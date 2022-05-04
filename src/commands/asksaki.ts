import { ICommand } from "wokcommands";
import { GoogleSpreadsheet } from "google-spreadsheet";
import config from "../config";

export default {
  name: "asksaki",
  category: "Fun",
  description: "Skip the bullshit and get the answers you need",
  cooldown: "30s",
  slash: false,
  testOnly: false,

  callback: async ({ message }) => {
    try {
      const doc = new GoogleSpreadsheet(config.asksaki_sheet_id);
      if (
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL === undefined ||
        process.env.GOOGLE_PRIVATE_KEY === undefined
      ) {
        throw new Error(
          `Missing Google Service Account Email or Private Key. Failed obtain sheet by name.`
        );
      }
      await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });
      await doc.loadInfo();
      const sheet = doc.sheetsByTitle["answers"];
      const rows = (await sheet.getRows()).filter(
        (row) => row["answer"] !== undefined
      );
      const answer = rows[Math.floor(Math.random() * rows.length)]["answer"];
      message.reply(answer);
    } catch (error) {
      console.error(error);
    }
  },
} as ICommand;
