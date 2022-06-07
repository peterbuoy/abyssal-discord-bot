import { pool } from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config";
import { userMention } from "@discordjs/builders";
import { Collection, GuildMember } from "discord.js";

export default {
  name: "absentees",
  names: "absentees",
  category: "War",
  description: "List people who have not attended war in the past 30 days.",
  slash: false,
  testOnly: false,
  minArgs: 0,
  maxArgs: 0,
  syntax: "war-stats",
  callback: async ({ member, channel, client }) => {
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
    const abyssalMembers = members!.filter((member) =>
      member.roles.cache.has(config.role_ab)
    );
    const fillerGuildMember = abyssalMembers.first();

    const queryResult = await pool.query(
      "SELECT name, signuplist, date_of_war FROM warsignup WHERE date_of_war > CURRENT_DATE - INTERVAL '30 days' ORDER BY date_of_war ASC"
    );
    const rows = queryResult.rows;

    // edit the code below lol

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
          attendance.set(key, fillerGuildMember!);
        }
      }
    });
    const absenteeMembers = attendance.difference(abyssalMembers);
    let statMessage = `*${absenteeMembers.size} members have NOT attended war in the past 30 days*\n`;
    absenteeMembers.forEach((value, key) => {
      statMessage += `${userMention(key)}\n`;
    });
    channel.send(statMessage);
  },
} as ICommand;
