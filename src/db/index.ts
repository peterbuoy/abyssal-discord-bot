import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.SUPABASE_CONN_STR;
const pool = new Pool({
  connectionString,
});

export { pool };
