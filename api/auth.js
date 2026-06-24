import sql from './db.js';

export default async function handler(req, res) {
  const { method } = req;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') return res.status(200).end();

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    // 1. SIGN UP ROUTE
    if (action === 'signup') {
      const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Account already exists with this email' });
      }

      // Check if this specific email should default to Admin status
      const isAdmin = email.toLowerCase() === 'savalepg62@gmail.com';

      const newUser = await sql`
        INSERT INTO users (email, password, is_admin)
        VALUES (${email}, ${password}, ${isAdmin})
        RETURNING id, email, is_admin as "isAdmin"
      `;

      return res.status(201).json({
        message: 'Account created successfully! You can now log in.',
        user: newUser[0]
      });
    }

    // 2. LOGIN ROUTE
    if (action === 'login') {
      const users = await sql`
        SELECT id, email, password, is_admin as "isAdmin" 
        FROM users 
        WHERE email = ${email}
      `;

      if (users.length === 0 || users[0].password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      return res.status(200).json({
        message: 'Login successful!',
        user: {
          id: users[0].id,
          email: users[0].email,
          isAdmin: users[0].isAdmin
        }
      });
    }

  } catch (error) {
    console.error("Auth System Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
