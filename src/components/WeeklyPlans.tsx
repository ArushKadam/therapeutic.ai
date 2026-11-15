
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  Plus,
  Brain,
  Sparkles,
  Clock,
  Star,
  BarChart3,
  Heart,
  BookOpen,
  Zap,
  Users,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import {
  moodAnalysisService,
  planService,
  type WeeklyPlan as DBWeeklyPlan,
} from "@/services/supabase";

import {
  planGenerator,
  type MoodPattern,
} from "@/services/planGenerator";

type WeeklyPlan = DBWeeklyPlan;

interface MoodInsight {
  primaryMood: string;
  frequency: number;
  intensity: number;
  keyEmotions: string[];
}

const getStartOfWeek = (date: Date): Date => {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
  start.setHours(0, 0, 0, 0);
  return start;
};

const localDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isCurrentWeek = (weekOf: string): boolean => {
  return localDateKey(getStartOfWeek(new Date())) ===
    weekOf.slice(0, 10);
};

const calculateProgress = (plan: WeeklyPlan): number => {
  const exercises = plan.exercises || [];
  if (!exercises.length) return 0;

  return (
    (exercises.filter((exercise) => exercise.completed).length /
      exercises.length) *
    100
  );
};

const getExerciseIcon = (type: string) => {
  const icons = {
    breathing: Clock,
    journaling: BookOpen,
    mindfulness: Heart,
    behavioral: Users,
    cognitive: Brain,
    physical: Zap,
  };

  return icons[type as keyof typeof icons] || Circle;
};

const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "bg-[#E2E9DF] text-[#5F795C]";
    case "medium":
      return "bg-[#EDE2D3] text-[#927454]";
    case "hard":
      return "bg-[#F0DDDA] text-[#A15E55]";
    default:
      return "bg-[#E9DFD4] text-[#796353]";
  }
};

