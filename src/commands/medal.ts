import { ICommand } from "wokcommands";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { userMention } from "@discordjs/builders";

export default {
  name: "medal",
  category: "Fun",
  description:
    "Put your Medal clip sharing link as a command argument to play the video in Discord.",
  slash: false,
  testOnly: false,
  minArgs: 1,
  maxArgs: 1,
  expectedArgs: "<Medal clip sharing link here>",
  syntax:
    "medal <https://medal.tv/games/black-desert/clips/H2GC0kmyMJt0a/ZJoPPMFO5SH4?theater=true>",
  cooldown: "2s",
  callback: async ({ channel, message, args, user }) => {
    let link = args[0];
    // Validate hostname
    const url = new URL(link);
    if (url.hostname !== "medal.tv") {
      message.reply("Sorry, that's not a valid medal.tv link");
      return;
    }
    // Sometimes sharing links use the clips route which has different html structure from clip route
    link = link.replace("clips", "clip");
    const path = url.pathname;
    const pathTokens = path.split("/");
    const clipTokenIndex = pathTokens.indexOf("clip");
    const clipID = pathTokens[clipTokenIndex + 1];
    try {
      const res = await fetch(link);
      const html = await res.text();
      const $ = cheerio.load(html);
      // The first script in the body tag is the script with the url
      const targetNode: any = $("body script").get()[0].firstChild;
      // Remove var hydrationData= from the target script innerHTML
      const hydrationData = JSON.parse(targetNode.data.substring(18));
      console.log(hydrationData);
      const directLink = hydrationData.clips[clipID].contentUrl;
      channel.send(`${userMention(user.id)} ${directLink}`);
    } catch (error) {
      message.reply(
        "Unexpected error while obtaining video from given medal link."
      );
      console.error(error);
    }
  },
} as ICommand;
