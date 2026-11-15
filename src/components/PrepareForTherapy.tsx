import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BedDouble,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardCopy,
  Download,
  FileHeart,
  Loader2,
  Mail,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { downloadTherapyBriefPdf } from '@/lib/therapy-pdf';
import {
  collectTherapyPreparationData,
  countSelectedRecords,
  generateTherapyBrief,
  regenerateTherapySection,
  type BriefSectionKey,
  type TherapyBrief,
  type TherapyPreparationData,
  type TherapySourceSelection,
} from '@/services/therapyPreparation';
import {
  sleepCheckinService,
  therapyNextStepService,
  type TherapyNextStep,
} from '@/services/supabase';

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString().slice(0, 10);
};

const sectionMeta: Array<{ key: BriefSectionKey; number: string; title: string }> = [
  { key: 'feelings', number: '01', title: "How I've Been Feeling" },
  { key: 'moodPatterns', number: '02', title: 'Mood Patterns' },
  { key: 'stressors', number: '03', title: 'Recurring Stressors' },
  { key: 'sleepHabits', number: '04', title: 'Sleep and Daily Habits' },
  { key: 'discussionTopics', number: '05', title: 'Things I Want to Discuss' },
];

const defaultSources: TherapySourceSelection = {
  chats: true,
  journals: true,
  moods: true,
  sleep: true,
  bookmarks: true,
};

const sourceLabels: Record<keyof TherapySourceSelection, string> = {
  chats: 'AI chat conversations',
  journals: 'Journal entries',
  moods: 'Mood check-ins',
  sleep: 'Sleep check-ins',
  bookmarks: 'Bookmarked moments',
};

const qualityLabels = ['Very poor', 'Poor', 'Okay', 'Good', 'Restful'];

interface SampleScenario {
  label: string;
  feelings: string;
  patterns: string;
  stressors: string;
  sleep: string;
  topics: string;
  questions: string[];
  journal: Array<[string, string, string]>;
  chats: string[];
  mood: Array<[string, string, number]>;
  sleepData: Array<[number, number, string]>;
  bookmarks: Array<[string, string]>;
}

