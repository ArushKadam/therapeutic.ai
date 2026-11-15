import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HeartHandshake,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type WalkthroughId = "first-session" | "ongoing-sessions";

interface Slide {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  note?: string;
}

interface Walkthrough {
  id: WalkthroughId;
  title: string;
  cardTitle: string;
  description: string;
  icon: typeof ClipboardList;
  accent: string;
  slides: Slide[];
}

const walkthroughs: Record<WalkthroughId, Walkthrough> = {
  "first-session": {
    id: "first-session",
    title: "Your first therapy session",
    cardTitle: "The first session",
    description: "See how an intake often unfolds, from paperwork to deciding whether the therapist feels right for you.",
    icon: ClipboardList,
    accent: "from-[#FAF7F2] via-[#F1EAE1] to-[#E9DFD4]",
    slides: [
      {
        eyebrow: "Before you begin",
        title: "Preparing and paperwork",
        body: "You may complete forms before the appointment, in the waiting room, or during the session. The timing and amount of paperwork vary by practice.",
        points: [
          "Contact, payment, insurance, and emergency-contact details",
          "Medical and mental health history, medications, and past support",
          "Brief questionnaires about recent mood, anxiety, energy, sleep, or stress",
        ],
        note: "You can ask why information is needed and how it will be stored.",
      },
      {
        eyebrow: "Setting the ground rules",
        title: "Confidentiality, consent, and logistics",
        body: "Your therapist will usually explain privacy, informed consent, and how the practice works before getting into personal details.",
        points: [
          "What is private and how records are handled",
          "Limits to confidentiality, which can differ by location and situation",
          "Session length, fees, cancellations, and contact between appointments",
        ],
        note: "Ask for clarification at any point. You do not need to remember every policy immediately.",
      },
      {
        eyebrow: "The big picture",
        title: "Goals, history, and what brings you in",
        body: "The therapist is learning who you are and what support would be useful—not trying to solve everything in one meeting.",
        points: [
          "What has been difficult lately and why you reached out now",
          "Important relationships, life events, strengths, culture, and identity",
          "What you hope might feel different with support",
        ],
        note: "A complete life story is not required. You and your therapist can fill in context over time.",
      },
      {
        eyebrow: "What they may ask",
        title: "Open, practical questions",
        body: "Questions are usually meant to understand patterns, needs, and possible next steps. They may sound like:",
        points: [
          "“What prompted you to reach out right now?”",
          "“What has helped, even a little, when things feel hard?”",
          "“How are sleep, work or school, relationships, and daily routines going?”",
          "“Have you had thoughts about hurting yourself or someone else?”",
        ],
        note: "Safety questions can be routine. You can ask what will happen with your answer before responding.",
      },
      {
        eyebrow: "You set the pace",
        title: "Boundaries, pacing, and safety",
        body: "A first session can feel vulnerable. You can slow down, pause, or say that you are not ready to discuss something in detail.",
        points: [
          "Name what would help you feel more comfortable",
          "Ask to take a break or shift topics",
          "Share only what feels manageable while still being honest about immediate safety concerns",
        ],
        note: "A therapist may offer a coping or regulation exercise, but no single technique works for everyone.",
      },
      {
        eyebrow: "Before time is up",
        title: "Wrapping up and next steps",
        body: "Near the end, the therapist may summarize what they heard and discuss what continuing together could look like.",
        points: [
          "Possible focus areas or an initial plan",
          "How often to meet and how progress might be reviewed",
          "Referrals or other support if a different service would fit better",
          "Time for your questions about their approach or experience",
        ],
      },
      {
        eyebrow: "After the appointment",
        title: "Judging therapist fit",
        body: "You do not need instant certainty. Consider whether you felt respected, heard, and able to ask questions—even if the conversation itself was difficult.",
        points: [
          "Did the therapist explain things clearly and honor your boundaries?",
          "Does their style feel workable for your needs and identities?",
          "Would another session help you decide, or would you prefer someone else?",
        ],
        note: "It is okay to interview more than one therapist or change therapists. Fit is part of effective care.",
      },
    ],
  },
  "ongoing-sessions": {
    id: "ongoing-sessions",
    title: "Ongoing therapy sessions",
    cardTitle: "After the first session",
    description: "Learn the rhythm of ongoing therapy, how approaches differ, and how the work can change over time.",
    icon: HeartHandshake,
    accent: "from-[#F7F2EB] via-[#ECE6DD] to-[#DDE3D8]",
    slides: [
      {
        eyebrow: "Arriving",
        title: "A brief check-in",
        body: "Sessions often begin with what has happened since you last met. Some therapists use a familiar question; others use a rating or short questionnaire.",
        points: [
          "What feels most present today",
          "Any major changes, wins, setbacks, or safety concerns",
          "How you felt after the previous session",
        ],
      },
      {
        eyebrow: "Choosing a focus",
        title: "A collaborative agenda",
        body: "You and your therapist may choose a focus together. A plan can create direction without making the conversation rigid.",
        points: [
          "Bring up something urgent or important to you",
          "Return to a longer-term goal or pattern",
          "Say when the therapist's suggested focus does not match what you need",
        ],
        note: "It is okay to arrive without a prepared topic.",
      },
      {
        eyebrow: "The work itself",
        title: "Different ways therapy can help",
        body: "Therapists use different methods depending on what you need. They should explain what they are doing in language that makes sense to you.",
        points: [
          "CBT (Cognitive Behavioral Therapy) helps you notice how thoughts, feelings, and actions affect one another—and practice changing unhelpful patterns",
          "DBT (Dialectical Behavior Therapy) teaches practical skills for handling strong emotions, stressful moments, and relationships",
          "Exploratory therapy looks at past experiences, relationships, and patterns that may still affect you today",
          "Trauma-focused therapy moves at a pace you agree to. You should not be forced to share details before you are ready",
        ],
        note: "You can always ask: “Why are we trying this, and how is it meant to help me?”",
      },
      {
        eyebrow: "Coming back to the room",
        title: "Regulation and closing",
        body: "As time ends, the therapist may help you notice what came up, summarize themes, and plan for the transition back into your day.",
        points: [
          "Name emotions or body sensations that are still present",
          "Discuss what support may help after the session",
          "Flag anything that feels unfinished for next time",
        ],
        note: "You may not leave every session feeling calm or resolved. Tell your therapist if endings repeatedly feel too abrupt.",
      },
      {
        eyebrow: "Between meetings",
        title: "Practice, reflection, or rest",
        body: "Some therapists suggest activities between sessions; others do not. These should connect to your goals and be adjusted when they are not useful.",
        points: [
          "Track a pattern, mood, or situation",
          "Try a communication, coping, or mindfulness skill",
          "Reflect, journal, read, or simply notice what emerges",
        ],
        note: "The app can support reflection between appointments, but it complements—not replaces—care from a qualified professional.",
      },
      {
        eyebrow: "The relationship matters",
        title: "Building trust with your therapist",
        body: "“Rapport” simply means feeling comfortable, respected, and able to work together. That trust may take several sessions to grow.",
        points: [
          "Tell your therapist what helps you feel heard and understood",
          "Let them know if the pace, wording, or approach does not feel right",
          "Pay attention to whether they respect your boundaries, background, and identity",
          "If something feels awkward or misunderstood, you can talk about it when you feel ready",
        ],
        note: "You do not have to feel an instant connection, but you should feel respected and increasingly safe being honest.",
      },
      {
        eyebrow: "Stepping back",
        title: "Reviewing progress and changing course",
        body: "Therapy is not always linear. Periodic reviews can help you and your therapist decide what to continue, change, pause, or end.",
        points: [
          "Look for meaningful changes, not perfect or constant improvement",
          "Revise goals or try a different approach when the work feels stuck",
          "Discuss a referral, second opinion, or different therapist when needed",
        ],
        note: "Changing therapists is allowed. A thoughtful ending or transfer can help, but your safety and access needs come first.",
      },
    ],
  },
};

