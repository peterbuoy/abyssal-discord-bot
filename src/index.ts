import { Client, Intents, TextChannel } from "discord.js";
import fs from "fs";
import path from "path";
import WOKCommands from "wokcommands";
import dotenv from "dotenv";
import config from "./config";
import { removeFromSheet } from "./utils/removeFromSheet";
import utils from "./utils/utils";
import { userMention } from "@discordjs/builders";
import pool from "./db/index";
import { updateOrCreateWarSignups } from "./utils/updateOrCreateWarSignups";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { addToDumpSheet } from "./utils/addToDumpSheet";
import { createWarSignUpCollector } from "./collectors/createWarSignUpCollector";
dayjs.extend(utc);
dayjs.extend(tz);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("Bot is starting...");

export const client = new Client({
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
  .readdirSync(path.join(__dirname, "events"))
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

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

client.on("ready", async (client) => {
  if (!client.user || !client.application) {
    return;
  }

  updateOrCreateWarSignups();
  new WOKCommands(client, {
    commandDir: path.join(__dirname, "commands"),
    // this setting is exclusive or
    // since we want to compile to js and run it we use this to do so
    typeScript: path.basename(__dirname) === "src" ? true : false,
    defaultLanguage: "english",
    ignoreBots: true,
    ephemeral: true,
    botOwners: config.id_peterbuoy,
    testServers: [config.id_guild],
    disabledDefaultCommands: [
      "help",
      "command",
      "language",
      "prefix",
      "required-role",
    ],
  }).setDefaultPrefix("%");

  // Check for valid names on startup
  try {
    const guild = await client.guilds.fetch(config.id_guild);
    const staffNotificationChannel = (await guild.channels.fetch(
      config.chan_staff_bot_notif
    )) as TextChannel;
    const memberList = await guild.members.fetch();
    const taggedMembersWithInvalidNames = memberList.filter(
      (member) =>
        member.roles.cache.hasAny(
          config.role_ab,
          config.role_ab_pending,
          config.role_az,
          config.role_az_pending
        ) && !utils.isNameValid(member.displayName)
    );
    if (taggedMembersWithInvalidNames.size > 0) {
      staffNotificationChannel.send("`-Bot restart: invalid names detected-`");
    }
    taggedMembersWithInvalidNames.forEach((member) => {
      staffNotificationChannel.send(
        `${userMention(member.id)} has an invalid name.`
      );
    });
  } catch (error) {
    console.error(error);
  }
  console.log(`${client.user.username} is ready!`);
  createWarSignUpCollector(client);
});

// If you put this in events it won't detect the removal
client.on("guildMemberRemove", async (member) => {
  if (!member.roles.cache.hasAny(config.role_ab, config.role_az)) {
    return;
  }
  await addToDumpSheet(member);
  await removeFromSheet(member);
  const staffBotNotifChannel = member.guild.channels.cache.get(
    config.chan_staff_bot_notif
  ) as TextChannel;
  const familyName = utils.parseFamilyName(member.displayName);
  await staffBotNotifChannel.send(
    `${userMention(
      member.id
    )}, family name \`${familyName}\` has left the server. Please kick from ${
      member.roles.cache.has(config.role_az) ? "Azurlane" : "Abyssal"
    }`
  );
  if (member.roles.cache.has(config.role_ab)) {
    await pool.query("UPDATE warsignup SET signuplist = signuplist - $1", [
      member.id,
    ]);
    updateOrCreateWarSignups();
  }
});

client.on("warn", console.warn);
client.on("error", console.error);
