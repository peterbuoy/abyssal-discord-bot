# abyssal-discord-bot
This bot manages the Abyssal / Azurlane guild activities. This bot is meant to replace the KCAZDiscord bot that originally supported the guild.

# Dependencies
- Discord.js v13.*
- dotenv 14.*
- Node.js v16.9.1 or higher
- npm v7.21.1 or higher

# Linting and Formatting
Linting is done via eslint: `npm run lint`

Formatting is done via prettier: `npm run format`

This repo uses ESlint along with the typescript plugin and parser.
It is highly recommended to install the [ESlint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for vs code as it will allow you to see errors and warnings as you make them :)

Installing the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode#review-details) for vs code is also recommended, which will allow you to format your code on save. Currently the `.prettierrc` configuration file is empty so the formatting style is the Prettier default.

Prettier formatting will override any eslint warnings with the current configuration.

# Setup
Secrets and tokens will be stored in the `.env` file, which needs to be manually populated on the instance. Depending on the implementation of authorization, certain secret values will also be stored in a file likely called 'credentials.json'.

# Starting the Bots
Development: `npm start`

Production: `npm run prod`
