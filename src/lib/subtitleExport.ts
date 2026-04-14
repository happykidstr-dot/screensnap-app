/**
 * Subtitle Export — SRT & VTT
 * Converts TranscriptSegment array to .srt or .vtt string and triggers download.
 */

export interface SubtitleSegment {
  startTime: number; // seconds
  endTime?: number;  // seconds (optional — will infer from next)
  text: string;
}

function toSRTTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.round((secs % 1) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

function toVTTTime(secs: number): string {
  return toSRTTime(secs).replace(',', '.');
}

export function exportSRT(segments: SubtitleSegment[], filename = 'subtitles'): void {
  const lines: string[] = [];
  segments.forEach((seg, i) => {
    const end = seg.endTime ?? (segments[i + 1]?.startTime ?? seg.startTime + 3);
    lines.push(`${i + 1}`);
    lines.push(`${toSRTTime(seg.startTime)} --> ${toSRTTime(end)}`);
    lines.push(seg.text.trim());
    lines.push('');
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.srt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportVTT(segments: SubtitleSegment[], filename = 'subtitles'): void {
  const lines: string[] = ['WEBVTT', ''];
  segments.forEach((seg, i) => {
    const end = seg.endTime ?? (segments[i + 1]?.startTime ?? seg.startTime + 3);
    lines.push(`${i + 1}`);
    lines.push(`${toVTTTime(seg.startTime)} --> ${toVTTTime(end)}`);
    lines.push(seg.text.trim());
    lines.push('');
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/vtt;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.vtt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
