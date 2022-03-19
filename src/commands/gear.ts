import { getSheetByTitle } from "../utils/getSheetByTitle";
import { ICommand } from "wokcommands";
import config from "../config";
import { codeBlock } from "@discordjs/builders";
import dayjs from "dayjs";

export default {
  name: "gear",
  category: "Testing",
  description: "Lists all gear of guild members based on argument",
  slash: false,
  testOnly: true,
  minArgs: 1,
  maxArgs: 1,
  cooldown: "10s",
  expectedArgs: "<guild>",
  syntax: "gear <guild>",
  callback: async ({ message, args, member, channel }) => {
    // Channel and guild member check
    if (
      message.channelId !== config.chan_gear_update ||
      !member.roles.cache.hasAny(config.role_az, config.role_ab)
    ) {
      message.reply("You can only use this in the gear update channel.");
      return;
    }

    let sheetTitle = "";
    args[0] = args[0].toLowerCase();
    if (args[0] === "kc" || args[0] === "ab") {
      sheetTitle = config.ab_sheet_title;
    } else if (args[0] === "az") {
      sheetTitle = config.az_sheet_title;
    } else {
      message.reply(
        `${args[0]} is not a valid argument, please specify **ab** or **az**`
      );
      return;
    }
    const sheet = await getSheetByTitle(sheetTitle);
    let rows = await sheet?.getRows();
    rows = rows?.filter((row) => row["Discord UserID"] !== "");
    rows?.sort((rowA, rowB) => rowB["Gear Score"] - rowA["Gear Score"]);

    // Consider making constants for the padding since they're repeated in member rows
    const familyName = "Family Name".padEnd(17, " ");
    const characterName = "Character Name".padEnd(17, " ");
    const className = "Class".padEnd(12, " ");
    const lvl = "Lv".padEnd(4, " ");
    const gs = "GS".padEnd(5, " ");
    const aAAPDP = "AP/AAP/DP".padEnd(13, " ");
    const lastUpdate = "Last Update";

    let msg = `${familyName}${characterName}${className}${lvl}${gs}${aAAPDP}${lastUpdate}\n${"-".repeat(
      78
    )}\n`;
    let count = 0;
    // What hath prettier wrought
    rows?.forEach((row) => {
      msg += `${row["Family Name"].padEnd(17, " ")}${row[
        "Character Name"
      ].padEnd(17, " ")}${row["Class"].padEnd(12, " ")}${row["Level"].padEnd(
        4,
        " "
      )}${row["Gear Score"].padEnd(5, " ")}${renderSplitGearScore(
        row["AP"],
        row["Awaken AP"],
        row["DP"]
      ).padEnd(13, " ")}${renderDate(row["Gear Timestamp"])}\n`;
      count++;
      if (count % 10 == 0) {
        channel.send(codeBlock(msg));
        msg = "";
      }
    });
    // Catch edge case where empty message is sent
    if (msg !== "") channel.send(codeBlock(msg));
  },
} as ICommand;

const renderDate = (date: string) => {
  if (date == "") {
    return "";
  } else {
    return dayjs(date).format("MM/DD/YYYY");
  }
};
function renderSplitGearScore(ap: string, aap: string, dp: string) {
  if (ap == "" && aap == "" && dp == "") {
    return "";
  }
  return `${ap.padEnd(3, " ")}/${aap.padEnd(3, " ")}/${dp.padEnd(3, " ")}`;
}
