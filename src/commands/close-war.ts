import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config.json";
import utils from "../utils/utils";
import { TextChannel } from "discord.js";

export default {
  name: "close-war",
  category: "Testing",
  description: "closes war signup sheet",
  slash: false,
  testOnly: true,
  minArgs: 0,
  maxArgs: 0,
  syntax: "close-war",
  cooldown: "5s",
  callback: async ({ member, message, channel }) => {
    // Nice to have: await user confirmation that this command will overwrite the active war
    // Only allow in #warbot-spam and only usable by war staff
    if (
      channel.id !== config.chan_war_bot_spam ||
      !message.member?.roles.cache.has(config.role_war_staff)
    ) {
      return;
    }
    const currentWar = await pool.query(
      "UPDATE warsignup SET is_active = false WHERE is_active = true RETURNING name, date_of_war"
    );
    if (currentWar.rowCount === 1) {
      message.reply(
        `**${currentWar.rows[0].name}** was closed by <${utils.parseFamilyName(
          member.displayName
        )}>`
      );
      const attendanceChannel = message.client.channels.cache.get(
        config.chan_attendance_log
      ) as TextChannel;
      attendanceChannel.send(
        `**${currentWar.rows[0].name}** was closed by <${utils.parseFamilyName(
          member.displayName
        )}>`
      );
    } else {
      console.error("Error: more than one war was closed.");
      message.reply("There is no war to close!");
    }
  },
} as ICommand;
