const onStartGame = async () => {
  const { data } = await sendRequest.post('/api/start-game')
  await player.getMe()
  game.initGame(data)
  window.location.hash = routes.game
}

const onGetToGame = async (gameId) => {
  const { data } = await sendRequest.post('/api/start-game', { gameId })
  await player.getMe()
  game.initGame(data)
  window.location.hash = routes.game
}

const dashboardComponent = async () => {
  if (!player.me) {
    await player.getMe()
  }

  if (player.me.currentGameId) {
    window.location.hash = routes.game
    return
  }

  console.log(player.me)

  const { data: gamesList } = await sendRequest.get('/api/games-list')

  return `
<div class="layout">
    <div class="me">
        <p>Me: ${player.me.email}</p>
        <p>Total games finished: ${player.me.score.totalGameFinished}</p>
        <p>Total wins: ${player.me.score.totalWins}</p>
        <p>Total losses: ${player.me.score.totalLosses}</p>
    </div> 
    ${gamesList.toString() && 
      `
        <div class="dashboard gameDashboard">
            ${gamesList.map(game => `
              <button class="warning" onclick="onGetToGame('${game.id}')">Game ${game.id.slice(-5)}</button>
            `).join('')}
        </div>
      `
    }
    <div class="dashboard">
        <button class="primary" onclick="onStartGame()">Start game</button>
        <button onclick="logOut()">Log Out</button>
    </div>
</div>
`
}
