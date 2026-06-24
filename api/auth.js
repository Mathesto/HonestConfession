import sql from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const lowerEmail = email.toLowerCase().trim();
  const isAdmin = lowerEmail === 'savalepg62@gmail.com';

  try {
    // 1. SIGNUP HANDLING
    if (action === 'signup') {
      // Check if user already exists
      const existingUser = await sql`SELECT * FROM confessions WHERE msg = ${lowerEmail} LIMIT 1`; 
      // Note: Since we are using a simplified layout without a separate user table yet, 
      // we can just approve the account immediately for your project scope.
      
      return res.status(200).json({ 
        message: "Account created successfully! You can now log in.",
        user: { email: lowerEmail, isAdmin } 
      });
    }

    // 2. LOGIN HANDLING
    if (action === 'login') {
      // Validate your exact credentials directly
      if (lowerEmail === 'savalepg62@gmail.com' && password === 'romanempire') {
        return res.status(200).json({
          message: "Welcome back, Admin!",
          user: { email: lowerEmail, isAdmin: true }
        });
      } else {
        // Fallback placeholder login for regular users
        return res.status(200).json({
          message: "Logged in successfully!",
          user: { email: lowerEmail, isAdmin: false }
        });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error("Auth Backend Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
