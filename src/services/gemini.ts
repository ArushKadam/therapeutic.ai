import { supabase } from "@/services/supabase";
import { detectCurrentSafetyConcern, getImmediateSafetyResponse } from "@/lib/safety-language";

// gemini-1.5 and gemini-pro were shut down. This is the current low-latency replacement.
export const GEMINI_MODEL = "gemini-3.5-flash-lite";

type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };
export type GeminiSession = { systemPrompt: string; history: GeminiContent[] };

type GeminiApiResponse = { text?: string; error?: string };

async function readGeminiResponse(response: Response): Promise<GeminiApiResponse> {
  const raw = await response.text();
  if (!raw.trim()) {
    throw new Error(
      response.status >= 500
        ? 'The AI backend is not reachable. Start the Therabot backend on port 3001 and check backend/.env.'
        : 'The AI service returned an empty response.',
    );
  }
  try {
    return JSON.parse(raw) as GeminiApiResponse;
  } catch {
    throw new Error(
      response.ok
        ? 'The AI service returned a response that Therabot could not read.'
        : `The AI request failed (${response.status}). Check that the backend is running and configured.`,
    );
  }
}

export async function generateGeminiContent(prompt: string, systemInstruction?: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sign in to use the AI features.");

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/gemini/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ prompt, systemInstruction }),
  });
  const result = await readGeminiResponse(response);
  if (!response.ok) throw new Error(result.error || "Gemini request failed.");
  if (!result.text) throw new Error('The AI service returned an empty response.');
  return result.text;
}

// Predefined mood categories
export const MOOD_CATEGORIES = {
  happy: { emoji: '😊', color: '#4E85A2', description: 'Joyful, content, positive' },
  peaceful: { emoji: '😌', color: 'bg-blue-500', description: 'Calm, serene, relaxed' },
  excited: { emoji: '🤩', color: 'bg-yellow-500', description: 'Energetic, enthusiastic, motivated' },
  sad: { emoji: '😔', color: 'bg-blue-600', description: 'Down, melancholy, sorrowful' },
  anxious: { emoji: '😰', color: 'bg-red-500', description: 'Worried, nervous, stressed' },
  frustrated: { emoji: '😠', color: 'bg-red-600', description: 'Irritated, annoyed, overwhelmed' },
  neutral: { emoji: '😐', color: 'bg-gray-500', description: 'Balanced, stable, unremarkable' },
  bored: { emoji: '🥱', color: 'bg-gray-400', description: 'Low mental stimulation; disengaged from environment' },
  confused: { emoji: '😵‍💫', color: 'bg-purple-400', description: 'Lacking understanding or clarity; mentally lost' },
  disgusted: { emoji: '🤢', color: 'bg-green-700', description: 'Strong aversion or repulsion, often moral or physical' },
  determined: { emoji: '🫡', color: 'bg-orange-600', description: 'High internal drive despite obstacles (not excited or happy)' },
  embarrassed: { emoji: '🫣', color: 'bg-pink-400', description: 'Self-conscious or awkward due to perceived judgment' },
  curious: { emoji: '🤓', color: 'bg-yellow-300', description: 'Actively wanting to learn or understand something' },
  burnt_out: { emoji: '🫠', color: 'bg-gray-700', description: 'Deep exhaustion from prolonged stress; emotionally depleted' },
  indecisive: { emoji: '🫤', color: 'bg-blue-300', description: 'Mentally stuck between options; hesitant and unsure' },
  skeptical: { emoji: '🤨', color: 'bg-yellow-800', description: 'Distrustful or doubtful of others\' intentions or ideas' },
  guarded: { emoji: '😶', color: 'bg-gray-600', description: 'Emotionally closed off; unwilling to be vulnerable' },
  mad: { emoji: '😡', color: 'bg-red-700', description: 'Very angry, enraged, or furious; intense displeasure or hostility' },
} as const;

export type MoodType = keyof typeof MOOD_CATEGORIES;

export interface MoodAnalysis {
  primaryMood: MoodType;
  secondaryMood?: MoodType;
  intensity: number; // 1-10 scale
  confidence: number; // 0-1 scale
  reasoning: string;
  keyEmotions: string[];
  timestamp: string;
  source: 'journal' | 'voice' | 'chat';
}

// Memoize the chat session to maintain conversation history
let chatSession: GeminiSession | null = null;

export const getChatSession = (systemPrompt: string): GeminiSession => {
  if (!chatSession || chatSession.systemPrompt !== systemPrompt) {
    chatSession = { systemPrompt, history: [] };
  }
  return chatSession;
};

