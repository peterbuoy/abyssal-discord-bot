import { GoogleSpreadsheet } from "google-spreadsheet";

const getSheetByTitle = async (sheetName: string) => {
  // The problem with that this makes the assumption that there will only be one spreadsheet
  // Soln: Just add the spreadsheet id as an argument if necessary.
  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
    if (
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL === undefined ||
      process.env.GOOGLE_PRIVATE_KEY === undefined
    ) {
      throw new Error(
        `Missing Google Service Account Email or Private Key. Failed obtain sheet by name.`
      );
    }
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
    await doc.loadInfo();
    return doc.sheetsByTitle[sheetName];
  } catch (error) {
    console.error(error);
  }
};

export { getSheetByTitle };
