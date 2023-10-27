// Represents the card suits enumeration
const CardSuits = {
  HEARTS: 'Hearts',
  DIAMONDS: 'Diamonds',
  CLUBS: 'Clubs',
  SPADES: 'Spades',
}

// Represents the card values enumeration
const CardValues = {
  TWO: '2',
  THREE: '3',
  FOUR: '4',
  FIVE: '5',
  SIX: '6',
  SEVEN: '7',
  EIGHT: '8',
  NINE: '9',
  TEN: '10',
  JACK: 'Jack',
  QUEEN: 'Queen',
  KING: 'King',
  ACE: 'Ace',
}

// Represents a service for managing decks of cards
export class DeckService {
  // Represents the deck of cards
  _deck

  /**
   * Returned existing deck
   * @returns {array | undefined}
   */
  get deck() {
    return this._deck
  }

  /**
   * Creates a new deck of cards.
   * @param {number} deckAmount - The number of decks to create (default is 1).
   */
  createNew(decksAmount = 1) {
    const suits = Object.values(CardSuits)
    const values = Object.values(CardValues)

    const singleDeck = []

    for (const suit of suits) {
      for (const value of values) {
        const card = {
          title: `${value} of ${suit}`,
          value
        }
        Object.freeze(card)
        singleDeck.push(card)
      }
    }
    const deck = []

    for (let i = 0; i < decksAmount; i++) {
      deck.push(...singleDeck)
    }

    Object.freeze(deck)

    this._deck = deck
  }

  /**
   * Creates a deck of cards from a source deck.
   * @param {Array} deck - The source deck of cards.
   */
  createFromSource(deck) {
    this.isDeckCorrect(deck)

    const newDeck = []

    for (const card of deck) {
      Object.freeze(card)
      newDeck.push(card)
    }

    Object.freeze(newDeck)

    this._deck = newDeck
  }

  /**
   * Shuffles the deck of cards.
   */
  shuffle() {
    const newDeck = [...this._deck]
    this.isDeckCorrect(newDeck)

    let currentIndex = newDeck.length
    let randomIndex
    let cardForRandom
    let cardForCurrent

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--

      cardForRandom = newDeck[currentIndex]
      cardForCurrent = newDeck[randomIndex]

      Object.freeze(cardForRandom)
      Object.freeze(cardForCurrent)

      newDeck[currentIndex] = cardForCurrent
      newDeck[randomIndex] = cardForRandom
    }

    Object.freeze(newDeck)

    this._deck = newDeck
  }

  /**
   * Calculates the weight of a card value.
   * @param {string} cardValue - The card value to calculate the weight for.
   * @param {boolean | undefined} isAceSmall - Is logic should be with Axe equal 1.
   * @returns {number} - The weight of the card value.
   */
  calculateWeight(cardValue, isAceSmall = false) {
    switch (cardValue) {
      case CardValues.TWO:
      case CardValues.THREE:
      case CardValues.FOUR:
      case CardValues.FIVE:
      case CardValues.SIX:
      case CardValues.SEVEN:
      case CardValues.EIGHT:
      case CardValues.NINE:
      case CardValues.TEN:
        return parseInt(cardValue)
      case CardValues.JACK:
      case CardValues.QUEEN:
      case CardValues.KING:
        return 10
      case CardValues.ACE:
        return isAceSmall ? 1 : 11
      default:
        return 0
    }
  }

  /**
   * Throws an error with a message.
   * @param {string} error - The error message.
   */
  riseError(error = '') {
    throw new Error(`Deck service: ${error}`)
  }

  /**
   * Checks if the provided deck is correct.
   * @param {Array} deck - The deck of cards to validate.
   */
  isDeckCorrect(deck) {
    if (!deck) {
      throw this.riseError('Deck should be defined')
    }

    if (!Array.isArray(deck)) {
      throw this.riseError('Deck should be array')
    }

    if (!deck.length) {
      throw this.riseError('Deck is empty')
    }

    const areCardsValid = deck.every(card => {
      return (
        typeof card === 'object' &&
        card !== null &&
        'title' in card &&
        typeof card.title === 'string' &&
        'value' in card &&
        typeof card.value === 'string'
      )
    })

    if (!areCardsValid) {
      throw this.riseError('Cards in deck are invalid')
    }

    const suits = Object.values(CardSuits)
    const values = Object.values(CardValues)

    const deckTitles = []
    const deckValues = []

    for (const suit of suits) {
      for (const value of values) {
        deckTitles.push(`${value} of ${suit}`)
        deckValues.push(value)
      }
    }

    const unknownTitles = []
    const unknownValues = []
    const mismatchedCard = []

    for (const card of deck) {
      if (!deckTitles.includes(card.title)) unknownTitles.push(card.title)
      if (!deckValues.includes(card.value)) unknownValues.push(card.value)
      if (card.title.split(' ')[0] !== card.value) mismatchedCard.push(`title: ${card.title} and value: ${card.value}`)
    }

    if (unknownTitles.length) {
      throw this.riseError(`Unknown card titles: ${unknownTitles.join(', ')}`)
    }

    if (unknownValues.length) {
      throw this.riseError(`Unknown card values: ${unknownValues.join(', ')}`)
    }

    if (mismatchedCard.length) {
      throw this.riseError(`Mismatched cards: ${mismatchedCard.join(', ')}`)
    }
  }
}
