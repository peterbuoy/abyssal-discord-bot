# abyssal-discord-bot
This bot manages and automates Abyssal / Azurlane guild activities. This bot retains the core functionality of the KCAZDiscord bot that originally supported the guilds. It is a drop in replacement in terms of user expectations with some additional user experience benefits such as error messages, syntax tips, etc. Also, buttons are cool.

**The wiki has more specific information if you're interested.**

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

# Setup
Secrets and tokens will be stored in the `.env` file, which needs to be manually populated on the instance. The `config.ts` file contains constants such as user, role, channel, and client IDs. This file uses process.env.NODE_ENV (set to dev or prod) to determine whether to use the development or production configuration files. For example, if you wanted to use the development configuration you could do `NODE_ENV=dev npx ts-node-dev src/index.ts`.

# Starting the Bots
Live Development: `npm run dev`

This uses ts-node-dev to start the bot up for development and sets process.env.NODE_ENV to dev. This is memory intensive so *do not* do this on the production server.

Deploy Development: `npm deploy:dev`
This creates a `dist` directory containing the compiled js files. Then it runs the `index.js` file using the **development** (testing) configuration file.
This should be rarely used after the new bot officially replaces the existing bots. This is used for extended end to end testing.

Production: `npm deploy:prod`

This creates a `dist` directory containing the compiled js files. Then it runs the `index.js` file using the **production** configuration file.
