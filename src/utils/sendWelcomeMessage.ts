import { GuildMember, TextChannel } from "discord.js";
import { userMention } from "@discordjs/builders";

const sendWelcomeMessage = async (
  newMember: GuildMember,
  channelID: string
) => {
  const channel = newMember.guild.channels.cache.get(channelID) as TextChannel;
  // The channel ids below will take you to their respective channels official Abyssal / Azurlane Discord server. Probably just leave this as is.
  channel.send(
    userMention(newMember.id) +
      "Welcome to the guild! You should be able to see all the members-only restricted Channels.\n" +
      "------------------------------------------\n" +
      "Make sure you navigate to <#637521198875672587> and register your gear and levels immediately. Please register only your combat main that you will be using for node wars. Failure to do so in a timely manner may result in expulsion.\n\n" +
      "AzurLane members are exempt from this requirement, but are still welcome to update their gear via <#637521198875672587> to track progress and receive advice.\n" +
      "------------------------------------------\n" +
      "All of our <#412900828328886273> and <#415340796561195008> are available for you to use. A quick peek over in <#711175769077841990> won't hurt either. If you have any questions, please ask in <#688929102572421351>! We are more than happy to assist you! \n" +
      "------------------------------------------\n" +
      "If you haven't already done so, configure your Chat Tab #1 to show Guild Chat __**and**__ Alliance Chat, and set display names to Family Names.\n\n" +
      "1. Press CTRL and hover over your chatbox (Default bottom left)\n" +
      "2. Click on the cog icon on the top of your chat box\n" +
      "3. Disable Server/World/whatever else you do not want to see\n" +
      "4. Enable Guild/Alliance/Whisper/whatever else you want to see\n" +
      "5. Click Family name\n" +
      "6. Confirm\n" +
      "------------------------------------------\n" +
      "<a:Boostpls:685267164160065578>If you like our server, please give us a boost so we can keep our custom invite link!<a:Boostpls:685267164160065578>\n"
  );
};

export { sendWelcomeMessage };
