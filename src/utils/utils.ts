const isNameValid = (name: string): boolean => {
  const regex = /^(.*)([^ ] {1})<([A-Z,a-z,0-9,_]{3,16})>$/;
  return regex.test(name);
};

const parseFamilyName = (displayName: string): string => {
  const regex = /<(.*?)>/;
  const famName = regex.exec(displayName);

  if (famName) return famName[1];
  else return displayName;
};

// export { collectionContains, isNameValid };
export default { isNameValid, parseFamilyName };
