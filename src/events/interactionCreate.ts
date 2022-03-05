import { roleMention, userMention } from "@discordjs/builders";
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
        content: `Congratulations on completing the application process! You have been tagged as a pending **<AzurLane>** member! The ${roleMention(
          config.role_gm_az
        )} will get to you shortly. If you don't get a ping within 5 minutes, it means that no one is currently available to invite right now. Feel free to ping ${roleMention(
          config.role_gm_az
        )} in a few hours to see if we are around!
        **Please note that your pending tag will be automatically removed in 72 hours. You will have to reapply if you do not get invited within that time**`,
        components: [],
      });
    } else if (interaction.customId === "abyssal") {
      member?.roles.add(config.role_ab_pending);
      interaction.update({
        content: `you have been tagged as a pending **<Abyssal>** member! A member of ${roleMention(
          config.role_war_staff
        )} will get to you shortly to verify your gear and administer a PvP test.`,
        components: [],
      });
    }
  },
};
