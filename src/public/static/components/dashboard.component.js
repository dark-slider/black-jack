const onStartGame = async () => {
  const { data } = await sendRequest.post('/api/start-game')
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

  return `
<div class="layout">
    <div class="me">
        <p>Me: ${player.me.email}</p>
        <p>Total games finished: ${player.me.score.totalGameFinished}</p>
        <p>Total wins: ${player.me.score.totalWins}</p>
        <p>Total losses: ${player.me.score.totalLosses}</p>
    </div> 
    <div class="dashboard">
        <button class="primary" onclick="onStartGame()">Start game</button>
        <button onclick="logOut()">Log Out</button>
    </div>
</div>
`
}
