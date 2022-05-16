import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config";
import dayjs from "dayjs";
import { channelMention, userMention } from "@discordjs/builders";

export default {
  name: "war-info",
  category: "War",
  description: "Gets info regarding war settings",
  slash: false,
  testOnly: false,
  minArgs: 0,
  maxArgs: 0,
  syntax: "war-info",
  callback: async ({ message, channel }) => {
    if (
      channel.id !== config.chan_war_bot_spam ||
      !message.member?.roles.cache.has(config.role_war_staff)
    ) {
      message.reply(
        `Only warstaff can use this in ${channelMention(
          config.chan_war_bot_spam
        )}.`
      );
      return;
    }
    const currentWar = await pool.query(
      "SELECT * FROM warsignup WHERE is_active = true LIMIT 2"
    );
    if (currentWar.rowCount === 0) {
      message.reply("There is no war in Ba Sing Se!");
      return;
    } else if (currentWar.rowCount > 1) {
      message.reply(
        `${userMention(config.id_peterbuoy)} Time to check the war database.`
      );
      throw Error(
        "There is more than one active war in the database. Something has gone terribly wrong and you're entirely at fault LMAO!"
      );
    }
    message.reply(
      `Name: ${currentWar.rows[0].name}\n` +
        `Date: ${dayjs(currentWar.rows[0].date_of_war).format(
          "MM/DD/YYYY"
        )}\n` +
        `Cap: ${
          currentWar.rows[0].attendee_cap
            ? currentWar.rows[0].attendee_cap
            : "None"
        }\n` +
        `Min GS: None\n` +
        `PVP Prof: ${
          currentWar.rows[0].require_pvp_proficiency
            ? "NOT REQUIRED"
            : "REQUIRED"
        }
    `
    );
  },
} as ICommand;
