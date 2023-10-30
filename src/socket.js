import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { MainController } from './controllers/index.js'
import { settings } from './settings.js'

let io
const mainController = new MainController()

export const initializeSocket = server => {
  io = new Server(server)

  io.use((socket, next) => {
    const { token } = socket.handshake.auth

    if (!token) {
      return next(new Error('Unauthorized'))
    }

    jwt.verify(token, settings.secretKey, (err) => {
      if (err) {
        return next(new Error('Invalid token'))
      }

      next()
    })
  })
  
  io.on('connection', (socket) => {
    console.log('User connected.')

    socket.on('subscribeToGame', (gameId) => {
      console.log(`User subscribed to game/${gameId}`)
      socket.join(`game/${gameId}`)
    })

    socket.on('unsubscribeFromGame', (gameId) => {
      console.log(`User unsubscribed from game/${gameId}`)
      socket.leave(`game/${gameId}`)
    })

    socket.on('disconnect', () => {
      const { token } = socket.handshake.auth
      jwt.verify(token, settings.secretKey, async (err, decoded) => {
        if (!err) {
          const req = {
            player: await mainController.playerService.loadPlayerByEmail(decoded.email)
          }

          await mainController.leaveGame(req)
        }
      })
      console.log('User disconnected.')
    })
  })
}

export const emitToGame = (gameId, message) => {
  io.to(`game/${gameId}`).emit('gameUpdate', message)
}
