import { GuildMember } from "discord.js";
import { getSheetByTitle } from "./getSheetByTitle";
import utils from "../utils/utils";
import config from "../config.json";
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
    sheet?.addRow({
      "Discord UserID": newMember.id,
      "Family Name": utils.parseFamilyName(newMember.displayName),
      "Join Date": dayjs().format("M/DD/YYYY"),
    });
  } catch (error) {
    console.log(error);
  }
};

export { addToSheet };
