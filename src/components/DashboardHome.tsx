
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Brain,
  CalendarDays,
  Heart,
  Sparkles,
} from 'lucide-react';
import { moodOrchestrator } from '@/services/mood-orchestrator';
import { processMoodData } from '@/lib/mood-processing';
import { format } from 'date-fns';

const ink = '#302a26';
const muted = '#87776c';
const sage = '#788b73';

// Custom taupe mood faces
function MoodFace({
  mood,
  size = 42,
}: {
  mood?: string | null;
  size?: number;
}) {
  const name = (mood || '').toLowerCase();

  const happy = /happy|joy|positive|excited|calm|content|grateful/.test(name);
  const sad = /sad|down|depress|hurt|hopeless|distress|anxious|fear|worr/.test(name);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={`${mood || 'Neutral'} mood`}
    >
      <circle
        cx="24"
        cy="24"
        r="21"
        fill="#D4BDA5"
        stroke="#B89F87"
        strokeWidth="1"
      />
      <circle cx="17" cy="19" r="2" fill={ink} />
      <circle cx="31" cy="19" r="2" fill={ink} />
      <path
        d={
          happy
            ? 'M15 28 Q24 37 33 28'
            : sad
            ? 'M15 34 Q24 25 33 34'
            : 'M16 30 Q24 29 32 30'
        }
        fill="none"
        stroke={ink}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Minimal action button
const Action = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-full border border-[#d9cfc5] px-4 py-2 text-xs font-semibold text-[#453c36] transition-colors hover:bg-[#e8ded3]"
  >
    {children}
    <ArrowUpRight size={13} />
  </button>
);

const DashboardHome = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [weeklyMoodData, setWeeklyMoodData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [todaysMood, setTodaysMood] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const fetchMoodData = async () => {
      try {
        setLoading(true);
        setError(null);

        const analytics = await moodOrchestrator.getMoodAnalytics(30);
        const processed = processMoodData(analytics.summaries);

        if (!active) return;

        setStats(processed.stats || []);
        setWeeklyMoodData(processed.weeklyData || []);
        setInsights(processed.insights || []);
        setTodaysMood(analytics.todaysSummary);
      } catch (err) {
        console.error('Error fetching mood analytics:', err);

        if (active) {
          setError('Unable to load mood data. Please try again.');
          setStats([]);
          setWeeklyMoodData([]);
          setInsights([]);
          setTodaysMood(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMoodData();

    return () => {
      active = false;
    };
  }, []);

  // Prepare recorded mood data
  const days = useMemo(
    () =>
      weeklyMoodData.map((day: any, index: number) => {
        const recorded = Number(day.analysisCount || 0) > 0;

        const intensity =
          recorded && Number.isFinite(Number(day.intensity))
            ? Math.max(0, Math.min(10, Number(day.intensity)))
            : null;

        return {
          ...day,
          id: `${day.day}-${index}`,
          recorded,
          intensity,
        };
      }),
    [weeklyMoodData]
  );

  // Graph coordinates
  const points = days.map((day, i) => ({
    x: days.length === 1 ? 50 : 6 + (i * 88) / (days.length - 1),
    y: day.intensity === null ? null : 94 - day.intensity * 8.4,
  }));

  const segments: string[] = [];
  let current: string[] = [];

  points.forEach((p) => {
    if (p.y === null) {
      if (current.length) segments.push(current.join(' '));
      current = [];
    } else {
      current.push(`${current.length ? 'L' : 'M'} ${p.x} ${p.y}`);
    }
  });

  if (current.length) segments.push(current.join(' '));

  const hasToday =
    !!todaysMood && Number(todaysMood.analysis_count) > 0;

  const statFallbacks = [
    { label: 'Days Tracked', value: '0', icon: CalendarDays },
    { label: 'Positive Days', value: '0%', icon: Heart },
    { label: 'Mood Trend', value: 'N/A', icon: Activity },
  ];

  const displayStats = statFallbacks.map((fallback) => ({
    ...fallback,
    ...(stats.find((s: any) => s.label === fallback.label) || {}),
    icon: fallback.icon,
  }));

  return (
    <div
      className="min-h-full w-full bg-[#f5f0e9] text-[#302a26]"
      style={{
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12 lg:py-11">

        {/* HEADER */}
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[#dcd1c6] pb-8">
          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#937e6b]">
              Dashboard / Your overview
            </div>

            <h1 className="text-3xl font-black tracking-[-0.055em] sm:text-4xl lg:text-[46px]">
              Welcome back.
            </h1>

            <p className="mt-2 text-sm text-[#7f7268]">
              Take a moment to check in with yourself. How are you feeling today?
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#75675c]">
            {format(new Date(), 'EEE, MMM d')}
            <CalendarDays size={17} strokeWidth={1.7} />
          </div>
        </header>

        {loading ? (
          <div className="py-24 text-center text-sm text-[#87776c]">
            Loading your mood analytics…
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-sm text-[#9b4943]">{error}</p>
            <Action onClick={() => window.location.reload()}>
              Try again
            </Action>
          </div>
        ) : (
          <>
            {/* TODAY'S MOOD + STATS */}
            <section className="grid gap-10 border-b border-[#dcd1c6] py-9 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
              <div>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-3 text-lg font-extrabold tracking-tight">
                    <Brain size={20} color={muted} />
                    Today's Mood Analysis
                  </h2>

                  {hasToday && (
                    <span className="rounded-full bg-[#e9dfd4] px-3 py-1 text-[10px] font-semibold text-[#796353]">
                      ✧ AI Analyzed
                    </span>
                  )}
                </div>

                {hasToday ? (
                  <>
                    <div className="flex flex-wrap items-center gap-4">
                      <MoodFace
                        mood={todaysMood.primary_mood}
                        size={56}
                      />

                      <div className="border-l border-[#d5c8bb] pl-4">
                        <div className="text-xl font-extrabold capitalize">
                          {todaysMood.primary_mood || 'Unknown'}
                        </div>

                        <div className="mt-0.5 text-sm text-[#7e7166]">
                          Intensity: {todaysMood.average_intensity}/10
                        </div>

                        <div className="mt-1 text-xs font-semibold text-[#5f795c]">
                          {Math.round(
                            Number(todaysMood.overall_confidence || 0) * 100
                          )}% confidence
                        </div>
                      </div>

                      <div className="ml-auto text-right text-xs leading-5 text-[#87776c]">
                        <div>{todaysMood.analysis_count} analyses</div>

                        {todaysMood.last_updated && (
                          <div>
                            Updated{' '}
                            {new Date(
                              todaysMood.last_updated
                            ).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {!!todaysMood.key_emotions?.length && (
                      <div className="mt-6 border-t border-[#e1d8ce] pt-4">
                        <div className="mb-2 text-xs text-[#87776c]">
                          Key emotions detected
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {todaysMood.key_emotions
                            .slice(0, 6)
                            .map((emotion: string, i: number) => (
                              <span
                                key={`${emotion}-${i}`}
                                className="rounded-full border border-[#d8c9b9] px-3 py-1 text-[11px] capitalize"
                              >
                                {emotion}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {todaysMood.reasoning && (
                      <div className="mt-5 rounded-xl bg-[#ebe3d9] px-4 py-3">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8c7765]">
                          AI Analysis
                        </div>

                        <p className="text-xs leading-relaxed text-[#584b42]">
                          {todaysMood.reasoning}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-2">
                    <div className="text-xl font-bold">
                      No mood data for today
                    </div>

                    <p className="mt-2 max-w-md text-sm leading-6 text-[#87776c]">
                      Your mood will be analyzed automatically as you use the app.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Action onClick={() => navigate('/journal')}>
                        Journal Entry
                      </Action>
                      <Action onClick={() => navigate('/voice')}>
                        Voice Session
                      </Action>
                      <Action onClick={() => navigate('/chat')}>
                        AI Chat
                      </Action>
                    </div>
                  </div>
                )}
              </div>

              {/* STATISTICS */}
              <div className="grid grid-cols-3 items-center gap-2 border-t border-[#dcd1c6] pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                {displayStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="text-center">
                    <Icon
                      className="mx-auto mb-4 h-6 w-6 text-[#937e6b]"
                      strokeWidth={1.6}
                    />

                    <div className="text-2xl font-black tracking-tight sm:text-3xl">
                      {value}
                    </div>

                    <div className="mt-1 text-[11px] leading-4 text-[#87776c]">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* MOOD JOURNEY */}
            <section className="border-b border-[#dcd1c6] py-9">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-3 text-lg font-extrabold tracking-tight">
                    <BarChart3 size={20} color={muted} />
                    Recent Mood Journey
                  </h2>

                  <p className="mt-1 pl-8 text-xs text-[#87776c]">
                    Your mood over the past 7 days.
                  </p>
                </div>

                <span className="rounded-full bg-[#e9dfd4] px-3 py-1 text-[10px] font-semibold text-[#796353]">
                  AI Powered
                </span>
              </div>

              {days.some(
                (d) => d.recorded && d.intensity !== null
              ) ? (
                <div className="w-full overflow-hidden rounded-xl bg-[#f0e9e0] px-3 py-5 sm:px-6">
                  <svg
                    viewBox="0 0 100 116"
                    preserveAspectRatio="none"
                    className="h-[190px] w-full"
                    role="img"
                    aria-label="Mood intensity chart, with gaps for days without recordings"
                  >
                    {[10, 30, 50, 70, 90].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        x2="100"
                        y1={y}
                        y2={y}
                        stroke="#ded4c8"
                        strokeWidth="0.4"
                      />
                    ))}

                    {segments.map((segment, i) => (
                      <path
                        key={i}
                        d={segment}
                        stroke={sage}
                        strokeWidth="1.2"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}

                    {points.map(
                      (p, i) =>
                        p.y !== null && (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="1.1"
                            fill={sage}
                          />
                        )
                    )}
                  </svg>

                  <div className="flex justify-between gap-1 text-center text-[11px] text-[#796d61]">
                    {days.map((d) => (
                      <span key={d.id} className="flex-1">
                        {d.day}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-[#f0e9e0] px-5 py-9 text-center">
                  <p className="font-semibold">No mood data yet</p>

                  <p className="mt-1 text-sm text-[#87776c]">
                    Start using the app to see your AI-analyzed mood journey.
                  </p>

                  <div className="mt-5 flex justify-center gap-2">
                    <Action onClick={() => navigate('/journal')}>
                      Start Journal
                    </Action>
                    <Action onClick={() => navigate('/chat')}>
                      AI Chat
                    </Action>
                  </div>
                </div>
              )}
            </section>

            {/* RECENT MOOD ENTRIES */}
            <section className="border-b border-[#dcd1c6] py-9">
              <h2 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-tight">
                <CalendarDays size={20} color={muted} />
                Recent Mood Entries
              </h2>

              {days.length ? (
                <div className="space-y-1">
                  {days.map((day) => (
                    <div
                      key={day.id}
                      className="grid grid-cols-[42px_34px_minmax(80px,125px)_1fr_52px] items-center gap-3 border-b border-[#e4dbd1] py-3 last:border-0 sm:gap-5"
                    >
                      <span className="text-xs font-semibold text-[#786a60]">
                        {day.day}
                      </span>

                      {day.recorded ? (
                        <MoodFace mood={day.mood} size={30} />
                      ) : (
                        <span className="text-center text-[#b5a99c]">
                          —
                        </span>
                      )}

                      <span className="text-xs font-semibold capitalize">
                        {day.recorded
                          ? day.mood || 'Recorded'
                          : 'Not recorded'}
                      </span>

                      <div className="h-2 overflow-hidden rounded-full bg-[#ded5cb]">
                        {day.intensity !== null && (
                          <div
                            className="h-full rounded-full bg-[#819179]"
                            style={{
                              width: `${day.intensity * 10}%`,
                            }}
                          />
                        )}
                      </div>

                      <span className="text-right text-xs text-[#786a60]">
                        {day.intensity !== null
                          ? `${day.intensity}/10`
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#87776c]">
                  No mood entries recorded yet.
                </p>
              )}
            </section>

            {/* AI INSIGHTS */}
            <section className="py-9">
              <h2 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-tight">
                <Sparkles size={20} color={muted} />
                AI-Powered Insights
              </h2>

              {insights.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {insights.map((insight: any, i: number) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-xl border border-[#ded3c7] bg-[#f1eae1] p-5"
                    >
                      <Brain
                        size={17}
                        className="mt-0.5 shrink-0 text-[#937e6b]"
                      />

                      <p className="text-sm leading-6 text-[#51473f]">
                        {typeof insight === 'string'
                          ? insight
                          : String(insight)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold">
                    AI insights will appear here
                  </p>

                  <p className="mt-2 text-sm text-[#87776c]">
                    The more you interact with the app, the more personalized insights our AI will generate.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Action onClick={() => navigate('/journal')}>
                      Write in Journal
                    </Action>
                    <Action onClick={() => navigate('/chat')}>
                      Chat with AI
                    </Action>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
