import { ICommand } from "wokcommands";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

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
  callback: async ({ channel, message, args }) => {
    message.suppressEmbeds(true);

    let link = args[0];
    // Validate hostname
    const linkHostName = new URL(link).hostname;
    if (linkHostName !== "medal.tv") {
      message.reply("Sorry, that's not a valid medal.tv link");
      return;
    }
    // Sometimes sharing links use the clips route which has different html structure from clip route
    link = link.replace("clips", "clip");
    try {
      const res = await fetch(link);
      const html = await res.text();
      const $ = cheerio.load(html);
      const directLink: string | undefined = $('[property="og:video"]').attr(
        "content"
      );
      if (directLink == undefined) {
        message.reply("Unable to obtain direct link to video using cheerio.");
        return;
      }
      channel.send(directLink);
    } catch (error) {
      message.reply(
        "Unexpected error while obtaining video from given medal link."
      );
      console.error(error);
    }
  },
} as ICommand;
