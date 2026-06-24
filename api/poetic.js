export default async function handler(req, res) {
  const { method } = req;

  // Handle CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') return res.status(200).end();

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided to enhance.' });
  }

  try {
    // Updated to look for your new variable name: GEMINI_API_KEY2
    const apiKey = process.env.GEMINI_API_KEY2;
    
    if (!apiKey) {
      return res.status(200).json({ 
        poeticText: `${text}\n\n(Backend configuration error: GEMINI_API_KEY2 could not be read by Vercel.)` 
      });
    }

    // Call the Gemini API directly via fetch
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a cinematic storyteller. Rewrite the following confession to make it deeply emotional, poetic, and beautifully written. Keep it concise, heartbreakingly honest, and maintain the original core meaning. Do not include any introductory remarks, explanations, or quotes—only output the rewritten text itself:\n\n"${text}"`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const poeticText = data.candidates?.[0]?.content?.parts?.[0]?.text || text;

    return res.status(200).json({ poeticText: poeticText.trim() });

  } catch (error) {
    console.error("Poetic AI Route Error:", error);
    return res.status(500).json({ error: 'Internal Server Error processing text.' });
  }
}
