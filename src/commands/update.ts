import { Collection, MessageReaction, TextChannel, User } from "discord.js";
import dayjs from "dayjs";
import { getSheetByTitle } from "../utils/getSheetByTitle";
import { ICommand } from "wokcommands";
import config from "../config";
import { channelMention, userMention } from "@discordjs/builders";
import { addToDumpSheet } from "../utils/addToDumpSheet";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(tz);

export default {
  name: "update",
  category: "Gear",
  description:
    "Starts gear update request process. Remember to attach an image.\n *Example:* %update Character Gaisgeil Class Ninja level 62 123/456/789",
  slash: false,
  testOnly: false,
  minArgs: 0,
  maxArgs: 8,
  cooldown: "5s",
  expectedArgs:
    "Character character_name Class class_name level your_level AP/awakening_ap/DP",
  syntax: "update Character NoHands Class Warrior level 63 300/300/300",
  callback: async ({ member, message, args, channel }) => {
    // Only allow usage in #gear-update and by az/ab members
    if (
      channel.id !== config.chan_gear_update ||
      !member.roles.cache.hasAny(config.role_ab, config.role_az)
    ) {
      message.reply(
        `Only Abyssal and Azurlane members can use this in ${channelMention(
          config.chan_gear_update
        )}.`
      );
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

    const sheet = await getSheetByTitle(
      member.roles.cache.has(config.role_ab)
        ? config.ab_sheet_title
        : config.az_sheet_title
    );
    const rows = await sheet?.getRows();
    const originalRow = rows?.find(
      (row) => row["Discord UserID"] === member.user.id
    );
    if (originalRow === undefined) {
      throw Error(
        "User was not able to be found in spreadsheet but attempted to start a gear update."
      );
    }

    // We initialize these values to ensure that the first gear update must
    // contain all values listed:
    // character name, class, level
    const updateInfo: Collection<string, string | number | boolean> =
      new Collection();
    updateInfo.set("Character Name", originalRow["Character Name"]);
    updateInfo.set("Class", originalRow["Class"]);
    updateInfo.set("Level", originalRow["Level"]);
    // Derived value, so not necessary
    // updateInfo.set("Gear Score", originalRow["Gear Score"]);
    updateInfo.set("AP", originalRow["AP"]);
    updateInfo.set("Awaken AP", originalRow["Awaken AP"]);
    updateInfo.set("DP", originalRow["DP"]);

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
        const jsonClassName = (updateInfo.get("Class") as string)
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

    // Check update info if there is anything missing and print it as an error message
    const missingUpdateInfo = updateInfo.filter((value) => value === "");
    if (missingUpdateInfo.size > 0) {
      // There's a cleaner way to map the collection to strings, but eh
      let missingInfo = "";
      missingUpdateInfo.forEach((value, key) => (missingInfo += `${key}\n`));
      message.reply(
        `Please make sure to include the following missing information:\n**${missingInfo}**
        Here is an example of a complete update.
        \`%update Character Gaisgeil Class Ninja level 62 123/456/789\`
        You only have to do a complete update your first time. 
        Afterwards you can just do \`%update 300/301/302\` `
      );
      return;
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
              updateInfo.set("Awaken AP Gained", 0);
              updateInfo.set(
                "Gear Timestamp",
                dayjs().tz("America/Los_Angeles").format("MM/DD/YYYY h:mm A")
              );
              await gearRequestMsg.delete();
              let sheetTitle = "";
              if (member?.roles.cache.has(config.role_ab)) {
                sheetTitle = config.ab_sheet_title;
              } else if (member?.roles.cache.has(config.role_az)) {
                sheetTitle = config.az_sheet_title;
              } else {
                throw Error("Member does not have a valid role");
              }
              const sheet = await getSheetByTitle(sheetTitle);
              if (sheet === undefined) {
                throw Error("Error accessing sheet in %update");
              }
              const rows = await sheet?.getRows();
              const targetRow = rows?.find(
                (row) => row["Discord UserID"] === member.user.id
              );
              if (targetRow == undefined) {
                channel.send(
                  `${userMention(
                    config.id_peterbuoy
                  )} Error in updating gear. Please check the logs. `
                );
                throw Error(
                  `Abyssal member ${member.displayName} tried to do a gear update but they were unable to be found in the google spreadsheet.`
                );
              }
              await addToDumpSheet(member);
              // I am lazy, so just use the targetRow.index to target the row
              // then just write the cells for that
              /*
              updateInfo.set("Character Name", originalRow["Character Name"]);
              updateInfo.set("Class", originalRow["Class"]);
              updateInfo.set("Level", originalRow["Level"]);
              // Derived value, so not necessary
              // updateInfo.set("Gear Score", originalRow["Gear Score"]);
              updateInfo.set("AP", originalRow["AP"]);
              updateInfo.set("Awaken AP", originalRow["Awaken AP"]);
              updateInfo.set("DP", originalRow["DP"]);
              updateInfo.get("Gear Timestamp")
              updateInfo.get("Gear Screenshot")
              */
              console.log(targetRow.rowIndex);
              await sheet.loadCells(
                `J${targetRow.rowIndex}:T${targetRow.rowIndex}`
              );
              const cellRowIndex = targetRow.rowIndex - 1;
              sheet.getCell(cellRowIndex, 9).value =
                updateInfo.get("Character Name")!;
              sheet.getCell(cellRowIndex, 10).value = updateInfo.get("Class")!;
              sheet.getCell(cellRowIndex, 11).value = updateInfo.get("Level")!;
              sheet.getCell(cellRowIndex, 13).value =
                updateInfo.get("Gear Score")!;
              sheet.getCell(cellRowIndex, 14).value = updateInfo.get("AP")!;
              sheet.getCell(cellRowIndex, 15).value =
                updateInfo.get("Awaken AP")!;
              sheet.getCell(cellRowIndex, 16).value = updateInfo.get("DP")!;
              sheet.getCell(cellRowIndex, 18).value =
                updateInfo.get("Gear Timestamp")!;
              sheet.getCell(cellRowIndex, 19).value =
                updateInfo.get("Gear Screenshot")!;
              sheet.saveUpdatedCells();

              await gearUpdateMsg.edit(
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
              await gearRequestMsg.delete();
              await gearUpdateMsg.edit(
                `**__Update Requested by__** ${message.author}\n` +
                  `*Please note that your update is now pending review by War Staff. Until it is approved, you will **not** see any changes reflected*\n` +
                  msg +
                  `\n🚫 Denied by ${userMention(reactionUser.id)} at ${dayjs()
                    .tz("America/Los_Angeles")
                    .format("MM/DD/YYYY h:mm A")} PST`
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
  else if (className == "drakania" || className == "drakonia")
    className = "Drakania";
  else className = "INVALID";

  return className;
}
