import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

// Disable SSL checking for Neon if needed, or enforce it securely
const sql = postgres(connectionString, { ssl: 'require' });

export default sql;
