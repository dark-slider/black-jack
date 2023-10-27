import AWS from 'aws-sdk'
import { settings } from '../settings.js'

const { DynamoDB } = AWS

export const dynamoClient = settings.env.isLocal
  ? new DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  : new DynamoDB.DocumentClient()
