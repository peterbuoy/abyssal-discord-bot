import { userMention } from "@discordjs/builders";
import { Client, TextChannel } from "discord.js";
import config from "../config.json";
import utils from "../utils/utils";

module.exports = {
  name: "ready",
  once: true,
  async execute(client: Client) {
    if (!client.user || !client.application) {
      return;
    }

    try {
      const guild = await client.guilds.fetch(config.id_guild);
      const staffNotificationChannel = (await guild.channels.fetch(
        config.chan_staff_bot_notif
      )) as TextChannel;
      const memberList = await guild.members.fetch();
      const taggedMembersWithInvalidNames = memberList.filter(
        (member) =>
          member.roles.cache.hasAny(
            config.role_ab,
            config.role_ab_pending,
            config.role_az,
            config.role_az_pending
          ) && !utils.isNameValid(member.displayName)
      );
      staffNotificationChannel.send(
        "`-Bot restart: listing members with invalid names-`"
      );
      taggedMembersWithInvalidNames.forEach((member) => {
        staffNotificationChannel.send(
          `${userMention(member.id)} has an invalid name.`
        );
      });
    } catch (error) {
      console.error(error);
    }
    console.log(`${client.user.username} is ready!`);
  },
};
