import { GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { userMention } from "@discordjs/builders";
import * as config from "../config.json";
import utils from "../utils/utils";

module.exports = {
  name: "guildMemberUpdate",
  execute(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
    console.log(oldMember, newMember);
    const userID = oldMember.id;
    const staffBotNotifChannel = newMember.guild.channels.cache.get(
      config.chan_staff_bot_notif
    );

    if (!staffBotNotifChannel?.isText()) return;

    const msg = `
      **Name Change Detected**
      User Profile: ${userMention(userID)}
      Old Nickname: ${oldMember.nickname}
      New Nickname: ${newMember.nickname}\n
      `;
    if (
      oldMember.nickname !== newMember.nickname &&
      !utils.isNameValid(newMember.nickname!)
    ) {
      console.log("invalid name");
      staffBotNotifChannel.send(
        `⚠️**Invalid Name Change**⚠️ for ${userMention(userID)}
        ${msg}
        `
      );
    } else {
      staffBotNotifChannel.send(msg);
    }
  },
};
