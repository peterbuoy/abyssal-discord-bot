import { ICommand } from "wokcommands";
import config from "../config";

export default {
  name: "help",
  category: "Help",
  description: "",
  callback: ({ member, channel, instance }) => {
    let helpMessage =
      "**Angle brackets are <REQUIRED> arguments\n Square brackets are [OPTIONAL] arguments**\n";
    const memberRoleCache = member.roles.cache;
    instance.commandHandler.commands.forEach((command: ICommand) => {
      if (
        command.category === "War" ||
        command.category === "Gear" ||
        command.category === "Management"
      )
        helpMessage += `\`%${command.names} ${command.syntax}\` \n\t${command.description}\n`;
    });
    channel.send(helpMessage);
  },
} as ICommand;
