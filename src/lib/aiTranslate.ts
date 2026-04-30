// AI Transcript Translation
import { getOpenAIKey } from './aiSummary';

export interface TranslatedSegment {
  startTime: number;
  endTime?: number;
  text: string;
}

export const TRANSLATION_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Turkce' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Francais' },
  { code: 'es', label: 'Espanol' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Portugues' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ru', label: 'Russian' },
  { code: 'pl', label: 'Polski' },
  { code: 'nl', label: 'Nederlands' },
];

/**
 * Translates transcript segments via OpenAI.
 * Returns segments with same timestamps but translated text.
 * Batched into groups of 40 to stay within token limits.
 */
export async function translateTranscript(
  segments: Array<{ startTime: number; endTime?: number; text: string }>,
  targetLang: string,
  targetLangLabel: string
): Promise<TranslatedSegment[]> {
  const apiKey = getOpenAIKey();
  if (!apiKey) throw new Error('OpenAI API key bulunamadi.');
  if (!segments.length) return [];

  const BATCH = 40;
  const results: TranslatedSegment[] = [];

  for (let i = 0; i < segments.length; i += BATCH) {
    const batch = segments.slice(i, i + BATCH);
    const inputJson = JSON.stringify(batch.map((s, idx) => ({ i: idx, t: s.text })));

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate text segments to ${targetLangLabel} (lang code: ${targetLang}). Return valid JSON array only with same structure: [{"i":0,"t":"translated text"},...]`,
          },
          { role: 'user', content: inputJson },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content ?? '[]';

    try {
      const translated: Array<{ i: number; t: string }> = JSON.parse(content);
      batch.forEach((seg, idx) => {
        const match = translated.find(x => x.i === idx);
        results.push({
          startTime: seg.startTime,
          endTime: seg.endTime,
          text: match?.t ?? seg.text,
        });
      });
    } catch {
      batch.forEach(seg => results.push({ startTime: seg.startTime, endTime: seg.endTime, text: seg.text }));
    }
  }

  return results;
}
