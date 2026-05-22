/**
 * Groq API Proxy — Vercel Serverless Function
 * 
 * Solves corporate network issues where:
 * - Firewalls block direct calls to api.groq.com
 * - DNS filtering prevents resolution of AI API domains
 * - Corporate proxies interfere with CORS/WebSocket headers
 * 
 * By proxying through your own Vercel domain, the browser only talks to
 * your server, bypassing all corporate network restrictions on third-party APIs.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default async function handler(req, res) {
  // CORS headers - allow any origin since this is a public API proxy
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    res.status(500).json({
      error: 'VITE_GROQ_API_KEY not configured on the server. Add it in your Vercel environment variables.',
    });
    return;
  }

  try {
    const { model, messages, temperature, max_tokens } = req.body;

    if (!model || !messages) {
      res.status(400).json({ error: 'Missing required fields: model, messages' });
      return;
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 0.5,
        max_tokens: max_tokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({
        error: `Groq API error (${response.status}): ${errText}`,
      });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({
      error: `Proxy error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }
}
