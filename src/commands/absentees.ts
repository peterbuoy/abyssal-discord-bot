import { pool } from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config";
import { userMention } from "@discordjs/builders";
import { Collection, GuildMember } from "discord.js";

export default {
  name: "absentees",
  names: "absentees",
  category: "War",
  description:
    "List people who have not attended war in the specified number of days back.",
  slash: false,
  testOnly: false,
  minArgs: 1,
  maxArgs: 1,
  expectedArgs: "[number of days back to check]",
  syntax: "absentees",
  callback: async ({ member, channel, client, args }) => {
    if (
      channel.id !== config.chan_war_bot_spam ||
      !member.roles.cache.hasAny(config.role_admin || config.role_war_staff)
    ) {
      channel.send(
        "This command can only be used in #war-bot-spam or #war-council by war-staff"
      );
      return;
    }
    const members = client.guilds.cache.get(config.id_guild)?.members.cache;
    if (members === undefined) {
      channel.send(
        "No members found in this Discord server. Unable to execute command."
      );
      return;
    }
    const abyssalMembers = members.filter((member) =>
      member.roles.cache.has(config.role_ab)
    );
    const fillerGuildMember = abyssalMembers.first();
    if (fillerGuildMember === undefined) {
      channel.send(
        "There are currently no Abyssal members. Unable to execute command."
      );
      return;
    }

    const numberOfDaysBack = `'${args[0]} days'`;
    const queryResult = await pool.query(
      "SELECT name, signuplist, date_of_war FROM warsignup WHERE date_of_war > CURRENT_DATE - $1::interval ORDER BY date_of_war ASC",
      [numberOfDaysBack]
    );
    const rows = queryResult.rows;

    // <Discord userID, GuildMember>
    const attendance = new Collection<string, GuildMember>();
    // Note that query orders by date_of_war ASC
    // and order is preserved using forEach so mostRecentWarDate is overwritten correctly
    rows.forEach((row) => {
      for (const key in row.signuplist) {
        // Only show CURRENT abyssal members in output
        if (!abyssalMembers.has(key)) {
          continue;
        }
        if (!attendance.has(key)) {
          attendance.set(key, fillerGuildMember);
        }
      }
    });
    const absenteeMembers = attendance.difference(abyssalMembers);
    let statMessage = `*${absenteeMembers.size} members have NOT attended war in the past ${numberOfDaysBack}*\n`;
    absenteeMembers.forEach((value, key) => {
      statMessage += `${userMention(key)}\n`;
    });
    channel.send(statMessage);
  },
} as ICommand;
