import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config.json";
import utils from "../utils/utils";
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
  cooldown: "5s",
  callback: async ({ message, channel }) => {
    // Nice to have: await user confirmation that this command will overwrite the active war
    // Only allow in #warbot-spam and only usable by war staff
    if (
      channel.id !== config.chan_war_bot_spam ||
      !message.member?.roles.cache.has(config.role_war_staff)
    ) {
      return;
    }
    const currentWar = await pool.query(
      "SELECT * FROM warsignup WHERE is_active = true"
    );
    console.log(currentWar.rows);
    if (currentWar.rowCount === 1) {
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
    } else {
      console.error("Error: more than one war is active or there is no war.");
      message.reply("More than one war is active or there is no war!");
    }
  },
} as ICommand;
