
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wind,
  Play,
  Pause,
  Square,
  Check,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

const BREATHING_PATTERNS = {
  simple: {
    name: "Simple Breathing",
    inhale: 6,
    hold1: 0,
    exhale: 6,
    hold2: 0,
  },
  box: {
    name: "Box Breathing",
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  },
  "4-7-8": {
    name: "4-7-8 Technique",
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
  },
  calm: {
    name: "Calming Breath",
    inhale: 5,
    hold1: 2,
    exhale: 7,
    hold2: 1,
  },
};

const SESSION_DURATIONS = [
  { value: 30, label: "30 seconds" },
  { value: 60, label: "60 seconds" },
  { value: 90, label: "90 seconds" },
  { value: 120, label: "120 seconds" },
];

type PatternKey = keyof typeof BREATHING_PATTERNS;
type Phase = "inhale" | "hold1" | "exhale" | "hold2";

const PHASES: Phase[] = [
  "inhale",
  "hold1",
  "exhale",
  "hold2",
];

const COLORS = {
  background: "#F5F0E9",
  surface: "#F0E9E0",
  ivory: "#FAF7F2",
  taupe: "#E9DFD4",
  border: "#DCD1C6",
  espresso: "#302A26",
  muted: "#87776C",
  accent: "#937E6B",
  sage: "#819179",
};

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;

  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

