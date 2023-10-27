const onLeaveGame = async () => {
  const { data } = await sendRequest.post('/api/leave-game')
  player.setMe(data)
  game.leaveGame()
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

  const render = (gameData) => `
<div class="layout">
    <div class="dashboard">
        ${gameData.readyToDeal ? '<button class="primary" onclick="onDeal()">Deal</button>' : ''}
        <button class="error" onclick="onLeaveGame()">Leave game</button>
    </div>
    ${gameData.dealerCards.toString() && `
        <div class="playerCard">
            <p>Name: Dealer ${gameData.winnerIds.includes('dealer') ? '<span style="color: green">Winner</span>' : ''}</p>
            <p>Total: ${gameData.dealerTotal}</p>
            <p>Cards:</p>
            ${renderCards(gameData.dealerCards)}
        </div>
        ${gameData.players.map(player => `
            <div class="playerCard">
                <p>Name: ${player.email} ${gameData.winnerIds.includes(player.id) ? '<span style="color: green">Winner</span>' : ''}</p>
                <p>Total: <span ${player.total > 21 ? 'style="color: red"' : ''}>${player.total}</span></p>
                <p>Cards:</p>
                ${renderCards(player.cards)}
                ${player.id === gameData.playerIdTurn
                  ? `
                    <div class="playerButtons">
                        <button class="primary" onclick="onHit()">Hit</button>
                        <button class="warning" onclick="onStand()">Stand</button>
                    </div>
                  `
                  : ''
                }
            </div>
        `).join('')}
        `
    }
</div>
`
  game.setRender(render)

  return render(game.data)
}