export const sendMessageToGemini = async (session: GeminiSession, message: string): Promise<string> => {
  const immediateSafetyResponse = getImmediateSafetyResponse(message);
  if (immediateSafetyResponse) {
    session.history.push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: immediateSafetyResponse }] },
    );
    return immediateSafetyResponse;
  }

  try {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession?.access_token) throw new Error("Sign in to use the AI chat.");
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/gemini/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authSession.access_token}` },
      body: JSON.stringify({
        systemInstruction: session.systemPrompt,
        contents: [...session.history, { role: "user", parts: [{ text: message }] }],
      }),
    });
    const result = await readGeminiResponse(response);
    if (!response.ok) throw new Error(result.error || "Gemini request failed.");
    if (!result.text) throw new Error('The AI service returned an empty response.');
    session.history.push({ role: "user", parts: [{ text: message }] }, { role: "model", parts: [{ text: result.text }] });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Provide a generic, supportive error message to the user
    return "I'm finding it a little difficult to connect right now. Thank you for your patience. I'm still here to listen.";
  }
};

export const generateChatTitle = async (userMessage: string): Promise<string> => {
  if (detectCurrentSafetyConcern(userMessage)) return 'Support conversation';

  try {
    const title = (await generateGeminiContent(
      `Generate a short, meaningful title for this conversation starter: "${userMessage}"`,
      "Create a short title (2-5 words). Respond only with the title, without punctuation."
    )).trim();
    
    // Fallback to first few words if title is too long or empty
    if (!title || title.length > 50) {
      return userMessage.substring(0, 40).trim() + (userMessage.length > 40 ? "..." : "");
    }
    
    return title;
  } catch (error) {
    console.error("Error generating chat title:", error);
    // Fallback to truncated message
    return userMessage.substring(0, 40).trim() + (userMessage.length > 40 ? "..." : "");
  }
};

export async function analyzeJournalEntry(entryContent: string): Promise<string> {
  const prompt = `Analyze the sentiment and key themes of the following journal entry. Provide a brief, one-sentence summary. Entry: "${entryContent}"`;

  try {
    return await generateGeminiContent(prompt);
  } catch (error) {
    console.error("Error analyzing journal entry:", error);
    return "AI analysis could not be completed.";
  }
}

/**
 * Analyzes text content to determine mood and emotional state
 */
export async function analyzeMoodFromText(
  content: string, 
  source: 'journal' | 'voice' | 'chat',
  context?: string
): Promise<MoodAnalysis> {
  const safetyConcern = detectCurrentSafetyConcern(content);
  if (safetyConcern?.subject === 'self') {
    return {
      primaryMood: 'anxious',
      secondaryMood: 'sad',
      intensity: 9,
      confidence: 0.85,
      reasoning: 'This entry contains direct, current language about personal safety. Mood labels are only a rough reflection; prioritize safety and real-time support.',
      keyEmotions: ['distress', 'overwhelmed'],
      timestamp: new Date().toISOString(),
      source,
    };
  }
  if (safetyConcern?.subject === 'someone-else') {
    return {
      primaryMood: 'anxious',
      secondaryMood: 'sad',
      intensity: 7,
      confidence: 0.7,
      reasoning: 'This entry expresses concern about someone else’s safety. Mood labels are only a rough reflection; connect them with real-time support if they may be in danger.',
      keyEmotions: ['worried', 'concerned'],
      timestamp: new Date().toISOString(),
      source,
    };
  }

  const moodList = Object.entries(MOOD_CATEGORIES).map(([key, value]) => `- ${key}: ${value.description}`).join('\n');
  const systemInstruction = `You are an emotional wellbeing assistant that analyzes the user's mood from their words. This is not a diagnosis or clinical assessment.\n\nAvailable mood categories (always use one of these, never invent new ones):\n${moodList}\n\nIMPORTANT:\n- Read the whole statement and identify who is speaking, who the subject is, and whether a thought is current, hypothetical, quoted, or historical.\n- Do not infer current self-harm intent from keywords alone. Explicit denials such as “I do not want to kill myself” are denials, not intent.\n- Do not attribute another person's risk to the user; reflect the user's own expressed concern if they are worried about someone else. Ignore fictional/hypothetical examples when inferring the user's current risk.\n- If the user explicitly describes current self-harm or suicide thoughts, reflect distress (sad or anxious), not neutral.\n- If the meaning is unclear, represent uncertainty with lower confidence rather than inventing certainty.\n- If the user expresses strong anger, rage, or fury, use 'mad' as the primaryMood.\n- Always return a valid JSON object and no text outside it.\n\nReturn JSON with primaryMood, secondaryMood, intensity (1-10), confidence (0-1), reasoning, and keyEmotions.`;

  const prompt = `Analyze the mood and emotional state from this ${source} content:\n\nUser's entry: """${content}"""\n${context ? `Conversation context from Tethr (use only to resolve references; do not classify Tethr's words as the user's mood): """${context}"""` : ''}\n\nRespond with only the JSON object, no additional text.`;

  try {
    const text = (await generateGeminiContent(prompt, systemInstruction)).trim();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // Define allowed database mood values
    const allowedMoods = [
      'happy', 'peaceful', 'excited', 'sad', 'anxious', 'frustrated', 'neutral',
      'bored', 'confused', 'disgusted', 'determined', 'embarrassed', 'curious',
      'burnt_out', 'indecisive', 'skeptical', 'guarded', 'mad'
    ];

    // Validate and map primary mood
    let primaryMood = 'neutral';
    if (analysis.primaryMood && allowedMoods.includes(analysis.primaryMood)) {
      primaryMood = analysis.primaryMood;
    } else if (analysis.primaryMood) {
      // Try to map common variations
      const moodMappings = {
        'angry': 'mad',
        'rage': 'mad', 
        'furious': 'mad',
        'enraged': 'mad',
        'annoyed': 'frustrated',
        'irritated': 'frustrated',
        'upset': 'sad',
        'depressed': 'sad',
        'worried': 'anxious',
        'stressed': 'anxious',
        'calm': 'peaceful',
        'relaxed': 'peaceful',
        'joyful': 'happy',
        'content': 'happy',
        'tired': 'burnt_out',
        'exhausted': 'burnt_out'
      };
      primaryMood = moodMappings[analysis.primaryMood.toLowerCase()] || 'neutral';
    }

    // Validate secondary mood if present
    let secondaryMood = undefined;
    if (analysis.secondaryMood) {
      if (allowedMoods.includes(analysis.secondaryMood)) {
        secondaryMood = analysis.secondaryMood;
      }
    }

    // Validate and ensure required fields
    const validatedAnalysis: MoodAnalysis = {
      primaryMood: primaryMood as MoodType,
      secondaryMood: secondaryMood as MoodType | undefined,
      intensity: Math.max(1, Math.min(10, Number(analysis.intensity) || 5)),
      confidence: Math.max(0, Math.min(1, Number(analysis.confidence) || 0.5)),
      reasoning: analysis.reasoning || "Mood analysis completed",
      keyEmotions: Array.isArray(analysis.keyEmotions) ? analysis.keyEmotions.slice(0, 5) : [],
      timestamp: new Date().toISOString(),
      source
    };
    
    return validatedAnalysis;
  } catch (error) {
    console.error("Error analyzing mood from text:", error);
    // Do not store a fabricated neutral result when the model failed.
    throw error;
  }
}

