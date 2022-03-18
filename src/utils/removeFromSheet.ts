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
    const rows = await sheet?.getRows();
    // use forEach to remove potential repeated members (happened before)
    rows?.forEach((row) => {
      if (row["Discord UserID"] === oldMember.id) row.delete();
    });
  } catch (error) {
    console.error(error);
  }
};

export { removeFromSheet };
