import { GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import { userMention } from "@discordjs/builders";
import config from "../config.json";
import { addToSheet } from "../utils/addToSheet";
import { removeFromSheet } from "../utils/removeFromSheet";
import { updateSheetFamilyName } from "../utils/updateSheetFamilyName";
import { sendWelcomeMessage } from "../utils/sendWelcomeMessage";

import utils from "../utils/utils";

module.exports = {
  name: "guildMemberUpdate",
  execute(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
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
      addToSheet(newMember);
      sendWelcomeMessage(newMember, config.chan_bot_spam);
    }

    // User leaving guild
    if (
      (oldMember.roles.cache.has(config.role_ab) &&
        !newMember.roles.cache.has(config.role_ab)) ||
      (oldMember.roles.cache.has(config.role_az) &&
        !newMember.roles.cache.has(config.role_az))
    ) {
      removeFromSheet(oldMember);
      // TODO: remove from war signup if member is in abyssal
    }

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
      utils.isNameValid(newMember.nickname!) &&
      newMember.roles.cache.hasAny(
        config.role_ab,
        config.role_ab_pending,
        config.role_az,
        config.role_ab_pending
      )
    ) {
      staffBotNotifChannel.send(`
      ☑️ Valid Name Change
      User Profile: ${userMention(userID)}
      Old Nickname: ${oldMember.nickname}
      New Nickname: ${newMember.nickname}
      *Sheet has been updated*\n`);
      updateSheetFamilyName(newMember);
    }
  },
};