const sampleScenarios: SampleScenario[] = [
  {
    label: 'Workload and boundaries',
    feelings: 'I have felt stretched thin by overlapping deadlines, but proud when I asked a teammate to help. I also wrote that it has been hard to switch off after work.',
    patterns: 'The sample mood check-ins move between anxious on busy days and calmer after breaks or supportive conversations. This is a small example set, not evidence of a real pattern.',
    stressors: 'The fictional entries mention deadline pressure, checking messages late, and worry about disappointing coworkers.',
    sleep: 'The fictional check-ins range from 5.5 to 7 hours, with one note about waking during the night. They do not establish why sleep varied.',
    topics: 'I might want to discuss setting work boundaries, asking for help, and finding a way to transition out of work at the end of the day.',
    questions: ['How can I set boundaries without feeling guilty?', 'What could a realistic end-of-work routine look like?'],
    journal: [['A crowded week', 'I kept checking work messages after dinner. I felt tense, then relieved after asking for help with a deadline.', 'anxious'], ['A small boundary', 'I took a real lunch break today and felt more present afterward.', 'calm']],
    chats: ['I feel behind even when I finish the most urgent tasks.', 'How do I tell my team I need help before I am overwhelmed?'],
    mood: [['anxious', 'Felt keyed up after a packed workday.', 7], ['calm', 'Felt more settled after taking a lunch break.', 4], ['hopeful', 'Felt encouraged after asking for help.', 5]],
    sleepData: [[5.5, 2, 'Woke up once and thought about tomorrow’s deadlines.'], [7, 4, 'Tried leaving my phone outside the bedroom.']],
    bookmarks: [['I asked for help before the deadline passed.', 'A moment I want to remember']]
  },
  {
    label: 'Social energy and connection',
    feelings: 'I have wanted connection and quiet at the same time. I enjoyed seeing a friend, then felt drained and needed a slower evening.',
    patterns: 'The sample mood notes alternate between lonely, connected, and tired. They suggest different feelings across situations rather than one fixed mood.',
    stressors: 'The fictional notes mention uncertainty about making plans, fear of seeming distant, and balancing social time with rest.',
    sleep: 'The sample check-ins range from 6 to 8 hours. One note mentions staying up late after a social event; another describes a restful night.',
    topics: 'I might want to explore how I notice my social limits, communicate them kindly, and stay connected without overcommitting.',
    questions: ['How can I communicate that I need downtime?', 'How do I tell the difference between helpful solitude and isolation?'],
    journal: [['A good visit', 'I laughed with a friend and felt connected. I was also tired afterward and needed a quiet evening.', 'connected'], ['Plans changed', 'I felt disappointed when plans fell through, then called someone else and felt less alone.', 'lonely']],
    chats: ['I want to see people but I get overwhelmed by too many plans.', 'Can needing quiet and wanting friends both be true?'],
    mood: [['lonely', 'Felt left out when plans changed.', 6], ['connected', 'Enjoyed an unhurried conversation with a friend.', 5], ['tired', 'Needed time alone after a busy weekend.', 6]],
    sleepData: [[6, 3, 'Stayed up later than I meant to after getting home.'], [8, 5, 'Quiet evening and a restful night.']],
    bookmarks: [['I can care about people and still need time to recharge.', 'A reminder about boundaries']]
  },
  {
    label: 'School pressure and confidence',
    feelings: 'I have felt frustrated by a difficult assignment and worried that I should understand it faster. Finishing one small part helped me feel more capable.',
    patterns: 'The fictional check-ins show frustration around school tasks and some relief after breaking work into smaller steps. More examples would be needed to tell whether this repeats.',
    stressors: 'The sample entries mention a large assignment, comparing progress with classmates, and putting off asking a question in class.',
    sleep: 'The example sleep notes vary from 5 to 8 hours. Shorter nights are mentioned near study sessions, but the sample does not show a cause.',
    topics: 'I might discuss perfectionism, asking for academic support sooner, and how to make large assignments feel more manageable.',
    questions: ['What makes it hard for me to ask for help?', 'Could we work on a plan for breaking down overwhelming tasks?'],
    journal: [['The first draft', 'I stared at the assignment for a long time because I wanted to get it right. Starting a rough outline made it feel possible.', 'frustrated'], ['Asked a question', 'I was nervous to ask the teacher, but their explanation helped me choose a next step.', 'relieved']],
    chats: ['Everyone else seems ahead of me, even though I know I cannot see the whole picture.', 'What is one small way to start when a task feels too big?'],
    mood: [['frustrated', 'Had trouble starting a large assignment.', 7], ['overwhelmed', 'Thought about several deadlines at once.', 8], ['relieved', 'Got clarification and picked one next step.', 4]],
    sleepData: [[5, 2, 'Stayed up studying and still felt worried about the work.'], [8, 4, 'Took a break from studying before bed.']],
    bookmarks: [['A rough first draft is still a start.', 'Something I want to keep in mind']]
  },
  {
    label: 'Family responsibilities and self-care',
    feelings: 'I have felt caring and exhausted while helping family. I noticed some relief when I accepted practical help and made time for a short walk.',
    patterns: 'The fictional entries include worry on caregiving days and moments of calm when support is shared. These examples do not establish a clinical pattern.',
    stressors: 'The sample notes mention changing plans, feeling responsible for everyone, and not always making room for personal needs.',
    sleep: 'The example check-ins range from 4.5 to 7 hours, with notes about interruptions and one more restful night after a lighter day.',
    topics: 'I might discuss caregiver stress, asking family for specific help, and making self-care feel possible rather than like another obligation.',
    questions: ['How can I ask for a specific kind of help?', 'What is a manageable way to make room for my own needs?'],
    journal: [['A changed plan', 'I felt disappointed when my plans shifted to help family. I was glad I could be there, and I also felt worn out.', 'overwhelmed'], ['A little space', 'A short walk gave me time to breathe. I came back feeling a bit less tense.', 'calm']],
    chats: ['I love my family and sometimes feel resentful about how much I am carrying.', 'How do I ask relatives for help without starting an argument?'],
    mood: [['worried', 'Wondered how to balance family needs and my own plans.', 7], ['grateful', 'Appreciated when someone else handled a task.', 4], ['tired', 'Felt low on energy after a long day of caregiving.', 7]],
    sleepData: [[4.5, 2, 'Woke up to help with something at home.'], [7, 4, 'Had a calmer evening and slept more steadily.']],
    bookmarks: [['Accepting help can be part of caring for my family.', 'A perspective I want to bring up']]
  },
  {
    label: 'Change, uncertainty, and routines',
    feelings: 'I have felt unsettled during a period of change and missed familiar routines. A few small repeated habits helped me feel more grounded.',
    patterns: 'Sample mood check-ins range from uncertain to hopeful. Hopefulness appears in notes about completing small routines, while uncertainty appears around upcoming changes.',
    stressors: 'The fictional records mention a changing schedule, waiting for decisions, and trying to plan without having all the information.',
    sleep: 'The example check-ins range from 6 to 7.5 hours. Notes vary between difficulty settling down and feeling rested after a consistent routine.',
    topics: 'I might discuss tolerating uncertainty, choosing routines that are flexible, and deciding what is within my control while plans are changing.',
    questions: ['What helps me handle uncertainty without trying to solve everything at once?', 'Which routines are supportive and realistic for me right now?'],
    journal: [['A week of changes', 'Several plans shifted this week. I felt unsettled, so I wrote down what I know and what I can decide later.', 'uncertain'], ['Kept one routine', 'I made breakfast before checking messages and felt more grounded this morning.', 'hopeful']],
    chats: ['I keep trying to plan for every possibility because I do not know what is going to happen.', 'How can I stay flexible without feeling like everything is out of control?'],
    mood: [['uncertain', 'Waiting for more information about a change.', 6], ['hopeful', 'Felt encouraged by keeping one small routine.', 4], ['calm', 'Focused on what can be decided today.', 3]],
    sleepData: [[6, 3, 'Took a while to settle while thinking through changes.'], [7.5, 4, 'Kept a steady evening routine.']],
    bookmarks: [['I only need to decide what is in front of me today.', 'A grounding thought']]
  },
];

