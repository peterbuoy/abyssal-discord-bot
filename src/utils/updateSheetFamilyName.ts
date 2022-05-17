import { GuildMember, PartialGuildMember } from "discord.js";
import { getSheetByTitle } from "./getSheetByTitle";
import util from "../utils/utils";
import config from "../config";

const updateSheetFamilyName = async (
  newMember: GuildMember | PartialGuildMember
) => {
  let sheetTitle = "";
  if (newMember.roles.cache.has(config.role_ab)) {
    sheetTitle = config.ab_sheet_title;
  } else if (newMember.roles.cache.has(config.role_az)) {
    sheetTitle = config.az_sheet_title;
  }
  try {
    const sheet = await getSheetByTitle(sheetTitle);
    await sheet?.loadCells("A2:B");
    const rowCount = sheet?.rowCount ?? 100;
    // sheets are zero indexed
    // Discord UserID is in column A (index 0)
    // Family  Name is in column B (index 1)
    for (let i = 1; i < rowCount; i++) {
      // if Discord ID in google sheet matches emitted member ID
      if (sheet?.getCell(i, 0).value === newMember.id) {
        // get the family name column value of that row and change it to the new member display name
        const targetCell = sheet?.getCell(i, 1);
        targetCell.value = util.parseFamilyName(newMember.displayName);
        targetCell.save();
        break;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

export { updateSheetFamilyName };
