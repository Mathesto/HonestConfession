import sql from './db.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    // 1. GET ALL CONFESSIONS
    if (method === 'GET') {
      const posts = await sql`SELECT * FROM confessions ORDER BY id DESC`;
      return res.status(200).json(posts);
    }

    // 2. CREATE A NEW CONFESSION
    if (method === 'POST') {
      const { to, msg, color } = req.body;

      if (!to || !msg) {
        return res.status(400).json({ error: 'Missing recipient or message' });
      }

      const cardColor = color || '#bfdbfe';

      const newPost = await sql`
        INSERT INTO confessions ("to", msg, color)
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
