import {
  Client,
  Collection,
  Guild,
  GuildMember,
  Intents,
  TextChannel,
} from "discord.js";
import fs from "fs";
import dotenv from "dotenv";
import config from "./config.json";
import { removeFromSheet } from "./eventHandlers/removeFromSheet";
import utils from "./utils/utils";
dotenv.config();

console.log("Bot is starting...");

const client: any = new Client({
  intents: [
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});
const token = process.env.BOT_TOKEN;

client.login(token);

client.commands = new Collection();

const commandFiles = fs
  .readdirSync("./src/commands")
  .filter((file) => file.endsWith(".js"));
(async () => {
  for (const file of commandFiles) {
    const command = await import(`./src/commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
  }
})();

const eventFiles = fs
  .readdirSync("./src/events")
  .filter((file) => file.endsWith(".ts"));

// dynamically import events from ./src/events
(async () => {
  for (const file of eventFiles) {
    const event = await import(`./events/${file}`);
    if (event.once) {
      client.once(event.name, (...args: any) => event.execute(...args));
    } else {
      client.on(event.name, (...args: any) => event.execute(...args));
    }
  }
})();

// If you put this in events it won't detect the removal
client.on("guildMemberRemove", (member: GuildMember) => {
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

client.on("interactionCreate", async (interaction: any) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.on("warn", console.warn);
client.on("error", console.error);
