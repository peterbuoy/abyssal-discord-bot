import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config.json";
import dayjs from "dayjs";

export default {
  name: "war-info",
  category: "Testing",
  description: "gets info regarding war settings",
  slash: false,
  testOnly: true,
  minArgs: 0,
  maxArgs: 0,
  syntax: "war-info",
  callback: async ({ message, channel }) => {
    if (
      channel.id !== config.chan_war_bot_spam ||
      !message.member?.roles.cache.has(config.role_war_staff)
    ) {
      return;
    }
    const currentWar = await pool.query(
      "SELECT * FROM warsignup WHERE is_active = true LIMIT 1"
    );
    if (currentWar.rowCount === 0) {
      return message.reply("There is no war in Ba Sing Se!");
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
        `Min GS: ${
          currentWar.rows[0].min_gs ? currentWar.rows[0].min_gs : "None"
        }\n` +
        `PVP Prof: ${
          currentWar.rows[0].require_pvp_proficiency
            ? "NOT REQUIRED"
            : "REQUIRED"
        }
    `
    );
  },
} as ICommand;