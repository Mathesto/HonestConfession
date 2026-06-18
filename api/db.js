import { createPool } from "@vercel/postgres";

// This function creates a pool connection to your Vercel database automatically
export async function queryDatabase(sql, params = []) {
  const pool = createPool();

  try {
    const { rows } = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error("Database query failed:", error);
    throw error;
  }
}
