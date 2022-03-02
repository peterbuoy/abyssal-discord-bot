import { Role, Collection } from "discord.js";

const isNameValid = (name: string): boolean => {
  const regex = /^(.*)([^ ] {1})<([A-Z,a-z,0-9,_]{3,16})>$/;
  return regex.test(name);
};

// export { collectionContains, isNameValid };
export default { isNameValid };
