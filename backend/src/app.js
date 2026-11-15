const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { randomUUID } = require('node:crypto');
const { AccessToken, LiveKitAPI } = require('livekit-server-sdk');
const geminiRouter = require('./gemini-routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:8080' }));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/gemini', geminiRouter);

const LIVEKIT_AGENT_NAME = process.env.LIVEKIT_AGENT_NAME || 'therabot-voice-agent';
const LIVEKIT_VOICES = new Set([
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede',
  'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
  'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
  'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi',
  'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
]);

app.post('/api/livekit/session', async (req, res) => {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  const accessToken = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const voice = typeof req.body?.voice === 'string' ? req.body.voice : 'Kore';

  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({ error: 'LiveKit voice sessions are not configured on the server.' });
  }
  if (!accessToken) return res.status(401).json({ error: 'Sign in to start a voice session.' });
  if (!LIVEKIT_VOICES.has(voice)) return res.status(400).json({ error: 'Choose a supported voice.' });

  try {
    const authResponse = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
    if (!authResponse.ok) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    const user = await authResponse.json();

    const roomName = `therabot-${randomUUID()}`;
    const apiHost = LIVEKIT_URL.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:');
    const livekit = new LiveKitAPI({ host: apiHost, apiKey: LIVEKIT_API_KEY, secret: LIVEKIT_API_SECRET });

    await livekit.agentDispatch.createDispatch(roomName, LIVEKIT_AGENT_NAME, {
      metadata: JSON.stringify({ voice }),
    });

    const participantToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `user-${user.id}-${randomUUID()}`,
      name: 'TheraBot user',
      ttl: 900,
    });
    participantToken.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return res.status(201).json({
      server_url: LIVEKIT_URL,
      participant_token: await participantToken.toJwt(),
      room_name: roomName,
    });
  } catch (error) {
    console.error('LiveKit session setup failed:', error.message);
    return res.status(503).json({ error: 'Could not start the LiveKit voice agent. Make sure its worker is running.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app;
