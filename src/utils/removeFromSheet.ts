import { GuildMember, PartialGuildMember } from "discord.js";
import { getSheetByTitle } from "./getSheetByTitle";
import config from "../config";

const removeFromSheet = async (oldMember: GuildMember | PartialGuildMember) => {
  let sheetTitle = "";
  if (oldMember.roles.cache.has(config.role_ab)) {
    sheetTitle = config.ab_sheet_title;
  } else if (oldMember.roles.cache.has(config.role_az)) {
    sheetTitle = config.az_sheet_title;
  }
  try {
    const sheet = await getSheetByTitle(sheetTitle);
    await sheet?.loadCells("A2:W");
    const rowCount = sheet?.rowCount ?? 100;
    for (let rowIndex = 1; rowIndex < rowCount; rowIndex++) {
      // Check cell if ID matches leaving member
      if (sheet?.getCell(rowIndex, 0).value === oldMember.id) {
        console.log(oldMember.id);
        // delete col 1 and 2
        // col 2 can NOT be an empty string or the formulas will break
        sheet.getCell(rowIndex, 0).value = "";
        sheet.getCell(rowIndex, 1).value = false;
        // delete index 9 - 19, aka column 10 to 20
        for (let col = 9; col < 21; col++) {
          sheet.getCell(rowIndex, col).value = "";
        }
        await sheet.saveUpdatedCells();
        break;
      }
    }
    // const rows = await sheet?.getRows();
    // // use forEach to remove potential repeated members (happened before)
    // rows?.forEach(async (row) => {
    //   if (row["Discord UserID"] === oldMember.id) await row.delete();
    // });
  } catch (error) {
    console.error(error);
  }
};

export { removeFromSheet };
