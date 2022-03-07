import { getSheetByTitle } from "../utils/getSheetByTitle";
import { ICommand } from "wokcommands";
import config from "../config.json";

export default {
  category: "Testing",
  description: "adds a reason for a leave of absence (vacation)",
  slash: false,
  cooldown: "30s",
  callback: async ({ message, args }) => {
    console.log("vacation cmd");
    let sheetTitle = "";
    // if they have both they'll be put into ab sheet
    // this should never happen unless war staff, admin, or az gm mess up
    message.member?.roles.cache.has(config.role_ab)
      ? (sheetTitle = config.ab_sheet_title)
      : (sheetTitle = config.az_sheet_title);
    const sheet = await getSheetByTitle(sheetTitle);
    const rows = await sheet?.getRows();
    const memberRow = rows?.find(
      (member) => member["Discord UserID"] === message.author.id
    );
    memberRow!["Vacation Info"] = args.join(" ");
    memberRow?.save();
  },
} as ICommand;
