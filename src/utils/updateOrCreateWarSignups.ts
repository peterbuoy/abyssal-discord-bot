import config from "../config";
import { Collection, TextChannel } from "discord.js";
import { client } from "../index";
import pool from "../db/index";
import { codeBlock } from "@discordjs/builders";

const updateOrCreateWarSignups = async () => {
  const nodeWarSignupChan = client.channels.cache.get(
    config.chan_node_war_signup
  ) as TextChannel;
  const messages = await nodeWarSignupChan.messages.fetch();
  const warSignupListMessage = messages.find(
    (message) => message.embeds.length === 0
  );
  if (warSignupListMessage === undefined) {
    console.log("No war signup list message found.");
    return;
  }
  const signUpListQuery = await pool.query(
    "SELECT signuplist FROM warsignup WHERE is_active = true LIMIT 1"
  );
  if (signUpListQuery.rows[0] === 0) {
    console.log("No active war signup list found.");
    return;
  }
  const signUpListJSON = signUpListQuery.rows[0].signuplist;

  const signUpList: Collection<string, any> = new Collection(
    Object.entries(signUpListJSON)
  );
  // gs is technically string
  // This is like buying a helmet and not strapping it once
  signUpList.sort((a, b) => parseInt(b.gs) - parseInt(a.gs));
  const familyName = "Family Name".padEnd(17, " ");
  const characterName = "Character Name".padEnd(17, " ");
  const className = "Class".padEnd(12, " ");
  const lvl = "Lvl".padEnd(4, " ");
  const gs = "GS".padEnd(5, " ");
  let formattedMessage = `${familyName}${characterName}${className}${lvl}${gs}Time (PT)\n`;
  try {
    signUpList.forEach((noob) => {
      formattedMessage += `${noob.family_name.padEnd(
        17,
        " "
      )}${noob.character_name.toString().padEnd(17, " ")}${noob.class
        .toString()
        .padEnd(12, " ")}${noob.lvl.toString().padEnd(4, " ")}${noob.gs.padEnd(
        5,
        " "
      )}${noob.timestamp}\n`;
    });
  } catch (error) {
    console.error(error);
  }

  warSignupListMessage?.edit(codeBlock(formattedMessage));
};

export { updateOrCreateWarSignups };
