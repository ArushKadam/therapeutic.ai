import { generateGeminiContent } from '@/services/gemini';
import {
  conversationService,
  dailyCheckinService,
  journalService,
  messageService,
  moodAnalysisService,
  sleepCheckinService,
  therapyBookmarkService,
  type DailyCheckin,
  type SleepCheckin,
  type TherapyBookmark,
} from '@/services/supabase';

export type BriefSectionKey =
  | 'feelings'
  | 'moodPatterns'
  | 'stressors'
  | 'sleepHabits'
  | 'discussionTopics';

export interface TherapyBrief {
  feelings: string;
  moodPatterns: string;
  stressors: string;
  sleepHabits: string;
  discussionTopics: string;
  questions: string[];
}

export interface TherapySourceSelection {
  chats: boolean;
  journals: boolean;
  moods: boolean;
  sleep: boolean;
  bookmarks: boolean;
}

export interface TherapyPreparationData {
  startDate: string;
  endDate: string;
  chats: Array<{ date: string; text: string }>;
  journals: Array<{ date: string; title: string; text: string; mood?: string }>;
  moods: Array<{ date: string; mood: string; reflection: string }>;
  moodAnalyses: Array<{ date: string; mood: string; intensity: number; emotions: string[] }>;
  sleep: SleepCheckin[];
  bookmarks: TherapyBookmark[];
}

