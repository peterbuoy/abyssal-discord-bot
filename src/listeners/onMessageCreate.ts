import { Client, Message } from "discord.js";
import { WelcomeHandler } from "src/handler";

export default (client: Client, welcomeHandler: WelcomeHandler) => {
  client.on("messageCreate", async (message: Message) => {
    if (!message.content.startsWith("%") || message.author.bot) return;
    const args = message.content.slice(1).trim().split(/ +/);

    const command = args.shift()?.toLowerCase();
    if (command === "join") {
      welcomeHandler.handleJoin(client, message);
    }
  });
};
