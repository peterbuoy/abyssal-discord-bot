import { Client, Message, Intents, TextChannel } from "discord.js";
import fs from "fs";
import dotenv from "dotenv";
import config from "./config.json";
import { removeFromSheet } from "./eventHandlers/removeFromSheet";
import utils from "./utils/utils";
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

// If you put this in events it won't detect the removal
client.on("guildMemberRemove", (member) => {
  console.log("guild member removed");
  const staffBotNotifChannel = member.guild.channels.cache.get(
    config.chan_staff_bot_notif
  ) as TextChannel;
  if (member.roles.cache.hasAny(config.role_ab, config.role_az)) {
    console.log("role detected for member that left");
    removeFromSheet(member);
    staffBotNotifChannel.send(
      `Family Name: ${utils.getFamilyName(
        member.displayName
      )} has left the server. Please kick them in game`
    );
  }
});

client.on("warn", console.warn);
client.on("error", console.error);
