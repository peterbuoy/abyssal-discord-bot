import { ICommand } from "wokcommands";

export default {
  name: "list",
  category: "Testing",
  description: "Lists all members in guild based on argument",
  slash: false,
  testOnly: true,
  expectedArgs: "",
  minArgs: 0,
  maxArgs: 1,
  cooldown: "10s",
  callback: async ({ message }) => {
    // lol},
  },
} as ICommand;
