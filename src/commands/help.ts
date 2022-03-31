import { ICommand } from "wokcommands";
import config from "../config";

export default {
  name: "help",
  category: "Help",
  description: "displays all available commands",
  callback: ({ member, channel, instance }) => {
    let helpMessage =
      "**Angle brackets are <REQUIRED> arguments\n Square brackets are [OPTIONAL] arguments**\n";
    instance.commandHandler.commands.forEach((command: ICommand) => {
      // All commands except config shown for admin, war staff, gm az
      if (
        member.roles.cache.hasAny(
          config.role_war_staff,
          config.role_admin,
          config.role_gm_az
        )
      ) {
        if (command.category !== "Configuration") {
          helpMessage += `\`%${command.names} ${command.syntax}\` \n\t${command.description}\n`;
        }
        // Regular guild members can only see gear commands
      } else if (member.roles.cache.hasAny(config.role_ab, config.role_az)) {
        if (command.category === "Gear") {
          helpMessage += `\`%${command.names} ${command.syntax}\` \n\t${command.description}\n`;
        }
        //New members can only see join command
      } else {
        if (command.category === "Join") {
          helpMessage += `\`%${command.names} ${command.syntax}\` \n\t${command.description}\n`;
        }
      }
    });
    channel.send(helpMessage);
  },
} as ICommand;
