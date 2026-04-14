/**
 * AI Klip Çıkartma (AI Highlight Clip)
 * OpenAI transcript'i analiz ederek en önemli ~60 saniyelik segmenti tespit eder,
 * ardından ffmpeg.wasm ile o segmenti ham videodan keser ve indirir.
 */

import { getOpenAIKey } from './aiSummary';

export interface ClipRange {
  start: number; // seconds
  end: number;   // seconds
  reason: string;
}

/**
 * Step 1: Ask GPT which 60-second window is the most valuable
 */
export async function detectHighlightRange(
  timestampedTranscript: string,
  totalDuration: number,
  targetSeconds = 60
): Promise<ClipRange> {
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
          content: 'You analyze video transcripts and identify the single most impactful segment. Return valid JSON only.',
        },
        {
          role: 'user',
          content: `This is a timestamped transcript from a ${Math.round(totalDuration)}-second video.
Find the single best ~${targetSeconds}-second window that contains the most valuable, insightful, or shareable content.

Return JSON only:
{"start": <start_seconds_number>, "end": <end_seconds_number>, "reason": "<one sentence why this segment is best>"}

Rules:
- start and end must be numbers (seconds)  
- end - start should be approximately ${targetSeconds} seconds (±15s is ok)
- start must be >= 0, end must be <= ${Math.round(totalDuration)}

Transcript:
${timestampedTranscript.substring(0, 3500)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices[0]?.message?.content ?? '{}';

  try {
    const parsed = JSON.parse(content);
    return {
      start: Math.max(0, Number(parsed.start) || 0),
      end: Math.min(totalDuration, Number(parsed.end) || targetSeconds),
      reason: parsed.reason || 'En değerli bölüm',
    };
  } catch {
    // Fallback: middle of the video
    const mid = totalDuration / 2;
    return {
      start: Math.max(0, mid - targetSeconds / 2),
      end: Math.min(totalDuration, mid + targetSeconds / 2),
      reason: 'Videonun orta bölümü',
    };
  }
}

/**
 * Step 2: Extract the time range from the blob using ffmpeg.wasm
 */
export async function extractClip(
  blob: Blob,
  start: number,
  end: number,
  filename: string,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

  const ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  const inputName = 'input.webm';
  const outputName = 'clip.mp4';

  await ffmpeg.writeFile(inputName, await fetchFile(blob));

  const duration = end - start;
  await ffmpeg.exec([
    '-ss', String(start),
    '-i', inputName,
    '-t', String(duration),
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-preset', 'fast',
    '-crf', '23',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  // ffmpeg readFile returns Uint8Array | string — ensure regular ArrayBuffer (not SharedArrayBuffer)
  let bytes: Uint8Array;
  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = new Uint8Array((data as Uint8Array).slice());
  }
  return new Blob([bytes as unknown as BlobPart], { type: 'video/mp4' });
}
