// Create an Axios instance with a timeout of 10 seconds
const sendRequest = axios.create({ timeout: 10000 })

// Axios request interceptor to add authorization header
sendRequest.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.authorization = `Bearer ${token}`
  }

  return config
})

// Axios response interceptor to handle 401 Unauthorized errors
sendRequest.interceptors.response.use(null, (error) => {
  if (error.response?.status === 401) {
    window.location.href = '#login'
  }

  throw error
})

let socket

// Function to start a socket connection with authentication
const startSocket = () => {
  const token = localStorage.getItem('token')

  if (token) {
    socket = io({
      auth: { token }
    })
  }
}

// Start the socket connection if a token is available
if (localStorage.getItem('token')) {
  startSocket()
}

// Function to log out the user and clear the token
const logOut = () => {
  localStorage.clear()
  window.location.hash = '#login'
}

// Player class for managing user data
class Player {
  _me

  get me() {
    return this._me
  }

  setMe(me) {
    this._me = me
  }

  // Fetch the user's data from the server
  async getMe() {
    const { data } = await sendRequest.get('/api/me')
    this._me = data
  }
}

// Create an instance of the Player class
const player = new Player()

const routes = {
  login: '#login',
  signup: '#signup',
  dashboard: '#dashboard',
  game: '#game'
}

// Game class for managing game-related data and interactions
class Game {
  _data

  get data() {
    return this._data
  }

  // Fetch game data from the server
  async getGame(gameId) {
    const { data } = await sendRequest.get(`/api/game-state?gameId=${gameId}`)
    this.initGame(data)
  }

  // Initialize the game data and subscribe to updates
  initGame(gameData) {
    this._data = gameData
    socket.emit('subscribeToGame', gameData.id)
  }

  // Set a rendering function for game updates
  setRender(render) {
    const app = document.getElementById('app')

    socket.on('gameUpdate', (data) => {
      this._data = data
      app.innerHTML = render(data)
    })
  }

  // Unsubscribe from game updates
  leaveGame() {
    this._data && socket.emit('unsubscribeFromGame', this._data.id)
  }
}

const game = new Game()