export function BreathingExercise() {
  const [selectedPattern, setSelectedPattern] =
    useState<PatternKey>("simple");

  const [sessionDuration, setSessionDuration] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);

  const lastTickRef = useRef<number | null>(null);

  const pattern = BREATHING_PATTERNS[selectedPattern];

  const phases = PHASES.filter(
    (phase) => pattern[phase] > 0
  );

  const cycleDuration = phases.reduce(
    (total, phase) => total + pattern[phase],
    0
  );

  const completedCycles = Math.floor(elapsed / cycleDuration);
  const cyclePosition = elapsed % cycleDuration;

  let phase: Phase = phases[0];
  let phaseElapsed = 0;
  let phaseStart = 0;

  for (const current of phases) {
    const duration = pattern[current];

    if (cyclePosition < phaseStart + duration) {
      phase = current;
      phaseElapsed = cyclePosition - phaseStart;
      break;
    }

    phaseStart += duration;
  }

  const phaseDuration = pattern[phase];
  const phaseProgress = Math.min(
    1,
    phaseElapsed / phaseDuration
  );

  const remainingTime = Math.max(
    0,
    sessionDuration - elapsed
  );

  const sessionProgress = Math.min(
    100,
    (elapsed / sessionDuration) * 100
  );

  const phaseLabel =
    phase === "inhale"
      ? "Breathe in."
      : phase === "exhale"
      ? "Breathe out."
      : "Hold gently.";

  const phaseDescription =
    phase === "inhale"
      ? "Slowly fill your lungs."
      : phase === "exhale"
      ? "Release the air naturally."
      : "Stay comfortable and relaxed.";

  const breathingScale =
    phase === "inhale"
      ? 0.72 + phaseProgress * 0.28
      : phase === "exhale"
      ? 1 - phaseProgress * 0.28
      : phase === "hold1"
      ? 1
      : 0.72;

  useEffect(() => {
    if (!isActive || isPaused) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = performance.now();

    const interval = window.setInterval(() => {
      const now = performance.now();
      const last = lastTickRef.current ?? now;
      const delta = Math.max(0, (now - last) / 1000);

      lastTickRef.current = now;

      setElapsed((previous) =>
        Math.min(sessionDuration, previous + delta)
      );
    }, 50);

    return () => {
      window.clearInterval(interval);
      lastTickRef.current = null;
    };
  }, [isActive, isPaused, sessionDuration]);

  useEffect(() => {
    if (isActive && elapsed >= sessionDuration) {
      setTotalCycles(Math.floor(sessionDuration / cycleDuration));
      setIsActive(false);
      setIsPaused(false);
      setIsComplete(true);
    }
  }, [elapsed, isActive, sessionDuration, cycleDuration]);

  const startSession = () => {
    setElapsed(0);
    setTotalCycles(0);
    setIsComplete(false);
    setIsPaused(false);
    setIsActive(true);
  };

  const stopSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setIsComplete(false);
    setElapsed(0);
    setTotalCycles(0);
  };

  const togglePause = () => {
    setIsPaused((previous) => !previous);
  };

  const buttonBase =
    "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200";

  return (
    <div
      className="min-h-full w-full bg-[#F5F0E9] text-[#302A26]"
      style={{
        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12 lg:py-11">

        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="border-b border-[#DCD1C6] pb-8"
        >
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#937E6B]">
            WELLNESS / BREATHING
          </div>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.055em] sm:text-4xl lg:text-[46px]">
                Find your calm.
              </h1>

              <p className="mt-2 text-sm text-[#7F7268]">
                A moment to slow down, breathe, and reconnect.
              </p>
            </div>

            <Wind
              size={26}
              strokeWidth={1.4}
              className="text-[#937E6B]"
            />
          </div>
        </motion.header>

        {/* SESSION SETTINGS */}
        <section className="border-b border-[#DCD1C6] py-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                Your breathing session
              </h2>

              <p className="mt-2 text-xs text-[#87776C]">
                Set a comfortable rhythm and duration.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="min-w-[170px]">
                <label
                  htmlFor="breathing-pattern"
                  className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#937E6B]"
                >
                  Technique
                </label>

                <div className="relative">
                  <select
                    id="breathing-pattern"
                    value={selectedPattern}
                    disabled={isActive || isPaused}
                    onChange={(event) =>
                      setSelectedPattern(
                        event.target.value as PatternKey
                      )
                    }
                    className="w-full appearance-none rounded-lg border border-[#D8C9B9] bg-[#FAF7F2] px-4 py-3 pr-10 text-sm font-medium text-[#302A26] outline-none transition focus:border-[#937E6B] disabled:opacity-60"
                  >
                    {Object.entries(BREATHING_PATTERNS).map(
                      ([key, value]) => (
                        <option key={key} value={key}>
                          {value.name}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#937E6B]"
                  />
                </div>
              </div>

              <div className="min-w-[150px]">
                <label
                  htmlFor="breathing-duration"
                  className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#937E6B]"
                >
                  Duration
                </label>

                <div className="relative">
                  <select
                    id="breathing-duration"
                    value={sessionDuration}
                    disabled={isActive || isPaused}
                    onChange={(event) =>
                      setSessionDuration(
                        Number(event.target.value)
                      )
                    }
                    className="w-full appearance-none rounded-lg border border-[#D8C9B9] bg-[#FAF7F2] px-4 py-3 pr-10 text-sm font-medium text-[#302A26] outline-none transition focus:border-[#937E6B] disabled:opacity-60"
                  >
                    {SESSION_DURATIONS.map((duration) => (
                      <option
                        key={duration.value}
                        value={duration.value}
                      >
                        {duration.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#937E6B]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#D8C9B9] px-3 py-1 text-[11px] text-[#796353]">
              {pattern.inhale}s inhale
            </span>

            {pattern.hold1 > 0 && (
              <span className="rounded-full border border-[#D8C9B9] px-3 py-1 text-[11px] text-[#796353]">
                {pattern.hold1}s hold
              </span>
            )}

            <span className="rounded-full border border-[#D8C9B9] px-3 py-1 text-[11px] text-[#796353]">
              {pattern.exhale}s exhale
            </span>

            {pattern.hold2 > 0 && (
              <span className="rounded-full border border-[#D8C9B9] px-3 py-1 text-[11px] text-[#796353]">
                {pattern.hold2}s hold
              </span>
            )}
          </div>
        </section>

        {/* MAIN BREATHING AREA */}
        <section className="py-10">
          <div className="relative flex min-h-[480px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#DED3C7] bg-[#F0E9E0] px-5 py-12 text-center sm:min-h-[540px]">

            <div className="absolute left-6 top-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#937E6B]">
              TETHR / RESET
            </div>

            <div className="absolute right-6 top-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#937E6B]">
              {isActive
                ? isPaused
                  ? "PAUSED"
                  : "IN SESSION"
                : "YOUR MOMENT"}
            </div>

            {/* BREATHING VISUAL */}
            <div className="relative mb-9 flex h-[230px] w-[230px] items-center justify-center sm:h-[270px] sm:w-[270px]">

              <div className="absolute inset-0 rounded-full border border-[#D6C7B8]" />

              <div className="absolute inset-[18px] rounded-full border border-[#D6C7B8]/70" />

              <motion.div
                className="relative flex h-[190px] w-[190px] items-center justify-center rounded-full sm:h-[225px] sm:w-[225px]"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, #DCCABC 0%, #C3AD99 65%, #AE9784 100%)",
                  boxShadow:
                    "0 18px 45px rgba(92,69,51,0.13), inset 0 1px 8px rgba(255,255,255,0.28)",
                }}
                animate={{
                  scale: isActive ? breathingScale : 0.82,
                }}
                transition={{
                  duration: 0.12,
                  ease: "linear",
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#5B4B40]">
                    {isActive
                      ? "BREATHE"
                      : "TETHR"}
                  </span>

                  <span className="mt-2 text-3xl font-black tracking-tight text-[#302A26] sm:text-4xl">
                    {isActive
                      ? Math.ceil(
                          Math.max(
                            0,
                            phaseDuration - phaseElapsed
                          )
                        )
                      : "•"}
                  </span>

                  {isActive && (
                    <span className="mt-1 text-[10px] uppercase tracking-widest text-[#5B4B40]">
                      seconds
                    </span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* INSTRUCTIONS */}
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  isActive
                    ? `${phase}-${isPaused}`
                    : "ready"
                }
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mb-7"
              >
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {!isActive
                    ? "Ready to breathe?"
                    : isPaused
                    ? "Take your time."
                    : phaseLabel}
                </h2>

                <p className="mt-3 text-sm text-[#87776C]">
                  {!isActive
                    ? "Get comfortable and prepare for a guided breathing session."
                    : isPaused
                    ? "Your session is paused."
                    : phaseDescription}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* SESSION PROGRESS */}
            {isActive && (
              <div className="mb-7 w-full max-w-md">
                <div className="mb-3 flex items-center justify-between text-xs text-[#796D61]">
                  <span>
                    Cycle {completedCycles + 1}
                  </span>

                  <span>
                    {formatTime(remainingTime)} remaining
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-[#D8C9B9]">
                  <div
                    className="h-full rounded-full bg-[#819179] transition-[width] duration-100"
                    style={{
                      width: `${sessionProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* CONTROLS */}
            {!isActive ? (
              <button
                onClick={startSession}
                className={`${buttonBase} min-w-[230px] bg-[#302A26] text-[#F5F0E9] hover:bg-[#4A3D34]`}
              >
                <Play size={17} fill="currentColor" />
                Start Breathing
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={togglePause}
                  className={`${buttonBase} min-w-[135px] bg-[#302A26] text-[#F5F0E9] hover:bg-[#4A3D34]`}
                >
                  {isPaused ? (
                    <Play size={16} />
                  ) : (
                    <Pause size={16} />
                  )}

                  {isPaused ? "Resume" : "Pause"}
                </button>

                <button
                  onClick={stopSession}
                  className={`${buttonBase} min-w-[135px] border border-[#CDBDAD] bg-[#FAF7F2] text-[#302A26] hover:bg-[#E9DFD4]`}
                >
                  <Square size={14} />
                  End Session
                </button>
              </div>
            )}

            <p className="mt-6 text-xs text-[#937E6B]">
              {isActive
                ? "Follow the rhythm of the circle."
                : "A little pause can go a long way."}
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCD1C6] py-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#937E6B]">
            A SPACE TO RECONNECT.
          </span>

          <span className="text-xs text-[#87776C]">
            One breath at a time.
          </span>
        </div>
      </div>

      {/* COMPLETION MODAL */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#302A26]/50 p-5"
          >
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="breathing-complete-title"
              className="w-full max-w-md rounded-2xl border border-[#DCD1C6] bg-[#F5F0E9] p-8 text-center shadow-xl"
            >
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#E0E8DD]">
                <Check
                  size={25}
                  className="text-[#5F795C]"
                />
              </div>

              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#937E6B]">
                SESSION COMPLETE
              </p>

              <h2
                id="breathing-complete-title"
                className="text-3xl font-black tracking-tight text-[#302A26]"
              >
                A moment well spent.
              </h2>

              <p className="mt-4 text-sm leading-7 text-[#87776C]">
                You completed {totalCycles} full breathing{" "}
                {totalCycles === 1 ? "cycle" : "cycles"} in{" "}
                {formatTime(sessionDuration)}.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={startSession}
                  className={`${buttonBase} flex-1 bg-[#302A26] text-[#F5F0E9] hover:bg-[#4A3D34]`}
                >
                  <RotateCcw size={16} />
                  Start Another
                </button>

                <button
                  onClick={stopSession}
                  className={`${buttonBase} flex-1 border border-[#D8C9B9] bg-[#FAF7F2] text-[#302A26] hover:bg-[#E9DFD4]`}
                >
                  Finish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
