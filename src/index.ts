import {
  Client,
  Intents,
  MessageReaction,
  TextChannel,
  User,
} from "discord.js";
import fs from "fs";
import path from "path";
import WOKCommands from "wokcommands";
import dotenv from "dotenv";
import config from "./config";
import { removeFromSheet } from "./utils/removeFromSheet";
import utils from "./utils/utils";
import { userMention } from "@discordjs/builders";
import { getSheetByTitle } from "./utils/getSheetByTitle";
import pool from "./db/index";
import { updateOrCreateWarSignups } from "./utils/updateOrCreateWarSignups";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { addToDumpSheet } from "./utils/addToDumpSheet";
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
  const nodeWarSignupChan = client.channels.cache.get(
    config.chan_node_war_signup
  ) as TextChannel;
  const attendanceChannel = client.channels.cache.get(
    config.chan_attendance_log
  ) as TextChannel;
  nodeWarSignupChan.messages
    .fetch()
    .then((messages) => {
      const embedMessage = messages.find(
        (message) => message.author.bot && message.embeds.length > 0
      );
      if (embedMessage) {
        const filter = (reaction: MessageReaction, user: User) => {
          const member = client.guilds.cache
            .get(config.id_guild)
            ?.members.cache.get(user.id);
          return (
            (reaction.emoji.name === "✅" || reaction.emoji.name === "🚫") &&
            member!.roles.cache.hasAll(
              config.role_ab
              // config.role_pvp_proficient
            )
          );
        };
        const collector = embedMessage.createReactionCollector({ filter });
        collector.on("collect", async (reaction, user) => {
          reaction.users.remove(user.id);
          console.log(`${user.username} reacted with ${reaction.emoji.name}`);
          if (reaction.emoji.name === "✅") {
            // pull data from google sheet
            const sheet = await getSheetByTitle(config.ab_sheet_title);
            const rows = await sheet?.getRows();
            const userInfo = rows?.find(
              (row) => row["Discord UserID"] === user.id
            );

            try {
              if (userInfo === undefined) {
                throw new Error(
                  "Could not find user in sheet when signing up for Node War"
                );
              }
              if (userInfo["Gear Score"] < config.ab_min_gear_score) {
                throw new Error(
                  `User ${user.username} does not meet minimum gear score requirement but attempted to sign up for Node War`
                );
              }
              const values = [
                JSON.stringify({
                  [user.id]: {
                    family_name: userInfo["Family Name"] || "none",
                    character_name: userInfo["Character Name"]
                      ? userInfo["Character Name"]
                      : "none",
                    class: userInfo["Class"] ? userInfo["Class"] : "none",
                    lvl: userInfo["Level"] ? userInfo["Level"] : 0,
                    gs: userInfo["Gear Score"] ? userInfo["Gear Score"] : 0,
                    timestamp: dayjs()
                      .tz("America/Los_Angeles")
                      .format("ddd, h:mm A"),
                  },
                }),
                user.id,
              ];
              // this query only successfuly updates if the id is not already a top-level key in the jsonb file, the ? operator
              const updateQuery = await pool.query(
                `UPDATE warsignup SET signuplist = signuplist || $1::jsonb WHERE is_active = true AND signuplist ? $2 = false RETURNING signuplist`,
                values
              );
              if (updateQuery.rowCount === 1) {
                attendanceChannel.send(
                  `${userMention(user.id)} has signed up for war`
                );
              }
            } catch (error) {
              console.error(error);
            }
          } else if (reaction.emoji.name === "🚫") {
            try {
              const deletedUser = await pool.query(
                "UPDATE warsignup SET signuplist = signuplist - $1 WHERE signuplist ? $1 = true RETURNING signuplist",
                [user.id]
              );
              console.log(deletedUser.rowCount);
              if (deletedUser.rowCount === 1) {
                attendanceChannel.send(
                  `${userMention(user.id)} has signed out of war`
                );
              }
            } catch (error) {
              console.error(error);
            }
          }
          updateOrCreateWarSignups();
        });
      } else {
        throw Error("Unable to find embed message in node war signup channel.");
      }
    })
    .catch((err) => console.error(err));
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
  staffBotNotifChannel.send(
    `${userMention(member.id)}, family name \`${utils.parseFamilyName(
      member.displayName
    )}\` has left the server. Please kick from ${
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
