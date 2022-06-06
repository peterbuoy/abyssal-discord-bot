import { pool } from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config";
import { userMention } from "@discordjs/builders";
import { Collection } from "discord.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(tz);

export default {
  name: "war-stats",
  category: "War",
  description: "List war signup statistics",
  slash: false,
  testOnly: false,
  minArgs: 0,
  maxArgs: 0,
  syntax: "war-stats",
  callback: async ({ member, channel }) => {
    if (
      channel.id !== config.chan_war_bot_spam ||
      !member.roles.cache.hasAny(config.role_admin || config.role_war_staff)
    ) {
      channel.send(
        "This command can only be used in #war-bot-spam or #war-council by war-staff"
      );
      return;
    }

    const queryResult = await pool.query(
      "SELECT name, signuplist, date_of_war FROM warsignup WHERE date_of_war > CURRENT_DATE - INTERVAL '30 days' ORDER BY date_of_war ASC"
    );
    const rows = queryResult.rows;
    // <Discord userID, [attendanceCount, mostRecentWarDate]
    const attendance = new Collection<string, [number, string]>();
    // Note that query orders by date_of_war ASC
    // and order is preserved using forEach so mostRecentWarDate is overwritten correctly
    rows.forEach((row) => {
      for (const key in row.signuplist) {
        if (!attendance.has(key)) {
          attendance.set(key, [1, row.date_of_war]);
        } else if (attendance.has(key)) {
          attendance.set(key, [
            (attendance.get(key)?.[0] as number) + 1,
            row.date_of_war,
          ]);
        } else {
          throw Error("Something has gone horribly wrong in %war-stats.");
        }
      }
    });
    // sort by number of wars attended past 30 days DESC
    attendance.sort((memberA, memberB) => memberB[0] - memberA[0]);
    let statMessage = `*${attendance.size} members have attended war in the past 30 days*\n\n#  last_date_attended Member\n-------------------\n`;
    attendance.forEach((value, key) => {
      statMessage += `${value[0]}  ${dayjs(value[1])
        .tz("America/Los_Angeles")
        .format("MM/DD/YYYY")} ${userMention(key)}\n`;
    });
    channel.send(statMessage);
  },
} as ICommand;