const WeeklyPlans: React.FC = () => {
  const [currentPlan, setCurrentPlan] =
    useState<WeeklyPlan | null>(null);

  const [pastPlans, setPastPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [moodInsights, setMoodInsights] = useState<MoodInsight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingExercise, setUpdatingExercise] =
    useState<string | null>(null);

  const analyzeMoodData = useCallback(async () => {
    try {
      const recentAnalyses = await moodAnalysisService.list(50);

      if (recentAnalyses.length < 3) {
        setMoodInsights([]);
        return;
      }

      const groups: Record<string, typeof recentAnalyses> = {};

      recentAnalyses.forEach((analysis) => {
        const mood = analysis.primary_mood || "unknown";
        if (!groups[mood]) groups[mood] = [];
        groups[mood].push(analysis);
      });

      const insights: MoodInsight[] = Object.entries(groups).map(
        ([mood, analyses]) => ({
          primaryMood: mood,
          frequency: analyses.length,
          intensity:
            analyses.reduce(
              (sum, analysis) => sum + Number(analysis.intensity || 0),
              0
            ) / analyses.length,
          keyEmotions: [
            ...new Set(
              analyses.flatMap(
                (analysis) => analysis.key_emotions || []
              )
            ),
          ].slice(0, 5),
        })
      );

      insights.sort((a, b) => b.frequency - a.frequency);
      setMoodInsights(insights);
    } catch (err) {
      console.error("Mood analysis failed:", err);
      setError("Could not analyze your recent mood patterns.");
    }
  }, []);

  const loadPlansAndInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const plans = await planService.list();

      setCurrentPlan(
        plans.find(
          (plan) =>
            !plan.completed && isCurrentWeek(plan.week_of)
        ) || null
      );

      setPastPlans(
        plans.filter(
          (plan) =>
            plan.completed || !isCurrentWeek(plan.week_of)
        )
      );

      await analyzeMoodData();
    } catch (err) {
      console.error("Failed to load plans:", err);
      setError("Failed to load weekly plans.");
    } finally {
      setLoading(false);
    }
  }, [analyzeMoodData]);

  useEffect(() => {
    loadPlansAndInsights();
  }, [loadPlansAndInsights]);

  const generateNewPlan = async () => {
    if (moodInsights.length === 0) {
      setError(
        "Not enough mood data yet. Use the journal, voice, or chat features to build your mood profile."
      );
      return;
    }

    if (currentPlan) {
      setError(
        "You already have an active plan for this week. Complete it before generating another."
      );
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const topMood = moodInsights[0];
      const recentAnalyses = await moodAnalysisService.list(10);

      const recentEntries = recentAnalyses
        .filter(
          (analysis) =>
            analysis.raw_content &&
            analysis.raw_content.length > 20
        )
        .slice(0, 3)
        .map((analysis) =>
          analysis.raw_content.substring(0, 100)
        );

      const moodPattern: MoodPattern = {
        primaryMood: topMood.primaryMood,
        frequency: topMood.frequency,
        intensity: topMood.intensity,
        keyEmotions: topMood.keyEmotions,
        recentEntries,
      };

      const generatedPlan =
        await planGenerator.generateWeeklyPlan(moodPattern);

      const weekOf = localDateKey(getStartOfWeek(new Date()));

      const planData = {
        title: generatedPlan.title,
        description: generatedPlan.description,
        target_area: generatedPlan.targetArea,
        confidence: generatedPlan.confidence,
        week_of: weekOf,
        insights: generatedPlan.insights,
      };

      const exercisesData = generatedPlan.exercises.map(
        (exercise, index) => ({
          title: exercise.title,
          description: exercise.description,
          type: exercise.type,
          duration: exercise.duration,
          difficulty: exercise.difficulty,
          due_date: new Date(
            Date.now() + (index + 1) * 86400000
          ).toISOString(),
          instructions: exercise.instructions,
          benefits: exercise.benefits,
        })
      );

      const newPlan = await planService.create(
        planData as any,
        exercisesData as any
      );

      setCurrentPlan(newPlan);
    } catch (err) {
      console.error("Plan generation failed:", err);
      setError(
        "Failed to generate your weekly plan. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const toggleExerciseCompletion = async (exerciseId: string) => {
    if (!currentPlan || updatingExercise) return;

    const exercise = currentPlan.exercises?.find(
      (item) => item.id === exerciseId
    );

    if (!exercise) return;

    setUpdatingExercise(exerciseId);
    setError(null);

    try {
      const updatedExercise =
        await planService.updateExerciseCompletion(
          exerciseId,
          !exercise.completed
        );

      const updatedExercises = (currentPlan.exercises || []).map(
        (item) =>
          item.id === exerciseId ? updatedExercise : item
      );

      const updatedPlan = {
        ...currentPlan,
        exercises: updatedExercises,
      };

      const allCompleted =
        updatedExercises.length > 0 &&
        updatedExercises.every((item) => item.completed);

      if (allCompleted) {
        const finishedPlan =
          await planService.updatePlanCompletion(
            currentPlan.id,
            true
          );

        setPastPlans((previous) => [
          { ...updatedPlan, ...finishedPlan },
          ...previous,
        ]);

        setCurrentPlan(null);
      } else {
        setCurrentPlan(updatedPlan);
      }
    } catch (err) {
      console.error("Exercise update failed:", err);
      setError("Could not update your progress. Try again.");
      await loadPlansAndInsights();
    } finally {
      setUpdatingExercise(null);
    }
  };

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-[#302A26] px-6 py-3 text-sm font-semibold text-[#F5F0E9] transition-colors hover:bg-[#4A3D34] disabled:cursor-not-allowed disabled:opacity-50";

  const subtleBadge =
    "inline-flex items-center gap-1.5 rounded-full bg-[#E9DFD4] px-3 py-1.5 text-[11px] font-semibold text-[#796353]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-full w-full bg-[#F5F0E9] text-[#302A26]"
      style={{
        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12 lg:py-11">

        {/* PAGE HEADER */}
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[#DCD1C6] pb-8">
          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#937E6B]">
              WELLNESS / YOUR WEEK
            </div>

            <h1 className="text-3xl font-black tracking-[-0.055em] sm:text-4xl lg:text-[46px]">
              Your weekly plan.
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#7F7268]">
              Small, intentional steps toward feeling better.
              Built around your recent emotional patterns.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#75675C]">
            <CalendarDays size={17} strokeWidth={1.7} />
            <span>
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#D9B9B1] bg-[#F1E3DF] p-4 text-sm text-[#9B4943]">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-4">
            <Brain
              size={28}
              className="animate-pulse text-[#937E6B]"
            />
            <p className="text-sm text-[#87776C]">
              Loading your wellness plans...
            </p>
          </div>
        ) : currentPlan ? (
          <>
            {/* ACTIVE PLAN */}
            <section className="border-b border-[#DCD1C6] py-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#937E6B]">
                    <Target size={15} />
                    CURRENT PLAN
                  </div>

                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                    {currentPlan.title}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#87776C]">
                    {currentPlan.description}
                  </p>
                </div>

                <span className={subtleBadge}>
                  <Sparkles size={12} />
                  AI Generated
                </span>
              </div>

              {/* PROGRESS */}
              <div className="mt-8 rounded-xl bg-[#F0E9E0] p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#796353]">
                      Your progress
                    </p>
                    <p className="mt-1 text-3xl font-black tracking-tight">
                      {Math.round(calculateProgress(currentPlan))}%
                    </p>
                  </div>

                  <span className={subtleBadge}>
                    <TrendingUp size={13} />
                    {currentPlan.target_area}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#DED5CB]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${calculateProgress(currentPlan)}%`,
                    }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full bg-[#819179]"
                  />
                </div>

                <p className="mt-3 text-xs text-[#87776C]">
                  {(currentPlan.exercises || []).filter(
                    (exercise) => exercise.completed
                  ).length}{" "}
                  of {(currentPlan.exercises || []).length} exercises
                  completed
                </p>
              </div>
            </section>

            {/* KEY INSIGHTS */}
            <section className="border-b border-[#DCD1C6] py-9">
              <h2 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-tight">
                <Brain size={20} color="#937E6B" />
                Key Insights
              </h2>

              {currentPlan.insights?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {currentPlan.insights.map(
                    (insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-xl border border-[#DED3C7] bg-[#F1EAE1] p-5"
                      >
                        <Star
                          size={17}
                          className="mt-0.5 shrink-0 text-[#937E6B]"
                        />
                        <p className="text-sm leading-6 text-[#51473F]">
                          {insight}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#87776C]">
                  No additional insights available.
                </p>
              )}
            </section>

            {/* EXERCISES */}
            <section className="py-9">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-lg font-extrabold tracking-tight">
                  <CheckCircle2 size={20} color="#937E6B" />
                  This Week's Exercises
                </h2>

                <span className="text-xs text-[#87776C]">
                  Move at your own pace
                </span>
              </div>

              <div className="space-y-3">
                {(currentPlan.exercises || []).map(
                  (exercise, index) => {
                    const Icon = getExerciseIcon(exercise.type);

                    return (
                      <div
                        key={exercise.id}
                        className={`rounded-xl border border-[#DED3C7] p-5 transition-colors sm:p-6 ${
                          exercise.completed
                            ? "bg-[#EAE9E1]"
                            : "bg-[#F1EAE1]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            type="button"
                            disabled={!!updatingExercise}
                            onClick={() =>
                              toggleExerciseCompletion(exercise.id)
                            }
                            aria-label={
                              exercise.completed
                                ? `Mark ${exercise.title} incomplete`
                                : `Mark ${exercise.title} complete`
                            }
                            className="mt-1 shrink-0 text-[#819179] transition-transform hover:scale-110 disabled:opacity-50"
                          >
                            {exercise.completed ? (
                              <CheckCircle2 size={23} />
                            ) : (
                              <Circle
                                size={23}
                                className="text-[#A8998B]"
                              />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Icon
                                size={16}
                                className="text-[#937E6B]"
                              />

                              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#937E6B]">
                                Exercise {index + 1}
                              </span>
                            </div>

                            <h3
                              className={`text-base font-extrabold ${
                                exercise.completed
                                  ? "text-[#87776C] line-through"
                                  : "text-[#302A26]"
                              }`}
                            >
                              {exercise.title}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#87776C]">
                              {exercise.description}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-[10px] font-semibold capitalize ${getDifficultyStyle(
                                  exercise.difficulty
                                )}`}
                              >
                                {exercise.difficulty}
                              </span>

                              <span className={subtleBadge}>
                                <Clock size={12} />
                                {exercise.duration} min
                              </span>

                              {exercise.completed && (
                                <span className="rounded-full bg-[#E2E9DF] px-3 py-1 text-[10px] font-semibold text-[#5F795C]">
                                  Completed
                                </span>
                              )}
                            </div>

                            {!exercise.completed && (
                              <div className="mt-5 border-t border-[#DCD1C6] pt-5">
                                {!!exercise.instructions?.length && (
                                  <div className="mb-5">
                                    <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#937E6B]">
                                      How to do it
                                    </h4>

                                    <ol className="space-y-3">
                                      {exercise.instructions.map(
                                        (instruction, i) => (
                                          <li
                                            key={i}
                                            className="flex items-start gap-3 text-sm leading-6 text-[#584B42]"
                                          >
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E4D8CC] text-[10px] font-bold text-[#796353]">
                                              {i + 1}
                                            </span>
                                            <span>{instruction}</span>
                                          </li>
                                        )
                                      )}
                                    </ol>
                                  </div>
                                )}

                                {!!exercise.benefits?.length && (
                                  <div>
                                    <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#937E6B]">
                                      Benefits
                                    </h4>

                                    <div className="flex flex-wrap gap-2">
                                      {exercise.benefits.map(
                                        (benefit, i) => (
                                          <span
                                            key={i}
                                            className="rounded-full border border-[#D8C9B9] px-3 py-1 text-[11px] text-[#796353]"
                                          >
                                            {benefit}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          </>
        ) : (
          /* NO CURRENT PLAN */
          <section className="border-b border-[#DCD1C6] py-10">
            <div className="rounded-2xl border border-[#DED3C7] bg-[#F0E9E0] px-6 py-12 sm:px-10 sm:py-16">

              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4C3B3] bg-[#E9DFD4]">
                  <CalendarDays
                    size={28}
                    strokeWidth={1.5}
                    className="text-[#937E6B]"
                  />
                </div>

                <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.23em] text-[#937E6B]">
                  YOUR NEXT CHAPTER
                </div>

                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  A fresh week starts here.
                </h2>

                <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#87776C]">
                  No active plan yet. Create a personalized weekly
                  routine based on your recent mood patterns,
                  with small exercises to help you reconnect.
                </p>

                {/* MOOD PATTERNS */}
                {moodInsights.length > 0 ? (
                  <div className="mt-10">
                    <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#937E6B]">
                      BASED ON YOUR RECENT PATTERNS
                    </div>

                    <div className="mx-auto grid max-w-lg gap-3 sm:grid-cols-2">
                      {moodInsights.slice(0, 2).map(
                        (insight, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-[#D8C9B9] bg-[#FAF7F2] p-5 text-left"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <Heart
                                size={17}
                                strokeWidth={1.6}
                                className="text-[#937E6B]"
                              />

                              <span className="text-[10px] text-[#937E6B]">
                                0{index + 1}
                              </span>
                            </div>

                            <div className="text-base font-extrabold capitalize">
                              {insight.primaryMood}
                            </div>

                            <div className="mt-1 text-xs text-[#87776C]">
                              {insight.frequency}{" "}
                              {insight.frequency === 1
                                ? "occurrence"
                                : "occurrences"}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto mt-8 max-w-md rounded-xl bg-[#E9DFD4] px-5 py-4">
                    <p className="text-sm leading-6 text-[#796353]">
                      Keep using your journal, voice sessions, or chat
                      to build your mood profile. Your personalized
                      plan will become available once enough data
                      has been collected.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={generateNewPlan}
                  disabled={
                    generating || moodInsights.length === 0
                  }
                  className={`${primaryButton} mt-8 min-w-[230px]`}
                >
                  {generating ? (
                    <>
                      <Brain size={17} className="animate-pulse" />
                      Generating your plan...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Generate Weekly Plan
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <p className="mt-5 text-xs text-[#937E6B]">
                  A little progress, every day.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* PAST PLANS */}
        {pastPlans.length > 0 && (
          <section className="border-b border-[#DCD1C6] py-9">
            <h2 className="mb-6 flex items-center gap-3 text-lg font-extrabold tracking-tight">
              <BarChart3 size={20} color="#937E6B" />
              Previous Plans
            </h2>

            <div className="space-y-3">
              {pastPlans.slice(0, 3).map((plan) => (
                <div
                  key={plan.id}
                  className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-[#DED3C7] bg-[#F1EAE1] p-5"
                >
                  <div>
                    <h3 className="text-sm font-extrabold">
                      {plan.title}
                    </h3>

                    <p className="mt-1 text-xs text-[#87776C]">
                      Week of{" "}
                      {new Date(
                        `${plan.week_of.slice(0, 10)}T12:00:00`
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#DED5CB]">
                      <div
                        className="h-full rounded-full bg-[#819179]"
                        style={{
                          width: `${calculateProgress(plan)}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs font-bold text-[#796353]">
                      {Math.round(calculateProgress(plan))}%
                    </span>

                    {plan.completed && (
                      <CheckCircle2
                        size={17}
                        className="text-[#5F795C]"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-3 py-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#937E6B]">
            A SPACE TO RECONNECT.
          </span>

          <span className="text-xs text-[#87776C]">
            One step at a time.
          </span>
        </footer>
      </div>
    </motion.div>
  );
};

export default WeeklyPlans;