const TherapyExpectations = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<WalkthroughId | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const activeWalkthrough = activeId ? walkthroughs[activeId] : null;
  const slide = activeWalkthrough?.slides[slideIndex];

  const openWalkthrough = (id: WalkthroughId) => {
    setActiveId(id);
    setSlideIndex(0);
    setCompleted(false);
  };

  const closeWalkthrough = () => {
    setActiveId(null);
    setSlideIndex(0);
    setCompleted(false);
  };

  const goBack = useCallback(() => {
    if (completed) {
      setCompleted(false);
      return;
    }
    setSlideIndex((current) => Math.max(0, current - 1));
  }, [completed]);

  const goNext = useCallback(() => {
    if (!activeWalkthrough) return;
    if (slideIndex === activeWalkthrough.slides.length - 1) {
      setCompleted(true);
      return;
    }
    setSlideIndex((current) => Math.min(activeWalkthrough.slides.length - 1, current + 1));
  }, [activeWalkthrough, slideIndex]);

  useEffect(() => {
    if (!activeWalkthrough) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" && !completed) {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft" && (slideIndex > 0 || completed)) {
        event.preventDefault();
        goBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeWalkthrough, completed, goBack, goNext, slideIndex]);

  const progress = activeWalkthrough
    ? completed
      ? 100
      : ((slideIndex + 1) / activeWalkthrough.slides.length) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 overflow-y-auto bg-[#F5F0E9] px-5 pb-10 pt-6 text-[#302A26] sm:px-8 [&_.bg-background]:bg-[#FAF7F2] [&_.bg-primary]:bg-[#302A26] [&_.text-foreground]:text-[#302A26] [&_.text-muted-foreground]:text-[#87776C] [&_.text-primary]:text-[#937E6B]"
    >
      <section className="rounded-2xl border border-[#DED3C7] bg-[#FAF7F2] p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#E9DFD4] p-3 text-[#937E6B]">
            <Route className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#937E6B]">A gentle preview, not a rulebook</p>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-[#302A26]">What to expect in therapy</h1>
            <p className="mt-3 max-w-3xl leading-6 text-[#87776C]">
              Therapy can feel less intimidating when the process is familiar. These short walkthroughs show common patterns, while leaving room for different therapists, approaches, cultures, and settings.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2" aria-label="Therapy walkthroughs">
        {Object.values(walkthroughs).map((walkthrough, index) => {
          const Icon = walkthrough.icon;
          return (
            <motion.button
              key={walkthrough.id}
              type="button"
              onClick={() => openWalkthrough(walkthrough.id)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.08 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              className="group rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Start ${walkthrough.title} walkthrough`}
            >
              <Card className="aspect-square h-full overflow-hidden rounded-2xl border-[#DED3C7] bg-[#FAF7F2] text-[#302A26] shadow-none transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#B9A593]">
                <CardContent className={`flex h-full flex-col bg-gradient-to-br ${walkthrough.accent} p-7 md:p-8`}>
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl border border-[#DED3C7] bg-[#FAF7F2]/90 p-3 text-[#937E6B]">
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full border border-[#DED3C7] bg-[#FAF7F2]/90 px-3 py-1.5 text-xs font-medium text-[#796353]">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      About 2 minutes
                    </span>
                  </div>

                  <div className="mt-auto">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#937E6B]">7-step walkthrough</p>
                    <h2 className="text-2xl font-bold md:text-3xl">{walkthrough.cardTitle}</h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-[#66584E] md:text-base">
                      {walkthrough.description}
                    </p>
                    <div className="mt-6 flex items-center gap-2 font-semibold text-[#796353]">
                      Start walkthrough
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>

      <section className="flex items-start gap-3 rounded-xl border border-[#DED3C7] bg-[#F1EAE1] p-4 text-sm text-[#66584E]">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#937E6B]" aria-hidden="true" />
        <p>
          TheraBot is a companion for reflection and support between appointments. It is not a therapist, emergency service, or replacement for professional care. If you may be in immediate danger, contact local emergency services or a crisis resource in the Resources tab.
        </p>
      </section>

      <Dialog open={Boolean(activeWalkthrough)} onOpenChange={(open) => !open && closeWalkthrough()}>
        <DialogContent className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border-[#DED3C7] bg-[#F5F0E9] p-0 text-[#302A26] sm:w-full [&_.bg-background]:bg-[#FAF7F2] [&_.bg-primary]:bg-[#302A26] [&_.text-foreground]:text-[#302A26] [&_.text-muted-foreground]:text-[#87776C] [&_.text-primary]:text-[#937E6B]">
          {activeWalkthrough && (
            <>
              <DialogHeader className="border-b border-[#DED3C7] px-5 pb-4 pt-6 pr-12 sm:px-7">
                <div className="mb-3 flex items-center justify-between gap-4 text-sm text-muted-foreground">
                  <span>{completed ? "Walkthrough complete" : `Step ${slideIndex + 1} of ${activeWalkthrough.slides.length}`}</span>
                  <span className="hidden items-center gap-1.5 sm:flex">
                    <ArrowLeft className="h-3.5 w-3.5" /> Arrow keys <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <Progress value={progress} className="h-2" aria-label={`${Math.round(progress)}% complete`} />
                <DialogTitle className="sr-only">{activeWalkthrough.title}</DialogTitle>
                <DialogDescription className="sr-only">
                  A seven-step interactive introduction to {activeWalkthrough.title.toLowerCase()}.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#FAF7F2] px-5 py-6 sm:px-7 sm:py-8">
                <AnimatePresence mode="wait" initial={false}>
                  {completed ? (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex min-h-[340px] flex-col items-center justify-center text-center"
                      role="status"
                    >
                      <div className="mb-5 rounded-full bg-[#DDE3D8] p-4 text-[#71816B]">
                        <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">You made it through</p>
                      <h3 className="mt-2 text-3xl font-bold">The process is allowed to be yours</h3>
                      <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
                        This walkthrough describes common patterns, not a script you have to follow. You can ask questions, name your boundaries, and take time to decide what support fits.
                      </p>
                      <p className="mt-5 font-medium">
                        Now that you know what therapy can look like, would you like help taking the next step?
                      </p>
                      <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <Button variant="outline" onClick={closeWalkthrough}>Maybe Later</Button>
                        <Button onClick={() => navigate('/prepare-therapy')}>
                          Prepare for Therapy
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : slide ? (
                    <motion.article
                      key={`${activeWalkthrough.id}-${slideIndex}`}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.2 }}
                      className="min-h-[340px]"
                      aria-live="polite"
                    >
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E9DFD4] text-[#937E6B]">
                        <Sparkles className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{slide.eyebrow}</p>
                      <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{slide.title}</h3>
                      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{slide.body}</p>
                      <ul className="mt-6 space-y-3">
                        {slide.points.map((point) => (
                          <li key={point} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E9DFD4] text-[#937E6B]">
                              <Check className="h-3 w-3" aria-hidden="true" />
                            </span>
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                      {slide.note && (
                        <div className="mt-6 rounded-xl border border-[#D8CABC] bg-[#F1EAE1] p-4 text-sm leading-relaxed text-[#66584E]">
                          <span className="font-semibold text-foreground">Keep in mind: </span>
                          {slide.note}
                        </div>
                      )}
                    </motion.article>
                  ) : null}
                </AnimatePresence>
              </div>

              {!completed && (
                <div className="flex items-center justify-between gap-3 border-t border-[#DED3C7] bg-[#F1EAE1] px-5 py-4 sm:px-7">
                  <Button variant="ghost" onClick={goBack} disabled={slideIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="hidden gap-1 sm:flex" aria-hidden="true">
                    {activeWalkthrough.slides.map((_, index) => (
                      <span
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${index === slideIndex ? "w-6 bg-[#302A26]" : index < slideIndex ? "w-2 bg-[#937E6B]" : "w-2 bg-[#CFC3B7]"}`}
                      />
                    ))}
                  </div>
                  <Button onClick={goNext}>
                    {slideIndex === activeWalkthrough.slides.length - 1 ? "Finish" : "Next"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TherapyExpectations;
