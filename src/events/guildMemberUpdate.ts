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
    ) as TextChannel;

    if (
      oldMember.nickname !== newMember.nickname &&
      !utils.isNameValid(newMember.nickname!)
    ) {
      staffBotNotifChannel.send(
        `⚠️ Invalid Name Change
        User Profile: ${userMention(userID)}
        Old Nickname: ${oldMember.nickname}
        New Nickname: ${newMember.nickname}\n`
      );
    } else {
      staffBotNotifChannel.send(`
      ☑️ Valid Name Change
      User Profile: ${userMention(userID)}
      Old Nickname: ${oldMember.nickname}
      New Nickname: ${newMember.nickname}\n`);
    }
  },
};
