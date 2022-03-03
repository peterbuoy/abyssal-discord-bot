import { GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { userMention } from "@discordjs/builders";
import config from "../config.json";
import { addToSheet } from "../eventHandlers/addToSheet";
import utils from "../utils/utils";

module.exports = {
  name: "guildMemberUpdate",
  execute(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
    //console.log(oldMember, newMember);
    const userID = oldMember.id;
    const staffBotNotifChannel = newMember.guild.channels.cache.get(
      config.chan_staff_bot_notif
    ) as TextChannel;

    // User joining guild
    if (
      (!oldMember.roles.cache.has(config.role_ab) &&
        newMember.roles.cache.has(config.role_ab)) ||
      (!oldMember.roles.cache.has(config.role_az) &&
        newMember.roles.cache.has(config.role_az))
    ) {
      console.log("add member to sheet");
      addToSheet(newMember);
    }

    // Maybe add error handling if someone changes their name before they get accepted?

    // Name check
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
    } else if (
      oldMember.nickname !== newMember.nickname &&
      utils.isNameValid(newMember.nickname!)
    ) {
      staffBotNotifChannel.send(`
      ☑️ Valid Name Change
      User Profile: ${userMention(userID)}
      Old Nickname: ${oldMember.nickname}
      New Nickname: ${newMember.nickname}\n`);
    }
  },
};
