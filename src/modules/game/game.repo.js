import { v4 as uuid } from 'uuid'
import { dynamoClient } from '../../utils/index.js'
import { settings } from '../../settings.js'

const TableName = `Games_${settings.stage}`

class GameEntity {
  id
  deck
  dealerCards
  playerIdTurn
  winnerIds

  /**
   * Create a new game entity with default or provided values.
   * @param {string} id - The unique identifier for the game.
   */
  constructor(id = undefined) {
    this.id = id || uuid()
    this.deck = []
    this.dealerCards = []
    this.playerIdTurn = null
    this.winnerIds = []
  }
}

export class GameRepo {
  client = dynamoClient

  /**
   * Create a new instance of a game entity.
   * @returns {GameEntity} - A new game entity instance.
   */
  get build() {
    return new GameEntity()
  }

  /**
   * Create a new game entity and store it in DynamoDB.
   * @returns {GameEntity} - The newly created game entity.
   */
  async create() {
    const game = new GameEntity()

    await this.client
      .put({
        TableName,
        Item: game
      })
      .promise()

    return game
  }

  /**
   * Update the attributes of a game entity in DynamoDB.
   * @param {GameEntity} game - The game entity to be updated.
   * @returns {boolean} - `true` if the update was successful.
   * @throws {Error} - If the provided game is not an instance of GameEntity.
   */
  async update(game) {
    if (game.constructor.name !== 'GameEntity') throw new Error('Game should be instance of GameEntity')

    let expressionKeys = {}
    let expressionAttributes = {}

    for (const key in game) {
      if (key === 'id') continue

      expressionKeys[key] = `:${key}`
      expressionAttributes[`:${key}`] = game[key]
    }

    const expression = Object.keys(expressionKeys).map(key => `${key} = ${expressionKeys[key]}`).join(', ')

    if (!expression) throw new Error('Invalid expression to use in update method')

    const params = {
      TableName,
      Key: {
        id: game.id
      },
      UpdateExpression: `set ${expression}`,
      ExpressionAttributeValues: expressionAttributes
    }

    await this.client
      .update(params)
      .promise()

    return true
  }

  /**
   * Find a game entity by its unique identifier.
   * @param {string} id - The unique identifier of the game.
   * @returns {GameEntity|null} - The found game entity or `null` if not found.
   */
  async findById(id) {
    const { Item: gameRaw } = await this.client
      .get({
        TableName,
        Key: { id },
      })
      .promise()

    if (!gameRaw) return null

    const game = new GameEntity(gameRaw.id)
    game.deck = gameRaw.deck
    game.dealerCards = gameRaw.dealerCards
    game.playerIdTurn = gameRaw.playerIdTurn
    game.winnerIds = gameRaw.winnerIds

    return game
  }

  /**
   * Retrieve all games from the database.
   * @returns {Array} - An array of GameEntity objects representing the games.
   */
  async findAll() {
    const { Items } = await this.client
      .scan({
        TableName,
        ProjectionExpression: 'id'
      })
      .promise()

    const games = []

    if (!Items) return []
    if (!Items.length) return []

    for (const game of Items) {
      const newGame = new GameEntity(game.id)
      newGame.deck = game.deck
      newGame.dealerCards = game.dealerCards
      newGame.playerIdTurn = game.playerIdTurn
      newGame.winnerIds = game.winnerIds

      games.push(game)
    }

    return games
  }

  /**
   * Clone a game entity, creating a new instance with the same attributes.
   * @param {GameEntity} game - The game entity to be cloned.
   * @returns {GameEntity} - A new game entity with the same attributes as the original.
   * @throws {Error} - If the provided game is not an instance of GameEntity.
   */
  clone(game) {
    if (game.constructor.name !== 'GameEntity') throw new Error('Game should be instance of GameEntity')

    const newGame = new GameEntity(game.id)
    newGame.deck = game.deck
    newGame.dealerCards = game.dealerCards
    newGame.playerIdTurn = game.playerIdTurn
    newGame.winnerIds = game.winnerIds

    return newGame
  }

  /**
   * Remove a game entity from DynamoDB by its unique identifier.
   * @param {string} id - The unique identifier of the game to be removed.
   * @returns {boolean} - `true` if the removal was successful.
   */
  async remove(id) {
    const params = {
      TableName,
      Key: {
        id
      }
    }

    await this.client
      .delete(params)
      .promise()

    return true
  }
}
