'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Browser Speech API type shims ─────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface ISpeechRecognitionResultList {
  length: number;
  resultIndex: number;
  [index: number]: ISpeechRecognitionResult;
}
interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}
interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
// ───────────────────────────────────────────────────────────────────────────

interface LiveCaptionsProps {
  isRecording: boolean;
  enabled: boolean;
  onCaptionChange?: (text: string) => void;
}

interface CaptionLine {
  id: number;
  text: string;
}

export default function LiveCaptions({ isRecording, enabled, onCaptionChange }: LiveCaptionsProps) {
  const [captions, setCaptions] = useState<CaptionLine[]>([]);
  const [interim, setInterim] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const idCounter = useRef(0);
  const restartTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  const isRecordingRef = useRef(isRecording);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  const startRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = 'tr-TR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => {
      setIsListening(false);
      if (enabledRef.current && isRecordingRef.current) {
        restartTimeout.current = setTimeout(startRecognition, 300);
      }
    };

    rec.onresult = (event: ISpeechRecognitionEvent) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const txt = result[0].transcript.trim();
          if (txt) {
            setCaptions(prev => {
              const next = [...prev, { id: idCounter.current++, text: txt }];
              return next.slice(-3);
            });
            setInterim('');
            onCaptionChange?.(txt);
          }
        } else {
          interimText += result[0].transcript;
        }
      }
      setInterim(interimText);
      onCaptionChange?.(interimText || captions.map(c => c.text).slice(-1)[0] || '');
    };

    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Speech recognition error:', e.error);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (enabled && isRecording) {
      startRecognition();
    } else {
      if (restartTimeout.current) clearTimeout(restartTimeout.current);
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      setIsListening(false);
      setCaptions([]);
      setInterim('');
      onCaptionChange?.('');
    }
    return () => {
      if (restartTimeout.current) clearTimeout(restartTimeout.current);
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    };
  }, [enabled, isRecording, startRecognition]);

  if (!enabled || !isRecording) return null;
  const displayLines = captions.map(c => c.text);
  if (displayLines.length === 0 && !interim) return null;

  return (
    <>
      <style>{`
        @keyframes captionPulse {
          0%, 100% { transform: scaleY(1); opacity: 0.5; }
          50% { transform: scaleY(2.2); opacity: 1; }
        }
        @keyframes captionFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9000,
        maxWidth: '80vw',
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '6px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '4px', height: '4px', borderRadius: '50%',
                background: '#a78bfa',
                animation: `captionPulse 1s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div style={{
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '10px 20px',
          border: '1px solid rgba(167,139,250,0.25)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          {displayLines.map((text, idx) => (
            <p key={idx} style={{
              margin: '2px 0', fontSize: '17px', fontWeight: 600,
              color: '#f3f4f6', letterSpacing: '0.01em', lineHeight: 1.5,
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              animation: 'captionFadeIn 0.2s ease-out',
            }}>{text}</p>
          ))}
          {interim && (
            <p style={{
              margin: '2px 0', fontSize: '17px', fontWeight: 600,
              color: 'rgba(167,139,250,0.9)', letterSpacing: '0.01em',
              lineHeight: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              fontStyle: 'italic',
            }}>{interim}</p>
          )}
        </div>
      </div>
    </>
  );
}
