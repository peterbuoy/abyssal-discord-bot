import { GuildMember } from "discord.js";
import { GoogleSpreadsheet } from "google-spreadsheet";
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
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  });
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[sheetTitle];
  const row = await sheet.addRow({
    "Discord UserID": newMember.id,
    "Family Name": utils.getFamilyName(newMember.displayName),
    "Join Date": dayjs().format("MM/DD/YYYY"),
  });
};

export { addToSheet };
