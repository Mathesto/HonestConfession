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
    // We use the Gemini API key stored securely in your Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // Fallback message so your UI doesn't crash if the key isn't added yet
      return res.status(200).json({ 
        poeticText: `${text}\n\n(A silent echo follows... Please configure your GEMINI_API_KEY in Vercel to activate the magic!)` 
      });
    }

    // Call the Gemini API directly via fetch to keep things serverless-lightweight
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
