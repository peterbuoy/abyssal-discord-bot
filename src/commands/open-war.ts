import dayjs from "dayjs";
import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config.json";
import { TextChannel } from "discord.js";
import utils from "../utils/utils";

export default {
  name: "open-war",
  category: "Testing",
  description: "Opens war signup sheet",
  slash: false,
  testOnly: true,
  minArgs: 2,
  maxArgs: 2,
  expectedArgs: "<War_Name> <MM/DD/YYYY>",
  syntax: "open-war <War_Name> <Date MM/DD/YYYY>",
  cooldown: "5s",
  callback: async ({ member, message, channel, args }) => {
    // Nice to have: await user confirmation that this command will overwrite the active war
    // Only allow in #warbot-spam and only usable by war staff
    if (
      channel.id !== config.chan_war_bot_spam ||
      !message.member?.roles.cache.has(config.role_war_staff)
    ) {
      return;
    }
    const warName = args[0].replace("_", " ");
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
      .then((res) => console.log(res.rows[0]))
      .catch((err) => console.error(err))
      .finally(() => {
        message.reply(
          `You have opened up a war:\nName: ${warName}\nDate: ${warDate}`
        );
        const attendanceChannel = message.client.channels.cache.get(
          config.chan_attendance_log
        ) as TextChannel;
        attendanceChannel.send(
          `🎉 The event ${warName} has been opened by <${utils.parseFamilyName(
            member.displayName
          )}>🎉 `
        );
      });
  },
} as ICommand;
