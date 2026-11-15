import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Room as LiveKitRoom } from 'livekit-client';
import {
  AlertCircle,
  Bot,
  CircleStop,
  Mic,
  MicOff,
  Sparkles,
  User,
} from 'lucide-react';
import { moodOrchestrator } from '@/services/mood-orchestrator';
import { supabase } from '@/services/supabase';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const VOICES = [
  ['Zephyr', 'Bright'], ['Puck', 'Upbeat'], ['Charon', 'Informative'],
  ['Kore', 'Firm'], ['Fenrir', 'Excitable'], ['Leda', 'Youthful'],
  ['Orus', 'Firm'], ['Aoede', 'Breezy'], ['Callirrhoe', 'Easy-going'],
  ['Autonoe', 'Bright'], ['Enceladus', 'Breathy'], ['Iapetus', 'Clear'],
  ['Umbriel', 'Easy-going'], ['Algieba', 'Smooth'], ['Despina', 'Smooth'],
  ['Erinome', 'Clear'], ['Algenib', 'Gravelly'], ['Rasalgethi', 'Informative'],
  ['Laomedeia', 'Upbeat'], ['Achernar', 'Soft'], ['Alnilam', 'Firm'],
  ['Schedar', 'Even'], ['Gacrux', 'Mature'], ['Pulcherrima', 'Forward'],
  ['Achird', 'Friendly'], ['Zubenelgenubi', 'Casual'], ['Vindemiatrix', 'Gentle'],
  ['Sadachbia', 'Lively'], ['Sadaltager', 'Knowledgeable'], ['Sulafat', 'Warm'],
] as const;

type SessionState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';
type ConversationTurn = { speaker: 'user' | 'ai'; text: string };

