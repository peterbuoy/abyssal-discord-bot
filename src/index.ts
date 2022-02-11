import { Client, Message, Intents } from "discord.js";
import ready from "./listeners/ready";
import dotenv from "dotenv";
import { WelcomeHandler } from "./handler";

dotenv.config();

const token = process.env.BOT_TOKEN;
console.log("Bot is starting...");

const welcomeHandler = new WelcomeHandler();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});
client.on("messageCreate", async (message: Message) => {
  if (!message.content.startsWith("%") || message.author.bot) return;
  const args = message.content.slice(1).trim().split(/ +/);

  const command = args.shift()?.toLowerCase();
  if (command === "join") {
    welcomeHandler.handleJoin(client, message);
  }
});

ready(client);

client.login(token);
