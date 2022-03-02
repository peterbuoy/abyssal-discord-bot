import { Client } from "discord.js";
import * as config from "../config.json";
import utils from "../utils/utils";

module.exports = {
  name: "ready",
  once: true,
  execute(client: Client) {
    if (!client.user || !client.application) {
      return;
    }
    const guild = client.guilds.cache.get(config.id_guild);
    const members = guild?.members.cache;
    console.log(members);
    const membersWithInvalidNames = guild?.members.cache.filter((member) =>
      member.roles.cache.hasAny(
        config.role_ab,
        config.role_ab_pending,
        config.role_az,
        config.role_az_pending
      )
    );
    // .filter((member) => !utils.isNameValid(member.displayName));
    console.log(membersWithInvalidNames);

    console.log(`${client.user.username} is ready!`);
  },
};
