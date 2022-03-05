import { MessageActionRow, MessageComponentInteraction } from "discord.js";
import { ICommand } from "wokcommands";
import { abyssalButton, azurlaneButton } from "../buttons/joinButtons";
import config from "../config.json";

export default {
  name: "join",
  category: "Testing",
  description: "Starts process of joining guild", // Required for slash commands

  slash: false,
  testOnly: true, // Only register a slash command for the testing guilds
  expectedArgs: "",
  minArgs: 0,
  maxArgs: 0,
  cooldown: "60s",

  callback: async ({ message }) => {
    // if message author has roles
    if (
      message.member?.roles.cache.hasAny(
        config.role_ab,
        config.role_ab_pending,
        config.role_az,
        config.role_az_pending
      )
    ) {
      return;
    }
    const reply =
      "Hi, which guild would you like to join?\n This message will self-destruct in **60** seconds.";
    const row = new MessageActionRow().addComponents(
      abyssalButton,
      azurlaneButton
    );

    // message is provided for a legacy command
    try {
      const replyMessage = await message.reply({
        content: reply,
        components: [row],
      });
      setTimeout(() => {
        if (replyMessage.components.length !== 0) {
          replyMessage.delete();
        }
      }, 59 * 1000);
    } catch (error) {
      console.error(error);
    }
  },
} as ICommand;
