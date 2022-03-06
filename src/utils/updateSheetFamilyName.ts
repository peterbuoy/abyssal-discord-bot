import { GuildMember, PartialGuildMember } from "discord.js";
import { getSheetByTitle } from "./getSheetByTitle";
import util from "../utils/utils";
import config from "../config.json";

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
    const rows = await sheet?.getRows();
    rows?.forEach(async (row) => {
      if (row["Discord UserID"] === newMember.id) {
        row["Family Name"] = util.parseFamilyName(newMember.displayName);
        await row.save();
      }
    });
  } catch (error) {
    console.error(error);
  }
};

export { updateSheetFamilyName };
