import { Client, Message, Intents, TextChannel } from "discord.js";
import dotenv from "dotenv";
import { WelcomeHandler } from "./handler";

// smelly imports
import ready from "./listeners/ready";
import guildMemberUpdate from "./listeners/guildMemberUpdate";
import onMessageCreate from "./listeners/onMessageCreate";

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
const welcomeHandler = new WelcomeHandler();

client.login(token);

// this is smelly
ready(client);
guildMemberUpdate(client);
// doesn't this mean that welcomeHandler gets passed as a param everytime a message is created
// should look into that
onMessageCreate(client, welcomeHandler);
