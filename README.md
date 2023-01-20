# abyssal-discord-bot
This bot manages and automates Abyssal/Azurlane guild activities. This bot retains the core functionality of the KCAZDiscord bot that originally supported the guilds. It is a drop in replacement in terms of user expectations with some additional user experience benefits such as error messages, syntax tips, etc.

**The wiki has more specific information regarding setup and infrastructure information.**

**The current guild master has access to all systems logins and secrets if you need them.**

The bot has two mostly mirrored environments that share the same repo. You should develop locally (test environment) and when ready deploy to production. When you are developing locally, you have to populate your own `.env` file locally.

![diagram of bot infrastructure](https://i.imgur.com/GSG9S5V.png)

# Dependencies
- Node.js v17.* or higher
- npm v7.21.1 or higher

# Linting and Formatting
Linting is done via eslint: `npm run lint`

Formatting is done via prettier: `npm run format`

This repo uses ESlint along with the typescript plugin and parser.
It is highly recommended to install the [ESlint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for vs code as it will allow you to see errors and warnings as you make them :)

Installing the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode#review-details) for vs code is also recommended, which will allow you to format your code on save. Currently the `.prettierrc` configuration file is empty so the formatting style is the Prettier default.

Prettier formatting will override any eslint warnings with the current configuration.

**Again, the wiki has more specific information regarding setup and infrastructure information.**
