import { GuildMember, TextChannel } from "discord.js";
import { getSheetByTitle } from "../utils/getSheetByTitle";
import config from "../config.json";
import { removeFromSheet } from "../utils/removeFromSheet";
import { updateOrCreateWarSignups } from "../utils/updateOrCreateWarSignups";
import pool from "../db/index";
import { userMention } from "@discordjs/builders";
import { addToDumpSheet } from "src/utils/addToDumpSheet";

module.exports = {
  name: "guildMemberRemove",
  async execute(member: GuildMember) {
    await addToDumpSheet(member);
    await removeFromSheet(member);
    const staffBotNotifChannel = member.guild.channels.cache.get(
      config.chan_staff_bot_notif
    ) as TextChannel;
    staffBotNotifChannel.send(`${userMention(member.id)} has left the server.`);
    await pool.query("UPDATE warsignup SET signuplist = signuplist - $1", [
      member.id,
    ]);
    updateOrCreateWarSignups();
  },
};
