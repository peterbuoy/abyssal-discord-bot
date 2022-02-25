import { Database } from "better-sqlite3";
import { Client } from "discord.js";
import { id_guild, role_az_pending } from "../config.json";

const purgePending = (client: Client, db: Database) => {
  console.log("purging pending");
  const select = db.prepare("SELECT snowflake FROM pending WHERE kickTime < ?");
  const purged = select.all(Date.now());

  if (purged.length > 0) {
    purged.forEach((user) => {
      const del = db.prepare("DELETE FROM pending WHERE snowflake = ?");
      del.run(user.snowflake);
      client.guilds
        .fetch(id_guild)
        .then((guild) => guild.members.fetch(user.snowflake))
        .then((member) => member.roles.remove(role_az_pending));
    });
    console.log("purging pending in db");
  }
  const stmt = db.prepare("SELECT * FROM pending");
  const pendingMembers = stmt.all();
  console.log(pendingMembers);
};

export { purgePending };
