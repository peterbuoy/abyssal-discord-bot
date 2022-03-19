import { GuildMember, Role, TextChannel } from "discord.js";
import config from "../config";
import { removeFromSheet } from "../utils/removeFromSheet";
import { updateOrCreateWarSignups } from "../utils/updateOrCreateWarSignups";
import pool from "../db/index";
import { userMention } from "@discordjs/builders";
import { addToDumpSheet } from "../utils/addToDumpSheet";

module.exports = {
  name: "guildMemberRemove",
  async execute(member: GuildMember) {
    if (!member.roles.cache.hasAny(config.role_ab, config.role_az)) {
      return;
    }
    await addToDumpSheet(member);
    await removeFromSheet(member);
    const staffBotNotifChannel = member.guild.channels.cache.get(
      config.chan_staff_bot_notif
    ) as TextChannel;
    staffBotNotifChannel.send(
      `${userMention(member.id)} has left the server. Please kick from ${
        member.roles.cache.has(config.role_az) ? "Azurlane" : "Abyssal"
      }`
    );
    if (member.roles.cache.has(config.role_ab)) {
      await pool.query("UPDATE warsignup SET signuplist = signuplist - $1", [
        member.id,
      ]);
      updateOrCreateWarSignups();
    }
  },
};
