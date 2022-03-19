import { getSheetByTitle } from "../utils/getSheetByTitle";
import { ICommand } from "wokcommands";
import config from "../config";
import { Embed } from "@discordjs/builders";

export default {
  name: "info",
  category: "Gear",
  description:
    "displays the gear info of the member and takes a mention as an optional argument",
  slash: false,
  testOnly: false,
  minArgs: 0,
  maxArgs: 1,
  cooldown: "10s",
  expectedArgs: "[mention]",
  syntax: "info [mention]",
  callback: async ({ message, member, channel }) => {
    // Channel and guild member check
    if (
      channel.id !== config.chan_gear_update ||
      !member.roles.cache.hasAny(config.role_az, config.role_ab)
    ) {
      message.reply("You can only use this in the gear update channel.");
      return;
    }
    let targetID = "";
    if (message.mentions.members?.first()?.id !== undefined) {
      targetID = message.mentions.members?.first()?.id as string;
    } else {
      targetID = member.id;
    }

    const sheetTitle = member.roles.cache.has(config.role_ab)
      ? config.ab_sheet_title
      : config.az_sheet_title;

    const sheet = await getSheetByTitle(sheetTitle);
    const rows = await sheet?.getRows();
    const targetRow = rows?.find((row) => row["Discord UserID"] === targetID);
    if (targetRow === undefined)
      throw Error("User not found in sheet when called with info command");
    const newEmbed = new Embed()
      .setTitle(
        `${
          member.roles.cache.has(config.role_ab) ? "<Abyssal>" : "<Azurlane>"
        } ${targetRow["Family Name"]}`
      )

      .addField({
        name: "__**Character Stats**__",
        value: `Last updated: ${targetRow["Gear Timestamp"]}`,
      })
      .addFields(
        { name: "Name", value: targetRow["Character Name"], inline: true },
        { name: "Class", value: targetRow["Class"], inline: true },
        {
          name: "Gear",
          value: `${targetRow["AP"]}/${targetRow["Awaken AP"]}/${targetRow["DP"]} (${targetRow["Gear Score"]})`,
          inline: true,
        },
        { name: "Level", value: targetRow["Level"] }
      )
      .setImage(targetRow["Gear Screenshot"]);
    message.reply({ embeds: [newEmbed] });
  },
} as ICommand;
