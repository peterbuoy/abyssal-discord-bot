import config from "../config";
import { Collection, TextChannel } from "discord.js";
import { client } from "../index";
import { pool } from "../db/index";
import { codeBlock } from "@discordjs/builders";

const updateOrCreateWarSignups = async () => {
  const nodeWarSignupChan = client.channels.cache.get(
    config.chan_node_war_signup
  ) as TextChannel;
  const listMessageIDArray = await pool
    .query(
      `SELECT list_msg_id, list_msg_id_2, list_msg_id_3, list_msg_id_4 FROM warsignup WHERE is_active = true`
    )
    .then((res) => res.rows[0]);
  const listMessage1 = await nodeWarSignupChan.messages.fetch(
    listMessageIDArray.list_msg_id
  );
  const listMessage2 = await nodeWarSignupChan.messages.fetch(
    listMessageIDArray.list_msg_id_2
  );
  const listMessage3 = await nodeWarSignupChan.messages.fetch(
    listMessageIDArray.list_msg_id_3
  );
  const listMessage4 = await nodeWarSignupChan.messages.fetch(
    listMessageIDArray.list_msg_id_4
  );

  if (listMessage1 === undefined) {
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
  const noobArray: string[] = [];
  try {
    signUpList.forEach((noob) => {
      noobArray.push(
        `${noob.family_name.padEnd(17, " ")}${noob.character_name
          .toString()
          .padEnd(17, " ")}${noob.class.toString().padEnd(12, " ")}${noob.lvl
          .toString()
          .padEnd(4, " ")}${noob.gs.toString().padEnd(5, " ")}${
          noob.timestamp
        }\n`
      );
    });
  } catch (error) {
    console.error(error);
  }
  await listMessage1.edit(
    codeBlock(
      `Signups: ${
        signUpList.size
      }\n\n${familyName}${characterName}${className}${lvl}${gs}Time (PT)\n------------------------------------------------------------------\n${noobArray
        .slice(0, Math.min(25, noobArray.length))
        .join("")}`
    )
  );
  if (noobArray.length > 25) {
    await listMessage2.edit(
      codeBlock(
        `${noobArray.slice(25, Math.min(50, noobArray.length)).join("")}`
      )
    );
  }
  if (noobArray.length > 50) {
    await listMessage3.edit(
      codeBlock(
        `${noobArray.slice(50, Math.min(75, noobArray.length)).join("")}`
      )
    );
  }
  if (noobArray.length > 75) {
    await listMessage4.edit(
      codeBlock(
        `${noobArray.slice(75, Math.min(100, noobArray.length)).join("")}`
      )
    );
  }
};

export { updateOrCreateWarSignups };
