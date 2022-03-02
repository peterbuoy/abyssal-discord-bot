import { Client, Message, Intents, TextChannel } from "discord.js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

console.log("Bot is starting...");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});
const token = process.env.BOT_TOKEN;

client.login(token);

const eventFiles = fs
  .readdirSync("./src/events")
  .filter((file) => file.endsWith(".ts"));

// dynamically import events from ./src/events
(async () => {
  for (const file of eventFiles) {
    const event = await import(`./events/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
})();

client.on("warn", console.warn);
client.on("error", console.error);
