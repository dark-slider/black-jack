import { GameRepo } from './game.repo.js'
import { DeckService } from '../deck/index.js'

export class GameService {
  _game
  _repo = new GameRepo()
  _deckService = new DeckService()

  /**
   * Get the current game instance.
   * @returns {GameEntity|null} - The current game entity or `null` if not defined.
   */
  get game() {
    return this._game
  }

  /**
   * Get a public representation of the current game.
   * @returns {Object} - A simplified game object with limited information.
   */
  get gamePublic() {
    return {
      id: this._game.id,
      playerIdTurn: this._game.playerIdTurn,
      winnerIds: this._game.winnerIds || [],
      dealerCards: this._game.dealerCards.map((item, index) => index === 0 ? { title: '*', value: '*' } : item)
    }
  }

  /**
   * Create a new game instance and store it in the repository.
   * @returns {GameEntity} - The newly created game entity.
   */
  async createNewGame() {
    const game = await this._repo.create()

    Object.freeze(game)

    this._game = game

    return this.game
  }

  /**
   * Load a game by its unique identifier.
   * @param {string} gameId - The unique identifier of the game to load.
   * @returns {GameEntity} - The loaded game entity.
   * @throws {Error} - If the game with the specified ID is not found.
   */
  async loadGame(gameId) {
    const game = await this._repo.findById(gameId)

    if (!game) throw this.riseError(`Game ${gameId} not found`)

    Object.freeze(game)

    this._game = game

    return this.game
  }

  /**
   * Load a simplified public representation of a game by its ID.
   * @param {string} gameId - The unique identifier of the game to load.
   * @returns {Object} - A public representation of the game.
   */
  async loadPublicGame(gameId) {
    await this.loadGame(gameId)

    return this.gamePublic
  }

  /**
   * Remove a game by its unique identifier.
   * @param {string} gameId - The unique identifier of the game to remove.
   * @throws {Error} - If the game with the specified ID is not found.
   */
  async removeGame(gameId) {
    const game = await this._repo.findById(gameId)

    if (!game) throw this.riseError(`Game ${gameId} not found`)

    await this._repo.remove(gameId)

    this._game = undefined
  }

  /**
   * Add a card back to the game's deck.
   * @param {Object} options - Object containing the card and game ID.
   * @param {Object} options.card - The card to add back to the deck.
   * @param {string} options.gameId - The ID of the game to update.
   * @returns {GameEntity} - The updated game entity.
   */
  async backCard({ card, gameId }) {
    if (!this._game) await this.loadGame(gameId)

    const game = this._repo.clone(this._game)

    game.deck.unshift(card)

    await this._repo.update(game)

    Object.freeze(game)

    this._game = game

    return this.game
  }

  /**
   * Assign the current player's turn in the game.
   * @param {Object} options - Object containing the game ID and player ID.
   * @param {string} options.gameId - The ID of the game to update.
   * @param {string|null} options.playerId - The ID of the player whose turn it is or `null` for the dealer's turn.
   * @returns {GameEntity} - The updated game entity.
   */
  async assignCurrentPlayerTurn({ gameId, playerId }) {
    if (!this._game) await this.loadGame(gameId)

    const game = this._repo.clone(this._game)

    game.playerIdTurn = playerId

    await this._repo.update(game)

    Object.freeze(game)

    this._game = game

    return this.game
  }

  /**
   * Set the winner IDs for the current game.
   * @param {string[]} winnersIds - An array of player IDs who are the winners.
   */
  async setWinners(winnersIds) {
    if (!this._game) throw this.riseError('Game not defined')

    const game = this._repo.clone(this._game)

    game.winnerIds = winnersIds

    await this._repo.update(game)

    Object.freeze(game)

    this._game = game
  }