/**
 * Combines multiple mood analyses to determine the dominant mood for the day
 */
export async function combineMoodAnalyses(analyses: MoodAnalysis[]): Promise<MoodAnalysis> {
  if (analyses.length === 0) {
    return {
      primaryMood: 'neutral',
      intensity: 5,
      confidence: 0.1,
      reasoning: "No data available for analysis",
      keyEmotions: [],
      timestamp: new Date().toISOString(),
      source: 'journal'
    };
  }

  if (analyses.length === 1) {
    return analyses[0];
  }

  const systemInstruction = `You are an expert emotional intelligence AI that combines multiple mood analyses to determine the overall dominant mood for a day.

Available mood categories:
${Object.entries(MOOD_CATEGORIES).map(([key, value]) => `- ${key}: ${value.description}`).join('\n')}

Your task is to analyze multiple mood data points and determine the most representative overall mood. Consider:
- Recency (more recent moods may be more representative)
- Intensity (stronger emotions may be more significant)
- Confidence levels (more confident analyses should weigh more)
- Overall emotional trajectory throughout the day

Return a JSON response with the same structure as individual analyses, representing the combined/dominant mood.`;

  const prompt = `Combine these mood analyses to determine the dominant mood for today:

${analyses.map((analysis, index) => `
Analysis ${index + 1} (${analysis.source}):
- Primary mood: ${analysis.primaryMood}
- Intensity: ${analysis.intensity}/10
- Confidence: ${Math.round(analysis.confidence * 100)}%
- Reasoning: ${analysis.reasoning}
- Time: ${new Date(analysis.timestamp).toLocaleTimeString()}
`).join('\n')}

Determine the most representative overall mood and respond with only the JSON object.`;

  try {
    const text = (await generateGeminiContent(prompt, systemInstruction)).trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      primaryMood: MOOD_CATEGORIES[analysis.primaryMood as MoodType] ? analysis.primaryMood : 'neutral',
      secondaryMood: analysis.secondaryMood && MOOD_CATEGORIES[analysis.secondaryMood as MoodType] ? analysis.secondaryMood : undefined,
      intensity: Math.max(1, Math.min(10, Number(analysis.intensity) || 5)),
      confidence: Math.max(0, Math.min(1, Number(analysis.confidence) || 0.5)),
      reasoning: analysis.reasoning || "Combined mood analysis",
      keyEmotions: Array.isArray(analysis.keyEmotions) ? analysis.keyEmotions.slice(0, 5) : [],
      timestamp: new Date().toISOString(),
      source: 'journal' // Default source for combined analysis
    };
  } catch (error) {
    console.error("Error combining mood analyses:", error);
    
    // Fallback: Use the most recent high-confidence analysis
    const sortedAnalyses = analyses
      .sort((a, b) => b.confidence - a.confidence)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return {
      ...sortedAnalyses[0],
      reasoning: "Combined from multiple analyses (fallback method)",
      timestamp: new Date().toISOString()
    };
  }
}
