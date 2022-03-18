import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config.json";
import utils from "../utils/utils";
import { MessageEmbed, TextChannel } from "discord.js";
import dayjs from "dayjs";

export default {
  name: "change-war-date",
  category: "Testing",
  description: "closes war signup sheet",
  slash: false,
  testOnly: true,
  minArgs: 1,
  maxArgs: 1,
  syntax: "change-war-date",
  cooldown: "5s",
  callback: async ({ client, member, message, args, channel }) => {
    if (
      !member.roles.cache.has(config.role_war_staff) ||
      channel.id !== config.chan_war_bot_spam
    ) {
      message.reply("You can only use this in the warbot-spam channel.");
      return;
    }

    const date = dayjs(args[0]).format("MM/DD/YYYY");
    const currentWar = await pool.query(
      "UPDATE warsignup SET date_of_war = $1 WHERE is_active = true RETURNING *",
      [date]
    );
    message.reply(`You have changed the date of the current war to ${date}`);
    const attendanceChannel = client.channels.cache.get(
      config.chan_attendance_log
    ) as TextChannel;
    attendanceChannel.send(
      `🎉 The event ${
        currentWar.rows[0].name
      } has had its date changed to ${date} by <${utils.parseFamilyName(
        member.displayName
      )}>🎉 `
    );
    const nodeWarSignupChan = client.channels.cache.get(
      config.chan_node_war_signup
    ) as TextChannel;
    nodeWarSignupChan.messages.fetch().then((messages) => {
      const embedMessage = messages.find(
        (message) => message.author.bot && message.embeds.length > 0
      );
      const newEmbed = new MessageEmbed(embedMessage?.embeds[0]).setFields(
        {
          name: "Date",
          value: date,
        },
        {
          name: "Instructions",
          value: "Click the 🅱️ below to sign up or unsignup from war",
        }
      );
      embedMessage?.edit({ embeds: [newEmbed] });
    });
  },
} as ICommand;
