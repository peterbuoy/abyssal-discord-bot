import { MessageButton } from "discord.js";

const abyssalButton = new MessageButton()
  .setCustomId("abyssal")
  .setLabel("Abyssal")
  .setStyle("PRIMARY");

const azurlaneButton = new MessageButton()
  .setCustomId("azurlane")
  .setLabel("Azurlane")
  .setStyle("PRIMARY");

const yesAZRulesButton = new MessageButton()
  .setCustomId("yesAZRules")
  .setLabel("Yes")
  .setStyle("SUCCESS");

const noAZRulesButton = new MessageButton()
  .setCustomId("noAZRules")
  .setLabel("No")
  .setStyle("DANGER");

export { abyssalButton, azurlaneButton, yesAZRulesButton, noAZRulesButton };