const inRange = (value: string, startDate: string, endDate: string) => {
  const time = new Date(value).getTime();
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T23:59:59.999`).getTime();
  return time >= start && time <= end;
};

const trimRecord = (value: string, max = 800) => value.trim().slice(0, max);

export async function collectTherapyPreparationData(
  startDate: string,
  endDate: string,
  sources: TherapySourceSelection,
): Promise<TherapyPreparationData> {
  const [journals, checkins, analyses, sleep, bookmarks, conversations] = await Promise.all([
    sources.journals ? journalService.list() : Promise.resolve([]),
    sources.moods ? dailyCheckinService.list() : Promise.resolve([]),
    sources.moods ? moodAnalysisService.list(200) : Promise.resolve([]),
    sources.sleep ? sleepCheckinService.list(startDate, endDate).catch(() => []) : Promise.resolve([]),
    sources.bookmarks ? therapyBookmarkService.list().catch(() => []) : Promise.resolve([]),
    sources.chats ? conversationService.list() : Promise.resolve([]),
  ]);

  const chatMessages = sources.chats
    ? (await Promise.all(conversations.slice(0, 30).map((conversation) => messageService.list(conversation.id))))
      .flat()
      .filter((message) => message.role === 'user' && inRange(message.created_at, startDate, endDate))
      .slice(-60)
      .map((message) => ({ date: message.created_at, text: trimRecord(message.content) }))
    : [];

  return {
    startDate,
    endDate,
    chats: chatMessages,
    journals: journals
      .filter((entry) => inRange(entry.created_at, startDate, endDate))
      .slice(0, 40)
      .map((entry) => ({
        date: entry.created_at,
        title: trimRecord(entry.title, 120),
        text: trimRecord(entry.content, 1200),
        mood: entry.mood,
      })),
    moods: (checkins as DailyCheckin[])
      .filter((entry) => inRange(entry.created_at, startDate, endDate))
      .slice(0, 60)
      .map((entry) => ({ date: entry.created_at, mood: entry.mood, reflection: trimRecord(entry.reflection, 500) })),
    moodAnalyses: analyses
      .filter((entry) => inRange(entry.created_at, startDate, endDate))
      .slice(0, 80)
      .map((entry) => ({
        date: entry.created_at,
        mood: entry.primary_mood,
        intensity: Number(entry.intensity),
        emotions: entry.key_emotions || [],
      })),
    sleep,
    bookmarks: bookmarks.slice(0, 30),
  };
}

export const countSelectedRecords = (data: TherapyPreparationData) => ({
  chats: data.chats.length,
  journals: data.journals.length,
  moods: data.moods.length + data.moodAnalyses.length,
  sleep: data.sleep.length,
  bookmarks: data.bookmarks.length,
});

const compactData = (data: TherapyPreparationData) => ({
  dateRange: { start: data.startDate, end: data.endDate },
  directUserStatements: {
    chats: data.chats,
    journals: data.journals,
    moodCheckins: data.moods,
    sleepCheckins: data.sleep.map(({ checkin_date, hours, quality, notes }) => ({ checkin_date, hours, quality, notes: trimRecord(notes, 500) })),
    bookmarkedMoments: data.bookmarks.map(({ content, note, source_type, created_at }) => ({
      source: source_type,
      date: created_at,
      originalText: trimRecord(content, 1000),
      whyItMatters: trimRecord(note, 500),
    })),
  },
  existingMoodAnalyses: data.moodAnalyses,
});

const systemInstruction = `You help a user prepare for a conversation with a licensed therapist. You are not diagnosing or creating a clinical record.
Use plain, compassionate, non-clinical language. Do not invent facts, causes, diagnoses, risks, sleep patterns, or trends. Distinguish direct user statements from inferred themes with wording such as "I wrote..." versus "A possible theme may be...". Only describe a recurring pattern when multiple records support it. Never claim sleep caused a mood. Preserve the meaning of bookmarked text and prioritize it. Return valid JSON only.`;

const parseJson = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('The AI response could not be read. Please try again.');
  return JSON.parse(match[0]);
};

export async function generateTherapyBrief(data: TherapyPreparationData): Promise<TherapyBrief> {
  const prompt = `Create a concise therapy preparation summary from only the selected records below.
Return exactly this JSON shape with strings and 2-3 short editable questions:
{"feelings":"","moodPatterns":"","stressors":"","sleepHabits":"","discussionTopics":"","questions":["",""]}

If information is insufficient for a section, say so plainly. Do not fill gaps. Keep each section under 110 words.

SELECTED RECORDS:
${JSON.stringify(compactData(data))}`;

  const parsed = parseJson(await generateGeminiContent(prompt, systemInstruction)) as Partial<TherapyBrief>;
  const bookmarks = data.bookmarks
    .map((bookmark) => `“${trimRecord(bookmark.content, 240)}”${bookmark.note ? ` — ${trimRecord(bookmark.note, 140)}` : ''}`)
    .join('\n');

  return {
    feelings: String(parsed.feelings || 'There was not enough selected information to summarize how I have been feeling.'),
    moodPatterns: String(parsed.moodPatterns || 'There was not enough selected information to identify a recurring mood pattern.'),
    stressors: String(parsed.stressors || 'There was not enough selected information to identify recurring stressors.'),
    sleepHabits: data.sleep.length
      ? String(parsed.sleepHabits || 'The selected sleep check-ins did not show a clear pattern.')
      : 'I do not have enough sleep check-ins in this date range to summarize sleep or daily habits.',
    discussionTopics: bookmarks || String(parsed.discussionTopics || 'I have not added any bookmarked moments for this date range.'),
    questions: Array.isArray(parsed.questions)
      ? parsed.questions.map(String).filter(Boolean).slice(0, 3)
      : ['What feels most important for us to focus on first?'],
  };
}

export async function regenerateTherapySection(
  section: BriefSectionKey,
  data: TherapyPreparationData,
): Promise<string> {
  const labels: Record<BriefSectionKey, string> = {
    feelings: "How I've Been Feeling",
    moodPatterns: 'Mood Patterns',
    stressors: 'Recurring Stressors',
    sleepHabits: 'Sleep and Daily Habits',
    discussionTopics: 'Things I Want to Discuss',
  };
  if (section === 'sleepHabits' && data.sleep.length === 0) {
    return 'I do not have enough sleep check-ins in this date range to summarize sleep or daily habits.';
  }
  const prompt = `Rewrite only the therapy-preparation section titled "${labels[section]}" from the selected records below. Return JSON exactly as {"text":"..."}. Keep it under 110 words and follow all safety rules.
${JSON.stringify(compactData(data))}`;
  const parsed = parseJson(await generateGeminiContent(prompt, systemInstruction));
  return String(parsed.text || 'There was not enough selected information for this section.');
}
