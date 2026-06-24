import sql from './db.js';

export default async function handler(req, res) {
  const { method } = req;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. GET ALL CONFESSIONS (Sorted by pinned first, then newest)
    if (method === 'GET') {
      const posts = await sql`
        SELECT id, "to", msg, color, is_pinned, created_at 
        FROM confessions 
        ORDER BY is_pinned DESC, id DESC
      `;
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
        INSERT INTO confessions ("to", msg, color, is_pinned)
        VALUES (${to}, ${msg}, ${cardColor}, false)
        RETURNING id, "to", msg, color, is_pinned, created_at
      `;

      return res.status(201).json(newPost[0]);
    }

    // 3. TOGGLE PIN STATUS (ADMIN ONLY)
    if (method === 'PUT') {
      const { id, is_pinned } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing confession ID' });

      const updatedPost = await sql`
        UPDATE confessions 
        SET is_pinned = ${is_pinned} 
        WHERE id = ${id}
        RETURNING *
      `;
      return res.status(200).json(updatedPost[0]);
    }

    // 4. DELETE A CONFESSION
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
