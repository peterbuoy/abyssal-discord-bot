import { GuildMember } from "discord.js";
import { getSheetByTitle } from "./getSheetByTitle";
import utils from "./utils";
import config from "../config";
import dayjs from "dayjs";

const addToSheet = async (newMember: GuildMember) => {
  let sheetTitle = "";
  if (newMember.roles.cache.has(config.role_ab)) {
    sheetTitle = config.ab_sheet_title;
  } else if (newMember.roles.cache.has(config.role_az)) {
    sheetTitle = config.az_sheet_title;
  }
  try {
    const sheet = await getSheetByTitle(sheetTitle);

    // Discord UserID, index 0
    // Family Name, index 1
    // Join Date, index 20
    await sheet?.loadCells("A2:U");
    const rowCount = sheet?.rowCount ?? 100;
    for (let i = 1; i < rowCount; i++) {
      // doesn't seem to be working check the if statement below
      // kinda works, but ID is not being inserted ?

      if (
        sheet?.getCell(i, 0).value === "" ||
        sheet?.getCell(i, 0).value == undefined
      ) {
        const idCell = sheet?.getCell(i, 0);
        const familyNameCell = sheet?.getCell(i, 1);
        const joinDateCell = sheet?.getCell(i, 20);
        idCell!.value = newMember.id;
        familyNameCell!.value = utils.parseFamilyName(newMember.displayName);
        joinDateCell!.value = dayjs().format("M/DD/YYYY");
        sheet?.saveUpdatedCells();
        break;
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export { addToSheet };
