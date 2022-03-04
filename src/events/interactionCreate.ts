import { userMention } from "@discordjs/builders";
import { Interaction, Message, MessageMentions } from "discord.js";
import { yesAZRulesButton, noAZRulesButton } from "src/buttons/joinButtons";
import config from "../config.json";
import got from "got";

module.exports = {
  name: "interactionCreate",
  async execute(interaction: Interaction) {
    if (!interaction.isMessageComponent()) return;

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const mentions = interaction.message.mentions as MessageMentions;
    const interactionOriginator = mentions.repliedUser;

    if (interactionOriginator?.id !== interaction.member?.user.id) {
      const response = await got("https://api.kanye.rest/");
      const kanyeQuote = response.body.slice(9, -1);
      member!.timeout(15 * 1000, "Pushed a button.");
      interaction.channel?.send(
        `${userMention(
          member!.id
        )} As requested, a Kanye Quote\n *${kanyeQuote}*`
      );
      return;
    }

    if (interaction.customId === "azurlane") {
      member?.roles.add(config.role_az_pending);
      interaction.update({
        content:
          "You have been tagged as a pending Azurlane member. something something mention az gm",
        components: [],
      });
    } else if (interaction.customId === "abyssal") {
      member?.roles.add(config.role_ab_pending);
      interaction.update({
        content:
          "You have been tagged as a pending Abyssal member. something something mention war staff to do stuff",
        components: [],
      });
    }
  },
};
