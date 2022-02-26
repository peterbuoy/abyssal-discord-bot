import { Client, TextChannel } from "discord.js";
import { userMention } from "@discordjs/builders";
import { chan_staff_bot_notif } from "../config.json";

export default (client: Client): void => {
  client.on("guildMemberUpdate", (oldMember, newMember) => {
    const userID = oldMember.id;
    const regex = /<[A-Za-z(0-9)?]+>/;
    const staffBotNotifChannel =
      client.channels.cache.get(chan_staff_bot_notif);
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
  });
};
