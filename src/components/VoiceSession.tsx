
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useVoiceSession from '../hooks/use-voice-session';
import {
  Mic,
  MicOff,
  BrainCircuit,
  Bot,
  User,
  CircleStop,
  AlertCircle,
  Sparkles,
  AudioLines,
  ChevronDown
} from 'lucide-react';
import { moodOrchestrator } from '@/services/mood-orchestrator';
import { ttsService } from '@/services/textToSpeech';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from './ui/select';

function isElevenLabsProvider(
  provider: any
): provider is { fetchVoices: () => Promise<any[]> } {
  return (
    provider != null &&
    typeof provider.fetchVoices === 'function'
  );
}

const VoiceSession = () => {
  const {
    sessionState,
    transcript,
    conversationHistory,
    error,
    toggleListening,
    endSession,
    setTTSVoice
  } = useVoiceSession();

  const [sessionStartTime, setSessionStartTime] =
    useState<number | null>(null);

  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState('EXAVITQu4vr4xnSDxMaL');

  useEffect(() => {
    const provider = (ttsService as any).provider;
    let mounted = true;

    if (isElevenLabsProvider(provider)) {
      provider.fetchVoices()
        .then((availableVoices: any[]) => {
          if (!mounted) return;
          setVoices(availableVoices);

          if (availableVoices.length > 0) {
            setSelectedVoice(
              availableVoices[0].voice_id
            );
          }
        })
        .catch((err: any) => {
          console.error(
            'Failed to fetch ElevenLabs voices:',
            err
          );
        });
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof setTTSVoice === 'function') {
      setTTSVoice(selectedVoice);
    }
  }, [selectedVoice, setTTSVoice]);

  const latestAiResponse = conversationHistory
    .filter(turn => turn.speaker === 'ai')
    .pop()?.text;

  const exchangeCount = Math.floor(
    conversationHistory.length / 2
  );

  const isListening = sessionState === 'listening';
  const isProcessing = sessionState === 'processing';
  const isSpeaking = sessionState === 'speaking';
  const hasError = sessionState === 'error';

  const statusConfig = {
    listening: {
      text: 'Listening',
      color: '#8A6954',
      background: '#E9DDD0'
    },
    processing: {
      text: 'Thinking',
      color: '#8A6954',
      background: '#E9DDD0'
    },
    speaking: {
      text: 'Speaking',
      color: '#60745B',
      background: '#E3E9DF'
    },
    error: {
      text: 'Connection issue',
      color: '#A4554C',
      background: '#F4E2DF'
    },
    idle: {
      text: 'Ready',
      color: '#60745B',
      background: '#E3E9DF'
    }
  };

  const status =
    statusConfig[
      sessionState as keyof typeof statusConfig
    ] || statusConfig.idle;

  const getButtonText = () => {
    switch (sessionState) {
      case 'listening':
        return 'Stop Listening';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      case 'error':
        return 'Try Again';
      default:
        return 'Start Listening';
    }
  };

  const handleToggleListening = () => {
    if (
      sessionState === 'idle' ||
      sessionState === 'error'
    ) {
      setSessionStartTime(Date.now());
    }

    toggleListening();
  };

  const handleEndSession = async () => {
    endSession();

    if (
      sessionStartTime &&
      conversationHistory.length > 0
    ) {
      const durationMinutes = Math.max(
        1,
        Math.round(
          (Date.now() - sessionStartTime) / 60000
        )
      );

      const userContent = conversationHistory
        .filter(turn => turn.speaker === 'user')
        .map(turn => turn.text)
        .join(' ');

      try {
        await moodOrchestrator.handleRealtimeMoodUpdate(
          'voice',
          'voice-session',
          userContent,
          undefined,
          durationMinutes
        );
      } catch (err) {
        console.error(
          'Voice session mood analysis failed:',
          err
        );
      }
    }

    setSessionStartTime(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-full w-full bg-[#F5F0E9] text-[#302A26]"
      style={{
        fontFamily:
          'Inter, ui-sans-serif, system-ui, sans-serif'
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12 lg:py-11">

        {/* PAGE HEADER */}
        <header className="border-b border-[#DCD1C6] pb-8">

          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#937E6B]">
            TETHR / VOICE SESSION
          </div>

          <div className="flex flex-wrap items-start justify-between gap-5">

            <div>
              <h1 className="text-3xl font-black tracking-[-0.055em] sm:text-4xl lg:text-[46px]">
                Voice Session.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#7F7268]">
                A space to speak freely. Share what's on
                your mind and take a moment for yourself.
              </p>
            </div>

            <div
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
              style={{
                color: status.color,
                backgroundColor: status.background
              }}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isListening ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: status.color
                }}
              />

              {status.text}
            </div>

          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#E4BDB5] bg-[#F4E2DF] p-4 text-sm text-[#9A4F46]">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </header>

        {/* SESSION OVERVIEW */}
        <section className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCD1C6] py-6">

          <div className="flex items-center gap-3">
            <AudioLines
              size={20}
              strokeWidth={1.7}
              className="text-[#937E6B]"
            />

            <div>
              <h2 className="text-sm font-bold">
                Your Conversation
              </h2>

              <p className="mt-1 text-xs text-[#87776C]">
                A private moment to reflect and reconnect.
              </p>
            </div>
          </div>

          {conversationHistory.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-[#E9DFD4] px-4 py-2 text-xs font-semibold text-[#796353]">
              <Sparkles size={13} />
              {exchangeCount} exchanges
            </div>
          )}

        </section>

        {/* CONVERSATION PANELS */}
        <section className="grid gap-5 py-8 lg:grid-cols-2">

          {/* AI RESPONSE */}
          <div className="flex min-h-[350px] flex-col rounded-2xl border border-[#D9CEC2] bg-[#EDE4DA] p-6 sm:p-8">

            <div className="flex items-center gap-3 border-b border-[#D5C8BB] pb-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DED0C1]">
                <Bot
                  size={20}
                  strokeWidth={1.7}
                  className="text-[#665448]"
                />
              </div>

              <div>
                <h3 className="text-base font-extrabold tracking-tight">
                  TETHR
                </h3>

                <p className="mt-0.5 text-xs text-[#87776C]">
                  AI Companion
                </p>
              </div>

              <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A8777]">
                RESPONSE
              </span>

            </div>

            <div className="flex flex-1 items-center justify-center py-10">

              {latestAiResponse ? (
                <motion.p
                  key={latestAiResponse}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full whitespace-pre-wrap text-base leading-8 text-[#443A33]"
                >
                  {latestAiResponse}
                </motion.p>
              ) : (
                <div className="max-w-sm text-center">

                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#D3C4B5]">
                    <AudioLines
                      size={24}
                      strokeWidth={1.3}
                      className="text-[#927E6C]"
                    />
                  </div>

                  <h4 className="text-lg font-bold tracking-tight">
                    Here to listen.
                  </h4>

                  <p className="mt-3 text-sm leading-6 text-[#87776C]">
                    Begin speaking whenever you're ready.
                    TETHR's responses will appear here
                    as your conversation unfolds.
                  </p>

                </div>
              )}

            </div>

            <div className="border-t border-[#D5C8BB] pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#9A8777]">
                AI-GENERATED RESPONSE
              </p>
            </div>

          </div>

          {/* USER TRANSCRIPT */}
          <div className="flex min-h-[350px] flex-col rounded-2xl border border-[#DED3C7] bg-[#F8F4EF] p-6 sm:p-8">

            <div className="flex items-center gap-3 border-b border-[#E4DBD1] pb-5">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEE5DC]">
                <User
                  size={20}
                  strokeWidth={1.7}
                  className="text-[#806B5A]"
                />
              </div>

              <div>
                <h3 className="text-base font-extrabold tracking-tight">
                  Your Voice
                </h3>

                <p className="mt-0.5 text-xs text-[#87776C]">
                  Live transcription
                </p>
              </div>

              <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A8777]">
                TRANSCRIPT
              </span>

            </div>

            <div className="flex flex-1 items-center justify-center py-10">

              {transcript ? (
                <motion.p
                  key={transcript}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full whitespace-pre-wrap text-base leading-8 text-[#443A33]"
                >
                  {transcript}
                </motion.p>
              ) : (
                <div className="max-w-sm text-center">

                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#DED3C7]">
                    <Mic
                      size={23}
                      strokeWidth={1.3}
                      className="text-[#927E6C]"
                    />
                  </div>

                  <h4 className="text-lg font-bold tracking-tight">
                    Your words matter.
                  </h4>

                  <p className="mt-3 text-sm leading-6 text-[#87776C]">
                    Your spoken words will appear here
                    while you talk. Take your time.
                  </p>

                </div>
              )}

            </div>

            <div className="border-t border-[#E4DBD1] pt-4">

              <div className="flex items-center gap-2">

                <span
                  className={`h-2 w-2 rounded-full ${
                    isListening ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: isListening
                      ? '#71846B'
                      : '#B9ADA1'
                  }}
                />

                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#9A8777]">
                  {isListening
                    ? 'MICROPHONE ACTIVE'
                    : 'MICROPHONE INACTIVE'}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* SESSION CONTROLS */}
        <section className="rounded-2xl border border-[#DED3C7] bg-[#F0E8DF] px-5 py-8 sm:px-8">

          <div className="flex flex-col items-center">

            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#937E6B]">
              SESSION CONTROLS
            </div>

            <h3 className="mb-7 text-xl font-extrabold tracking-tight">
              {isListening
                ? "We're listening."
                : isProcessing
                ? 'Taking a moment to respond.'
                : isSpeaking
                ? 'TETHR is speaking.'
                : 'Ready when you are.'}
            </h3>

            {/* MICROPHONE BUTTON */}
            <div className="flex w-full flex-wrap items-center justify-center gap-3">

              <button
                type="button"
                onClick={handleToggleListening}
                disabled={isProcessing || isSpeaking}
                className={`
                  flex min-h-[52px] w-full items-center justify-center gap-3
                  rounded-xl px-8 py-3 text-sm font-bold
                  transition-all duration-200
                  sm:w-auto
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  ${
                    isListening
                      ? 'bg-[#A66D5B] text-white hover:bg-[#925B4A]'
                      : 'bg-[#493D35] text-white hover:bg-[#302A26]'
                  }
                `}
              >
                {isListening ? (
                  <MicOff size={19} />
                ) : (
                  <Mic size={19} />
                )}

                {getButtonText()}
              </button>

              {/* END SESSION */}
              {conversationHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleEndSession}
                  className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-[#CDBEAF] bg-transparent px-7 py-3 text-sm font-bold text-[#665448] transition-colors hover:bg-[#E5D9CD] sm:w-auto"
                >
                  <CircleStop size={19} />
                  End Session
                </button>
              )}

            </div>

            <p className="mt-5 max-w-md text-center text-xs leading-6 text-[#87776C]">
              {isListening
                ? 'Speak naturally. Press Stop Listening when you finish.'
                : 'Press Start Listening to begin. Press again when you finish speaking to receive a response.'}
            </p>

          </div>

          {/* VOICE SELECTION */}
          {voices.length > 0 && (
            <div className="mx-auto mt-8 max-w-sm border-t border-[#D8CBBE] pt-6">

              <label className="mb-3 block text-center text-[10px] font-bold uppercase tracking-[0.17em] text-[#937E6B]">
                AI VOICE PREFERENCE
              </label>

              <Select
                value={selectedVoice}
                onValueChange={setSelectedVoice}
              >
                <SelectTrigger className="h-12 w-full rounded-xl border-[#D4C5B6] bg-[#F8F4EF] text-[#493D35] focus:ring-[#937E6B]">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>

                <SelectContent className="border-[#D4C5B6] bg-[#F8F4EF]">
                  {voices.map((voice: any) => (
                    <SelectItem
                      key={voice.voice_id}
                      value={voice.voice_id}
                    >
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
          )}

        </section>

        {/* FOOTER */}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCD1C6] pt-6">

          <span className="text-[10px] font-black tracking-[0.25em] text-[#493D35]">
            TETHR
          </span>

          <p className="text-xs text-[#9A8777]">
            A space to reconnect.
          </p>

        </footer>

      </div>
    </motion.div>
  );
};

export default VoiceSession;
