import {
  Collection,
  GuildMember,
  PartialGuildMember,
  TextChannel,
} from "discord.js";
import { userMention } from "@discordjs/builders";
import config from "../config.json";
import { addToSheet } from "../utils/addToSheet";
import { removeFromSheet } from "../utils/removeFromSheet";
import { updateSheetFamilyName } from "../utils/updateSheetFamilyName";
import { sendWelcomeMessage } from "../utils/sendWelcomeMessage";

import utils from "../utils/utils";
import { getSheetByTitle } from "../utils/getSheetByTitle";

module.exports = {
  name: "guildMemberUpdate",
  async execute(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember
  ) {
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
      // START: Add to dump sheet
      let sheetTitle = "";
      let dumpSheetTitle = "";
      if (oldMember?.roles.cache.has(config.role_ab)) {
        sheetTitle = config.ab_sheet_title;
        dumpSheetTitle = config.ab_dump_sheet_title;
      } else if (oldMember?.roles.cache.has(config.role_az)) {
        sheetTitle = config.az_sheet_title;
        dumpSheetTitle = config.az_dump_sheet_title;
      } else {
        throw Error("Member does not have a valid role");
      }
      // This functionality to add member info to the dumpsheet is pulled from
      // the update command. Consider writing a function?
      const sheet = await getSheetByTitle(sheetTitle);
      const rows = await sheet?.getRows();
      const targetRow = rows?.find(
        (row) => row["Discord UserID"] === oldMember.user.id
      );
      const dumpSheet = await getSheetByTitle(config.ab_dump_sheet_title);
      // Move current info to Dump Sheet
      if (targetRow !== undefined) {
        await dumpSheet?.addRow({
          "Discord UserID": targetRow["Discord UserID"],
          "Family Name": targetRow["Family Name"],
          "Character Name": targetRow["Character Name"],
          Class: targetRow["Class"],
          Level: targetRow["Level"],
          "Gear Score": targetRow["Gear Score"],
          AP: targetRow["AP"],
          "Awaken AP": targetRow["Awaken AP"],
          DP: targetRow["DP"],
          "Gear Screenshot": targetRow["Gear Screenshot"],
          "Join Date": targetRow["Join Date"],
        });
      }
      // END add to dump sheet
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
