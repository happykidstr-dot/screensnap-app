// ─── AI Auto-Chapters Generator ─────────────────────────────────────────────
// Uses transcript segments to automatically generate chapter markers

import { TranscriptSegment, Chapter } from './db';

interface ChapterCandidate {
  time: number;
  label: string;
  score: number;
}

// Topic change detection keywords (Turkish/English)
const TOPIC_MARKERS_TR = [
  'şimdi', 'sonra', 'ilk olarak', 'ikinci olarak', 'son olarak',
  'öncelikle', 'ardından', 'devam edelim', 'bakalım', 'geçelim',
  'bir sonraki', 'sonuç olarak', 'özetle', 'başlayalım', 'bitiriyoruz',
  'ana konumuz', 'burada', 'dikkat edin', 'önemli', 'kritik',
  'adım', 'aşama', 'bölüm', 'kısım', 'madde',
];

const TOPIC_MARKERS_EN = [
  'now', 'next', 'first', 'second', 'finally', 'also',
  'let\'s', 'moving on', 'let me show', 'here we',
  'in summary', 'to conclude', 'let\'s start', 'step',
  'section', 'part', 'chapter', 'important', 'key point',
  'another', 'furthermore', 'however', 'but',
];

const ALL_MARKERS = [...TOPIC_MARKERS_TR, ...TOPIC_MARKERS_EN];

// Minimum gap between chapters (seconds)
const MIN_CHAPTER_GAP = 15;
// Minimum transcript segments needed
const MIN_SEGMENTS = 5;

/**
 * Analyze transcript to extract natural chapter points
 */
export function generateAutoChapters(
  transcript: TranscriptSegment[],
  totalDuration: number,
  maxChapters: number = 8
): Chapter[] {
  if (!transcript || transcript.length < MIN_SEGMENTS) return [];

  const candidates: ChapterCandidate[] = [];

  // Always add "Intro" at time 0
  candidates.push({ time: 0, label: 'Intro / Giriş', score: 100 });

  // Analyze each segment for topic change signals
  for (let i = 1; i < transcript.length; i++) {
    const seg = transcript[i];
    const prevSeg = transcript[i - 1];
    const text = seg.text.toLowerCase();
    let score = 0;
    let matchedMarker = '';

    // Check for topic marker keywords
    for (const marker of ALL_MARKERS) {
      if (text.includes(marker)) {
        score += 10;
        if (!matchedMarker) matchedMarker = marker;
      }
    }

    // Check for pause gaps (long silence suggests topic change)
    const gap = seg.startTime - (prevSeg.startTime + estimateSegmentDuration(prevSeg.text));
    if (gap > 3) score += 15; // 3+ second pause
    if (gap > 5) score += 10; // 5+ second pause

    // Check for sentence starters (capital letter after period)
    if (/^[A-ZÇĞİÖŞÜ]/.test(seg.text.trim())) score += 3;

    // Check for question patterns (often introduce new sections)
    if (/\?/.test(seg.text)) score += 5;

    // Check for numbered lists
    if (/^\d+[\.\)\-]/.test(seg.text.trim())) score += 12;

    // Only consider if score is meaningful
    if (score >= 8) {
      candidates.push({
        time: Math.floor(seg.startTime),
        label: generateChapterLabel(seg.text, matchedMarker, i),
        score,
      });
    }
  }

  // Add approximate midpoint if we have few candidates
  if (candidates.length < 3 && totalDuration > 60) {
    const mid = Math.floor(totalDuration / 2);
    const nearestSeg = findNearestSegment(transcript, mid);
    if (nearestSeg) {
      candidates.push({
        time: mid,
        label: generateChapterLabel(nearestSeg.text, '', Math.floor(transcript.length / 2)),
        score: 5,
      });
    }
  }

  // Sort by score descending, then enforce minimum gap
  candidates.sort((a, b) => b.score - a.score);

  const selected: ChapterCandidate[] = [];
  for (const c of candidates) {
    if (selected.length >= maxChapters) break;
    const tooClose = selected.some(s => Math.abs(s.time - c.time) < MIN_CHAPTER_GAP);
    if (!tooClose) selected.push(c);
  }

  // Sort chronologically
  selected.sort((a, b) => a.time - b.time);

  // Convert to Chapter format
  return selected.map((c, i) => ({
    id: `auto_ch_${i}_${Date.now()}`,
    time: c.time,
    label: c.label,
  }));
}

function estimateSegmentDuration(text: string): number {
  // Rough estimate: ~150 words per minute = 2.5 words per second
  const words = text.split(/\s+/).length;
  return words / 2.5;
}

function findNearestSegment(segments: TranscriptSegment[], time: number): TranscriptSegment | null {
  let nearest: TranscriptSegment | null = null;
  let minDist = Infinity;
  for (const seg of segments) {
    const dist = Math.abs(seg.startTime - time);
    if (dist < minDist) {
      minDist = dist;
      nearest = seg;
    }
  }
  return nearest;
}

function generateChapterLabel(text: string, marker: string, index: number): string {
  // Try to create a meaningful short label from the segment text
  const cleaned = text.trim();

  // If text is short enough, use it directly
  if (cleaned.length <= 40) return cleaned;

  // Try to get the first sentence
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  if (firstSentence.length <= 40 && firstSentence.length > 5) return firstSentence;

  // Truncate intelligently
  const words = cleaned.split(/\s+/).slice(0, 6).join(' ');
  if (words.length > 3) return words + '…';

  // Fallback
  return `Bölüm ${index}`;
}

/**
 * Generate chapters based on even time intervals (fallback when no transcript)
 */
export function generateEvenChapters(totalDuration: number, count: number = 5): Chapter[] {
  if (totalDuration < 30) return []; // Too short for chapters

  const interval = totalDuration / count;
  const chapters: Chapter[] = [];

  for (let i = 0; i < count; i++) {
    const time = Math.floor(i * interval);
    chapters.push({
      id: `even_ch_${i}_${Date.now()}`,
      time,
      label: i === 0 ? 'Başlangıç' : `Bölüm ${i + 1}`,
    });
  }

  return chapters;
}
