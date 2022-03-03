import { GuildMember, PartialGuildMember } from "discord.js";
import { GoogleSpreadsheet } from "google-spreadsheet";
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
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetTitle];
    const row = await sheet.getRows();
    row.forEach(async (row) => {
      if (row["Discord UserID"] === newMember.id) {
        row["Family Name"] = util.getFamilyName(newMember.displayName);
        await row.save();
      }
    });
  } catch (error) {
    console.error(error);
  }
};

export { updateSheetFamilyName };
