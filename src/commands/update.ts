import {
  Collection,
  GuildMember,
  MessageAttachment,
  MessageReaction,
  ReactionEmoji,
  TextChannel,
  User,
} from "discord.js";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { getSheetByTitle } from "../utils/getSheetByTitle";
import { ICommand } from "wokcommands";
import config from "../config.json";

export default {
  name: "update",
  category: "Testing",
  description: "starts character, gear update request process",
  slash: false,
  testOnly: true,
  minArgs: 0, // huh
  maxArgs: -1, // change later
  cooldown: "10s",
  callback: async ({ member, message, args, channel }) => {
    // Only allow usage in #gear-update and by az/ab members
    if (
      channel.id !== config.chan_gear_update ||
      !member.roles.cache.hasAny(config.role_ab, config.role_az)
    ) {
      return;
    }

    // Argument parsing from KC Bot, slightly modified'
    // Only allow a single image as an attachment
    if (
      message.attachments.size !== 1 ||
      message.attachments.first()?.contentType !== "image/png"
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
    const updateInfo: Collection<string, any> = new Collection();

    const argsLowerCase = args.map((arg) => arg.toLowerCase());

    // Character name
    const charNameIndex = argsLowerCase.indexOf("character") + 1;
    if (charNameIndex > 0 && charNameIndex < args.length) {
      const charName = args[charNameIndex];
      updateInfo.set("charName", charName);
    }

    // Class Name, two word classes (Dark Knight) must be inputted by without spaces, e.g. dk or darkknight
    const classIndex = argsLowerCase.indexOf("class") + 1;
    if (classIndex > 0 && classIndex < args.length) {
      const className = parseClassName(argsLowerCase[classIndex]);
      updateInfo.set("className", className);
    }
    try {
      // Assign class role. className from config are all lower case with underscores instead of spaces
      const class_roles: { [className: string]: string } = config.class_roles;
      const jsonClassName = updateInfo
        .get("className")
        .toLowerCase()
        .split(" ")
        .join("_");
      const classId = class_roles[jsonClassName];

      // Get roles of member, remove ALL roles if they are in config.class_roles
      // Add the class role
      const classesToRemove: Array<string> = [];
      message.member?.roles.cache.filter((value) => {
        value;
      });
      message.member?.roles.cache.forEach((id: any) => {
        if (Object.values(class_roles).indexOf(id) > -1 && id != classId) {
          classesToRemove.push(id);
        }
      });
      message.member?.roles
        .remove(classesToRemove)
        .then((guildMember) => guildMember.roles.add(classId));
    } catch (err) {
      console.log(err);
    }
    const level = 0;
    let levelIndex = -1;
    let levelInfo: string | undefined | number = "";

    if (argsLowerCase.includes("level")) {
      levelIndex = argsLowerCase.indexOf("level") + 1;
      if (levelIndex > 0 && levelIndex < args.length) {
        levelInfo = args[levelIndex];
      }
    } else if (argsLowerCase.includes("lvl")) {
      levelIndex = argsLowerCase.indexOf("lvl") + 1;
      if (levelIndex > 0 && levelIndex < args.length) {
        levelInfo = args[levelIndex];
      }
    } else if (argsLowerCase.includes("lv")) {
      levelIndex = argsLowerCase.indexOf("lv") + 1;
      if (levelIndex > 0 && levelIndex < args.length) {
        levelInfo = args[levelIndex];
      }
    } else {
      levelInfo = argsLowerCase.find((e) => {
        return e.includes("level") || e.includes("lvl") || e.includes("lv");
      });

      if (levelInfo) {
        levelInfo = levelInfo.replace(/level/g, "");
        levelInfo = levelInfo.replace(/lvl/g, "");
        levelInfo = levelInfo.replace(/lv/g, "");
      }
    }

    // Gear Score AP/AAP/DP
    let ap = -1;
    let aap = -1;
    let dp = -1;

    // can't have 0/0/0 using this regex, only 1 - 999 accepted
    let gsInfo: any = argsLowerCase.find((e) => {
      return (
        /^[1-9]\d{0,2}\/[1-9]\d{0,2}\/[1-9]\d{0,2}$/g.test(e) ||
        /^[1-9]\d{0,2}\/0\/[1-9]\d{0,2}$/g.test(e)
      );
    });

    if (gsInfo) {
      gsInfo = gsInfo.split("/");
      ap = parseInt(gsInfo[0]);
      aap = parseInt(gsInfo[1]);
      dp = parseInt(gsInfo[2]);
    }

    // Confirmation message
    let msg = "";
    if (updateInfo.get("charName")) {
      msg += `\n**Character Name** - ${updateInfo.get("charName")}`;
    }
    if (
      updateInfo.get("className") &&
      updateInfo.get("charName") !== "INVALID"
    ) {
      msg += `\n**Class** - ${updateInfo.get("charName")}`;
    }
    if (level > 0 && level < 100) msg += `\n**Level** - ${level}`;
    if (ap > 0) msg += `\n**AP** - ${ap}`;
    if (aap >= 0) msg += `\n**AAP** - ${aap}`;
    if (dp > 0) msg += `\n**DP** - ${dp}`;

    // Consider rewriting this with async and await since we
    // should reference previously determined values for readability
    if (msg) {
      message.channel
        .send(
          `**__Update Requested by__** ${message.author}\n` +
            `*Please note that your update is now pending review by War Staff.
        Until it is approved, you will **not** see any changes reflected*\n` +
            msg
        )
        .then((m) => {
          const gearRequestChan = m.guild?.channels?.cache.get(
            config.chan_gear_requests
          ) as TextChannel;
          return gearRequestChan.send(
            `**__Update Requested by__** ${message.author} ${m.id}\n` +
              msg +
              `\n**Screenshot** - ${image?.url}`
          );
        })
        .then((gearRequestChanMsg) => {
          gearRequestChanMsg
            .react("✅")
            .then((r: MessageReaction) => {
              r.message.react("🚫");
              const filter = (reaction: MessageReaction, user: User) =>
                !user.bot;
              const collector = r.message.createReactionCollector({
                filter,
                maxUsers: 1,
              });
              collector.on("collect", (reaction: MessageReaction) => {
                if (reaction.emoji.name === "✅") {
                  // Approve
                  // Update the character
                  // add current info to dump
                  // add to sheet
                  // update message in gear-update
                  r.message.delete();
                } else if (reaction.emoji.name === "🚫") {
                  // Deny
                  // update message in gear-update
                  r.message.delete();
                }
              });
            })
            .catch((error) => {
              console.error(error);
            });
        });
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
