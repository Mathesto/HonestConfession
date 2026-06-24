export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on Vercel.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Rewrite the following confession text to make it deeply emotional, poetic, and beautiful while maintaining its core meaning and initials. Keep it relatively concise so it fits perfectly on a card: "${text}"`
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API error details:", data);
      throw new Error(data.error?.message || 'Failed to generate poetic text');
    }

    const poeticText = data.candidates?.[0]?.content?.parts?.[0]?.text || text;

    return res.status(200).json({ poeticText: poeticText.trim() });

  } catch (error) {
    console.error("Backend AI Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
