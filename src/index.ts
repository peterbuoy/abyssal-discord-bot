import { Client, Intents, TextChannel } from "discord.js";
import { userMention } from "@discordjs/builders";

import path from "path";
import WOKCommands from "wokcommands";
import dotenv from "dotenv";
import config from "./config";
import utils from "./utils/utils";
import { pool } from "./db/index";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(tz);

import { addToSheet } from "./utils/addToSheet";
import { removeFromSheet } from "./utils/removeFromSheet";
import { getSheetByTitle } from "./utils/getSheetByTitle";
import { addToDumpSheet } from "./utils/addToDumpSheet";
import { updateSheetFamilyName } from "./utils/updateSheetFamilyName";
import { sendWelcomeMessage } from "./utils/sendWelcomeMessage";
import { updateOrCreateWarSignups } from "./utils/updateOrCreateWarSignups";
import { createWarSignUpCollector } from "./collectors/createWarSignUpCollector";

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

client.on("ready", async (client) => {
  if (!client.user || !client.application) {
    return;
  }
  setAbyssalMemberCountAsActivity(client);
  purgeAzPending(client);

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

// Event listener for role tagging and name enforcement of ABAZ members
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const userID = oldMember.id;
  const staffBotNotifChannel = newMember.guild.channels.cache.get(
    config.chan_staff_bot_notif
  ) as TextChannel;

  // User joining guild
  if (
    (!oldMember.roles.cache.has(config.role_ab) &&
      newMember.roles.cache.has(config.role_ab)) ||
    (!oldMember.roles.cache.has(config.role_az) &&
      newMember.roles.cache.has(config.role_az))
  ) {
    await removeFromSheet(newMember);
    await addToSheet(newMember);
    setTimeout(setAbyssalMemberCountAsActivity, 3 * 1000, client);
    sendWelcomeMessage(newMember, config.chan_bot_spam);
  }

  // User leaving guild
  if (
    (oldMember.roles.cache.has(config.role_ab) &&
      !newMember.roles.cache.has(config.role_ab)) ||
    (oldMember.roles.cache.has(config.role_az) &&
      !newMember.roles.cache.has(config.role_az))
  ) {
    await addToDumpSheet(oldMember);
    await removeFromSheet(oldMember);
    if (oldMember.roles.cache.has(config.role_ab)) {
      await pool.query("UPDATE warsignup SET signuplist = signuplist - $1", [
        oldMember.id,
      ]);
      setTimeout(setAbyssalMemberCountAsActivity, 3 * 1000, client);
      updateOrCreateWarSignups();
    }
  }

  // Name check
  if (
    oldMember.nickname !== newMember.nickname &&
    !utils.isNameValid(newMember.nickname!) &&
    newMember.roles.cache.hasAny(
      config.role_ab,
      config.role_ab_pending,
      config.role_az,
      config.role_ab_pending
    )
  ) {
    staffBotNotifChannel.send(
      `⚠️ Invalid Name Change
        User Profile: ${userMention(userID)}
        Old Nickname: ${oldMember.nickname}
        New Nickname: ${newMember.nickname}\n`
    );
  } else if (
    oldMember.nickname !== newMember.nickname &&
    utils.isNameValid(newMember.nickname!) &&
    newMember.roles.cache.hasAny(
      config.role_ab,
      config.role_ab_pending,
      config.role_az,
      config.role_ab_pending
    )
  ) {
    staffBotNotifChannel.send(`
      ☑️ Valid Name Change
      User Profile: ${userMention(userID)}
      Old Nickname: ${oldMember.nickname}
      New Nickname: ${newMember.nickname}
      *Sheet has been updated*\n`);

    updateSheetFamilyName(newMember);
  }
});

// Event listener for an ABAZ member leaving the Discord server
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
    setTimeout(setAbyssalMemberCountAsActivity, 3 * 1000, client);
  }
});

client.on("warn", console.warn);
client.on("error", console.error);

// Function sets bot activity as the count based on those in the google sheet
const setAbyssalMemberCountAsActivity = async (client: Client) => {
  console.log("getting abyssal member count");
  const abSheet = await getSheetByTitle(config.ab_sheet_title);
  const rows = await abSheet?.getRows();
  let abMemberCount = 0;
  rows?.forEach((row) => {
    if (row["Discord UserID"] !== "") {
      abMemberCount += 1;
    }
  });
  console.log(abMemberCount);
  client.user?.setActivity(`${abMemberCount} members. %help for help`, {
    type: "WATCHING",
  });
};

// Function removes pending AZ members after 3 days
const purgeAzPending = async (client: Client) => {
  const guild = client.guilds.cache.get(config.id_guild);
  const { rows: azPendingPurgeList } = await pool.query(
    "DELETE FROM pending_az WHERE conferment_timestamp < current_timestamp - INTERVAL '3 days' RETURNING discord_user_id"
  );
  azPendingPurgeList.forEach((member) => {
    const purgableMember = guild?.members.cache.get(member.discord_user_id);
    if (purgableMember?.roles.cache.has(config.role_az_pending)) {
      purgableMember.roles.remove(config.role_az_pending);
    }
  });
};

setInterval(purgeAzPending, 3600 * 1000, client);
setInterval(setAbyssalMemberCountAsActivity, 3600 * 1000, client);
