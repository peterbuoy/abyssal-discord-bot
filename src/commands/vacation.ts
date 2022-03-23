import { getSheetByTitle } from "../utils/getSheetByTitle";
import { ICommand } from "wokcommands";
import config from "../config";

export default {
  category: "Management",
  description:
    "Adds a reason for a leave of absence (vacation). Just type your message after the command.",
  slash: false,
  testOnly: false,
  cooldown: "30s",
  callback: async ({ member, channel, args, message }) => {
    // only allow cmd to be used by ab az guild memebers in contact an officer chan
    if (
      !member.roles.cache.hasAny(config.role_ab, config.role_az) ||
      channel.id !== config.chan_contact_an_officer
    ) {
      message.reply("You can only use this in the contact an officer channel.");
      return;
    }
    let sheetTitle = "";
    // if they have both they'll be put into ab sheet
    // this should never happen unless war staff, admin, or az gm mess up
    try {
      member.roles.cache.has(config.role_ab)
        ? (sheetTitle = config.ab_sheet_title)
        : (sheetTitle = config.az_sheet_title);
      const sheet = await getSheetByTitle(sheetTitle);
      const rows = await sheet?.getRows();
      const memberRow = rows?.find(
        (row) => row["Discord UserID"] === member.id
      );
      memberRow!["Vacation Info"] = args.join(" ");
      memberRow?.save();
      message.reply("Your request has been recorded.");
    } catch (error) {
      throw Error(
        `An error has occurred while trying to use the vacation command: ${error}`
      );
    }
  },
} as ICommand;
