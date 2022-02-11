import { Client, Message, Intents } from "discord.js";
import ready from "./listeners/ready";
import dotenv from "dotenv";
import { WelcomeHandler } from "./handler";
import { userMention } from "@discordjs/builders";

dotenv.config();

const token = process.env.BOT_TOKEN;
console.log("Bot is starting...");

const welcomeHandler = new WelcomeHandler();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILD_MEMBERS,
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

// Name Format Enforcement
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  // Doesn't work for server owner
  // Handle name enforcement here I guess? What happens if the bot goes down?
  // Maybe have a name enforcement check when the bot turns on?
  console.log("update detected");
  console.log(`Old name was ${oldMember.displayName}`);
  const regex = /<[A-Za-z(0-9)?]+>/;
  if (
    oldMember.displayName !== newMember.displayName &&
    !regex.test(newMember.displayName)
  ) {
    const userID = oldMember.id;
    // print 2 staff channel
    console.log(`Invalid name change detected! for ${userMention(userID)}`);
    console.log(`Name is ${newMember.displayName}`);
  }
});

ready(client);

client.login(token);
