import dayjs from "dayjs";
import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config";
import { MessageEmbed, TextChannel } from "discord.js";
import utils from "../utils/utils";
import { channelMention, codeBlock } from "@discordjs/builders";
import { createWarSignUpCollector } from "../collectors/createWarSignUpCollector";

export default {
  name: "open-war",
  category: "War",
  description: "Opens war signup sheet in #node-war-signup",
  slash: false,
  testOnly: false,
  minArgs: 2,
  maxArgs: 2,
  expectedArgs: "<War_Name> <MM/DD/YYYY>",
  syntax: "open-war <War_Name> <Date MM/DD/YYYY>",
  cooldown: "5s",
  callback: async ({ client, member, message, channel, args }) => {
    // Only allow in #warbot-spam and only usable by war staff
    if (
      channel.id !== config.chan_war_bot_spam ||
      !message.member?.roles.cache.has(config.role_war_staff)
    ) {
      message.reply(
        `Only warstaff only use this in the ${channelMention(
          config.chan_war_bot_spam
        )}`
      );
      return;
    }
    const warName = args[0].split("_").join(" ");
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
      .then((res) => {
        console.log(res.rows[0]);
        message.reply(
          `You have opened up a war:\nName: ${warName}\nDate: ${warDate}`
        );
        const attendanceChannel = client.channels.cache.get(
          config.chan_attendance_log
        ) as TextChannel;
        attendanceChannel.send(
          `🎉 The event ${warName} has been opened by <${utils.parseFamilyName(
            member.displayName
          )}>🎉 `
        );
      })
      .catch((err) => console.error(err));
    const nodeWarSignupChan = client.channels.cache.get(
      config.chan_node_war_signup
    ) as TextChannel;
    // This fetches UP to x amount of messages and deletes them via bulk delete discord api call
    await nodeWarSignupChan.bulkDelete(10);

    const exampleEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle(`**${warName}**`)
      .addFields(
        { name: "Date", value: warDate },
        {
          name: "Instructions",
          value: "✅ Signup ||  🚫 Sign out",
        }
      )
      .setTimestamp();
    // You must await this or the emoji collector will be created before the embed
    await nodeWarSignupChan
      .send({ embeds: [exampleEmbed] })
      .then((msg) =>
        Promise.all([
          msg.react("✅"),
          msg.react("🚫"),
          pool.query(
            `UPDATE warsignup SET embed_msg_id = $1 WHERE is_active = true`,
            [msg.id]
          ),
          createWarSignUpCollector(client, msg.id),
        ])
      )
      .catch((err) => console.error(err));
    // An emoji collector will be created when the bot is started in the "ready" event

    const familyName = "Family Name".padEnd(17, " ");
    const characterName = "Character Name".padEnd(17, " ");
    const className = "Class".padEnd(12, " ");
    const lvl = "Lv".padEnd(4, " ");
    const gs = "GS".padEnd(5, " ");
    const pvp = "PVP".padEnd(4, " ");
    const time = "Time (PT)";
    const listMessage = await nodeWarSignupChan.send(
      codeBlock(
        `${familyName}${characterName}${className}${lvl}${gs}${pvp}${time}`
      )
    );
    await pool.query(
      `UPDATE warsignup SET list_msg_id = $1 WHERE is_active = true`,
      [listMessage.id]
    );
  },
} as ICommand;
