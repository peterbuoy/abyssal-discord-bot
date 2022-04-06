import { CommandErrors, ICommand } from "wokcommands";
import { getSheetByTitle } from "../utils/getSheetByTitle";
import config from "../config";
import { userMention } from "@discordjs/builders";
import { Collection } from "discord.js";

export default {
  name: "list",
  category: "Management",
  description: "Lists all members in guild based on arguments: kc, ab, or az",
  slash: false,
  testOnly: false,
  minArgs: 0,
  maxArgs: 1,
  expectedArgs: "<guild>",
  syntax: "list <guild>",
  cooldown: "10s",
  callback: async ({ message, args, channel }) => {
    if (channel.id === config.chan_gear_update) {
      message.reply(
        "You can not use this management command in #gear-update. \nUse %gear to list the gear of members.\n e.g. `%gear ab` or `%gear az`"
      );
      return;
    }
    if (
      !message.member?.roles.cache.hasAny(
        config.role_war_staff,
        config.role_gm_az,
        config.role_admin
      )
    ) {
      return;
    }
    let sheetName = "";
    args[0] = args[0]?.toLowerCase();
    if (args[0] === "ab" || args[0] === "kc" || args[0] === "") {
      sheetName = config.ab_sheet_title;
    } else if (args[0] === "az" || args[0] === "azurlane") {
      sheetName = config.az_sheet_title;
    } else {
      message.reply("Invalid argument please specify ab, kc, or az.");
      return;
    }
    const sheet = await getSheetByTitle(sheetName);
    const rows = await sheet?.getRows();

    // Collection contains <userID, [famName, vacation]>
    const memberCollection: Collection<string, [string, string]> =
      new Collection();
    rows?.forEach((row) => {
      if (row["Discord UserID"] !== undefined) {
        memberCollection.set(row["Discord UserID"], [
          row["Family Name"],
          row["Vacation Info"],
        ]);
      }
    });

    memberCollection.sort(ASCIISort);

    let count = 1;
    let memberListMessage = "";
    memberCollection.forEach((value, key) => {
      const paddedCountStr = count.toString().padStart(3, "0");
      memberListMessage += `\`${paddedCountStr}\`:${userMention(key)} ${
        value[1] ? `~**VACATION**: ${value[1]}` : ""
      }\n`;
      count++;
      if (count % 26 == 0) {
        message.channel.send(memberListMessage);
        memberListMessage = "";
      }
    });
    message.channel.send(memberListMessage);
  },
} as ICommand;

// Thanks microwave and Ando :D!
function ASCIISort(valsA: any, valsB: any) {
  for (let i = 0; i < valsA[0].length && i < valsB[0].length; i++) {
    if (valsA[0].charCodeAt(i) != valsB[0].charCodeAt(i)) {
      return valsA[0].charCodeAt(i) - valsB[0].charCodeAt(i);
    }
  }

  // Edge case for strings like
  // String 1="Geeky" and String 2="Geekyguy"
  return valsA[0].length - valsB[0].length;
  // If none of the above conditions is true,
  // it implies both the strings are equal
}
