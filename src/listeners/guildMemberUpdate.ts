import { Client, TextChannel } from "discord.js";
import { userMention } from "@discordjs/builders";
import {
  role_ab,
  role_az,
  inGuildOrPending,
  role_az_pending,
  chan_staff_bot_notif,
} from "../config.json";
import Database from "better-sqlite3";

export default (client: Client, db: Database): void => {
  client.on("guildMemberUpdate", (oldMember, newMember) => {
    const userID = oldMember.id;
    const regex = /<[A-Za-z(0-9)?]+>/;
    const staffBotNotifChannel = client.channels.cache.get(chan_staff_bot_notif);
    const msg = `
      **Name Change Detected**
      User Profile: ${userMention(userID)}
      Old Nickname: ${oldMember.nickname}
      New Nickname: ${newMember.nickname}\n
      `;
    if (!(staffBotNotifChannel instanceof TextChannel)) {
      return;
    }
    if (
      oldMember.nickname !== newMember.nickname &&
      !regex.test(newMember.nickname!)
    ) {
      console.log("invalid name");
      staffBotNotifChannel.send(
        `⚠️**Invalid Name Change**⚠️ for ${userMention(userID)}
        ${msg}
        `
      );
    } else {
      staffBotNotifChannel.send(msg);
    }
    if (newMember.roles.cache.has(role_az)) {
      console.log("Member confirmed. Removing from pending member database.");
      const del = db.prepare("DELETE FROM pending WHERE ?");
      del.run(newMember.id);
      const stmt = db.prepare("SELECT * FROM pending");
      const pendingMembers = stmt.all();
      console.log(pendingMembers);
    }
  });
})
