import { Collection, MessageReaction, TextChannel, User } from "discord.js";
import dayjs from "dayjs";
import { getSheetByTitle } from "../utils/getSheetByTitle";
import { ICommand } from "wokcommands";
import config from "../config";
import { userMention } from "@discordjs/builders";
import { addToDumpSheet } from "../utils/addToDumpSheet";

export default {
  name: "update",
  category: "Gear",
  description: "starts character, gear update request process",
  slash: false,
  testOnly: false,
  minArgs: 0,
  maxArgs: 8,
  cooldown: "5s",
  syntax: "update Character YourName Class Warrior lvl 63 300/300/300",
  callback: async ({ member, message, args, channel }) => {
    // Only allow usage in #gear-update and by az/ab members
    if (
      channel.id !== config.chan_gear_update ||
      !member.roles.cache.hasAny(config.role_ab, config.role_az)
    ) {
      message.reply("You can only use this in the gear update channel.");
      return;
    }

    // Contains argument parsing from KC Bot, but HEAVILY modified logic
    // Only allow a single image as an attachment
    if (
      message.attachments.size !== 1 ||
      (message.attachments.first()?.contentType !== "image/jpeg" &&
        message.attachments.first()?.contentType !== "image/png")
    ) {
      message.reply(
        "Please make sure to attach a single image to the command!"
      );
      return;
    }
    const image = message.attachments.first();

    // Example usage: character OchacoReto class DK lvl 61 271/284/312
    // At least ONE "arg" must be provided e.g.
    // character OchacoReto OR class DK OR lvl 62 OR 271/284/312

    // We can simplify the code by not worrying TOO much about data integrity
    // since gear requests are manually verified anyway.

    // Dynamically create a collection with the values that need to be updated
    // Use updateInfo to add only the necessary values to the GoogleSpreadsheet
    const updateInfo: Collection<string, string | null> = new Collection();
    const argsLowerCase = args.map((arg) => arg.toLowerCase());

    updateInfo.set("Gear Screenshot", image!.url);

    // Character name
    const charNameIndex = argsLowerCase.indexOf("character") + 1;
    if (charNameIndex > 0 && charNameIndex < args.length) {
      const charName = args[charNameIndex];
      updateInfo.set("Character Name", charName);
    }

    // Class name, two word classes (Dark Knight) must be inputted by without spaces, e.g. dk or darkknight
    const classIndex = argsLowerCase.indexOf("class") + 1;
    if (classIndex > 0 && classIndex < args.length) {
      const className = parseClassName(argsLowerCase[classIndex]);
      updateInfo.set("Class", className);
      try {
        // Assign class role. className from config are all lower case with underscores instead of spaces
        const class_roles: { [className: string]: string } = config.class_roles;
        const jsonClassName = updateInfo
          .get("Class")!
          .toLowerCase()
          .split(" ")
          .join("_");
        const classId = class_roles[jsonClassName];
        const allClassIds: Array<string> = Object.values(class_roles);
        message.member?.roles
          .remove(allClassIds)
          .then((guildMember) => guildMember.roles.add(classId));
      } catch (err) {
        console.error("error assigning class role", err);
      }
    }

    // Level
    const levelIndex = argsLowerCase.indexOf("level") + 1;
    if (levelIndex > 0 && levelIndex < args.length) {
      const level = args[levelIndex];
      updateInfo.set("Level", level);
    }

    // Gear Score AP/AAP/DP
    // can't have 0/0/0 using this regex, only 1 - 999 accepted
    let gsInfo: any = argsLowerCase.find((e) => {
      return (
        /^[1-9]\d{0,2}\/[1-9]\d{0,2}\/[1-9]\d{0,2}$/g.test(e) ||
        /^[1-9]\d{0,2}\/0\/[1-9]\d{0,2}$/g.test(e)
      );
    });
    if (gsInfo) {
      gsInfo = gsInfo.split("/");
      const ap = gsInfo[0];
      const aap = gsInfo[1];
      const dp = gsInfo[2];
      if (ap) updateInfo.set("AP", ap);
      if (aap) updateInfo.set("Awaken AP", aap);
      if (dp) updateInfo.set("DP", dp);
      if (ap && aap && dp) {
        const gearScore = (
          Math.max(parseInt(ap), parseInt(aap)) + parseInt(dp)
        ).toString();
        updateInfo.set("Gear Score", gearScore);
      }
    }

    // Confirmation message
    let msg = "";
    if (updateInfo.get("Character Name")) {
      msg += `\n**Character Name** - ${updateInfo.get("Character Name")}`;
    }
    if (updateInfo.get("Class") && updateInfo.get("Class") !== "INVALID") {
      msg += `\n**Class** - ${updateInfo.get("Class")}`;
    }
    if (updateInfo.get("Level"))
      msg += `\n**Level** - ${updateInfo.get("Level")}`;
    if (updateInfo.get("AP")) msg += `\n**AP** - ${updateInfo.get("AP")}`;
    if (updateInfo.get("Awaken AP"))
      msg += `\n**AAP** - ${updateInfo.get("Awaken AP")}`;
    if (updateInfo.get("DP")) msg += `\n**DP** - ${updateInfo.get("DP")}`;

    if (msg) {
      try {
        const gearUpdateMsg = await message.channel.send(
          `**__Update Requested by__** ${message.author}\n` +
            `*Please note that your update is now pending review by War Staff.
        Until it is approved, you will **not** see any changes reflected*\n` +
            msg
        );
        const gearRequestChan = message.guild?.channels.cache.get(
          config.chan_gear_requests
        ) as TextChannel;
        const gearRequestMsg = await gearRequestChan.send(
          `**__Update Requested by__** ${message.author}\n` +
            msg +
            `\n**Screenshot** - ${image?.url}`
        );
        await gearRequestMsg.react("✅");
        await gearRequestMsg.react("🚫");
        const filter = (reaction: MessageReaction, user: User) => !user.bot;
        const collector = gearRequestMsg.createReactionCollector({
          filter,
          maxUsers: 1,
        });
        collector.on(
          "collect",
          async (reaction: MessageReaction, reactionUser: User) => {
            if (reaction.emoji.name === "✅") {
              updateInfo.set("Awaken AP Gained", null);
              updateInfo.set(
                "Gear Timestamp",
                dayjs().format("M/D/YYYY h:mm A")
              );
              gearRequestMsg.delete();
              let sheetTitle = "";
              if (member?.roles.cache.has(config.role_ab)) {
                sheetTitle = config.ab_sheet_title;
              } else if (member?.roles.cache.has(config.role_az)) {
                sheetTitle = config.az_sheet_title;
              } else {
                throw Error("Member does not have a valid role");
              }
              const sheet = await getSheetByTitle(sheetTitle);
              const rows = await sheet?.getRows();
              const targetRow = rows?.find(
                (row) => row["Discord UserID"] === member.user.id
              );
              if (targetRow !== undefined) {
                await addToDumpSheet(member);
                updateInfo.forEach((value, columnName) => {
                  targetRow[columnName] = value;
                });
                await targetRow.save();
              }

              gearUpdateMsg.edit(
                `**__Update Requested by__** ${message.author}\n` +
                  `*Please note that your update is now pending review by War Staff.
          Until it is approved, you will **not** see any changes reflected*\n` +
                  msg +
                  `\n✅ Approved by ${userMention(
                    reactionUser.id
                  )} at ${updateInfo.get("Gear Timestamp")} PST
                  \n Your new gear info has been updated. 
                If you are signed up for war, you will need to sign up again for the changes to be reflected.`
              );
            } else if (reaction.emoji.name === "🚫") {
              gearRequestMsg.delete();
              gearUpdateMsg.edit(
                `**__Update Requested by__** ${message.author}\n` +
                  `*Please note that your update is now pending review by War Staff. Until it is approved, you will **not** see any changes reflected*\n` +
                  msg +
                  `\n🚫 Denied by ${userMention(
                    reactionUser.id
                  )} at ${updateInfo.get("Gear Timestamp")} PST`
              );
              channel.send({
                content:
                  userMention(member.id) +
                  " ,your gear submission was denied! Please make sure all your info is correct and your screenshot contains everything highlighted below! Thank you!",
                files: [
                  {
                    // Careful, process.cwd() depends on where you actually start the file (could be .sh or .bat somewhere)
                    // https://stackoverflow.com/questions/13051961/proper-way-to-reference-files-relative-to-application-root-in-node-js
                    // "will return the root path for the file that initiated the running process"
                    // ~ deimosaffair
                    attachment: `${process.cwd()}/src/assets/gear.jpg`,
                    name: "gear.jpg",
                    description: "gear update photo",
                  },
                ],
              });
            }
          }
        );
      } catch (error) {
        return console.error(error);
      }
    } else {
      return message.reply(
        "I couldn't find any relevant info in your command. Please try again!"
      );
    }
  },
} as ICommand;

