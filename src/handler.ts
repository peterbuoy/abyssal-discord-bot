import { Database } from "better-sqlite3";
import {
  Client,
  Message,
  MessageActionRow,
  MessageComponentInteraction,
} from "discord.js";
import {
  abyssalButton,
  azurlaneButton,
  yesAZRulesButton,
  noAZRulesButton,
} from "./buttons/joinButtons";
import config from "./config.json";

class WelcomeHandler {
  // Array of user IDs to keep track of who is currently using the join cmd
  joinUserIDs: string[] = [];
  handleJoin(client: Client, message: Message, db: Database) {
    if (
      message.member?.roles.cache.some(
        (key) =>
          config.inGuildOrPending.includes(key.id) ||
          (this.joinUserIDs.includes(message.member!.id) &&
            message.channelId === config.chan_welcome)
      )
    ) {
      return;
    }
    this.joinUserIDs.push(message.member!.id);
    let botMessageID = "";
    message
      .reply({
        content: "Which guild would you like to join?",
        components: [
          new MessageActionRow().addComponents(abyssalButton, azurlaneButton),
        ],
      })
      .then((msg) => {
        botMessageID = msg.id;
        setTimeout(() => {
          msg.edit({
            content: "Join process exceeded 5 minutes. Please try again.",
            components: [],
          });
          this.#removeFromJoinUserID(message.member!.id);
        }, 5 * 60000);
      });

    // Interaction handler for join command
    client.on("interactionCreate", (interaction) => {
      const guild = client.guilds.cache.get(config.id_guild);
      const member = guild?.members.cache.get(interaction.user.id);
      // Checks if interaction is button and if the interaction is the one associated with the bot message
      if (!interaction.isButton() && interaction.user.id !== botMessageID)
        return;
      // Type narrowing using instanceof. Comment for spaced repetition :D
      if (!(interaction instanceof MessageComponentInteraction)) return;

      switch (interaction.customId) {
        case "abyssal":
          member?.roles.add(config.role_ab_pending);
          this.joinUserIDs = this.joinUserIDs.filter((id) => id !== member?.id);
          interaction.update({
            content: "Welcome to Abyssal",
            components: [],
          });
          break;
        case "azurlane":
          interaction.update({
            content: "Did you read the rules?",
            components: [
              new MessageActionRow().addComponents(
                yesAZRulesButton,
                noAZRulesButton
              ),
            ],
          });
          break;
        case "yesAZRules": {
          interaction.update({
            content: "Congrats you got pending tag",
            components: [],
          });
          this.#removeFromJoinUserID(member!.id);
          member?.roles.add(config.role_az_pending);
          const insert = db.prepare(
            "INSERT INTO pending(snowflake, kickTime) values (?, ?)"
          );
          insert.run(member?.id, Date.now() + 10000);
          // const stmt = db.prepare("SELECT * FROM pending");
          // const pendingMembers = stmt.all();
          // console.log(pendingMembers);
          break;
        }
        case "noAZRules":
          interaction.update({
            content: "Go read the rules",
            components: [],
          });
          this.#removeFromJoinUserID(member!.id);
          break;
      }
    });
  }
  #removeFromJoinUserID(memberID: string) {
    this.joinUserIDs = this.joinUserIDs.filter((id) => id !== memberID);
  }
}

export { WelcomeHandler };
