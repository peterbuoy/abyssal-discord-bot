import dayjs from "dayjs";
import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config";
import { MessageEmbed, MessageReaction, TextChannel, User } from "discord.js";
import utils from "../utils/utils";
import { codeBlock, userMention } from "@discordjs/builders";
import { getSheetByTitle } from "../utils/getSheetByTitle";
import { updateOrCreateWarSignups } from "../utils/updateOrCreateWarSignups";

export default {
  name: "open-war",
  category: "War",
  description: "Opens war signup sheet in #node-war-signup",
  slash: false,
  testOnly: false,
  minArgs: 2,
  maxArgs: 2,
  expectedArgs: "<War_Name> <MM/DD/YYYY>",
  syntax: "open-war <War_Name> <Date MM/DD/YYYY>",
  cooldown: "5s",
  callback: async ({ client, member, message, channel, args }) => {
    // Nice to have: await user confirmation that this command will overwrite the active war
    // Only allow in #warbot-spam and only usable by war staff
    if (
      channel.id !== config.chan_war_bot_spam ||
      !message.member?.roles.cache.has(config.role_war_staff)
    ) {
      message.reply("You can only use this in the warbot-spam channel.");
      return;
    }
    const warName = args[0].split("_").join(" ");
    console.log(args[1]);
    let warDate = "";
    try {
      if (!dayjs(args[1]).isValid()) throw "Invalid date format";
      warDate = dayjs(args[1]).format("MM/DD/YYYY");
    } catch (err) {
      console.error(err);
    }
    await pool.query(
      "UPDATE warsignup SET is_active = false WHERE is_active = true"
    );
    const text =
      "INSERT into warsignup(name, date_of_war, is_active) VALUES($1, $2, $3) RETURNING *";
    const values = [warName, warDate, true];
    pool
      .query(text, values)
      .then((res) => {
        console.log(res.rows[0]);
        message.reply(
          `You have opened up a war:\nName: ${warName}\nDate: ${warDate}`
        );
        const attendanceChannel = client.channels.cache.get(
          config.chan_attendance_log
        ) as TextChannel;
        attendanceChannel.send(
          `🎉 The event ${warName} has been opened by <${utils.parseFamilyName(
            member.displayName
          )}>🎉 `
        );
      })
      .catch((err) => console.error(err));
    const nodeWarSignupChan = client.channels.cache.get(
      config.chan_node_war_signup
    ) as TextChannel;
    await nodeWarSignupChan.bulkDelete(10);

    const exampleEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle(`**${warName}**`)
      .addFields(
        { name: "Date", value: warDate },
        {
          name: "Instructions",
          value: "✅ Signup ||  🚫 Sign out",
        }
      )
      .setTimestamp();
    // You must await this or the emoji collector will be created before the embed
    await nodeWarSignupChan
      .send({ embeds: [exampleEmbed] })
      .then((msg) => {
        msg.react("✅");
        msg.react("🚫");
      })
      .then((msg) => {
        console.log(msg);
      })
      .catch((err) => console.error(err));
    // An emoji collector will be created when the bot is started in the "ready" event

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
                    `✅ ${userMention(user.id)} has signed up for war`
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
                    `🚫 ${userMention(user.id)} has signed out of war`
                  );
                }
              } catch (error) {
                console.error(error);
              }
            }
            updateOrCreateWarSignups();
          });
        } else {
          throw Error(
            "Unable to find embed message in node war signup channel."
          );
        }
      })
      .catch((err) => console.error(err));
    // This is NOT ideal but if the bot is reset the ✅ collector must start again somehow
    const familyName = "Family Name".padEnd(17, " ");
    const characterName = "Character Name".padEnd(17, " ");
    const className = "Class".padEnd(12, " ");
    const lvl = "Lv".padEnd(4, " ");
    const gs = "GS".padEnd(5, " ");
    const pvp = "PVP".padEnd(4, " ");
    const time = "Time (PT)";
    nodeWarSignupChan.send(
      codeBlock(
        `${familyName}${characterName}${className}${lvl}${gs}${pvp}${time}`
      )
    );
  },
} as ICommand;