const buildSampleTherapyData = (scenario: SampleScenario, startDate: string, endDate: string, sources: TherapySourceSelection): TherapyPreparationData => {
  const rangeDays = Math.max(0, Math.floor((new Date(`${endDate}T12:00:00`).getTime() - new Date(`${startDate}T12:00:00`).getTime()) / 86_400_000));
  const dateFor = (requestedDaysBack: number) => {
    const daysBack = Math.min(requestedDaysBack, rangeDays);
    const date = new Date(`${endDate}T12:00:00`);
    date.setDate(date.getDate() - daysBack);
    return date.toISOString();
  };
  const createdAt = dateFor(0);
  return {
    startDate,
    endDate,
    chats: sources.chats ? scenario.chats.map((text, index) => ({ date: dateFor(index * 3 + 1), text })) : [],
    journals: sources.journals ? scenario.journal.map(([title, text, mood], index) => ({ date: dateFor(index * 5 + 2), title, text, mood })) : [],
    moods: sources.moods ? scenario.mood.map(([mood, reflection], index) => ({ date: dateFor(index * 4 + 1), mood, reflection })) : [],
    moodAnalyses: sources.moods ? scenario.mood.map(([mood, reflection, intensity], index) => ({ date: dateFor(index * 4 + 1), mood, intensity, emotions: [mood, index % 2 ? 'tired' : 'hopeful'] })) : [],
    sleep: sources.sleep ? scenario.sleepData.map(([hours, quality, notes], index) => ({
      id: `sample-sleep-${index}`,
      user_id: 'sample-user',
      checkin_date: dateFor(index * 6 + 1).slice(0, 10),
      hours,
      quality,
      notes,
      created_at: dateFor(index * 6 + 1),
      updated_at: dateFor(index * 6 + 1),
    })) : [],
    bookmarks: sources.bookmarks ? scenario.bookmarks.map(([content, note], index) => ({
      id: `sample-bookmark-${index}`,
      user_id: 'sample-user',
      source_type: index % 2 ? 'chat_message' as const : 'journal_entry' as const,
      source_id: `sample-source-${index}`,
      content,
      note,
      created_at: createdAt,
      updated_at: createdAt,
    })) : [],
  };
};

const buildSampleTherapyBrief = (scenario: SampleScenario, data: TherapyPreparationData): TherapyBrief => ({
  feelings: data.chats.length || data.journals.length ? scenario.feelings : 'There are no selected sample chat or journal records to summarize how I have been feeling.',
  moodPatterns: data.moods.length || data.moodAnalyses.length ? scenario.patterns : 'There are no selected sample mood records to describe mood patterns.',
  stressors: data.chats.length || data.journals.length ? scenario.stressors : 'There are no selected sample chat or journal records to identify possible stressors.',
  sleepHabits: data.sleep.length ? scenario.sleep : 'There are no selected sample sleep check-ins to summarize sleep or daily habits.',
  discussionTopics: data.bookmarks.length ? scenario.topics : data.chats.length || data.journals.length ? scenario.topics : 'There are no selected sample records to suggest discussion topics.',
  questions: scenario.questions,
});

