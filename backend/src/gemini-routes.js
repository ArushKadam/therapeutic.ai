const express = require('express');

const router = express.Router();
const requestCounts = new Map();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.post('/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: 'AI service is not configured on the server.' });
  }
  if (!token) return res.status(401).json({ error: 'Sign in to use AI features.' });

  try {
    const supabaseBaseUrl = supabaseUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
    let authResponse;
    try {
      authResponse = await fetch(`${supabaseBaseUrl}/auth/v1/user`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` },
      });
    } catch (authError) {
      console.error('Supabase auth verification failed:', authError.message);
      return res.status(502).json({
        error: 'The backend could not reach Supabase. Copy the working VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values from the root .env into backend/.env without the VITE_ prefix.',
      });
    }
    if (!authResponse.ok) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    const user = await authResponse.json();

    const now = Date.now();
    const recent = (requestCounts.get(user.id) || []).filter((timestamp) => now - timestamp < 60_000);
    if (recent.length >= 30) return res.status(429).json({ error: 'Too many AI requests. Please wait a minute and try again.' });
    recent.push(now);
    requestCounts.set(user.id, recent);

    const { prompt, systemInstruction, contents } = req.body || {};
    const requestContents = Array.isArray(contents)
      ? contents
      : typeof prompt === 'string' ? [{ role: 'user', parts: [{ text: prompt }] }] : null;
    if (!requestContents || requestContents.length === 0 || requestContents.length > 40) {
      return res.status(400).json({ error: 'Invalid Gemini request.' });
    }
    const totalTextLength = requestContents.reduce((total, item) => total + (item?.parts || []).reduce((sum, part) => sum + (typeof part?.text === 'string' ? part.text.length : 0), 0), 0);
    if (totalTextLength > 30_000 || (systemInstruction && (typeof systemInstruction !== 'string' || systemInstruction.length > 12_000))) {
      return res.status(413).json({ error: 'Gemini request is too large.' });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const geminiBody = JSON.stringify({
      contents: requestContents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
    });
    let geminiResponse;
    let result;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: geminiBody,
      });
      result = await geminiResponse.json().catch(() => ({}));
      if (geminiResponse.ok || ![429, 500, 503].includes(geminiResponse.status) || attempt === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    if (!geminiResponse.ok) {
      const upstreamMessage = typeof result?.error?.message === 'string'
        ? result.error.message.replaceAll(apiKey, '[redacted]').slice(0, 300)
        : '';
      console.error('Gemini request failed', { status: geminiResponse.status, message: upstreamMessage });
      if (geminiResponse.status === 429) {
        return res.status(502).json({ error: 'Gemini is temporarily rate-limited. Wait about a minute, then try again.' });
      }
      if (geminiResponse.status === 403) {
        return res.status(502).json({ error: 'The Gemini API key does not have permission for this model or request. Check the key restrictions in Google AI Studio.' });
      }
      return res.status(502).json({
        error: upstreamMessage
          ? `Gemini rejected the request (${geminiResponse.status}): ${upstreamMessage}`
          : `Gemini rejected the request with status ${geminiResponse.status}.`,
      });
    }
    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!text) return res.status(502).json({ error: 'The AI service returned an empty response.' });
    return res.json({ text });
  } catch (error) {
    console.error('Gemini proxy error:', error.message);
    return res.status(502).json({ error: 'The AI service could not complete the request.' });
  }
});

module.exports = router;
