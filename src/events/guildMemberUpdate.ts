import { GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { userMention } from "@discordjs/builders";
import { chan_staff_bot_notif } from "../config.json";

module.exports = {
  name: "guildMemberUpdate",
  execute(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
    console.log(oldMember, newMember);
    const userID = oldMember.id;
    const regex = /<[A-Za-z(0-9)?]+>/;
    // get channel by id
    const staffBotNotifChannel =
      newMember.guild.channels.cache.get(chan_staff_bot_notif);
    if (!staffBotNotifChannel?.isText()) return;
    const msg = `
      **Name Change Detected**
      User Profile: ${userMention(userID)}
      Old Nickname: ${oldMember.nickname}
      New Nickname: ${newMember.nickname}\n
      `;
    if (
      oldMember.nickname !== newMember.nickname &&
      !regex.test(newMember.nickname!)
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
