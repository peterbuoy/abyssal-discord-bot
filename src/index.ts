import { Client, Message, Intents, TextChannel } from "discord.js";
import ready from "./listeners/ready";
import dotenv from "dotenv";
import { WelcomeHandler } from "./handler";
import { userMention } from "@discordjs/builders";
import { collectionContains } from "./utils/utils";
import {
  role_ab,
  role_az,
  inGuildOrPending,
  role_az_pending,
  chan_staff_bot_notif,
} from "./config.json";

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

client.on("messageCreate", async (message: Message) => {
  if (!message.content.startsWith("%") || message.author.bot) return;
  const args = message.content.slice(1).trim().split(/ +/);

  const command = args.shift()?.toLowerCase();
  if (command === "join") {
    welcomeHandler.handleJoin(client, message);
  }
});

// Name Format Enforcement
client.on("guildMemberUpdate", (oldMember, newMember) => {
  const userID = oldMember.id;
  const regex = /<[A-Za-z(0-9)?]+>/;
  const staffBotNotifChannel = client.channels.cache.get(chan_staff_bot_notif);
  const msg = `
    **Name Change Detected**
    User Profile: ${userMention(userID)}
    Old Nickname: ${oldMember.nickname}
    New Nickname: ${newMember.nickname}\n
    `;
  if (!(staffBotNotifChannel instanceof TextChannel)) {
    return;
  }
  if (
    oldMember.nickname !== newMember.nickname &&
    !regex.test(newMember.nickname!)
  ) {
    console.log("invalid name");
    staffBotNotifChannel.send(
      `⚠️**Invalid Name Change**⚠️ for ${userMention(userID)}
      ${msg}
      `
    );
  } else {
    staffBotNotifChannel.send(msg);
  }
});

ready(client);
