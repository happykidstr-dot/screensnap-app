/**
 * Web Speech API transcript helper.
 * Records speech-to-text in real time during screen recording.
 * Falls back gracefully if the browser doesn't support it.
 */
import { TranscriptSegment } from './db';

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : never;

export class TranscriptRecorder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private segments: TranscriptSegment[] = [];
  private startedAt = 0;
  public isSupported: boolean;

  constructor(private lang = 'tr-TR') {
    this.isSupported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  start(lang?: string) {
    if (!this.isSupported) return;
    this.segments = [];
    this.startedAt = Date.now();
    if (lang) this.lang = lang;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = this.lang;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      const elapsedSec = (Date.now() - this.startedAt) / 1000;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          this.segments.push({
            text: e.results[i][0].transcript.trim(),
            startTime: Math.max(0, elapsedSec - 3), // approximate
          });
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onerror = (e: any) => {
      // Restart on non-fatal errors
      if (e.error === 'no-speech' || e.error === 'network') {
        setTimeout(() => { try { r.start(); } catch { /* ignore */ } }, 500);
      }
    };

    r.onend = () => {
      // Auto-restart (continuous mode stops on some browsers)
      try { r.start(); } catch { /* ignore if already stopped */ }
    };

    try { r.start(); } catch { /* ignore */ }
    this.recognition = r;
  }

  stop(): TranscriptSegment[] {
    if (this.recognition) {
      // Remove onend to prevent auto-restart
      this.recognition.onend = null;
      try { this.recognition.stop(); } catch { /* ignore */ }
      this.recognition = null;
    }
    return [...this.segments];
  }

  getSegments(): TranscriptSegment[] {
    return [...this.segments];
  }

  static toPlainText(segments: TranscriptSegment[]): string {
    return segments.map(s => s.text).join(' ');
  }
}
