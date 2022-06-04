import config from "../config";
import { Collection, TextChannel } from "discord.js";
import { client } from "../index";
import pool from "../db/index";
import { codeBlock } from "@discordjs/builders";

const updateOrCreateWarSignups = async () => {
  const nodeWarSignupChan = client.channels.cache.get(
    config.chan_node_war_signup
  ) as TextChannel;
  const listMessageID = await pool
    .query(`SELECT list_msg_id FROM warsignup WHERE is_active = true`)
    .then((res) => res.rows[0].list_msg_id);
  const listMessage = await nodeWarSignupChan.messages.fetch(listMessageID);
  if (listMessage === undefined) {
    console.log("No war signup list message found.");
    return;
  }
  const signUpListQuery = await pool.query(
    "SELECT signuplist FROM warsignup WHERE is_active = true LIMIT 1"
  );
  if (signUpListQuery.rowCount === 0) {
    console.log("No active war signup list found.");
    return;
  }
  const signUpListJSON = signUpListQuery.rows[0].signuplist;

  const signUpList: Collection<string, any> = new Collection(
    Object.entries(signUpListJSON)
  );
  // gs is technically string
  // This is like buying a helmet and not strapping it on
  signUpList.sort((a, b) => parseInt(b.gs) - parseInt(a.gs));
  const familyName = "Family Name".padEnd(17, " ");
  const characterName = "Character Name".padEnd(17, " ");
  const className = "Class".padEnd(12, " ");
  const lvl = "Lvl".padEnd(4, " ");
  const gs = "GS".padEnd(5, " ");
  let formattedMessage = `Signups: ${signUpList.size}\n\n${familyName}${characterName}${className}${lvl}${gs}Time (PT)\n`;
  formattedMessage +=
    "------------------------------------------------------------------\n";
  try {
    signUpList.forEach((noob) => {
      formattedMessage += `${noob.family_name.padEnd(
        17,
        " "
      )}${noob.character_name.toString().padEnd(17, " ")}${noob.class
        .toString()
        .padEnd(12, " ")}${noob.lvl.toString().padEnd(4, " ")}${noob.gs
        .toString()
        .padEnd(5, " ")}${noob.timestamp}\n`;
    });
  } catch (error) {
    console.error(error);
  }

  await listMessage.edit(codeBlock(formattedMessage));
};

export { updateOrCreateWarSignups };
