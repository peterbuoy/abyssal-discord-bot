import { roleMention, userMention } from "@discordjs/builders";
import { Interaction, Message, MessageMentions } from "discord.js";
import { yesAZRulesButton, noAZRulesButton } from "src/buttons/joinButtons";
import config from "../config.json";
import got from "got";

module.exports = {
  name: "interactionCreate",
  async execute(interaction: Interaction) {
    // removed indirection by placing collector in join command
  },
};
