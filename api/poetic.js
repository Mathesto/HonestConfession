export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  // This reads your key securely from the server environment
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing on the server.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI assistant for a anonymous confession website called HonestConfession. Take this user's raw message and rewrite it to be beautifully poetic, emotional, and clear. Keep the core meaning identical. Return ONLY the rewritten text, with no extra conversational remarks: "${text}"`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({ error: 'Gemini API Error' });
    }

    const poeticText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.status(200).json({ poeticText: poeticText.trim() });

  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}