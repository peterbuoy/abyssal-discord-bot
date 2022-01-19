import { Client, Message, Intents } from "discord.js";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;
console.log("Bot is starting...");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.on("message", (message: Message) => {
  if (!message.content.startsWith("%") || message.author.bot) return;
  console.log("i see %");
  const args = message.content.slice(1).trim().split(/ +/);
  try {
    const command = args?.shift()?.toLowerCase();
    console.log(command);
    if (command === "ping") {
      message.channel.send("Pong");
    }
  } catch (err) {
    console.error(err);
  }
});

ready(client);
interactionCreate(client);

client.login(token);
