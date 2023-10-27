import { GameService, PlayerService } from '../modules/index.js'
import { generateJwt, validation } from '../utils/index.js'
import { emitToGame } from '../socket.js'

export class MainController {
  playerService = new PlayerService()
  gameService = new GameService()

  /**
   * Handle user login.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  async login(req, res) {
    try {
      // Load the player based on the provided email
      const player = await this.playerService.loadPlayerByEmail(req.body.email)

      // Generate a JSON Web Token (JWT) for authentication
      const token = generateJwt(player.email)

      res.json({ token })
    } catch(error) {
      res.status(400).json({ message: error.message })
    }
  }

  /**
   * Get information about the current user.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  getMe (req, res) {
    const { player } = req

    if (!player) throw new Error('Player not found')

    res.json(player)
  }

  /**
   * Handle user registration.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  async signUp(req, res) {
    try {
      // Create a new player based on the provided email
      const player = await this.playerService.createPlayer(req.body.email)

      // Generate a JWT for authentication
      const token = generateJwt(player.email)

      res.json({ token })
    } catch(error) {
      res.status(400).json({ message: error.message })
    }
  }

  /**
   * Get the state of a game.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  async getGameState(req, res) {
    try {
      const { player, query } = req
      const { gameId } = query

      // Check if a player is found in the request
      if (!player) throw new Error('Player not found')

      // Check if the player is in the specified game
      if (player.currentGameId !== gameId) throw new Error(`Player not in game ${gameId}`)

      // Load the game and players associated with it
      const game = await this.gameService.loadPublicGame(gameId)
      const players = await this.playerService.findGameMembers(gameId)

      // Calculate player totals and game state
      const playersResult = []

      for (const playerSource of players) {
        playersResult.push({
          ...playerSource,
          total: this.gameService.calculateTotal(playerSource.cards)
        })
      }

      const calculatedDealerTotal = this.gameService.calculateTotal(this.gameService.game.dealerCards)
      const gameResult = !game.playerIdTurn ? this.gameService.game : game
      const result = {
        ...gameResult,
        dealerTotal: !game.playerIdTurn ? calculatedDealerTotal : '-',
        players: playersResult,
        readyToDeal: !game.dealerCards.length || !game.playerIdTurn
      }

      if (game.dealerCards.length) {
        emitToGame(gameId, result)
      }

      res.json(result)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  /**
   * Start a new game.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  async startGame(req, res) {
    try {
      const { player } = req

      // Check if a player is found in the request
      if (!player) throw new Error('Player not found')

      // Check if the player is already in a game
      if (player.currentGameId) throw new Error(`Player already in game ${player.currentGameId}`)

      // Build the player from source data
      this.playerService.buildFromSource(player)

      // Create a new game
      const game = await this.gameService.createNewGame()

      // Start the game for the player
      await this.playerService.startGame({ gameId: game.id, gamePosition: 1 })

      // Assign the current player's turn
      await this.gameService.assignCurrentPlayerTurn({
        gameId: game.id,
        playerId: player.id
      })

      req.player = this.playerService.player
      req.query.gameId = game.id

      await this.getGameState(req, res)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  /**
   * Deal cards to players in the game.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  async deal(req, res) {
    try {
      const { player, body } = req
      const { gameId, decksAmount } = body

      // Check if a player is found in the request
      if (!player) throw new Error('Player not found')

      // Check if the player is in the specified game
      if (player.currentGameId !== gameId) throw new Error(`Player not in game ${gameId}`)

      // Retrieve a list of players in the game
      const players = await this.playerService.findGameMembers(gameId)

      // Find the player with the highest game position (first player to be dealt)
      const firstPlayer = players.sort((a, b) => b.currentGamePosition - a.currentGamePosition)[0]

      // Deal cards to players and get the dealt cards for each player
      const playersCards = await this.gameService.deal({
        gameId,
        playersAmount: players.length,
        decksAmount,
        playerIdTurn: firstPlayer.id
      })

      // Prepare a list to store player information with their totals
      const playersResult = []

      // Distribute the cards to players and calculate their totals
      for (let i = 0; i < playersCards.length; i++) {
        const player = players[i]
        const cards = playersCards[i]

        // Reset player hands before receiving new cards
        await this.playerService.resetHands(player.email)

        // Distribute the cards to the player
        for (const card of cards) {
          await this.playerService.takeCard({ card, gameId })
        }

        const playerSource = this.playerService.player
        playersResult.push({
          ...playerSource,
          total: this.gameService.calculateTotal(playerSource.cards)
        })
      }

      // Prepare the game result with player information
      const result = {
        ...this.gameService.gamePublic,
        dealerTotal: '-',
        players: playersResult
      }

      // Emit the game result to update clients via WebSockets
      emitToGame(gameId, result)

      res.json(result)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  /**
   * Handle a player's request to "hit" and receive a card in the game.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  async hit(req, res) {
    try {
      const { player, body } = req
      const { gameId } = body

      // Check if a player is found in the request
      if (!player) throw new Error('Player not found')

      // Check if the player is in the specified game
      if (player.currentGameId !== gameId) throw new Error(`Player not in game ${gameId}`)

      // Request the game service to provide a card to the player
      const card = await this.gameService.hit({
        gameId,
        playerCards: player.cards
      })

      try {
        // Try to take the card
        await this.playerService.takeCard({ card, gameId })
      } catch (error) {
        // If an error occurs during card handling, return card to deck
        await this.gameService.backCard({ card, gameId })
        res.status(400).json({ message: error.message })
      }

      // Calculate the player's total points
      const total = this.gameService.calculateTotal(this.playerService.player.cards)

      // If the player's total exceeds 21, mark the player as "lose"
      if (total > 21) {
        await this.playerService.lose(player.email)
      }

      // If the player's total is greater than or equal to 21, automatically "stand"
      if (total >= 21) {
        return this.stand(req, res)
      }

      req.player = this.playerService.player
      req.query.gameId = gameId

      await this.getGameState(req, res)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  /**
   * Handle the dealer's turn in the game.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  async dealerTurn(req, res) {
    try {
      const { body } = req
      const { gameId } = body

      // Load the game with the specified game ID
      let game = await this.gameService.loadGame(gameId)
      if (!game) throw new Error(`Game not found ${gameId}`)

      // Check if there are already winners in the game
      if (game.winnerIds.length) {
        req.query.gameId = gameId
        return this.getGameState(req, res)
      }

      // Assign the current player's turn to null, indicating the dealer's turn
      await this.gameService.assignCurrentPlayerTurn({ gameId, playerId: null })
      game = this.gameService.game

      // Calculate the dealer's total points during their turn
      const dealerTotal = await this.gameService.dealerTurn(gameId)

      // Prepare the result object for the response
      const result = {
        ...game,
        players: [],
        dealerTotal,
        winnerIds: [],
        readyToDeal: true
      }

      // Find all players in the game
      const players = await this.playerService.findGameMembers(gameId)

      // Determine possible winners and maximum total points among players
      const {
        possibleWinners,
        maxTotal,
        maxCardsTotal
      } = this.gameService.getPossibleWinners(players)

      // Check if the dealer wins or if there are player winners
      if (maxTotal < dealerTotal || (maxTotal === dealerTotal && game.dealerCards.length < maxCardsTotal)) {
        for (const player of possibleWinners) {
          await this.playerService.lose(player.email)
        }

        // Mark the dealer as the winner
        result.winnerIds = ['dealer']
      } else {
        for (const player of possibleWinners) {
          await this.playerService.win(player.email)
          result.winnerIds.push(player.id)
        }
      }

      // Build the player data and total points for each player
      for (const player of players) {
        this.playerService.buildFromSource(player)

        const playerSource = this.playerService.player
        result.players.push({
          ...playerSource,
          total: this.gameService.calculateTotal(playerSource.cards)
        })
      }

      // Set the winners in the game and emit the updated game state
      await this.gameService.setWinners(result.winnerIds)

      emitToGame(gameId, result)

      res.json(result)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  /**
   * Handle a player's request to "stand" during their turn in the game.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  async stand(req, res) {
    try {
      const { player, body } = req
      const { gameId } = body

      // Check if a player is found in the request
      if (!player) throw new Error('Player not found')

      // Check if the player is in the specified game
      if (player.currentGameId !== gameId) throw new Error(`Player not in game ${gameId}`)

      // Find all players in the game and sort them by game position
      let players = await this.playerService.findGameMembers(gameId)
      players = players.sort((a, b) => a.currentGamePosition - b.currentGamePosition)

      // Find the index of the current player
      const currentPlayerIndex = players.find(item => item.currentGamePosition === player.currentGamePosition)
      const nextPlayer = players[currentPlayerIndex + 1]

      // If there is a next player, assign the turn to them; otherwise, proceed to the dealer's turn
      if (nextPlayer) {
        await this.gameService.assignCurrentPlayerTurn({
          gameId,
          playerId: nextPlayer.id
        })
      } else {
        return this.dealerTurn(req, res)
      }

      await this.getGameState(req, res)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  /**
   * Handle a player's request to leave the current game.
   * @param {Object} req - The HTTP request object.
   * @param {Object} res - The HTTP response object.
   */
  async leaveGame(req, res) {
    try {
      const { player } = req

      // Check if a player is found in the request
      if (!player) throw new Error('Player not found')

      // Retrieve the current game ID from the player
      const gameId = player.currentGameId

      // Build the player's data from the source
      this.playerService.buildFromSource(player)

      // Find all players in the game and sort them by game position
      let players = await this.playerService.findGameMembers(gameId)
      players = players.sort((a, b) => a.currentGamePosition - b.currentGamePosition)

      // Find the index of the current player
      const currentPlayerIndex = players.find(item => item.currentGamePosition === player.currentGamePosition)
      const nextPlayer = players[currentPlayerIndex + 1]

      // Leave the current game and remove the player from the players list
      await this.playerService.leaveGame()
      delete players[currentPlayerIndex]

      // If no players are left in the game, remove the game
      if (!players.length && gameId) {
        await this.gameService.removeGame(gameId)
      }

      // If there are remaining players and a game, assign the next player's turn
      if (players.length && gameId) {
        if (nextPlayer) {
          await this.gameService.assignCurrentPlayerTurn({
            gameId,
            playerId: nextPlayer.id
          })
        } else {

        }
      }

      res.json(this.playerService.player)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
}
