import jwt from 'jsonwebtoken'
import { MainController } from './controllers/index.js'
import { settings } from './settings.js'

const mainController = new MainController()

const verifyToken = (req, res, next) => {
  const authorizationHeader = req.headers['authorization']

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = authorizationHeader.split(' ')[1]

  jwt.verify(token, settings.secretKey, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' })
    }
    req.player = await mainController.playerService.loadPlayerByEmail(decoded.email)
    next()
  })
}

export const router = (app) => {
  app.use('/api', verifyToken)

  app.post('/auth/login', mainController.login.bind(mainController))
  app.post('/auth/signup', mainController.signUp.bind(mainController))
  app.get('/api/me', mainController.getMe.bind(mainController))
  app.get('/api/game-state', mainController.getGameState.bind(mainController))
  app.post('/api/start-game', mainController.startGame.bind(mainController))
  app.post('/api/leave-game', mainController.leaveGame.bind(mainController))
  app.post('/api/deal', mainController.deal.bind(mainController))
  app.post('/api/hit', mainController.hit.bind(mainController))
  app.post('/api/stand', mainController.stand.bind(mainController))
}
