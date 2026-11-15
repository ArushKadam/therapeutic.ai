import { createClient } from '@supabase/supabase-js';
import type { MoodAnalysis, MoodType } from './gemini';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  content: string;
  mood?: string;
  ai_analysis?: string;
  _isPromptBased?: boolean; // Custom flag for prompt-based entries
}

export interface DailyCheckin {
    id: string;
    user_id: string;
    mood: string;
    reflection: string;
    created_at: string;
}

export interface MoodEntry {
    id: string;
    user_id: string;
    mood: string;
    intensity: number;
    created_at: string;
}

// Enhanced mood analysis interfaces
export interface MoodAnalysisEntry {
    id: string;
    user_id: string;
    source: 'journal' | 'voice' | 'chat';
    source_id: string; // ID of the related journal entry, conversation, etc.
    primary_mood: MoodType;
    secondary_mood?: MoodType;
    intensity: number;
    confidence: number;
    reasoning: string;
    key_emotions: string[];
    raw_content: string; // The original text that was analyzed
    created_at: string;
    duration?: number; // Duration in minutes
}

export interface DailyMoodSummary {
    id: string;
    user_id: string;
    date: string; // YYYY-MM-DD format
    primary_mood: MoodType;
    secondary_mood?: MoodType;
    average_intensity: number;
    overall_confidence: number;
    reasoning: string;
    key_emotions: string[];
    analysis_count: number; // Number of analyses that went into this summary
    last_updated: string;
    created_at: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  description: string;
  target_area: string;
  confidence: number;
  week_of: string;
  insights: any; // jsonb
  completed: boolean;
  exercises?: Exercise[]; // This will be populated after fetching
}

export interface Exercise {
  id:string;
  plan_id: string;
  user_id: string;
  created_at: string;
  title: string;
  description: string;
  type: string;
  duration: number;
  difficulty: string;
  completed: boolean;
  due_date: string;
  instructions: any; // jsonb
  benefits: any; // jsonb
}

// Database operations
export const conversationService = {
  async list(): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(title: string): Promise<Conversation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('conversations')
      .insert({ title, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTimestamp(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async updateTitle(id: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    // First delete all messages in the conversation
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id);
    
    if (messagesError) throw messagesError;

    // Then delete the conversation
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);
    
    if (conversationError) throw conversationError;
  }
};

export const messageService = {
  async list(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(conversationId: string, role: 'user' | 'model', content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const journalService = {
    async list(): Promise<JournalEntry[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user found for journal list');
            throw new Error("User not authenticated");
        }

        console.log('Fetching journal entries for user:', user.id);
        const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Supabase error fetching journal entries:', error);
            throw error;
        }
        
        console.log('Journal entries fetched:', data?.length || 0);
        return data || [];
    },
    async create(entry: Omit<JournalEntry, 'id' | 'created_at' | 'user_id'>): Promise<JournalEntry> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('No authenticated user found');
            throw new Error("User not authenticated");
        }

        console.log('Creating journal entry for user:', user.id);
        const { data, error } = await supabase
            .from('journal_entries')
            .insert([{ ...entry, user_id: user.id }])
            .select()
            .single();
            
        if (error) {
            console.error('Supabase error creating journal entry:', error);
            throw error;
        }
        
        console.log('Journal entry created successfully:', data);
        return data;
    },
    async update(id: string, entry: Partial<Omit<JournalEntry, 'id' | 'created_at' | 'user_id'>>): Promise<JournalEntry> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('journal_entries')
            .update(entry)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async delete(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);
        if (error) throw error;
    }
};

