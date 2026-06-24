import sql from './db.js';

export default async function handler(req, res) {
  const { method } = req;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. GET ALL POSTS
    if (method === 'GET') {
      const posts = await sql`
        SELECT id, "to", msg, color, is_pinned, user_id, from_user, created_at 
        FROM confessions 
        ORDER BY is_pinned DESC, id DESC
      `;
      return res.status(200).json(posts);
    }

    // 2. CREATE POST
    if (method === 'POST') {
      const { to, msg, color, userId, fromUser } = req.body;

      if (!to || !msg) {
        return res.status(400).json({ error: 'Missing recipient or message' });
      }

      const cardColor = color || '#bfdbfe';
      const authorId = userId || null;
      const displayAuthor = fromUser || null; // Will stay null if completely anonymous

      const newPost = await sql`
        INSERT INTO confessions ("to", msg, color, is_pinned, user_id, from_user)
        VALUES (${to}, ${msg}, ${cardColor}, false, ${authorId}, ${displayAuthor})
        RETURNING id, "to", msg, color, is_pinned, user_id, from_user, created_at
      `;

      return res.status(201).json(newPost[0]);
    }

    // 3. PIN POST
    if (method === 'PUT') {
      const { id, is_pinned } = req.body;
      const updatedPost = await sql`
        UPDATE confessions SET is_pinned = ${is_pinned} WHERE id = ${id} RETURNING *
      `;
      return res.status(200).json(updatedPost[0]);
    }

    // 4. DELETE POST (Enforces owner or admin validation check)
    if (method === 'DELETE') {
      const { id, currentUserId, isAdmin } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing confession ID' });

      // Fetch post details first to verify authority ownership
      const post = await sql`SELECT user_id FROM confessions WHERE id = ${id}`;
      if (post.length === 0) return res.status(404).json({ error: 'Confession not found' });

      const isOwner = currentUserId && post[0].user_id == currentUserId;
      const explicitAdmin = isAdmin === 'true';

      if (explicitAdmin || isOwner) {
        await sql`DELETE FROM confessions WHERE id = ${id}`;
        return res.status(200).json({ message: 'Confession removed successfully' });
      }

      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error("Database Handler Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
