# abyssal-discord-bot
This bot manages the Abyssal / Azurlane guild activities. This bot is meant to replace the KCAZDiscord bot that originally supported the guild.

# Dependencies
- Discord.js v13.*
- dotenv 14.*
- Node.js v16.9.1 or higher
- npm v7.21.1 or higher

# Linting and Formatting
This repo uses eslint along with the typescript plugin and parser.

You can manually run the linter by typing in `npm run lint` in the command line.

It is highly recommended to install the [eslint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for vs code as it will allow you to see errors and warnings as you make them :)

Formatting is done via prettier.

# Setup
Secrets and tokens will be stored in the `.env` file, which needs to be manually populated on the instance. Depending on the implementation of authorization, certain secret values will also be stored in a file likely called 'credentials.json'.

# Starting the Bots
Development: `npm start`

Production: `npm run prod`
