import dotenv from 'dotenv';
import { cli, defineAgent, inference, ServerOptions, voice } from '@livekit/agents';
import { fileURLToPath } from 'node:url';

dotenv.config();

const VOICES = new Set([
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede',
  'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
  'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
  'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi',
  'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
]);

const instructions = `You are Tethr (pronounced "Tether," like tetherball), a supportive AI wellness companion. Refer to yourself as Tethr when introducing yourself or when the user asks your name. Listen carefully and respond in a calm, warm, concise way. Reply in the language the user is speaking unless they ask for another language. Ask one thoughtful question at a time and encourage practical coping steps. You are not a therapist or a substitute for professional care: do not diagnose, prescribe, or claim confidentiality. If someone may be in immediate danger, encourage them to call local emergency services; in the United States or Canada, they can call or text 988.`;

export default defineAgent({
  entry: async (ctx) => {
    let metadata = {};
    try {
      metadata = JSON.parse(ctx.job.metadata || '{}');
    } catch {
      // Use the default voice if dispatch metadata is invalid.
    }
    const selectedVoice = VOICES.has(metadata.voice) ? metadata.voice : 'Kore';

    const session = new voice.AgentSession({
      llm: new inference.RealtimeModel({
        model: process.env.LIVEKIT_REALTIME_MODEL || 'google/gemini-3.8-live',
        voice: selectedVoice,
        apiKey: process.env.LIVEKIT_API_KEY,
        apiSecret: process.env.LIVEKIT_API_SECRET,
        instructions,
      }),
    });

    await session.start({
      agent: voice.Agent.create({ instructions }),
      room: ctx.room,
    });
    await ctx.connect();
    await session.generateReply({
      instructions: 'Greet the user gently, introduce yourself as Tethr (pronounced Tether), and invite them to share what is on their mind.',
    });
  },
});

cli.runApp(new ServerOptions({
  agent: fileURLToPath(import.meta.url),
  agentName: process.env.LIVEKIT_AGENT_NAME || 'therabot-voice-agent',
}));
