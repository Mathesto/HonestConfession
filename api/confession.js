import sql from './db.js';

export default async function handler(req, res) {
  const { method } = req;

  // Add standard CORS headers so your frontend browser doesn't block the request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. GET ALL CONFESSIONS
    if (method === 'GET') {
      const posts = await sql`SELECT id, "to", msg, color, created_at FROM confessions ORDER BY id DESC`;
      return res.status(200).json(posts);
    }

    // 2. CREATE A NEW CONFESSION
    if (method === 'POST') {
      const { to, msg, color } = req.body;

      if (!to || !msg) {
        return res.status(400).json({ error: 'Missing recipient or message' });
      }

      const cardColor = color || '#bfdbfe';

      // Cleaned up query format for Vercel's parsing engine
      const newPost = await sql`
        INSERT INTO confessions (${sql('to')}, ${sql('msg')}, ${sql('color')})
        VALUES (${to}, ${msg}, ${cardColor})
        RETURNING *
      `;

      return res.status(201).json(newPost[0]);
    }

    // 3. DELETE A CONFESSION (ADMIN ONLY)
    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing confession ID' });

      await sql`DELETE FROM confessions WHERE id = ${id}`;
      return res.status(200).json({ message: 'Confession removed successfully' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error("Database Handler Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
