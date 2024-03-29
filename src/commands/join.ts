import { channelMention, roleMention, userMention } from "@discordjs/builders";
import { ButtonInteraction, MessageActionRow } from "discord.js";
import { ICommand } from "wokcommands";
import {
  abyssalButton,
  azurlaneButton,
  yesAZRulesButton,
  noAZRulesButton,
} from "../buttons/joinButtons";
import config from "../config";
import got from "got";
import utils from "../utils/utils";
import { pool } from "../db/index";

export default {
  name: "join",
  category: "Join",
  description: `Starts process of joining either guild. Only works in <#${config.chan_welcome}>`,

  slash: false,
  testOnly: false,
  expectedArgs: "",
  minArgs: 0,
  maxArgs: 0,
  cooldown: "60s",

  callback: async ({ message, channel, member, cancelCoolDown }) => {
    if (
      member.roles.cache.hasAny(
        config.role_ab,
        config.role_ab_pending,
        config.role_az,
        config.role_az_pending
      ) ||
      channel.id !== config.chan_welcome
    ) {
      message.reply(
        `This command is only available to guildless members in ${channelMention(
          config.chan_welcome
        )}`
      );
      return;
    }
    if (!utils.isNameValid(member.nickname as string)) {
      message.reply(`Please confirm that your family name is formatted correctly: 
      Nickname <YourFamilyNameHere>
      *Example:* Gais <Gaisgeil> I love bdo`);
      cancelCoolDown();
      return;
    }

    const replyContent =
      "Hi, which guild would you like to join?\n This process will end in **60** seconds.";
    const guildChoice = new MessageActionRow().addComponents(
      abyssalButton,
      azurlaneButton
    );
    const azRuleYesNo = new MessageActionRow().addComponents(
      yesAZRulesButton,
      noAZRulesButton
    );
    const reply = await message.reply({
      content: replyContent,
      components: [guildChoice],
    });
    const collector = reply.createMessageComponentCollector({
      componentType: "BUTTON",
      time: 59 * 1000,
    });

    collector.on("collect", async (i: ButtonInteraction) => {
      if (i.user.id !== message.author.id) {
        got("https://api.kanye.rest/")
          .then((response) => response.body.slice(9, -1))
          .then((kanyeQuote) => {
            i.reply({
              content: `Your button press is irrelevant like this quote from Ye West, formerly known as Kanye West:\n *${kanyeQuote}*`,
              ephemeral: true,
            });
          });
      } else {
        i.deferUpdate();
        switch (i.customId) {
          case "abyssal":
            member?.roles.add(config.role_ab_pending);
            reply.delete();
            channel.send({
              content: `${userMention(
                i.user.id
              )} has been tagged as a pending **<Abyssal>** member.\nA member of ${roleMention(
                config.role_war_staff
              )} will get to you shortly to verify your gear and administer a PvP test.`,
            });
            break;
          case "azurlane":
            reply.edit({
              content:
                "**Azurlane Rules**\n" +
                "`1.Leaving discord means leaving the guild\n" +
                "2.If you are more than 3 days offline you may be kicked.`\n" +
                "*Please confirm that you are aware of these rules.*",
              components: [azRuleYesNo],
            });
            break;
          case "yesAZRules":
            try {
              member?.roles.add(config.role_az_pending);
              reply.delete();
              channel.send({
                content: `${userMention(
                  i.user.id
                )} has been tagged as a pending **<AzurLane>** member. The <@&${
                  config.role_gm_az
                }> or ${roleMention(
                  config.role_az_officer
                )} will get to you shortly. If you don't get a ping within 5 minutes, it means that they are not currently available to invite right now. Feel free to ping ${roleMention(
                  config.role_gm_az
                )} or ${roleMention(
                  config.role_az_officer
                )} in a few hours to see if they are around!\n**Please note that your pending tag will be automatically removed in 72 hours. You will have to reapply if you do not get invited within that time**`,
              });
              await pool.query(
                "INSERT INTO pending_az(discord_user_id) VALUES ($1) ON CONFLICT (discord_user_id) DO UPDATE SET conferment_timestamp = current_timestamp",
                [member.id]
              );
            } catch (error) {
              console.error(error);
            }
            break;
          case "noAZRules":
            reply.edit({
              content: `Join process ended due to saying no to rules.`,
              components: [],
            });
            break;
        }
      }
    });

    // Remove buttons and edit message after 59 seconds if they don't interact
    collector.on("end", () => {
      if (reply.components.length !== 0 && reply.deletable) {
        reply.edit({
          content:
            "No guild or answer was selected in time. Join process has ended.",
          components: [],
        });
      }
    });
  },
} as ICommand;
