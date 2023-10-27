import { PlayerRepo } from './player.repo.js'

export class PlayerService {
  _player
  _repo = new PlayerRepo()

  /**
   * Get the current player.
   * @returns {PlayerEntity} - The current player entity.
   */
  get player() {
    return this._player
  }

  /**
   * Build a player entity from a source object and freeze it.
   * @param {PlayerEntity} player - The player entity to build from.
   * @returns {PlayerEntity} - The built and frozen player entity.
   * @throws {Error} - If the provided object is not an instance of PlayerEntity.
   */
  buildFromSource(player) {
    if (player.constructor.name !== 'PlayerEntity') throw this.riseError('Player should be instance of PlayerEntity')

    Object.freeze(player)

    this._player = player

    return this.player
  }

  /**
   * Create a new player with the given email address.
   * @param {string} email - The email address of the new player.
   * @returns {PlayerEntity} - The newly created player entity.
   */
  async createPlayer(email) {
    const player = await this._repo.create({ email })

    Object.freeze(player)

    this._player = player

    return this.player
  }

  /**
   * Load a player by their email address.
   * @param {string} playerEmail - The email address of the player to load.
   * @returns {PlayerEntity} - The loaded player entity.
   * @throws {Error} - If the player with the specified email address is not found.
   */
  async loadPlayerByEmail(playerEmail) {
    this.validateEmail(playerEmail)

    const player = await this._repo.findOneByEmail(playerEmail)

    if (!player) throw this.riseError(`Player ${playerEmail} not found`)

    Object.freeze(player)

    this._player = player

    return this.player
  }

  /**
   * Start a new game for the current player.
   * @param {Object} options - Options for starting the game including gameId and gamePosition.
   * @throws {Error} - If the current player is undefined or already in a game.
   */
  async startGame({ gameId, gamePosition }) {
    if (!this._player) throw this.riseError('Player undefined')
    if (this._player.currentGameId) throw this.riseError(`Player already in game ${this._player.currentGameId}`)

    const player = this._repo.clone(this._player)

    player.currentGameId = gameId
    player.currentGamePosition = gamePosition
    player.cards = []

    await this._repo.update(player)

    Object.freeze(player)

    this._player = player
  }

  /**
   * Reset the player's hand.
   * @param {string} playerEmail - The email address of the player to reset the hand for.
   */
  async resetHands(playerEmail) {
    if (!this._player) await this.loadPlayerByEmail(playerEmail)

    const player = this._repo.clone(this._player)

    player.cards = []

    await this._repo.update(player)

    Object.freeze(player)

    this._player = player
  }

  /**
   * Leave the current game for the player.
   */
  async leaveGame() {
    if (!this._player) throw this.riseError('Player undefined')

    const player = this._repo.clone(this._player)

    player.currentGameId = null
    player.currentGamePosition = 0
    player.cards = []

    await this._repo.update(player)

    Object.freeze(player)

    this._player = player
  }

  /**
   * Mark the player as a winner and update their score.
   * @param {string} playerEmail - The email address of the winning player.
   * @returns {PlayerEntity} - The updated player entity.
   */
  async win(playerEmail) {
    if (!this._player) await this.loadPlayerByEmail(playerEmail)

    const player = this._repo.clone(this._player)

    player.score.totalWins += 1
    player.score.totalGameFinished += 1

    await this._repo.update(player)

    Object.freeze(player)

    this._player = player

    return this.player
  }

  /**
   * Mark the player as a loser and update their score.
   * @param {string} playerEmail - The email address of the losing player.
   * @returns {PlayerEntity} - The updated player entity.
   */
  async lose(playerEmail) {
    if (!this._player) await this.loadPlayerByEmail(playerEmail)

    const player = this._repo.clone(this._player)

    player.score.totalLosses += 1
    player.score.totalGameFinished += 1

    await this._repo.update(player)

    Object.freeze(player)

    this._player = player

    return this.player
  }

  /**
   * Find all game members by the game's ID.
   * @param {string} gameId - The ID of the game to find members for.
   * @returns {PlayerEntity[]} - An array of player entities associated with the game.
   */
  async findGameMembers(gameId) {
    return await this._repo.findAllByGame(gameId)
  }

  /**
   * Take a card and add it to the player's hand.
   * @param {Object} options - Options including the card and gameId.
   * @returns {PlayerEntity} - The updated player entity with the new card.
   * @throws {Error} - If the current player is undefined or not a participant of the specified game.
   */
  async takeCard({ card, gameId }) {
    if (!this._player) throw this.riseError('Player undefined')
    if (this._player.currentGameId !== gameId) throw this.riseError(`Player is not participant of game ${gameId}`)

    const player = this._repo.clone(this._player)

    player.cards.push(card)

    await this._repo.update(player)

    Object.freeze(player)

    this._player = player

    return this.player
  }

  /**
   * Validate an email address.
   * @param {string} email - The email address to validate.
   * @throws {Error} - If the email address is not valid.
   */
  validateEmail(email) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw this.riseError('email should be type of email')
    }
  }

  /**
   * Helper function to raise an error.
   * @param {string} error - The error message.
   * @throws {Error} - An error with the specified message.
   */
  riseError(error = '') {
    throw new Error(`Player service: ${error}`)
  }
}
