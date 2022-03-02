import { Client } from "discord.js";

module.exports = {
  name: "ready",
  once: true,
  execute(client: Client) {
    if (!client.user || !client.application) {
      return;
    }
    console.log(`${client.user.username} is ready!`);
  },
};
