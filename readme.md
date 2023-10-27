# BlackJack Game

This is a simple implementation of the classic card game BlackJack using clean JavaScript without any frameworks. The game allows players to play against a computer dealer, following standard BlackJack rules.

## Features

- Play BlackJack against a computer dealer.
- Clean JavaScript implementation.
- Basic game logic and UI.
- Socket.io integration for real-time updates (notified when the game starts).
- Express.js server for handling game requests.
- JWT-based authentication.
- AWS SDK for managing data storage (DynamoDB).
- Jest for unit testing.

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/dark-slider/black-jack.git
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:

   Create a `.env` file in the project root and add the following variables:

   ```
    NODE_ENV=local
    PORT=4442
    SECRET_KEY=abrakedabra
   ```

4. Start the server:

   ```
   npm start
   ```

The server will run on `http://localhost:4442`.

## Usage

1. Register or log in to create a player profile.
2. Start a new game.
3. Play BlackJack and try to beat the dealer.

## Testing

Run the tests using:

```
npm test
```

## Credits

This project was created by [Roman Danylov].

[Socket.io](https://socket.io/)
[Express.js](https://expressjs.com/)
[AWS SDK](https://aws.amazon.com/sdk-for-javascript/)
[Jest](https://jestjs.io/)
[UUID](https://www.npmjs.com/package/uuid)

Enjoy the game!
