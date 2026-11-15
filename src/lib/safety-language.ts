export type SafetyConcern = {
  subject: 'self' | 'someone-else';
};

const SELF_RISK_PATTERNS = [
  /\b(?:i\s+(?:want|wish|plan|intend|might|may|could|will|am going to|feel like|think about|am thinking about|keep thinking about|can't stop thinking about)\s+(?:to\s+)?(?:kill|hurt|harm|cut|injure)\s+myself|i(?:'m| am)\s+going to\s+(?:kill|hurt|harm|cut|injure)\s+myself|(?:kill|hurt|harm|cut|injure)(?:ing)?\s+myself)\b/i,
  /\b(?:i\s+(?:want|wish|plan|intend|might|may|could|will|feel like|think about|am thinking about|am going to)\s+(?:to\s+)?(?:die|be dead|end my life|take my life|not be alive)|i(?:'m| am)\s+going to\s+(?:die|end my life|take my life)|(?:end|take)\s+my\s+(?:own\s+)?life)\b/i,
  /\b(?:i(?:'m|\s+am|\s+feel|\s+have been feeling|\s+keep feeling)\s+suicidal|my suicidal thoughts|i\s+(?:have|am having|keep having)\s+(?:suicidal thoughts?|thoughts? of suicide)|i(?:'m|\s+am|\s+keep)\s+thinking about suicide|i\s+(?:am considering|have considered|plan to|am planning to)\s+suicide)\b/i,
  /\bi\s+(?:attempted|am attempting|tried to)\s+(?:suicide|to (?:kill|hurt|harm) myself)\b/i,
  /\bi\s+(?:want|plan|intend|might|may|could|will|am going to)\s+(?:to\s+)?attempt\s+(?:suicide|to (?:kill|hurt|harm) myself)\b/i,
  /\b(?:i\s+(?:can't|cannot|don't know if i can|am not sure i can)|not sure i can)\s+(?:keep myself safe|stop myself|avoid hurting myself)\b/i,
  /\b(?:i\s+(?:am|'m|have been|keep)\s+)?self[-\s]?harming\b/i,
];

const OTHER_PERSON_RISK = /\b(?:my|our|the|a)\s+(?:friend|partner|spouse|husband|wife|sibling|brother|sister|mom|mother|dad|father|parent|child|son|daughter|roommate|classmate|coworker)\b.{0,100}\b(?:suicid(?:al|e)|(?:want|plan|intend|try|might|may|could|will|going)\s+(?:to\s+)?(?:die|kill|hurt|harm|cut)|(?:kill|hurt|harm|cut)\s+(?:themself|themselves|himself|herself)|suicide attempt)\b/i;

const SELF_EXPLICIT_DENIAL = [
  /\b(?:i\s+(?:do not|don't|did not|didn't|never|would not|wouldn't|will not|won't|am not|was not|wasn't|have not|haven't|no longer)|i(?:'m| am) not|do not|don't|did not|didn't|never|would not|wouldn't|will not|won't|am not|was not|wasn't|have not|haven't|no longer)\s+(?:(?:want|plan|intend|think|consider|feel|have|am)\w*\s+(?:to\s+|about\s+)?)*(?:kill myself|hurt myself|cut myself|harm myself|suicid(?:al|e)|self[-\s]?harm|end my life|take my life|die|be dead|attempt suicide)\b/i,
  /\b(?:i\s+)?(?:have|want)\s+no\s+(?:plans?|intention|thoughts?|desire)\s+(?:(?:of|to|about)\s+)?(?:suicide|self[-\s]?harm|killing myself|hurting myself|cutting myself|ending my life)\b/i,
  /\b(?:i\s+)?(?:do not|don't|did not|didn't|never)\s+think\s+(?:i\s+)?(?:will|would|could|might)\s+(?:ever\s+)?(?:kill myself|die|attempt suicide|hurt myself|cut myself)\b/i,
  /\bi\s+(?:never said|didn't say|did not say|wasn't saying|was not saying)\s+(?:that\s+)?i\s+(?:want|wanted|plan|planned|intend|intended|am going|was going)\s+to\s+(?:kill|hurt|harm|cut)\s+myself\b/i,
  /\bi\s+(?:have|want)\s+no\s+(?:plans?|intention|desire)\s+to\s+(?:kill|hurt|harm|cut)\s+myself\b/i,
  /\bi(?:'m| am)\s+not\s+(?:suicidal|thinking about suicide|considering suicide|planning suicide)\b/i,
];

const OTHER_PERSON_DENIAL = /\b(?:does not|doesn't|do not|don't|is not|isn't|was not|wasn't|will not|won't|never)\b.{0,50}\b(?:suicid(?:al|e)|die|kill|hurt|harm|cut)\b/i;
const CLEARLY_HYPOTHETICAL = /\b(?:hypothetically|for a story|fictional character|in my novel|in this movie|song lyrics|as an example|what if i were to|if i were to)\b/i;
const LANGUAGE_DISCUSSION = /\b(?:the phrase|those words|that wording|keyword|search term|means|mean|definition of|how do you spell|quoted|quote|lyrics|fictional character|in a book|in a story)\b/i;
const CLEARLY_HISTORICAL = /\b(?:years? ago|months? ago|last (?:year|month|week)|when i was \d+|as a child|as a teenager|in high school|in college|in the past|used to|back then)\b/i;
const CURRENT_OR_AMBIVALENT = /\b(?:now|today|currently|tonight|again|still|lately|might|may|could|can't keep myself safe|cannot keep myself safe|not sure i can|afraid|scared|worried)\b/i;
const EVERYDAY_CUT_CONTEXT = /\b(?:shaving|cooking|chopping|paper cut|accidentally|by accident|craft project|cut my hair)\b/i;
const COMMON_IDIOM = /\bkill myself laughing\b/i;

function splitIntoClauses(text: string): string[] {
  return text
    .replace(/[’‘]/g, "'")
    .split(/[.!?\n;]+|\b(?:but|however|yet|although)\b/gi)
    .map((part) => part.trim())
    .filter(Boolean);
}

function hasCurrentSelfRisk(clause: string): boolean {
  if (CLEARLY_HYPOTHETICAL.test(clause) || LANGUAGE_DISCUSSION.test(clause) || COMMON_IDIOM.test(clause)) return false;
  if (!SELF_RISK_PATTERNS.some((pattern) => pattern.test(clause))) return false;
  if (OTHER_PERSON_RISK.test(clause)) return false;
  if (EVERYDAY_CUT_CONTEXT.test(clause) && !/\b(?:want|plan|intend|might|may|could|will|thinking about)\b/i.test(clause)) return false;
  if (CLEARLY_HISTORICAL.test(clause) && !CURRENT_OR_AMBIVALENT.test(clause)) return false;
  if (SELF_EXPLICIT_DENIAL.some((pattern) => pattern.test(clause))) return false;
  return true;
}

function hasCurrentRiskForSomeoneElse(clause: string): boolean {
  if (!OTHER_PERSON_RISK.test(clause) || CLEARLY_HYPOTHETICAL.test(clause)) return false;
  if (CLEARLY_HISTORICAL.test(clause) && !CURRENT_OR_AMBIVALENT.test(clause)) return false;
  if (OTHER_PERSON_DENIAL.test(clause)) return false;
  return true;
}

/**
 * Detects clear, current self-harm language for a fast supportive response.
 * Keyword-only mentions, explicit denials, hypotheticals, and past history are
 * not treated as current intent. Reports about another person are distinguished.
 */
export function detectCurrentSafetyConcern(text: string): SafetyConcern | null {
  const clauses = splitIntoClauses(text);
  if (clauses.some(hasCurrentSelfRisk)) return { subject: 'self' };
  if (clauses.some(hasCurrentRiskForSomeoneElse)) return { subject: 'someone-else' };
  return null;
}

export function getImmediateSafetyResponse(text: string): string | null {
  const concern = detectCurrentSafetyConcern(text);
  if (!concern) return null;

  if (concern.subject === 'someone-else') {
    return "I'm glad you said something. If this is about someone who may hurt themselves, ask them directly if they're in immediate danger and connect them with someone who can stay with them. In the U.S., call or text 988 for the Suicide & Crisis Lifeline. If they may act soon or are in immediate danger, call 911 or go to an emergency department. Outside the U.S., contact local emergency services or find a crisis line at https://findahelpline.com/.";
  }

  return "I'm glad you told me. I'm Tethr, an AI companion, not emergency support. If this reflects how you're feeling right now, please reach out to someone you trust and ask them to stay with you. In the U.S., call or text 988 for the Suicide & Crisis Lifeline. If you may act soon or are in immediate danger, call 911 or go to an emergency department. Outside the U.S., contact your local emergency service or find a crisis line at https://findahelpline.com/. Are you in immediate danger right now?";
}
