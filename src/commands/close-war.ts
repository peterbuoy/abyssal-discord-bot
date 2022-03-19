import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config";
import utils from "../utils/utils";
import { TextChannel } from "discord.js";

export default {
  name: "close-war",
  category: "War",
  description: "closes currently active war",
  slash: false,
  testOnly: false,
  minArgs: 0,
  maxArgs: 0,
  syntax: "close-war",
  cooldown: "5s",
  callback: async ({ client, member, message, channel }) => {
    // Only allow in #warbot-spam and only usable by war staff
    if (
      channel.id !== config.chan_war_bot_spam ||
      !message.member?.roles.cache.has(config.role_war_staff)
    ) {
      message.reply("You can only use this in the warbot-spam channel.");
      return;
    }
    const currentWar = await pool.query(
      "UPDATE warsignup SET is_active = false WHERE is_active = true RETURNING name, date_of_war"
    );
    if (currentWar.rowCount !== 1) {
      return message.reply("There is no war to close!");
    }

    message.reply(
      `**${currentWar.rows[0].name}** was closed by <${utils.parseFamilyName(
        member.displayName
      )}>`
    );
    const attendanceChannel = client.channels.cache.get(
      config.chan_attendance_log
    ) as TextChannel;
    const nodeWarSignupChan = client.channels.cache.get(
      config.chan_node_war_signup
    ) as TextChannel;
    attendanceChannel.send(
      `**${currentWar.rows[0].name}** was closed by <${utils.parseFamilyName(
        member.displayName
      )}>`
    );
    nodeWarSignupChan.bulkDelete(10);
  },
} as ICommand;
