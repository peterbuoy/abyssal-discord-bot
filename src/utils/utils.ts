import { Role, Collection } from "discord.js";

const collectionContains = (
  object: Collection<string, Role>,
  keys: Array<string>
) => keys.some((k) => k in object);

export { collectionContains };
