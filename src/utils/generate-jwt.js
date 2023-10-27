import jwt from 'jsonwebtoken'
import { settings } from '../settings.js'

export const generateJwt = (email) => {
  return jwt.sign({ email }, settings.secretKey, { expiresIn: '7d' })
}
