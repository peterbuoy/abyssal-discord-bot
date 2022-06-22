import { channelMention, userMention } from "@discordjs/builders";
import { Client, MessageReaction, TextChannel, User } from "discord.js";
import { pool } from "../db/index";
import { getSheetByTitle } from "../utils/getSheetByTitle";
import { updateOrCreateWarSignups } from "../utils/updateOrCreateWarSignups";
import config from "../config";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { QueryResult } from "pg";
dayjs.extend(utc);
dayjs.extend(tz);

const createWarSignUpCollector = async (
  client: Client,
  embed_msg_id?: string
) => {
  if (typeof embed_msg_id == "undefined") {
    embed_msg_id = await pool
      .query(`SELECT embed_msg_id FROM warsignup WHERE is_active = true`)
      .then((qResult: QueryResult) => {
        const embed_msg_id = qResult.rows[0].embed_msg_id;
        try {
          if (!embed_msg_id) {
            throw new Error("lol");
          } else return embed_msg_id;
        } catch (err) {
          console.error(err);
        }
      });
  }
  const nodeWarSignupChan = client.channels.cache.get(
    config.chan_node_war_signup
  ) as TextChannel;
  const attendanceChannel = client.channels.cache.get(
    config.chan_attendance_log
  ) as TextChannel;
  const botSpamChannel = client.channels.cache.get(
    config.chan_bot_spam
  ) as TextChannel;
  const embedMessage = await nodeWarSignupChan.messages.fetch(
    embed_msg_id as string
  );
  const filter = (reaction: MessageReaction, user: User) => {
    if (!user.bot) reaction.users.remove(user);
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
    console.log(`${user.username} reacted with ${reaction.emoji.name}`);
    if (reaction.emoji.name === "✅") {
      // pull data from google sheet
      const sheet = await getSheetByTitle(config.ab_sheet_title);
      const rows = await sheet?.getRows();
      const userInfo = rows?.find((row) => row["Discord UserID"] === user.id);

      try {
        if (userInfo === undefined) {
          throw new Error(
            "Could not find user in sheet when signing up for Node War"
          );
        }
        // check if userInfo has the three stipulated values by gais
        if (
          userInfo["Character Name"] == "" ||
          userInfo["Gear Score"] == "" ||
          userInfo["Class"] == ""
        ) {
          await attendanceChannel.send(
            `:grey_exclamation: ${userMention(
              userInfo["Discord UserID"]
            )} attempted to sign up for nodewar but they have not completed a gear update.`
          );
          await botSpamChannel.send(
            `${userMention(
              userInfo["Discord UserID"]
            )} Hi, please complete a gear update in ${channelMention(
              config.chan_gear_update
            )} before you can sign up for nodewar.`
          );
          return;
        }
        // if missing, send an ephemeral message to user that the values are missing
        // (and they need to do a FULL new gear update)
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
          `UPDATE warsignup SET signuplist = signuplist || $1::jsonb WHERE is_active = true AND signuplist ? $2 = false RETURNING signuplist->$2`,
          values
        );
        console.log(
          updateQuery.rows[0],
          "is the row count for update query that adds AB members to signuplist"
        );
        if (updateQuery.rowCount === 1) {
          await attendanceChannel.send(
            `✅ ${userMention(user.id)} has signed up for war`
          );
        } else if (updateQuery.rows[0] === undefined) {
          await attendanceChannel.send(
            `❔ ${userMention(
              user.id
            )} has signed up for war but is already signed up.`
          );
          return;
        } else {
          await attendanceChannel.send(
            `${userMention(config.id_peterbuoy)} ${userMention(
              user.id
            )} tried to sign up for war but they have not been added into the database.`
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
};

export { createWarSignUpCollector };
