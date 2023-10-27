import { v4 as uuid } from 'uuid'
import { dynamoClient } from '../../utils/index.js'
import { settings } from '../../settings.js'

const TableName = `Players_${settings.stage}`

class PlayerEntity {
  id
  email
  score
  currentGameId
  currentGamePosition
  cards

  /**
   * Constructs a PlayerEntity object.
   * @param {string} id - The unique identifier for the player (optional).
   */
  constructor(id = undefined) {
    this.id = id || uuid()
    this.email = ''
    this.currentGameId = null
    this.currentGamePosition = 0
    this.score = {
      totalWins: 0,
      totalLosses: 0,
      totalGameFinished: 0
    }
    this.cards = []
  }
}

export class PlayerRepo {
  client = dynamoClient

  /**
   * Get a new instance of PlayerEntity.
   * @returns {PlayerEntity} - A new PlayerEntity instance.
   */
  get build() {
    return new PlayerEntity()
  }

  /**
   * Create a new player and store it in the DynamoDB table.
   * @param {string} email - The email address of the new player.
   * @returns {PlayerEntity} - The newly created player entity.
   * @throws {Error} - If a user with the same email already exists.
   */
  async create({ email }) {
    const exitsItem = await this.client
      .scan({
        TableName,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      })
      .promise()

    if (exitsItem.Count) {
      throw new Error('User already exist')
    }

    const player = new PlayerEntity()
    player.email = email

    await this.client
      .put({
        TableName,
        Item: player
      })
      .promise()

    return player
  }

  /**
   * Update the player's attributes in the DynamoDB table.
   * @param {PlayerEntity} player - The player entity to update.
   * @returns {boolean} - `true` if the update was successful.
   * @throws {Error} - If the provided object is not an instance of PlayerEntity.
   */
  async update(player) {
    if (player.constructor.name !== 'PlayerEntity') throw new Error('Player should be instance of PlayerEntity')

    let expressionKeys = {}
    let expressionAttributes = {}

    for (const key in player) {
      if (key === 'id') continue

      expressionKeys[key] = `:${key}`
      expressionAttributes[`:${key}`] = player[key]
    }

    const expression = Object.keys(expressionKeys).map(key => `${key} = ${expressionKeys[key]}`).join(', ')

    if (!expression) throw new Error('Invalid expression to use in update method')

    const params = {
      TableName,
      Key: {
        id: player.id
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
   * Find a player by their email address.
   * @param {string} email - The email address of the player to find.
   * @returns {PlayerEntity|null} - The player entity if found, or `null` if not found.
   */
  async findOneByEmail(email) {
    const { Items } = await this.client
      .scan({
        TableName,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      })
      .promise()

    if (!Items) return null
    if (!Items.length) return null

    const player = new PlayerEntity(Items[0].id)
    player.email = Items[0].email
    player.score = Items[0].score
    player.currentGameId = Items[0].currentGameId
    player.currentGamePosition = Items[0].currentGamePosition
    player.cards = Items[0].cards

    return player
  }

  /**
   * Find all players in a specific game by the game's ID.
   * @param {string} gameId - The ID of the game to find players for.
   * @returns {PlayerEntity[]} - An array of player entities associated with the game.
   */
  async findAllByGame(gameId) {
    const { Items } = await this.client
      .scan({
        TableName,
        FilterExpression: 'currentGameId = :gameId',
        ExpressionAttributeValues: {
          ':gameId': gameId
        }
      })
      .promise()

    const players = []

    if (!Items) return []
    if (!Items.length) return []

    for (const player of Items) {
      const newPlayer = new PlayerEntity(player.id)
      newPlayer.email = player.email
      newPlayer.score = player.score
      newPlayer.currentGameId = player.currentGameId
      newPlayer.currentGamePosition = player.currentGamePosition
      newPlayer.cards = player.cards

      players.push(newPlayer)
    }

    return players
  }

  /**
   * Create a clone of a player entity.
   * @param {PlayerEntity} player - The player entity to clone.
   * @returns {PlayerEntity} - A new player entity with the same attributes as the original.
   * @throws {Error} - If the provided object is not an instance of PlayerEntity.
   */
  clone(player) {
    if (player.constructor.name !== 'PlayerEntity') throw new Error('Player should be instance of PlayerEntity')

    const newPlayer = new PlayerEntity(player.id)
    newPlayer.email = player.email
    newPlayer.score = player.score
    newPlayer.currentGameId = player.currentGameId
    newPlayer.currentGamePosition = player.currentGamePosition
    newPlayer.cards = player.cards

    return newPlayer
  }
}
