import { DeckService } from './deck.service.js'

describe('DeckService', () => {
  let deckService

  beforeEach(() => {
    deckService = new DeckService()
  })

  it('should create a new deck with the default amount', () => {
    deckService.createNew()
    expect(deckService.deck.length).toBe(52)
  })

  it('should create a new deck with the specified amount', () => {
    deckService.createNew(2)
    expect(deckService.deck.length).toBe(104)
  })

  it('should create a deck from a source deck', () => {
    const sourceDeck = [
      { title: '2 of Hearts', value: '2' },
      { title: '3 of Diamonds', value: '3' },
      { title: '4 of Diamonds', value: '4' },
      { title: '5 of Diamonds', value: '5' },
      { title: '6 of Diamonds', value: '6' },
    ]

    deckService.createFromSource(sourceDeck)
    expect(deckService.deck).toEqual(sourceDeck)
  })

  it('should shuffle the deck', () => {
    deckService.createNew()
    const originalDeck = [...deckService.deck]

    deckService.shuffle()

    expect(deckService.deck).not.toEqual(originalDeck)
  })

  it('should throw an error if the deck is invalid', () => {
    let invalidDeck

    expect(() => {
      deckService.isDeckCorrect(invalidDeck)
    }).toThrowError('Deck should be defined')
  })

  it('should throw an error if cards in deck are invalid', () => {
    const invalidDeck = [
      { title: '2 of Hearts' },
    ]

    expect(() => {
      deckService.isDeckCorrect(invalidDeck)
    }).toThrowError('Cards in deck are invalid')
  })

  it('should throw an error if card title is invalid', () => {
    const invalidDeck = [
      { title: '2 of Something', value: '2' },
    ]

    expect(() => {
      deckService.isDeckCorrect(invalidDeck)
    }).toThrowError('Unknown card titles: 2 of Something')
  })

  it('should throw an error if card value is invalid', () => {
    const invalidDeck = [
      { title: '2 of Hearts', value: 'Woaa' },
    ]

    expect(() => {
      deckService.isDeckCorrect(invalidDeck)
    }).toThrowError('Unknown card values: Woaa')
  })

  it('should throw an error if card value is invalid', () => {
    const invalidDeck = [
      { title: '2 of Hearts', value: '3' },
    ]

    expect(() => {
      deckService.isDeckCorrect(invalidDeck)
    }).toThrowError('Mismatched cards: title: 2 of Hearts and value: 3')
  })
})
