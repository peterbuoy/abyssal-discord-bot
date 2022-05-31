import { ICommand } from "wokcommands";
import { getSheetByTitle } from "../utils/getSheetByTitle";
import config from "../config";
import { Collection } from "discord.js";

export default {
  name: "comp",
  category: "Gear",
  description: `Displays the class composition of Abyssal and gear score statistics. Only works in <#${config.chan_gear_update}>`,
  slash: false,
  testOnly: false,
  cooldown: "10s",
  minArgs: 0,
  maxArgs: 0,
  callback: async ({ message, channel }) => {
    if (channel.id != config.chan_gear_update) {
      message.reply(`You can only use this in <#${config.chan_gear_update}> `);
      return;
    }

    // This would be a lot easier if there was a clean way to get column values as an array

    const sheet = await getSheetByTitle(config.ab_sheet_title);
    const allRows = await sheet?.getRows();
    const rows = allRows?.filter(
      (row) => row["Gear Score"] !== "" && row["Gear Score"] !== undefined
    );
    const classMap: Collection<string, number> = new Collection();
    let minGS = Number.POSITIVE_INFINITY;
    let maxGS = Number.NEGATIVE_INFINITY;
    let sumGS = 0;
    let avgGS = 0;
    rows?.forEach((row) => {
      // Gear score stat
      const gearScore = parseInt(row["Gear Score"]);
      sumGS += gearScore;
      if (gearScore < minGS) minGS = gearScore;
      if (gearScore > maxGS) maxGS = gearScore;
      // Class counter
      if (!classMap.has(row["Class"])) {
        classMap.set(row["Class"], 1);
      } else if (classMap.has(row["Class"])) {
        classMap.set(row["Class"], classMap.get(row["Class"])! + 1);
      }
    });
    classMap.sort().reverse();
    console.log(classMap);
    avgGS = Math.round(sumGS / rows!.length);
    let msg = "**Abyssal Member Composition and Stats**\n";
    classMap.forEach((value, key) => {
      msg += `${value}: ${key}\n`;
    });
    msg += `Maximum GS ${maxGS} **::** Minimum GS ${minGS} **::** Average GS ${avgGS}`;
    channel.send(msg);
  },
} as ICommand;