function parseClassName(className: string) {
  // Archer, Berserker, Dark Knight, Kunoichi, Lahn, Maehwa, Musa, Mystic, Ninja, Ranger, Shai, Sorceress, Striker, Tamer, Valkyrie, Warrior, Witch, Wizard
  if (className == "archer") className = "Archer";
  else if (
    className == "berserker" ||
    className == "berzerker" ||
    className == "serker" ||
    className == "zerker" ||
    className == "serk" ||
    className == "zerk"
  )
    className = "Berserker";
  else if (
    className == "dark" ||
    className == "darkknight" ||
    className == "darknight" ||
    className == "knight" ||
    className == "dk"
  )
    className = "Dark Knight";
  else if (
    className == "guardian" ||
    className == "gaurdian" ||
    className == "gardian" ||
    className == "gurdian" ||
    className == "garden" ||
    className == "guard" ||
    className == "gaurd" ||
    className == "gard" ||
    className == "gurd"
  )
    className = "Guardian";
  else if (className == "kunoichi" || className == "kuno")
    className = "Kunoichi";
  else if (
    className == "lahn" ||
    className == "lan" ||
    className == "rahn" ||
    className == "ran"
  )
    className = "Lahn";
  else if (className == "maehwa" || className == "maewha" || className == "mae")
    className = "Maehwa";
  else if (className == "musa") className = "Musa";
  else if (className == "mystic") className = "Mystic";
  else if (className == "ninja" || className == "nin") className = "Ninja";
  else if (className == "ranger") className = "Ranger";
  else if (className == "shai") className = "Shai";
  else if (className == "sorceress" || className == "sorc")
    className = "Sorceress";
  else if (className == "striker") className = "Striker";
  else if (className == "tamer") className = "Tamer";
  else if (className == "valkyrie" || className == "valk")
    className = "Valkyrie";
  else if (className == "warrior" || className == "war") className = "Warrior";
  else if (className == "witch") className = "Witch";
  else if (className == "wizard") className = "Wizard";
  else if (
    className == "hashashin" ||
    className == "hash" ||
    className == "hashbrown"
  )
    className = "Hashashin";
  else if (className == "nova") className = "Nova";
  else if (className == "sage") className = "Sage";
  else if (className == "corsair" || className == "courser")
    className = "Corsair";
  else className = "INVALID";

  return className;
}
