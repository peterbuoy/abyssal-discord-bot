import { GuildMember, PartialGuildMember } from "discord.js";
import { GoogleSpreadsheet } from "google-spreadsheet";
import config from "../config.json";

const removeFromSheet = async (oldMember: GuildMember | PartialGuildMember) => {
  console.log("removing from sheet");
  let sheetTitle = "";
  if (oldMember.roles.cache.has(config.role_ab)) {
    sheetTitle = config.ab_sheet_title;
  } else if (oldMember.roles.cache.has(config.role_az)) {
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
    row.forEach((row) => {
      if (row["Discord UserID"] === oldMember.id) row.delete();
    });
  } catch (error) {
    console.error(error);
  }
};

export { removeFromSheet };
