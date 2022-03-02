import { Message } from "discord.js";
import { GoogleSpreadsheet } from "google-spreadsheet";

module.exports = {
  name: "messageCreate",
  execute(message: Message) {
    if (!message.content.startsWith("%") || message.author.bot) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    if (command === "join") {
      console.log("handle join or something");
    }
    if (command === "test") {
      console.log("get az first row");
      (async () => {
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
        await doc.useServiceAccountAuth({
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
          // .env files are plain text, so we need to use the `replace` method to get rid of the `\n`
          // thanks for nothing documentation >:(.
          private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        });
        await doc.loadInfo();
        console.log(doc.title);
        const sheet = doc.sheetsByIndex[1];
        console.log(sheet.title);
      })();
    }
  },
};
