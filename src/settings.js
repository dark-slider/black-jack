import * as dotenv from 'dotenv'

dotenv.config()

const stage = process.env.NODE_ENV || 'local'

export const settings = {
  port: process.env.PORT || 4442,
  secretKey: process.env.SECRET_KEY || 'abrakedabra',

  stage,
  env: {
    isLocal: stage === 'local',
    isProduction: stage === 'production'
  }
}
