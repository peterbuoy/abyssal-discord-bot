import {
  Client,
  Message,
  Intents,
  MessageActionRow,
  MessageButton,
  Interaction,
} from "discord.js";
import ready from "./listeners/ready";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;
console.log("Bot is starting...");

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

client.on("messageCreate", async (message: Message) => {
  if (!message.content.startsWith("%") || message.author.bot) return;
  console.log("i see %");
  const args = message.content.slice(1).trim().split(/ +/);

  const command = args?.shift()?.toLowerCase();
  if (command === "join") {
    const abyssalButton = new MessageButton()
      .setCustomId("abyssal")
      .setLabel("Abyssal")
      .setStyle("PRIMARY");
    const azurlaneButton = new MessageButton()
      .setCustomId("azurlane")
      .setLabel("Azurlane")
      .setStyle("PRIMARY");

    const row = new MessageActionRow().addComponents(
      abyssalButton,
      azurlaneButton
    );
    await message.reply({
      content: "Which guild would you like to join?",
      components: [row],
    });
  }
});

client.on("interactionCreate", (interaction: Interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.user.id !== interaction.member?.user.id) {
    console.log("interaction id and caller id mismatch");
    return;
  }

  if (interaction.customId === "abyssal") {
    interaction.update({
      content: "Welcome to Abyssal Message Here",
      components: [],
    });
  } else if (interaction.customId === "azurlane") {
    const yesButton = new MessageButton()
      .setCustomId("yesAZRules")
      .setLabel("Yes")
      .setStyle("SUCCESS");
    const noButton = new MessageButton()
      .setCustomId("noAZRules")
      .setLabel("No")
      .setStyle("DANGER");
    const row = new MessageActionRow().addComponents(yesButton, noButton);
    interaction.update({
      content: "Can Gaisgeil pvp?",
      components: [row],
    });
  }
  if (interaction.customId === "yesAZRules") {
    interaction.update({ content: "There's even a website LMAO", components: [] });
  }
  if (interaction.customId === "noAZRules") {
    interaction.update({ content: "Go read the rules", components: [] });
  }
});

ready(client);

client.login(token);
