import { queryDatabase } from './db.js';

export default async function handler(req, res) {
  // Case 1: Someone opens the website and wants to READ all confessions
  if (req.method === 'GET') {
    try {
      const confessions = await queryDatabase('SELECT * FROM confessions ORDER BY id DESC');
      return res.status(200).json(confessions);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch confessions' });
    }
  }

  // Case 2: Someone clicks "Post Anonymously" and wants to SAVE a confession
  if (req.method === 'POST') {
    const { to, msg, color } = req.body;

    if (!to || !msg) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      await queryDatabase(
        'INSERT INTO confessions ("to", msg, color) VALUES ($1, $2, $3)',
        [to, msg, color || '#bfdbfe']
      );
      return res.status(200).json({ success: true, message: 'Confession posted!' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save confession' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}