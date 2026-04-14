/**
 * AI Summary via OpenAI Chat Completions API.
 * User provides their own API key (stored in localStorage).
 */

const STORAGE_KEY = 'screensnap_openai_key';

export function getOpenAIKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export function setOpenAIKey(key: string) {
  if (typeof window === 'undefined') return;
  if (key) localStorage.setItem(STORAGE_KEY, key);
  else localStorage.removeItem(STORAGE_KEY);
}

export interface AISummaryResult {
  summary: string;
  keyPoints: string[];
  chapters?: string[];
  emailDraft: string;
  wikiDocument?: string;
}

export async function generateAISummary(
  transcript: string,
  language = 'tr'
): Promise<AISummaryResult> {
  const apiKey = getOpenAIKey();
  if (!apiKey) throw new Error('No OpenAI API key. Add it in Settings.');
  if (!transcript.trim()) throw new Error('No transcript to summarize. Enable transcript in recording settings.');

  const langHint = language === 'tr' ? 'Respond in Turkish.' : `Respond in ${language}.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an assistant that summarizes screen recording transcripts. ${langHint} Return valid JSON only.`,
        },
        {
          role: 'user',
          content: `Summarize this transcript from a screen recording. Return JSON with:
- "summary": 2-3 sentence overview
- "keyPoints": array of 3-5 bullet points
- "chapters": array of suggested chapter titles for the recording
- "emailDraft": a professional and persuasive cold-email template sharing this video, introducing the key topic and establishing a call to action. Add placeholders like [Name] where necessary.
- "wikiDocument": a comprehensive Notion/Confluence style documentation in Markdown format with # Headers, bullet points, and formal steps extracted directly from what was spoken. Transform this video into a professional company wiki guide.

Transcript:
${transcript.substring(0, 4000)}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices[0]?.message?.content ?? '{}';

  try {
    return JSON.parse(content);
  } catch {
    return { summary: content, keyPoints: [], emailDraft: "Could not generate email draft." };
  }
}

/**
 * AI Chapter Detection
 * Analyzes a timestamped transcript and returns chapter markers with times.
 */
export interface AIChapter {
  id: string;
  time: number;   // seconds
  label: string;
}

export async function generateAIChapters(
  timestampedTranscript: string,
  totalDuration: number
): Promise<AIChapter[]> {
  const apiKey = getOpenAIKey();
  if (!apiKey) throw new Error('No OpenAI API key.');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You analyze video transcripts and identify topic changes to create chapter markers. Return valid JSON only, no markdown.',
        },
        {
          role: 'user',
          content: `Analyze this timestamped video transcript (total duration: ${Math.round(totalDuration)}s) and identify 3-7 distinct topic sections or chapters.

Return a JSON array of chapters:
[{"time": <seconds_as_number>, "label": "<short chapter title (max 5 words)>"}]

Rules:
- time must be a number (seconds), not a string
- Use the actual timestamps from the transcript
- Labels should be concise and descriptive
- First chapter should start at or near 0

Transcript:
${timestampedTranscript.substring(0, 3000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices[0]?.message?.content ?? '[]';

  try {
    const raw: Array<{ time: number; label: string }> = JSON.parse(content);
    return raw.map((ch, i) => ({
      id: `ai_ch_${Date.now()}_${i}`,
      time: Number(ch.time) || 0,
      label: ch.label || `Bölüm ${i + 1}`,
    }));
  } catch {
    return [];
  }
}
