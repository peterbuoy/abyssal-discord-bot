import dayjs from "dayjs";
import pool from "../db/index";
import { ICommand } from "wokcommands";
import config from "../config.json";
import { MessageEmbed, TextChannel } from "discord.js";
import utils from "../utils/utils";
import { codeBlock } from "@discordjs/builders";

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
  callback: async ({ client, member, message, channel, args }) => {
    // Nice to have: await user confirmation that this command will overwrite the active war
    // Only allow in #warbot-spam and only usable by war staff
    if (
      channel.id !== config.chan_war_bot_spam ||
      !message.member?.roles.cache.has(config.role_war_staff)
    ) {
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
      .then((res) => console.log(res.rows[0]))
      .catch((err) => console.error(err))
      .finally(() => {
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
      });
    const nodeWarSignupChan = client.channels.cache.get(
      config.chan_node_war_signup
    ) as TextChannel;
    nodeWarSignupChan.messages
      .fetch()
      .then((messages) => messages.forEach((m) => m.delete()));

    const exampleEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle(`**${warName}**`)
      .addFields(
        { name: "Date", value: warDate },
        {
          name: "Instructions",
          value: "Click the 🅱️ below to sign up or unsignup from war",
        }
      )
      .setTimestamp();

    nodeWarSignupChan
      .send({ embeds: [exampleEmbed] })
      .then((msg) => msg.react("🅱️"))
      .catch((err) => console.error(err));
    // An emoji collector will be created when the bot is started in the "ready" event
    // This is NOT ideal but if the bot is reset the 🅱️ collector must start again somehow
    const familyName = "Family Name".padEnd(17, " ");
    const characterName = "Character Name".padEnd(17, " ");
    const className = "Class".padEnd(12, " ");
    const lvl = "Lv".padEnd(4, " ");
    const gs = "GS".padEnd(5, " ");
    const pvp = "PVP".padEnd(4, " ");
    const time = "Time (PT)";
    nodeWarSignupChan.send(
      codeBlock(
        `## ${familyName}${characterName}${className}${lvl}${gs}${pvp}${time}`
      )
    );
  },
} as ICommand;