  /**
   * Deal cards to players in the game.
   * @param {Object} options - Object containing game details.
   * @param {string} options.gameId - The ID of the game to deal cards in.
   * @param {number} options.playersAmount - The number of players receiving cards.
   * @param {string} options.playerIdTurn - The ID of the player whose turn it is.
   * @param {number} options.decksAmount - The number of decks to use for dealing cards (default is 1).
   * @returns {Object[]} - An array of player card arrays representing the dealt cards.
   */
  async deal({ gameId, playersAmount, playerIdTurn, decksAmount = 1 }) {
    await this.loadGame(gameId)

    this._deckService.createNew(decksAmount)
    this._deckService.shuffle()

    const game = this._repo.clone(this._game)
    game.deck = [...this._deckService.deck]
    game.playerIdTurn = playerIdTurn
    game.dealerCards = []
    game.winnerIds = []

    const playersCards = []

    for (let i = 0; i < 2; i ++) {
      game.dealerCards.push(game.deck.shift())

      for (let j = 0; j < playersAmount; j++) {
        if (!playersCards[j]) playersCards[j] = []

        playersCards[j].push(game.deck.shift())
      }
    }

    await this._repo.update(game)

    Object.freeze(game)

    this._game = game

    return playersCards
  }

  /**
   * Draw a card for a player in the game.
   * @param {Object} options - Object containing the game ID and player's current cards.
   * @param {string} options.gameId - The ID of the game to draw a card in.
   * @param {Object[]} options.playerCards - An array of the player's current cards.
   * @returns {Object} - The drawn card.
   * @throws {Error} - If the player's total exceeds 21.
   */
  async hit({ gameId, playerCards }) {
    if (!this._game) await this.loadGame(gameId)

    const game = this._repo.clone(this._game)

    const total = this.calculateTotal(playerCards)

    if (total > 21) throw this.riseError('Player cannot take another card')

    const card = game.deck.shift()

    await this._repo.update(game)

    Object.freeze(game)

    this._game = game

    return card
  }

  /**
   * Simulate the dealer's turn in the game.
   * @param {string} gameId - The ID of the game to simulate the dealer's turn in.
   * @returns {number} - The total value of the dealer's cards after the turn.
   */
  async dealerTurn(gameId) {
    if (!this._game) await this.loadGame(gameId)

    const game = this._repo.clone(this._game)

    game.playerIdTurn = null

    let total = this.calculateTotal(game.dealerCards)

    while (total < 16) {
      game.dealerCards.push(game.deck.shift())
      total = this.calculateTotal(game.dealerCards)
    }

    await this._repo.update(game)

    Object.freeze(game)

    this._game = game

    return total
  }

  /**
   * Determine the possible winners among the players.
   * @param {Object[]} players - An array of player objects.
   * @returns {Object} - An object containing possible winners, max total, and max cards total.
   */
  getPossibleWinners(players) {
    let playerResults = []
    for (const player of players) {
      const playerTotal = this.calculateTotal(player.cards)
      playerResults.push({
        id: player.id,
        email: player.email,
        total: playerTotal,
        cardsTotal: player.cards.length
      })
    }

    playerResults = playerResults.filter(player => player.total <= 21)
    const maxTotal = Math.max(...playerResults.map(item => item.total))
    const maxCardsTotal = Math.max(...playerResults.map(item => item.cardsTotal))

    let possibleWinners = playerResults.filter(player => player.total === maxTotal)

    if (possibleWinners.length > 1) {
      possibleWinners = possibleWinners.filter(player => player.cardsTotal === maxCardsTotal)
    }

    return {
      possibleWinners,
      maxTotal,
      maxCardsTotal
    }
  }

  /**
   * Calculate the total value of a set of cards.
   * @param {Object[]} cards - An array of card objects.
   * @returns {number} - The total value of the cards.
   */
  calculateTotal(cards) {
    if (!cards.length) return 0
    this._deckService.isDeckCorrect(cards)

    let total = 0

    for (const card of cards) {
      total += this._deckService.calculateWeight(card.value)
    }

    if (total > 21) {
      total = 0

      for (const card of cards) {
        total += this._deckService.calculateWeight(card.value, true)
      }
    }

    return total
  }

  /**
   * Helper function to throw an error with a message prefixed with "Game service: ".
   * @param {string} error - The error message.
   * @throws {Error} - An error with the specified message.
   */
  riseError(error = '') {
    throw new Error(`Game service: ${error}`)
  }
}
