import { queryDatabase } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    if (action === 'signup') {
      // 1. Check if user already exists
      // Real implementation will query your users table:
      // const existing = await queryDatabase('SELECT * FROM users WHERE email = ?', [email]);
      
      return res.status(200).json({ success: true, message: 'Account created successfully!' });
    } 
    
    if (action === 'login') {
      // 2. Authenticate user
      const lowerEmail = email.toLowerCase().trim();
      
      // Determine if the user logging in is you (the Admin)
      const isAdmin = lowerEmail === 'savalepg62@gmail.com';

      return res.status(200).json({ 
        success: true, 
        message: 'Welcome back!',
        user: { email: lowerEmail, isAdmin: isAdmin }
      });
    }

    return res.status(400).json({ error: 'Invalid action specified.' });

  } catch (error) {
    console.error('Auth server error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}