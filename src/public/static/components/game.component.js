let interval
let timeout

const onLeaveGame = async () => {
  await sendRequest.post('/api/leave-game')
  await player.getMe()
  game.leaveGame()
  clearTimeout(timeout)
  clearInterval(interval)
  window.location.hash = routes.dashboard
}

const onDeal = async () => {
  if (game.data.id) {
    await sendRequest.post('/api/deal', { gameId: game.data.id })
  }
}

const onHit = async () => {
  if (game.data.id) {
    await sendRequest.post('/api/hit', { gameId: game.data.id })
  }
}

const onStand = async () => {
  if (game.data.id) {
    await sendRequest.post('/api/stand', { gameId: game.data.id })
  }
}

const cardIcons = {
  Spades: '♠',
  Clubs: '♣',
  Diamonds: '♦',
  Hearts: '♥'
}

const gameComponent = async () => {
  if (!player.me) {
    await player.getMe()
  }

  if (!player.me.currentGameId) {
    window.location.hash = routes.dashboard
    return
  }

  if (!game.data) {
    await game.getGame(player.me.currentGameId)
  }

  const renderCards = (cardTitles) => {
    let cards = []

    const cardValue = (titlePart) => !isNaN(parseInt(titlePart)) ? titlePart : titlePart.charAt(0)

    for (const card of cardTitles) {
      const cardParts = card.title.split(' ')
      if (!cardParts[1]) {
        cards.push(`<div class="card">${card.title}</div>`)
      } else {
        cards.push(
          `<div class="card" ${['Diamonds', 'Hearts'].includes(cardParts[2]) ? 'style="color: red"' : ''}>
              ${cardValue(cardParts[0])}${cardIcons[cardParts[2]]}
          </div>`
        )
      }
    }

    return `
    <div class="cards">
        ${cards.join('')}
    </div>
    `
  }

  const render = (gameData) => {
    clearTimeout(timeout)
    clearInterval(interval)

    let i = 20

    if (gameData.playerIdTurn) {
      timeout = setTimeout(() => {
        onLeaveGame()
      }, 20000)

      interval = setInterval(() => {
        i--
        document.getElementById(`timer-${gameData.playerIdTurn}`).innerHTML = i.toString()
      }, 1000)
    }

    return `
<div class="layout">
    <div class="dashboard">
        ${gameData.readyToDeal ? '<button class="primary" onclick="onDeal()">Deal</button>' : ''}
        <button class="error" onclick="onLeaveGame()">Leave game</button>
    </div>
    ${gameData.dealerCards.toString() && `
        <div class="playerCard">
            <p>Name: Dealer ${gameData.winnerIds.includes('dealer') ? '<span style="color: green">Winner</span>' : ''}</p>
            <p>Total: <span ${gameData.dealerTotal > 21 ? 'style="color: red"' : ''}>${gameData.dealerTotal}</span></p>
            <p>Cards:</p>
            ${renderCards(gameData.dealerCards)}
        </div>
        ${gameData.players.map(currentPlayer => `
            <div class="playerCard" id="${currentPlayer.id}">
                <p>Name: ${currentPlayer.email} ${gameData.winnerIds.includes(currentPlayer.id) ? '<span style="color: green">Winner</span>' : ''}</p>
                <p>Total: <span ${currentPlayer.total > 21 ? 'style="color: red"' : ''}>${currentPlayer.total}</span></p>
                <p>${currentPlayer.currentGamePosition}</p>
                <p>Cards:</p>
                ${renderCards(currentPlayer.cards)}
                ${currentPlayer.id === gameData.playerIdTurn && currentPlayer.id === player.me.id
                  ? `
                    <div class="playerButtons">
                        <button class="primary" onclick="onHit()">Hit</button>
                        <button class="warning" onclick="onStand()">Stand</button>
                    </div>
                    <p class="timer">You will leave in: <span id="timer-${currentPlayer.id}">${i}</span></p>
                  `
                  : ''
                }
                ${currentPlayer.id === gameData.playerIdTurn && currentPlayer.id !== player.me.id
                  ?  `<p class="timer">...thinking</p>`
                  : ''
                }
            </div>
        `).join('')}
        `
    }
</div>
`
  }
  game.setRender(render)

  return render(game.data)
}
