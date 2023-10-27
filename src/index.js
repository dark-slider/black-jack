import express from 'express'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import http from 'http'
import { initializeSocket } from './socket.js'
import { router } from './router.js'
import { settings } from './settings.js'

const __filename = fileURLToPath(import.meta.url)
const publicPath = `${dirname(__filename)}/public`

const app = express()
const server = http.createServer(app)
initializeSocket(server)

app.use(express.json())
app.use(express.static(publicPath))

router(app)

server.listen(settings.port, () => {
  console.log(`Server is running on port ${settings.port}`)
})
