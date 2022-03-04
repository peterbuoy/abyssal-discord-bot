import { Message } from "discord.js";

module.exports = {
  name: "messageCreate",
  execute(message: Message) {
    // if (!message.content.startsWith("%") || message.author.bot) return;
    // const args = message.content.slice(1).trim().split(/ +/);
    // const command = args.shift()?.toLowerCase();
    // if (command === "join") {
    //   console.log("handle join or something");
    // }
  },
};
