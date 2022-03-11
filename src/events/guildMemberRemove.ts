import { GuildMember } from "discord.js";
import { getSheetByTitle } from "../utils/getSheetByTitle";
import config from "../config.json";
import { removeFromSheet } from "../utils/removeFromSheet";

module.exports = {
  name: "guildMemberRemove",
  async execute(member: GuildMember) {
    let sheetTitle = "";
    let dumpSheetTitle = "";
    if (member?.roles.cache.has(config.role_ab)) {
      sheetTitle = config.ab_sheet_title;
      dumpSheetTitle = config.ab_dump_sheet_title;
    } else if (member?.roles.cache.has(config.role_az)) {
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
      (row) => row["Discord UserID"] === member.user.id
    );
    const dumpSheet = await getSheetByTitle(dumpSheetTitle);
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
    removeFromSheet(member);
  },
};