const SessionBriefTab = () => {
  const [range, setRange] = useState('14');
  const [startDate, setStartDate] = useState(daysAgo(14));
  const [endDate, setEndDate] = useState(today());
  const [sources, setSources] = useState(defaultSources);
  const [preparedData, setPreparedData] = useState<TherapyPreparationData | null>(null);
  const [brief, setBrief] = useState<TherapyBrief | null>(null);
  const [included, setIncluded] = useState<Record<BriefSectionKey, boolean>>({
    feelings: true,
    moodPatterns: true,
    stressors: true,
    sleepHabits: true,
    discussionTopics: true,
  });
  const [questions, setQuestions] = useState<string[]>([]);
  const [personalNotes, setPersonalNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState<'review' | 'generate' | BriefSectionKey | null>(null);
  const [error, setError] = useState('');
  const [goalAnswers, setGoalAnswers] = useState({ bothering: '', change: '', helping: '' });
  const [goals, setGoals] = useState<Array<{ text: string; approved: boolean }>>([]);
  const [sleep, setSleep] = useState({ hours: '', quality: '3', notes: '' });
  const [savingSleep, setSavingSleep] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [showingSampleReport, setShowingSampleReport] = useState(false);
  const { toast } = useToast();

  const resetReview = () => {
    setPreparedData(null);
    setConsent(false);
    setShowingSampleReport(false);
  };

  const changeRange = (value: string) => {
    setRange(value);
    if (value !== 'custom') {
      setStartDate(daysAgo(Number(value)));
      setEndDate(today());
    }
    resetReview();
  };

  const toggleSource = (key: keyof TherapySourceSelection) => {
    setSources((current) => ({ ...current, [key]: !current[key] }));
    resetReview();
  };

  const reviewRecords = async () => {
    if (!Object.values(sources).some(Boolean)) {
      setError('Choose at least one type of information to include.');
      return;
    }
    if (startDate > endDate) {
      setError('The start date must be before the end date.');
      return;
    }
    setLoading('review');
    setError('');
    setShowingSampleReport(false);
    try {
      setPreparedData(await collectTherapyPreparationData(startDate, endDate, sources));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not review the selected records.');
    } finally {
      setLoading(null);
    }
  };

  const generateBrief = async () => {
    if (!preparedData || !consent) return;
    const counts = countSelectedRecords(preparedData);
    if (Object.values(counts).every((count) => count === 0)) {
      setError('There are no selected records in this date range. Try a wider range or add a journal or check-in first.');
      return;
    }
    setLoading('generate');
    setError('');
    setShowingSampleReport(false);
    try {
      const next = await generateTherapyBrief(preparedData);
      setBrief(next);
      setQuestions(next.questions);
      toast({ title: 'Session brief ready', description: 'Review and edit every section before using it.' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The session brief could not be generated.');
    } finally {
      setLoading(null);
    }
  };

  const generateSampleReport = () => {
    const scenario = sampleScenarios[sampleIndex % sampleScenarios.length];
    const sampleData = buildSampleTherapyData(scenario, startDate, endDate, sources);
    setPreparedData(sampleData);
    setBrief(buildSampleTherapyBrief(scenario, sampleData));
    setQuestions(scenario.questions);
    setConsent(false);
    setShowingSampleReport(true);
    setSampleIndex((index) => (index + 1) % sampleScenarios.length);
    setError('');
    toast({ title: `Sample report: ${scenario.label}`, description: 'Generated with fictional sample data. Nothing was sent to Gemini.' });
  };

  const regenerate = async (key: BriefSectionKey) => {
    if (!preparedData || !brief || !consent) return;
    setLoading(key);
    setError('');
    try {
      const text = await regenerateTherapySection(key, preparedData);
      setBrief({ ...brief, [key]: text });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This section could not be regenerated.');
    } finally {
      setLoading(null);
    }
  };

  const createGoals = () => {
    const generated = [
      goalAnswers.bothering.trim() && `I want help handling ${goalAnswers.bothering.trim().replace(/[.!?]+$/, '').toLowerCase()}.`,
      goalAnswers.change.trim() && `I want to ${goalAnswers.change.trim().replace(/[.!?]+$/, '').replace(/^to\s+/i, '').toLowerCase()}.`,
      goalAnswers.helping.trim() && `I will know therapy is helping when ${goalAnswers.helping.trim().replace(/[.!?]+$/, '').toLowerCase()}.`,
    ].filter(Boolean) as string[];
    setGoals(generated.slice(0, 3).map((text) => ({ text, approved: true })));
  };

  const saveSleep = async () => {
    const hours = Number(sleep.hours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      setError('Enter sleep hours between 0 and 24.');
      return;
    }
    setSavingSleep(true);
    setError('');
    try {
      await sleepCheckinService.save({ checkin_date: today(), hours, quality: Number(sleep.quality), notes: sleep.notes.trim() });
      toast({ title: 'Sleep check-in saved', description: 'It can now be included in a future session brief.' });
      setSleep({ hours: '', quality: '3', notes: '' });
      resetReview();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the sleep check-in.');
    } finally {
      setSavingSleep(false);
    }
  };

  const moodCounts = useMemo(() => {
    if (!preparedData) return [];
    const counts = new Map<string, number>();
    preparedData.moods.forEach((item) => counts.set(item.mood, (counts.get(item.mood) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [preparedData]);

  const summaryText = useMemo(() => {
    if (!brief) return '';
    const chunks = ['THERAPY SESSION BRIEF', `Date range: ${startDate} to ${endDate}`, ''];
    sectionMeta.forEach(({ key, number, title }) => {
      if (included[key]) chunks.push(`${number} — ${title.toUpperCase()}`, brief[key], '');
    });
    const approvedGoals = goals.filter((goal) => goal.approved && goal.text.trim());
    if (approvedGoals.length) chunks.push('THERAPY GOALS', ...approvedGoals.map((goal) => `• ${goal.text}`), '');
    chunks.push('06 — QUESTIONS FOR MY THERAPIST', ...questions.filter(Boolean).map((question) => `• ${question}`), '');
    if (personalNotes.trim()) chunks.push('PERSONAL NOTES', personalNotes.trim(), '');
    chunks.push('For personal preparation only — not a diagnosis or clinical record.');
    return chunks.join('\n');
  }, [brief, endDate, goals, included, personalNotes, questions, startDate]);

  const copySummary = async () => {
    await navigator.clipboard.writeText(summaryText);
    toast({ title: 'Session brief copied' });
  };

  const counts = preparedData ? countSelectedRecords(preparedData) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileHeart className="h-5 w-5 text-primary" /> Choose what to include</CardTitle>
          <CardDescription>Nothing is sent to Gemini until you review the record counts and confirm below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium">Date range</label>
              <Select value={range} onValueChange={changeRange}>
                <SelectTrigger className="border-[#D8CABC] bg-[#FAF7F2] text-[#302A26]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">Past 2 weeks</SelectItem>
                  <SelectItem value="28">Past 4 weeks</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium">From</label>
                <Input type="date" value={startDate} max={endDate} disabled={range !== 'custom'} onChange={(event) => { setStartDate(event.target.value); resetReview(); }} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">To</label>
                <Input type="date" value={endDate} min={startDate} max={today()} disabled={range !== 'custom'} onChange={(event) => { setEndDate(event.target.value); resetReview(); }} />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">Information to include</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(sourceLabels) as Array<keyof TherapySourceSelection>).map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/40">
                  <Checkbox checked={sources[key]} onCheckedChange={() => toggleSource(key)} />
                  <span className="text-sm">{sourceLabels[key]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={reviewRecords} disabled={loading !== null}>
              {loading === 'review' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Review selected records
            </Button>
            <Button variant="outline" onClick={generateSampleReport} disabled={loading !== null}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Generate varied sample report
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Cycles through five fictional scenarios and does not use or send your records.</p>

          {counts && (
            <div className="rounded-xl border border-[#C7D0C2] bg-[#EEF1EB] p-4">
              <p className="font-medium">{showingSampleReport ? 'Fictional sample records (not sent to Gemini):' : 'These records will be sent securely to Gemini:'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(Object.keys(counts) as Array<keyof typeof counts>).map((key) => (
                  <Badge key={key} variant="secondary">{counts[key]} {sourceLabels[key]}</Badge>
                ))}
              </div>
              {showingSampleReport ? (
                <p className="mt-4 text-sm text-muted-foreground">This sample is fictional and generated locally for preview only.</p>
              ) : (
                <>
                  <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
                    <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} />
                    <span>I understand that only the selected records above will be sent to Gemini to create this private preparation summary. Nothing will be shared with a therapist or anyone else automatically.</span>
                  </label>
                  <Button className="mt-4" onClick={generateBrief} disabled={!consent || loading !== null}>
                    {loading === 'generate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate my session brief
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {error && <Alert variant="destructive"><AlertTitle>Something needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Optional therapy goal builder</CardTitle>
            <CardDescription>Your answers stay in the browser unless you choose to include the finished goals in your export.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><label className="mb-2 block text-sm font-medium">What has been bothering you most recently?</label><Textarea value={goalAnswers.bothering} onChange={(event) => setGoalAnswers({ ...goalAnswers, bothering: event.target.value })} /></div>
            <div><label className="mb-2 block text-sm font-medium">What would you like to change or understand better?</label><Textarea value={goalAnswers.change} onChange={(event) => setGoalAnswers({ ...goalAnswers, change: event.target.value })} /></div>
            <div><label className="mb-2 block text-sm font-medium">How would you know therapy was helping?</label><Textarea value={goalAnswers.helping} onChange={(event) => setGoalAnswers({ ...goalAnswers, helping: event.target.value })} /></div>
            <Button variant="outline" onClick={createGoals} disabled={!Object.values(goalAnswers).some((value) => value.trim())}><Sparkles className="mr-2 h-4 w-4" /> Turn my answers into goals</Button>
            {goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <Checkbox checked={goal.approved} onCheckedChange={(checked) => setGoals(goals.map((item, itemIndex) => itemIndex === index ? { ...item, approved: checked === true } : item))} aria-label="Include goal" />
                <Input value={goal.text} onChange={(event) => setGoals(goals.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))} />
                <Button size="icon" variant="ghost" onClick={() => setGoals(goals.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove goal"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BedDouble className="h-5 w-5 text-primary" /> Today's optional sleep check-in</CardTitle>
            <CardDescription>Sleep is shown as context only. Therabot will not claim it caused a mood.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-2 block text-sm font-medium">Hours slept</label><Input type="number" min="0" max="24" step="0.5" value={sleep.hours} onChange={(event) => setSleep({ ...sleep, hours: event.target.value })} placeholder="7.5" /></div>
              <div><label className="mb-2 block text-sm font-medium">Sleep quality</label><Select value={sleep.quality} onValueChange={(value) => setSleep({ ...sleep, quality: value })}><SelectTrigger className="border-[#D8CABC] bg-[#FAF7F2] text-[#302A26]"><SelectValue /></SelectTrigger><SelectContent>{qualityLabels.map((label, index) => <SelectItem key={label} value={String(index + 1)}>{label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><label className="mb-2 block text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span></label><Textarea value={sleep.notes} onChange={(event) => setSleep({ ...sleep, notes: event.target.value })} placeholder="Woke up a few times, felt rested by morning..." /></div>
            <Button variant="outline" onClick={saveSleep} disabled={savingSleep || !sleep.hours}>{savingSleep && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save sleep check-in</Button>
          </CardContent>
        </Card>
      </div>

      {brief && (
        <Card className="border-[#B9A593] bg-[#FAF7F2]">
          <CardHeader className="border-b border-[#DED3C7] bg-[#F1EAE1]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><CardTitle>Editable session brief</CardTitle><CardDescription>Review every line. Remove anything you do not want to bring into therapy.</CardDescription></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={copySummary}><ClipboardCopy className="mr-2 h-4 w-4" /> Copy as text</Button><Button size="sm" onClick={() => downloadTherapyBriefPdf('Therapy Session Brief', summaryText)}><Download className="mr-2 h-4 w-4" /> Download PDF</Button></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {sectionMeta.map(({ key, number, title }) => (
              <div key={key} className={`rounded-xl border p-4 ${included[key] ? '' : 'opacity-60'}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3"><Checkbox checked={included[key]} onCheckedChange={(checked) => setIncluded({ ...included, [key]: checked === true })} aria-label={`Include ${title}`} /><div><span className="text-xs font-bold tracking-widest text-primary">{number}</span><h3 className="font-semibold">{title}</h3></div></div>
                  <Button variant="ghost" size="sm" onClick={() => regenerate(key)} disabled={!included[key] || loading !== null}>{loading === key ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}Regenerate section</Button>
                </div>
                <Textarea value={brief[key]} onChange={(event) => setBrief({ ...brief, [key]: event.target.value })} disabled={!included[key]} className="min-h-28" />
                {key === 'moodPatterns' && moodCounts.length >= 2 && (
                  <div className="mt-4 space-y-2" aria-label="Selected mood check-in counts">
                    {moodCounts.map(([mood, count]) => {
                      const max = Math.max(...moodCounts.map(([, value]) => value));
                      return <div key={mood} className="grid grid-cols-[90px_1fr_24px] items-center gap-2 text-xs"><span className="capitalize">{mood.replace('_', ' ')}</span><Progress value={(count / max) * 100} className="h-2" /><span>{count}</span></div>;
                    })}
                  </div>
                )}
              </div>
            ))}

            <div className="rounded-xl border p-4"><div className="mb-3"><span className="text-xs font-bold tracking-widest text-primary">06</span><h3 className="font-semibold">Questions for My Therapist</h3></div><div className="space-y-2">{questions.map((question, index) => <div key={index} className="flex gap-2"><Input value={question} onChange={(event) => setQuestions(questions.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /><Button variant="ghost" size="icon" onClick={() => setQuestions(questions.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="ghost" size="sm" onClick={() => setQuestions([...questions, ''])}><Plus className="mr-2 h-4 w-4" /> Add question</Button></div></div>
            <div><label className="mb-2 block text-sm font-medium">Personal notes</label><Textarea value={personalNotes} onChange={(event) => setPersonalNotes(event.target.value)} placeholder="Add anything you want to remember in your own words..." /></div>
            <Alert><ShieldCheck className="h-4 w-4" /><AlertTitle>For personal preparation only</AlertTitle><AlertDescription>This AI-assisted summary is not a diagnosis, assessment, or clinical record. Nothing is emailed, uploaded to a therapist, or shared automatically.</AlertDescription></Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const templateDefinitions = [
  { id: 'initial', title: 'Initial email inquiry', body: `Hi [Therapist Name],\n\nI'm looking for support with [Area of Concern] and wanted to ask whether you are accepting new clients. My availability is [Availability], and my insurance is [Insurance].\n\nCould you share a little about your approach and next steps?\n\nThank you.` },
  { id: 'consultation', title: 'Request a consultation', body: `Hi [Therapist Name],\n\nI'm looking for support with [Area of Concern]. Do you offer a brief consultation so I can learn about your approach and whether we may be a good fit? I am generally available [Availability].\n\nThank you.` },
  { id: 'pricing', title: 'Ask about insurance and pricing', body: `Hi [Therapist Name],\n\nBefore scheduling, could you let me know your session fee, whether you accept [Insurance], and whether you offer sliding-scale spaces or out-of-network paperwork?\n\nThank you.` },
  { id: 'followup', title: 'Follow up after no response', body: `Hi [Therapist Name],\n\nI'm following up on my earlier message about therapy for [Area of Concern]. I know schedules can be busy. If you are not accepting clients, I would appreciate any referral suggestions you may have.\n\nThank you.` },
];

const FindingTherapistTab = () => {
  const [fields, setFields] = useState({ therapist: '', concern: '', availability: '', insurance: '' });
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [consultationChecks, setConsultationChecks] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  const renderTemplate = useCallback((template: typeof templateDefinitions[number]) => (custom[template.id] || template.body)
    .split('[Therapist Name]').join(fields.therapist || '[Therapist Name]')
    .split('[Area of Concern]').join(fields.concern || '[Area of Concern]')
    .split('[Availability]').join(fields.availability || '[Availability]')
    .split('[Insurance]').join(fields.insurance || '[Insurance]'), [custom, fields]);

  const questions = [
    'How do you typically structure sessions?',
    'Have you worked with concerns similar to mine?',
    'What approaches do you use, and how would we choose one?',
    'How do you and your clients review progress?',
    'What are your fees, insurance policies, and availability?',
    'What happens if either of us feels the fit is not right?',
  ];

  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Personalize outreach templates</CardTitle><CardDescription>Fill in only what you want to share. These messages are copied to your clipboard—Therabot never sends them.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Input placeholder="Therapist's name" value={fields.therapist} onChange={(event) => setFields({ ...fields, therapist: event.target.value })} /><Input placeholder="Area of concern" value={fields.concern} onChange={(event) => setFields({ ...fields, concern: event.target.value })} /><Input placeholder="Your availability" value={fields.availability} onChange={(event) => setFields({ ...fields, availability: event.target.value })} /><Input placeholder="Insurance or self-pay" value={fields.insurance} onChange={(event) => setFields({ ...fields, insurance: event.target.value })} /></CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {templateDefinitions.map((template) => (
          <Card key={template.id}><CardHeader><CardTitle className="text-lg">{template.title}</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea className="min-h-52" value={renderTemplate(template)} onChange={(event) => setCustom({ ...custom, [template.id]: event.target.value })} /><Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(renderTemplate(template)); toast({ title: 'Template copied' }); }}><ClipboardCopy className="mr-2 h-4 w-4" /> Copy message</Button></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> 15-minute consultation checklist</CardTitle><CardDescription>A consultation is also your chance to notice whether you feel respected and comfortable asking questions. Not every therapist offers free consultations.</CardDescription></CardHeader><CardContent className="space-y-3">{questions.map((question, index) => <label key={question} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40"><Checkbox checked={consultationChecks[index] || false} onCheckedChange={(checked) => setConsultationChecks({ ...consultationChecks, [index]: checked === true })} /><span className={consultationChecks[index] ? 'text-muted-foreground line-through' : ''}>{question}</span></label>)}</CardContent></Card>
    </div>
  );
};

const suggestedSteps = [
  'Check my insurance coverage or therapy budget',
  'Identify the type of support I am looking for',
  'Bookmark three therapist profiles',
  'Prepare one outreach message',
  'Contact one therapist',
  'Prepare questions for a consultation',
  'Generate a session brief before my first appointment',
];

const NextStepsTab = () => {
  const [steps, setSteps] = useState<TherapyNextStep[]>([]);
  const [newStep, setNewStep] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let saved = await therapyNextStepService.list();
      if (saved.length === 0) saved = await Promise.all(suggestedSteps.map((title, index) => therapyNextStepService.create(title, index)));
      setSteps(saved);
      setUsingLocalFallback(therapyNextStepService.isUsingLocalFallback());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load your next steps.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (step: TherapyNextStep, changes: Partial<Pick<TherapyNextStep, 'title' | 'completed' | 'skipped'>>) => {
    const optimistic = { ...step, ...changes };
    setSteps((current) => current.map((item) => item.id === step.id ? optimistic : item));
    try {
      const saved = await therapyNextStepService.update(step.id, changes);
      setSteps((current) => current.map((item) => item.id === step.id ? saved : item));
    } catch (cause) {
      setSteps((current) => current.map((item) => item.id === step.id ? step : item));
      toast({ title: 'Could not update step', description: cause instanceof Error ? cause.message : 'Please try again.', variant: 'destructive' });
    }
  };

  const add = async () => {
    if (!newStep.trim()) return;
    try {
      const saved = await therapyNextStepService.create(newStep.trim(), steps.length);
      setSteps([...steps, saved]);
      setNewStep('');
    } catch (cause) {
      toast({ title: 'Could not add step', description: cause instanceof Error ? cause.message : 'Please try again.', variant: 'destructive' });
    }
  };

  const completed = steps.filter((step) => step.completed).length;
  const relevant = steps.filter((step) => !step.skipped).length;
  const progress = relevant ? (completed / relevant) * 100 : 0;

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" /> Loading your next steps...</div>;

  return (
    <div className="space-y-6">
      <Card className="border-[#DED3C7] bg-[#F1EAE1]"><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /> One small step at a time</CardTitle><CardDescription>No streaks, deadlines, or guilt. Edit the plan, skip what does not apply, and move at your own pace.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-3"><Progress value={progress} className="h-2 flex-1" /><span className="text-sm text-muted-foreground">{completed} complete</span></div></CardContent></Card>
      {error && <Alert variant="destructive"><AlertTitle>Database setup needed</AlertTitle><AlertDescription>{error} Apply the new Prepare for Therapy Supabase migration, then try again.</AlertDescription></Alert>}
      {usingLocalFallback && <Alert><AlertTitle>Saved on this device</AlertTitle><AlertDescription>Your next steps are working and saved in this browser. Apply the Prepare for Therapy Supabase migration to sync them across devices.</AlertDescription></Alert>}
      {!error && <Card><CardContent className="space-y-3 pt-6">{steps.map((step) => <div key={step.id} className={`flex items-center gap-2 rounded-xl border p-3 ${step.skipped ? 'bg-muted/30 opacity-60' : ''}`}><Checkbox checked={step.completed} disabled={step.skipped} onCheckedChange={(checked) => update(step, { completed: checked === true })} aria-label={`Mark ${step.title} complete`} /><Input value={step.title} disabled={step.skipped} onChange={(event) => setSteps(steps.map((item) => item.id === step.id ? { ...item, title: event.target.value } : item))} onBlur={(event) => update(step, { title: event.target.value.trim() || step.title })} className={`border-0 bg-transparent shadow-none ${step.completed ? 'text-muted-foreground line-through' : ''}`} /><Button size="icon" variant="ghost" onClick={() => update(step, { skipped: !step.skipped, completed: false })} aria-label={step.skipped ? 'Restore step' : 'Skip step'}><SkipForward className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={async () => { await therapyNextStepService.remove(step.id); setSteps(steps.filter((item) => item.id !== step.id)); }} aria-label="Remove step"><Trash2 className="h-4 w-4" /></Button></div>)}<Separator /><div className="flex gap-2"><Input value={newStep} onChange={(event) => setNewStep(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && add()} placeholder="Add a step that feels useful..." /><Button onClick={add}><Plus className="mr-2 h-4 w-4" /> Add</Button></div></CardContent></Card>}
    </div>
  );
};

const PrepareForTherapy = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto h-full w-full max-w-6xl space-y-6 overflow-y-auto bg-[#F5F0E9] px-5 pb-10 pt-6 text-[#302A26] sm:px-8 [&_.bg-background]:bg-[#FAF7F2] [&_.bg-card]:bg-[#FAF7F2] [&_.bg-primary]:bg-[#302A26] [&_.border]:border-[#DED3C7] [&_.text-card-foreground]:text-[#302A26] [&_.text-foreground]:text-[#302A26] [&_.text-muted-foreground]:text-[#87776C] [&_.text-primary]:text-[#937E6B] [&_input]:border-[#D8CABC] [&_input]:bg-[#FAF7F2] [&_input]:text-[#302A26] [&_textarea]:border-[#D8CABC] [&_textarea]:bg-[#FAF7F2] [&_textarea]:text-[#302A26]">
    <section className="rounded-2xl border border-[#DED3C7] bg-[#FAF7F2] p-6 md:p-8">
      <div className="flex items-start gap-4"><div className="rounded-xl bg-[#E9DFD4] p-3 text-[#937E6B]"><BookOpenCheck className="h-7 w-7" /></div><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#937E6B]">A companion for the next step</p><h1 className="text-3xl font-black tracking-[-0.04em] text-[#302A26]">Prepare for therapy</h1><p className="mt-3 max-w-3xl leading-6 text-[#87776C]">Organize what you want to discuss, make reaching out feel more manageable, and prepare for appointments without replacing professional care.</p></div></div>
    </section>
    <Tabs defaultValue="brief" className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl border border-[#DED3C7] bg-[#E9DFD4] p-1 sm:grid-cols-3">
        <TabsTrigger value="brief" className="gap-2 py-3 text-[#796353] data-[state=active]:bg-[#FAF7F2] data-[state=active]:text-[#302A26] data-[state=active]:shadow-none"><FileHeart className="h-4 w-4" /> My Session Brief</TabsTrigger>
        <TabsTrigger value="finding" className="gap-2 py-3 text-[#796353] data-[state=active]:bg-[#FAF7F2] data-[state=active]:text-[#302A26] data-[state=active]:shadow-none"><Search className="h-4 w-4" /> Finding a Therapist</TabsTrigger>
        <TabsTrigger value="steps" className="gap-2 py-3 text-[#796353] data-[state=active]:bg-[#FAF7F2] data-[state=active]:text-[#302A26] data-[state=active]:shadow-none"><CheckCircle2 className="h-4 w-4" /> My Next Steps</TabsTrigger>
      </TabsList>
      <TabsContent value="brief" className="mt-6"><SessionBriefTab /></TabsContent>
      <TabsContent value="finding" className="mt-6"><FindingTherapistTab /></TabsContent>
      <TabsContent value="steps" className="mt-6"><NextStepsTab /></TabsContent>
    </Tabs>
  </motion.div>
);

export default PrepareForTherapy;