const VoiceSession = () => {
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [error, setError] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('therabot-livekit-voice') || 'Kore');
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const roomRef = useRef<LiveKitRoom | null>(null);
  const microphoneEnabledRef = useRef(false);
  const audioContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('therabot-livekit-voice', selectedVoice);
  }, [selectedVoice]);

  const startSession = useCallback(async () => {
    setSessionState('connecting');
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in before starting a voice session.');

      const response = await fetch('/api/livekit/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ voice: selectedVoice }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not start the voice session.');

      const { Room, RoomEvent, Track } = await import('livekit-client');
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio && audioContainerRef.current) {
          const audioElement = track.attach();
          audioElement.autoplay = true;
          audioElement.setAttribute('playsinline', 'true');
          audioContainerRef.current.appendChild(audioElement);
        }
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove());
      });
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        const speaker = participant?.identity === room.localParticipant.identity ? 'user' : 'ai';
        for (const segment of segments) {
          if (!segment.text) continue;
          if (speaker === 'user') setTranscript(segment.text);
          if (segment.final) {
            setConversationHistory((history) => {
              const lastTurn = history[history.length - 1];
              if (lastTurn?.speaker === speaker && lastTurn.text === segment.text) return history;
              return [...history, { speaker, text: segment.text }];
            });
          }
        }
      });
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const agentSpeaking = speakers.some((participant) => participant.identity !== room.localParticipant.identity);
        setSessionState(agentSpeaking ? 'speaking' : microphoneEnabledRef.current ? 'listening' : 'idle');
      });
      room.on(RoomEvent.Disconnected, () => {
        setSessionState('idle');
        setMicrophoneEnabled(false);
      });

      await room.connect(result.server_url, result.participant_token);
      await room.localParticipant.setMicrophoneEnabled(true);
      microphoneEnabledRef.current = true;
      setMicrophoneEnabled(true);
      setSessionStartTime(Date.now());
      setSessionState('listening');
    } catch (sessionError) {
      const message = sessionError instanceof Error ? sessionError.message : 'Could not start the LiveKit voice session.';
      setError(message);
      setSessionState('error');
      roomRef.current?.disconnect();
      roomRef.current = null;
    }
  }, [selectedVoice]);

  const toggleMicrophone = async () => {
    const room = roomRef.current;
    if (!room) {
      await startSession();
      return;
    }

    try {
      const enabled = !microphoneEnabled;
      await room.localParticipant.setMicrophoneEnabled(enabled);
      microphoneEnabledRef.current = enabled;
      setMicrophoneEnabled(enabled);
      setSessionState(enabled ? 'listening' : 'idle');
    } catch {
      setError('Could not change microphone state. Check your browser microphone permissions.');
      setSessionState('error');
    }
  };

  const endSession = async () => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) await room.disconnect();

    const userContent = conversationHistory
      .filter((turn) => turn.speaker === 'user')
      .map((turn) => turn.text)
      .join(' ');
    if (sessionStartTime && userContent) {
      const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime) / 60_000));
      try {
        await moodOrchestrator.handleRealtimeMoodUpdate('voice', 'voice-session', userContent, undefined, durationMinutes);
      } catch (moodError) {
        console.error('Voice session mood analysis failed:', moodError);
      }
    }

    setSessionStartTime(null);
    setConversationHistory([]);
    setTranscript('');
    microphoneEnabledRef.current = false;
    setMicrophoneEnabled(false);
    setSessionState('idle');
    setError('');
  };

  useEffect(() => () => {
    roomRef.current?.disconnect();
  }, []);

  const latestAiResponse = [...conversationHistory].reverse().find((turn) => turn.speaker === 'ai')?.text;
  const getStatus = () => {
    if (sessionState === 'connecting') return <Badge variant="secondary">Connecting to LiveKit…</Badge>;
    if (sessionState === 'listening') return <Badge variant="destructive" className="animate-pulse"><Mic className="mr-2 h-4 w-4" />Listening</Badge>;
    if (sessionState === 'speaking') return <Badge><Bot className="mr-2 h-4 w-4" />Speaking</Badge>;
    if (sessionState === 'error') return <Badge variant="destructive"><AlertCircle className="mr-2 h-4 w-4" />Error</Badge>;
    return <Badge variant="outline">Ready</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col space-y-6 pt-6"
    >
      <Card className="bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <Mic className="h-6 w-6 text-primary" />Voice Therapy Session
          </CardTitle>
          <CardDescription>Talk naturally with your AI wellness companion over a secure LiveKit audio session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatus()}
              {conversationHistory.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="mr-1 h-3 w-3" />{Math.floor(conversationHistory.length / 2)} exchanges
                </Badge>
              )}
            </div>
          </div>
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
        <Card className="flex flex-col transition-shadow hover:shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Bot className="h-5 w-5 text-primary" />AI Companion</CardTitle></CardHeader>
          <CardContent className="flex-1">
            <div className="flex h-full min-h-[120px] items-center justify-center">
              {latestAiResponse ? <p className="text-lg leading-relaxed">{latestAiResponse}</p> : <p className="text-center text-muted-foreground">Your companion’s response will appear here when the session begins.</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col bg-muted/50">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-muted-foreground" />Your Voice</CardTitle></CardHeader>
          <CardContent className="flex-1">
            <div className="flex h-full min-h-[80px] items-center justify-center">
              {transcript ? <p className="text-center text-lg italic">“{transcript}”</p> : <p className="text-center text-muted-foreground">Your speech transcript will appear here.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={audioContainerRef} className="sr-only" aria-hidden="true" />
      <Card className="bg-gradient-to-br from-secondary/20 to-transparent">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <Button onClick={toggleMicrophone} disabled={sessionState === 'connecting'} className="w-full sm:w-auto" size="lg">
              {microphoneEnabled && roomRef.current ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              <span className="ml-2">
                {sessionState === 'connecting' ? 'Connecting…' : roomRef.current ? microphoneEnabled ? 'Mute Microphone' : 'Unmute Microphone' : 'Start Voice Session'}
              </span>
            </Button>
            {roomRef.current && (
              <Button onClick={endSession} variant="destructive" className="w-full sm:w-auto" size="lg">
                <CircleStop className="h-6 w-6" /><span className="ml-2">End Session</span>
              </Button>
            )}
          </div>
          <div className="w-full max-w-sm space-y-2">
            <label htmlFor="voice-choice" className="block text-center text-sm font-medium">AI voice</label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={Boolean(roomRef.current)}>
              <SelectTrigger id="voice-choice"><SelectValue placeholder="Choose a voice" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {VOICES.map(([name, style]) => <SelectItem key={name} value={name}>{name} · {style}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-center text-xs text-muted-foreground">
              Spoken language: detected automatically. Gemini Live voices are multilingual, and the companion replies in your language.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground">Your microphone stays on for natural, hands-free conversation until you mute or end the session.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VoiceSession;
