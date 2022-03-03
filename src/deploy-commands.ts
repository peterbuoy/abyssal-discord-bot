import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import fs from "fs";
import config from "./config.json";
import dotenv from "dotenv";

dotenv.config();

const commands: any = [];
const commandFiles = fs
  .readdirSync("./src/commands")
  .filter((file) => file.endsWith(".ts"));

(async () => {
  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }
})();

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN!);

console.log(commandFiles);
rest
  .put(Routes.applicationGuildCommands(config.id_client, config.id_guild), {
    body: commands,
  })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