export const dailyCheckinService = {
    async list(): Promise<DailyCheckin[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
    async create(checkin: Omit<DailyCheckin, 'id' | 'created_at' | 'user_id'>): Promise<DailyCheckin> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('daily_checkins')
            .insert({ ...checkin, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

export const moodService = {
    async list(): Promise<MoodEntry[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('mood_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
    async create(mood: Omit<MoodEntry, 'id' | 'created_at' | 'user_id'>): Promise<MoodEntry> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('mood_entries')
            .insert({ ...mood, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

// Enhanced mood analysis services
export const moodAnalysisService = {
    async list(limit?: number): Promise<MoodAnalysisEntry[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        let query = supabase
            .from('mood_analyses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async create(analysis: MoodAnalysis, sourceId: string, rawContent: string, duration?: number): Promise<MoodAnalysisEntry> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const entry: Omit<MoodAnalysisEntry, 'id' | 'created_at'> = {
            user_id: user.id,
            source: analysis.source,
            source_id: sourceId,
            primary_mood: analysis.primaryMood,
            secondary_mood: analysis.secondaryMood,
            intensity: analysis.intensity,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            key_emotions: analysis.keyEmotions,
            raw_content: rawContent,
            ...(duration !== undefined ? { duration } : {})
        };

        const { data, error } = await supabase
            .from('mood_analyses')
            .insert(entry)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getByDate(date: string): Promise<MoodAnalysisEntry[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        const { data, error } = await supabase
            .from('mood_analyses')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString())
            .lt('created_at', endDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getBySource(source: 'journal' | 'voice' | 'chat', sourceId: string): Promise<MoodAnalysisEntry[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('mood_analyses')
            .select('*')
            .eq('user_id', user.id)
            .eq('source', source)
            .eq('source_id', sourceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};

export const dailyMoodService = {
    async list(limit?: number): Promise<DailyMoodSummary[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        let query = supabase
            .from('daily_mood_summaries')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getByDate(date: string): Promise<DailyMoodSummary | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('daily_mood_summaries')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', date)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
        return data || null;
    },

    async upsert(summary: Omit<DailyMoodSummary, 'id' | 'user_id' | 'created_at'>): Promise<DailyMoodSummary> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const entry = {
            ...summary,
            user_id: user.id
        };

        const { data, error } = await supabase
            .from('daily_mood_summaries')
            .upsert(entry, { 
                onConflict: 'user_id,date',
                ignoreDuplicates: false 
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateFromAnalyses(date: string): Promise<DailyMoodSummary> {
        const analyses = await moodAnalysisService.getByDate(date);
        
        if (analyses.length === 0) {
            // Create a default entry if no analyses exist
            const defaultSummary: Omit<DailyMoodSummary, 'id' | 'user_id' | 'created_at'> = {
                date,
                primary_mood: 'neutral',
                average_intensity: 5,
                overall_confidence: 0.1,
                reasoning: "No mood data recorded for this day",
                key_emotions: [],
                analysis_count: 0,
                last_updated: new Date().toISOString()
            };
            return await this.upsert(defaultSummary);
        }

        // Keep the day's current mood anchored to the newest journal/chat/voice
        // analysis, while using a recency-weighted average for the trend values.
        const latestAnalysis = analyses[analyses.length - 1];
        const totalWeight = analyses.reduce((sum, _analysis, index) => sum + index + 1, 0);
        const averageIntensity = analyses.reduce((sum, analysis, index) => sum + analysis.intensity * (index + 1), 0) / totalWeight;
        const averageConfidence = analyses.reduce((sum, analysis, index) => sum + analysis.confidence * (index + 1), 0) / totalWeight;

        // Keep the distribution for analytics, but let the newest entry drive
        // the label shown as today's current mood.
        const primaryMood = latestAnalysis.primary_mood;

        // Show emotions from the newest entry first, then retain recent context.
        const allEmotions = [...new Set([...analyses].reverse().flatMap(a => a.key_emotions))];
        const topEmotions = allEmotions.slice(0, 10); // Limit to top 10

        // Generate reasoning
        const sourceCounts = analyses.reduce((counts, a) => {
            counts[a.source] = (counts[a.source] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);

        const sourcesList = Object.entries(sourceCounts)
            .map(([source, count]) => `${count} ${source}`)
            .join(', ');

        const reasoning = `Based on ${analyses.length} mood analyses from ${sourcesList}. Most recent entry: ${primaryMood}.`;

        const summary: Omit<DailyMoodSummary, 'id' | 'user_id' | 'created_at'> = {
            date,
            primary_mood: primaryMood,
            secondary_mood: undefined, // Could be enhanced to find secondary mood
            average_intensity: Math.round(averageIntensity * 10) / 10,
            overall_confidence: Math.round(averageConfidence * 100) / 100,
            reasoning,
            key_emotions: topEmotions,
            analysis_count: analyses.length,
            last_updated: new Date().toISOString()
        };

        return await this.upsert(summary);
    }
};

export const planService = {
  async list(): Promise<WeeklyPlan[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: plans, error: plansError } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('week_of', { ascending: false });
    
    if (plansError) throw plansError;
    if (!plans) return [];

    // For each plan, fetch its exercises
    const plansWithExercises = await Promise.all(
      plans.map(async (plan) => {
        const { data: exercises, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .eq('plan_id', plan.id)
          .order('due_date', { ascending: true });
        
        if (exercisesError) {
          console.error(`Error fetching exercises for plan ${plan.id}:`, exercisesError);
          return { ...plan, exercises: [] };
        }
        return { ...plan, exercises: exercises || [] };
      })
    );

    return plansWithExercises;
  },

  async create(plan: Omit<WeeklyPlan, 'id' | 'user_id' | 'created_at' | 'completed' | 'exercises'>, exercises: Omit<Exercise, 'id' | 'plan_id' | 'user_id' | 'created_at' | 'completed'>[]): Promise<WeeklyPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const planPayload = { ...plan, user_id: user.id };
    const exercisesPayload = exercises.map(e => ({ ...e, user_id: user.id }));

    // Use a transaction to ensure both plan and exercises are created
    const { data, error } = await supabase.rpc('create_plan_with_exercises', {
      plan_data: planPayload,
      exercises_data: exercisesPayload
    });

    if (error) {
      console.error('Error creating plan with exercises:', error);
      throw error;
    }
    
    // The RPC function returns a jsonb object, which needs to be cast back to WeeklyPlan
    return data as WeeklyPlan;
  },

  async updateExerciseCompletion(exerciseId: string, completed: boolean): Promise<Exercise> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('exercises')
      .update({ completed })
      .eq('id', exerciseId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePlanCompletion(planId: string, completed: boolean): Promise<WeeklyPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const { data, error } = await supabase
      .from('weekly_plans')
      .update({ completed })
      .eq('id', planId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export interface TherapyBookmark {
  id: string;
  user_id: string;
  source_type: 'chat_message' | 'journal_entry';
  source_id: string;
  content: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface SleepCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  hours: number;
  quality: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TherapyNextStep {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  skipped: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const requireUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user;
};

const isMissingTherapyStepsTable = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === 'PGRST205' ||
  error?.code === '42P01' ||
  /therapy_next_steps.*(?:not found|does not exist)|could not find the table.*therapy_next_steps/i.test(error?.message || '');

const therapyStepsStorageKey = (userId: string) => `therabot:therapy-next-steps:${userId}`;
let usingLocalTherapyStepsFallback = false;

const readLocalTherapySteps = (userId: string): TherapyNextStep[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(therapyStepsStorageKey(userId)) || '[]') as TherapyNextStep[];
  } catch {
    return [];
  }
};

const writeLocalTherapySteps = (userId: string, steps: TherapyNextStep[]) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(therapyStepsStorageKey(userId), JSON.stringify(steps));
  }
};

export const therapyBookmarkService = {
  async list(): Promise<TherapyBookmark[]> {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('therapy_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getBySource(sourceType: TherapyBookmark['source_type'], sourceId: string): Promise<TherapyBookmark | null> {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('therapy_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async save(input: Pick<TherapyBookmark, 'source_type' | 'source_id' | 'content' | 'note'>): Promise<TherapyBookmark> {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('therapy_bookmarks')
      .upsert(
        { ...input, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,source_type,source_id' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const user = await requireUser();
    const { error } = await supabase
      .from('therapy_bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
  },
};

export const sleepCheckinService = {
  async list(startDate?: string, endDate?: string): Promise<SleepCheckin[]> {
    const user = await requireUser();
    let query = supabase
      .from('sleep_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('checkin_date', { ascending: false });
    if (startDate) query = query.gte('checkin_date', startDate);
    if (endDate) query = query.lte('checkin_date', endDate);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async save(input: Pick<SleepCheckin, 'checkin_date' | 'hours' | 'quality' | 'notes'>): Promise<SleepCheckin> {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('sleep_checkins')
      .upsert(
        { ...input, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,checkin_date' }
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export const therapyNextStepService = {
  isUsingLocalFallback(): boolean {
    return usingLocalTherapyStepsFallback;
  },

  async list(): Promise<TherapyNextStep[]> {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('therapy_next_steps')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });
    if (error) {
      if (isMissingTherapyStepsTable(error)) {
        usingLocalTherapyStepsFallback = true;
        return readLocalTherapySteps(user.id);
      }
      throw error;
    }
    return data || [];
  },

  async create(title: string, sortOrder: number): Promise<TherapyNextStep> {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('therapy_next_steps')
      .insert({ title, sort_order: sortOrder, user_id: user.id })
      .select()
      .single();
    if (error) {
      if (isMissingTherapyStepsTable(error)) {
        usingLocalTherapyStepsFallback = true;
        const now = new Date().toISOString();
        const step: TherapyNextStep = { id: crypto.randomUUID(), user_id: user.id, title, completed: false, skipped: false, sort_order: sortOrder, created_at: now, updated_at: now };
        writeLocalTherapySteps(user.id, [...readLocalTherapySteps(user.id), step]);
        return step;
      }
      throw error;
    }
    return data;
  },

  async update(id: string, changes: Partial<Pick<TherapyNextStep, 'title' | 'completed' | 'skipped' | 'sort_order'>>): Promise<TherapyNextStep> {
    const user = await requireUser();
    const { data, error } = await supabase
      .from('therapy_next_steps')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) {
      if (isMissingTherapyStepsTable(error)) {
        usingLocalTherapyStepsFallback = true;
        const updated = readLocalTherapySteps(user.id).map((step) => step.id === id ? { ...step, ...changes, updated_at: new Date().toISOString() } : step);
        writeLocalTherapySteps(user.id, updated);
        const step = updated.find((item) => item.id === id);
        if (step) return step;
      }
      throw error;
    }
    return data;
  },

  async remove(id: string): Promise<void> {
    const user = await requireUser();
    const { error } = await supabase
      .from('therapy_next_steps')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      if (isMissingTherapyStepsTable(error)) {
        usingLocalTherapyStepsFallback = true;
        writeLocalTherapySteps(user.id, readLocalTherapySteps(user.id).filter((step) => step.id !== id));
        return;
      }
      throw error;
    }
  },
};
