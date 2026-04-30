"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { t, getSavedLang, Lang } from '@/lib/i18n';

// ── TİD Parmak Alfabesi Sözlüğü (V4 - Gelişmiş) ──
type FP = { f1: number; f2: number; f3: number; f4: number; f5: number; thumb: number; rot: number; wrist: number; eyebrows?: number };
const ALPHA: Record<string, FP> = {
  'A': { f1: 0.9, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.3, rot: 0, wrist: 0 },
  'B': { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0.8, rot: 0, wrist: 0 },
  'C': { f1: 0.4, f2: 0.4, f3: 0.4, f4: 0.4, f5: 0.4, thumb: 0.2, rot: 15, wrist: 10 },
  'Ç': { f1: 0.4, f2: 0.4, f3: 0.4, f4: 0.4, f5: 0.4, thumb: 0.2, rot: 35, wrist: 20 },
  'D': { f1: 0, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.5, rot: 0, wrist: 0 },
  'E': { f1: 0.6, f2: 0.6, f3: 0.6, f4: 0.6, f5: 0.6, thumb: 0.7, rot: 0, wrist: 0 },
  'F': { f1: 0, f2: 0, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.2, rot: 0, wrist: -5 },
  'G': { f1: 0, f2: 0, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.1, rot: -15, wrist: -10 },
  'Ğ': { f1: 0, f2: 0, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.1, rot: -35, wrist: -15 },
  'H': { f1: 0.9, f2: 0, f3: 0, f4: 0.9, f5: 0.9, thumb: 0.5, rot: 0, wrist: 0 },
  'I': { f1: 0.9, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0, thumb: 0.7, rot: 0, wrist: 0 },
  'İ': { f1: 0.9, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0, thumb: 0.7, rot: 20, wrist: 10 },
  'J': { f1: 0.9, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0, thumb: 0.4, rot: 30, wrist: 15 },
  'K': { f1: 0, f2: 0, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.3, rot: 0, wrist: 0 },
  'L': { f1: 0, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0, rot: -10, wrist: -5 },
  'M': { f1: 0.7, f2: 0.7, f3: 0.7, f4: 0.9, f5: 0.9, thumb: 0.6, rot: 0, wrist: 0 },
  'N': { f1: 0.7, f2: 0.7, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.6, rot: 0, wrist: 0 },
  'O': { f1: 0.3, f2: 0.3, f3: 0.3, f4: 0.3, f5: 0.3, thumb: 0.1, rot: 0, wrist: 0 },
  'Ö': { f1: 0.3, f2: 0.3, f3: 0.3, f4: 0.3, f5: 0.3, thumb: 0.1, rot: 20, wrist: 10 },
  'P': { f1: 0, f2: 0, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.4, rot: -20, wrist: -10 },
  'R': { f1: 0.9, f2: 0.2, f3: 0.2, f4: 0.9, f5: 0.9, thumb: 0.5, rot: 0, wrist: 0 },
  'S': { f1: 0.8, f2: 0.8, f3: 0.8, f4: 0.8, f5: 0.8, thumb: 0.5, rot: 0, wrist: 0 },
  'Ş': { f1: 0.8, f2: 0.8, f3: 0.8, f4: 0.8, f5: 0.8, thumb: 0.5, rot: 30, wrist: 15 },
  'T': { f1: 0.9, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.1, rot: 0, wrist: 0 },
  'U': { f1: 0.9, f2: 0, f3: 0, f4: 0.9, f5: 0.9, thumb: 0.7, rot: 0, wrist: 0 },
  'Ü': { f1: 0.9, f2: 0, f3: 0, f4: 0.9, f5: 0.9, thumb: 0.7, rot: 20, wrist: 10 },
  'V': { f1: 0.9, f2: 0, f3: 0, f4: 0.9, f5: 0.9, thumb: 0.8, rot: -10, wrist: -5 },
  'Y': { f1: 0.9, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0, thumb: 0, rot: 0, wrist: 0 },
  'Z': { f1: 0, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.2, rot: 10, wrist: 5 },
  ' ': { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0, rot: 0, wrist: 0 },
};

// ── TİD Kelime Sözlüğü (Lexicon - Yeni) ──
const WORD_SIGNS: Record<string, FP[]> = {
  'MERHABA': [
    { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0.2, rot: -20, wrist: -10, eyebrows: -5 },
    { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0.2, rot: 20, wrist: 10, eyebrows: 0 }
  ],
  'EVET': [
    { f1: 0.8, f2: 0.8, f3: 0.8, f4: 0.8, f5: 0.8, thumb: 0.5, rot: 0, wrist: 15, eyebrows: -5 },
    { f1: 0.8, f2: 0.8, f3: 0.8, f4: 0.8, f5: 0.8, thumb: 0.5, rot: 0, wrist: -5, eyebrows: 0 }
  ],
  'HAYIR': [
    { f1: 0, f2: 0, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.2, rot: -30, wrist: 0, eyebrows: 5 },
    { f1: 0, f2: 0, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.2, rot: 30, wrist: 0, eyebrows: 5 }
  ],
  'TAMAM': [
    { f1: 0.5, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0.1, rot: 0, wrist: 0, eyebrows: -3 }
  ],
  'TEŞEKKÜR': [
    { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0.5, rot: 0, wrist: 20, eyebrows: -5 }
  ],
  'LÜTFEN': [
    { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0.8, rot: 0, wrist: 0, eyebrows: -10 }
  ],
  'KAYIT': [
    { f1: 0.8, f2: 0.8, f3: 0.8, f4: 0.8, f5: 0.8, thumb: 0.5, rot: 0, wrist: 0, eyebrows: 0 },
    { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0.2, rot: 0, wrist: 10, eyebrows: -5 }
  ],
  'DURDUR': [
    { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0.8, rot: 0, wrist: -10, eyebrows: 3 }
  ],
  'SİL': [
    { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0.1, rot: -45, wrist: -20, eyebrows: 5 },
    { f1: 0.9, f2: 0.9, f3: 0.9, f4: 0.9, f5: 0.9, thumb: 0.5, rot: 45, wrist: 20, eyebrows: 5 }
  ]
};

const DEF: FP = { f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, thumb: 0, rot: 0, wrist: 0, eyebrows: 0 };

// ── Yardımcı Bileşen: Gelişmiş El SVG ──
function ModernHand({ p, mirror = false }: { p: FP; mirror?: boolean }) {
  return (
    <svg viewBox="0 0 200 220" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.4))' }}>
      <defs>
        <linearGradient id={`skinGrad${mirror ? 'L' : 'R'}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fce4c4" />
          <stop offset="40%" stopColor="#f3c691" />
          <stop offset="100%" stopColor="#e0a96d" />
        </linearGradient>
        <filter id="jointShadow">
          <feGaussianBlur stdDeviation="1.5" />
          <feOffset dx="1" dy="1" />
          <feComponentTransfer><feFuncA type="linear" slope="0.2"/></feComponentTransfer>
        </filter>
      </defs>
      <g transform={`${mirror ? 'scale(-1,1) translate(-200,0) ' : ''} rotate(${p.rot},100,160)`}>
        {/* Avuç İçi ve Bilek */}
        <path d="M70 140 Q70 190 100 195 Q130 190 130 140 Q130 110 100 105 Q70 110 70 140" fill={`url(#skinGrad${mirror ? 'L' : 'R'})`} />
        <path d="M90 194 L110 194 L115 220 L85 220 Z" fill="#d49a5b" opacity="0.4" />
        
        {/* Başparmak - Daha anatomik */}
        <g transform={`rotate(${p.thumb * -45 + 12}, 82, 155)`} style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <path d="M82 155 Q62 150 55 135 Q52 120 62 112 Q72 108 82 125 L90 145" fill="#f3c691" stroke="#d49a5b" strokeWidth="0.5" />
          <path d="M58 120 Q62 115 68 118" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </g>

        {/* Parmaklar - Boğum detayları ve gölgelerle */}
        {[
          { x: 80, y: 112, a: -18, w: 12 }, { x: 92, y: 106, a: -6, w: 13 }, 
          { x: 104, y: 106, a: 6, w: 13 }, { x: 116, y: 112, a: 18, w: 12 }, { x: 128, y: 122, a: 30, w: 11 }
        ].map((f, i) => {
          const cc = [p.f1, p.f2, p.f3, p.f4, p.f5];
          const val = cc[i];
          const baseLen = 42;
          const len = baseLen * (1 - val * 0.72);
          return (
            <g key={i} transform={`rotate(${f.a}, ${f.x}, ${f.y})`} style={{ transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
              {/* Parmak Arka Gölge */}
              <rect x={f.x - f.w/2 + 1} y={f.y - len + 1} width={f.w} height={len} rx={f.w/2} fill="black" opacity="0.1" />
              {/* Ana Parmak */}
              <rect x={f.x - f.w/2} y={f.y - len} width={f.w} height={len} rx={f.w/2} fill="#fce4c4" stroke="#d49a5b" strokeWidth="0.5" />
              {/* Boğum Çizgileri */}
              {len > 25 && (
                <g opacity="0.4">
                  <line x1={f.x - f.w/2 + 2} y1={f.y - len + 15} x2={f.x + f.w/2 - 2} y2={f.y - len + 15} stroke="#d49a5b" strokeWidth="0.5" />
                  <line x1={f.x - f.w/2 + 2} y1={f.y - len + 28} x2={f.x + f.w/2 - 2} y2={f.y - len + 28} stroke="#d49a5b" strokeWidth="0.5" />
                </g>
              )}
              {/* Tırnak */}
              <rect x={f.x - f.w/2 + 2} y={f.y - len + 2} width={f.w - 4} height={10} rx={3} fill="white" opacity="0.2" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── Yardımcı Bileşen: Modern İnsan Figürü ──
function ModernHuman({ pose, talking, blinking, emotion = 'happy' }: { 
  pose: FP; talking: boolean; blinking: boolean; emotion?: 'happy' | 'serious' | 'surprised' 
}) {
  const headRot = pose.rot * 0.08;
  const eyebrowY = pose.eyebrows || 0;
  
  return (
    <svg viewBox="0 0 140 200" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="faceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fce4c4" />
          <stop offset="100%" stopColor="#f3c691" />
        </linearGradient>
        <filter id="depthShadow">
          <feGaussianBlur stdDeviation="3" />
          <feOffset dx="0" dy="4" />
          <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
        </filter>
      </defs>
      
      {/* Gövde - Daha gerçekçi omuz yapısı */}
      <path d="M20 200 C20 120 40 85 70 85 C100 85 120 120 120 200" fill="url(#shirtGrad)" filter="url(#depthShadow)" />
      {/* Yaka detayı */}
      <path d="M55 85 L70 105 L85 85" fill="none" stroke="white" strokeWidth="1" opacity="0.2" />
      
      {/* Baş ve Boyun */}
      <g transform={`rotate(${headRot}, 70, 75)`} style={{ transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {/* Boyun */}
        <rect x={60} y={70} width={20} height={20} fill="#e0a96d" />
        <path d="M60 85 Q70 90 80 85" fill="#d49a5b" opacity="0.3" />

        {/* Kafa - Anatomik şekil */}
        <path d="M35 45 C35 15 50 5 70 5 C90 5 105 15 105 45 C105 75 90 88 70 88 C50 88 35 75 35 45" fill="url(#faceGrad)" />
        
        {/* Saç - Modern stil */}
        <path d="M34 45 C34 10 50 2 70 2 C90 2 106 10 106 45 L110 52 C110 25 100 12 70 12 C40 12 30 25 30 52 Z" fill="#1a1a1a" />
        <path d="M35 40 Q40 15 70 15 Q100 15 105 40" fill="none" stroke="#333" strokeWidth="0.5" opacity="0.3" />
        
        {/* Burun - Derinlik veren gölge */}
        <path d="M68 42 Q70 58 75 58" fill="none" stroke="#d49a5b" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

        {/* Kaşlar (Dinamik ve daha ince) */}
        <g style={{ transition: 'transform 0.3s' }} transform={`translate(0, ${eyebrowY})`}>
          <path d="M48 30 Q58 24 66 29" fill="none" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M74 29 Q82 24 92 30" fill="none" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Gözler - Daha detaylı */}
        {!blinking ? (
          <g>
            {/* Sol Göz */}
            <circle cx={56} cy={42} r={5} fill="white" />
            <circle cx={56} cy={42} r={2.5} fill="#333" />
            <circle cx={57.5} cy={40.5} r={1} fill="white" />
            {/* Sağ Göz */}
            <circle cx={84} cy={42} r={5} fill="white" />
            <circle cx={84} cy={42} r={2.5} fill="#333" />
            <circle cx={85.5} cy={40.5} r={1} fill="white" />
          </g>
        ) : (
          <g opacity="0.7">
            <line x1={51} y1={42} x2={61} y2={42} stroke="#262626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={79} y1={42} x2={89} y2={42} stroke="#262626" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
        
        {/* Ağız - Dudak yapısı ile */}
        <g transform="translate(0, 5)">
          {talking ? (
            <ellipse cx={70} cy={65} rx={8} ry={6} fill="#5d2e0c" />
          ) : emotion === 'happy' ? (
            <g>
              <path d="M58 64 Q70 76 82 64" fill="none" stroke="#5d2e0c" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M56 63 Q58 63 58 65" fill="none" stroke="#5d2e0c" strokeWidth="1" opacity="0.3" />
              <path d="M84 63 Q82 63 82 65" fill="none" stroke="#5d2e0c" strokeWidth="1" opacity="0.3" />
            </g>
          ) : emotion === 'surprised' ? (
            <circle cx={70} cy={68} r={5} fill="#5d2e0c" />
          ) : (
            <path d="M62 68 Q70 72 78 68" fill="none" stroke="#5d2e0c" strokeWidth="2" strokeLinecap="round" />
          )}
        </g>
      </g>
      
      {/* Omuzlar ve Kolların Başlangıcı */}
      <circle cx={25} cy={105} r={12} fill="#4f46e5" opacity="0.8" />
      <circle cx={115} cy={105} r={12} fill="#4f46e5" opacity="0.8" />
    </svg>
  );
}

// ── Ana Bileşen ──
interface AvatarProps {
  externalText?: string;
  recorderState?: 'idle' | 'recording' | 'paused' | 'countdown' | 'saving';
}

export default function SignLanguageAvatar({ externalText, recorderState }: AvatarProps) {
  const [lang, setLang] = useState<Lang>('tr');
  useEffect(() => { setLang(getSavedLang()); }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [pose, setPose] = useState<FP>(DEF);
  const [letter, setLetter] = useState('');
  const [letters, setLetters] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(550);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'manual' | 'speech'>('manual');
  const [speechActive, setSpeechActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [talking, setTalking] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [emotion, setEmotion] = useState<'happy' | 'serious' | 'surprised'>('happy');

  const srRef = useRef<any>(null);
  const queueRef = useRef<string[]>([]);
  const busyRef = useRef(false);

  // ── Animasyonlar: Göz Kırpma ──
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 120);
    }, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  // ── Dışarıdan Gelen Metin Takibi (Transcript Entegrasyonu) ──
  useEffect(() => {
    if (externalText && externalText.trim()) {
      queueRef.current.push(externalText);
      processQueue();
    }
  }, [externalText]);

  // ── Kayıt Durumu Takibi (Otomasyon) ──
  useEffect(() => {
    if (!recorderState) return;
    
    if (recorderState === 'recording') {
      queueRef.current.push('KAYIT');
      setEmotion('happy');
    } else if (recorderState === 'paused') {
      queueRef.current.push('DURDUR');
      setEmotion('serious');
    } else if (recorderState === 'idle' && busyRef.current) {
      queueRef.current.push('TAMAM');
      setEmotion('happy');
    } else if (recorderState === 'saving') {
      setEmotion('surprised');
    }
    processQueue();
  }, [recorderState]);

  // ── Harf Döngüsü ──
  useEffect(() => {
    if (!playing || letters.length === 0) return;
    if (idx >= letters.length) {
      setPlaying(false);
      setLetter('✓');
      setPose(DEF);
      return;
    }
    const l = letters[idx];
    setPose(ALPHA[l] || DEF);
    setLetter(l === ' ' ? '␣' : l);
    const t = setTimeout(() => setIdx(i => i + 1), speed);
    return () => clearTimeout(t);
  }, [playing, idx, letters, speed]);

  // ── Konuşma İşleme Kuyruğu ──
  const processQueue = () => {
    if (busyRef.current || queueRef.current.length === 0) return;
    const text = queueRef.current.shift()!;
    const cleanText = text.toLocaleUpperCase('tr-TR');
    const words = cleanText.split(' ');

    busyRef.current = true;
    
    const run = async () => {
      for (const word of words) {
        if (!word) continue;
        
        // 1. Kelime bazlı kontrol
        if (WORD_SIGNS[word]) {
          setLetter(word);
          for (const p of WORD_SIGNS[word]) {
            setPose(p);
            await new Promise(r => setTimeout(r, speed * 1.2));
          }
        } else {
          // 2. Harf harf kodlama
          const chars = word.replace(/[^A-ZÇĞİÖŞÜ]/g, '').split('');
          for (const c of chars) {
            setLetter(c);
            setPose(ALPHA[c] || DEF);
            await new Promise(r => setTimeout(r, speed));
          }
        }
        // Kelime arası boşluk pozu
        setLetter('␣');
        setPose(DEF);
        await new Promise(r => setTimeout(r, speed * 0.5));
      }
      
      busyRef.current = false;
      if (queueRef.current.length > 0) processQueue();
      else setLetter('✓');
    };

    run();
  };

  // ── Speech Recognition API ──
  const startSpeech = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const sr = new SR();
    sr.lang = 'tr-TR';
    sr.continuous = true;
    sr.interimResults = true;

    sr.onstart = () => setSpeechActive(true);
    sr.onend = () => { if (speechActive) sr.start(); }; 
    
    sr.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          setTranscript(text);
          setTalking(true);
          setTimeout(() => setTalking(false), 1200);
          queueRef.current.push(text);
          processQueue();
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) setTranscript(interim);
    };

    srRef.current = sr;
    sr.start();
  };

  const stopSpeech = () => {
    setSpeechActive(false);
    srRef.current?.stop();
    setTranscript('');
    queueRef.current = [];
    busyRef.current = false;
  };

  const handleManualStart = () => {
    const text = inputText.toLocaleUpperCase('tr-TR');
    if (!text) return;
    queueRef.current.push(text);
    processQueue();
  };

  // ── Stil Tanımları (Glassmorphism) ──
  const styles = {
    panel: {
      position: 'fixed' as const, bottom: 24, left: 24, zIndex: 9999,
      width: '380px', borderRadius: '32px', overflow: 'hidden',
      background: 'rgba(10, 10, 20, 0.92)',
      backdropFilter: 'blur(24px) saturate(180%)',
      boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139, 92, 246, 0.35)',
      color: 'white', fontFamily: 'Outfit, Inter, sans-serif'
    },
    fab: {
      position: 'fixed' as const, bottom: 24, left: 24, zIndex: 9999,
      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
      padding: '16px 28px', borderRadius: '100px', border: 'none',
      color: 'white', fontWeight: 800, cursor: 'pointer',
      boxShadow: '0 12px 40px rgba(139, 92, 246, 0.5)',
      display: 'flex', alignItems: 'center', gap: '12px',
      transition: 'all 0.3s ease'
    }
  };

  return (
    <>
      {!isOpen && (
        <button 
          style={styles.fab} 
          onClick={() => setIsOpen(true)}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
        >
          <span style={{ fontSize: '24px' }}>🤟</span> {t('signLanguageAssistant', lang)}
        </button>
      )}

      {isOpen && (
        <div style={styles.panel} className="animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: 10, height: 10, borderRadius: '50%', 
                backgroundColor: speechActive ? '#ef4444' : '#10b981', 
                boxShadow: speechActive ? '0 0 10px #ef4444' : '0 0 10px #10b981',
                animation: speechActive ? 'pulse 1.5s infinite' : 'none' 
              }} />
              <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.5px' }}>
                {speechActive ? (lang === 'tr' ? 'CANLI TERCÜME' : 'LIVE TRANSLATE') : 'TİD AI AVATAR'}
              </span>
            </div>
            <button onClick={() => { setIsOpen(false); stopSpeech(); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '24px', padding: '0 4px' }}>×</button>
          </div>

          {/* Avatar Display */}
          <div style={{ padding: '10px 24px 30px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', position: 'relative', height: '220px' }}>
            <div style={{ width: '130px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}>
              <ModernHuman pose={pose} talking={talking} blinking={blinking} emotion={emotion} />
            </div>
            <div style={{ width: '130px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}>
              <ModernHand p={pose} />
            </div>
            
            {/* Letter Badge */}
            <div style={{
              position: 'absolute', bottom: '10px', padding: '8px 24px', 
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', borderRadius: '16px',
              fontSize: letter && letter.length > 1 ? '16px' : '32px', 
              fontWeight: 900, minWidth: '50px', textAlign: 'center',
              boxShadow: '0 15px 35px rgba(139, 92, 246, 0.4)',
              border: '1px solid rgba(255,255,255,0.2)',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {letter || '...'}
            </div>
          </div>

          {/* Transcript View */}
          <div style={{ height: '40px', padding: '0 24px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {transcript ? `"${transcript}"` : <span style={{ opacity: 0.3 }}>Konuşun veya yazın...</span>}
          </div>

          {/* Controls */}
          <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '5px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                onClick={() => { setMode('manual'); stopSpeech(); }}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: mode === 'manual' ? 'rgba(139, 92, 246, 0.9)' : 'none', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >Klavye</button>
              <button 
                onClick={() => { setMode('speech'); }}
                style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: mode === 'speech' ? 'rgba(139, 92, 246, 0.9)' : 'none', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >Mikrofon</button>
            </div>

            {mode === 'manual' ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualStart()}
                  placeholder="Metin yazın..."
                  style={{ flex: 1, padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '15px' }}
                />
                <button onClick={handleManualStart} style={{ width: '54px', height: '54px', borderRadius: '16px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)' }}>→</button>
              </div>
            ) : (
              <button 
                onClick={speechActive ? stopSpeech : startSpeech}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '18px', border: 'none', 
                  background: speechActive ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)', 
                  color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  boxShadow: speechActive ? '0 10px 25px rgba(239, 68, 68, 0.3)' : '0 10px 25px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {speechActive ? '⏹ DURDUR' : '🎙 DİNLEMEYE BAŞLA'}
              </button>
            )}

            {/* Speed & Emotion Controls */}
            <div style={{ marginTop: '24px', spaceY: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.5, letterSpacing: '1px' }}>HIZ</span>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="range" min="200" max="1000" step="50" 
                    value={1200 - speed} 
                    onChange={(e) => setSpeed(1200 - parseInt(e.target.value))}
                    style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, opacity: 0.5, letterSpacing: '1px' }}>DUYGU</span>
                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                  {([
                    { v: 'happy', l: '😊' },
                    { v: 'serious', l: '😐' },
                    { v: 'surprised', l: '😲' }
                  ] as const).map(em => (
                    <button key={em.v} onClick={() => setEmotion(em.v)}
                      style={{ 
                        flex: 1, padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                        background: emotion === em.v ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                        color: 'white', cursor: 'pointer', transition: 'all 0.2s', fontSize: '16px'
                      }}
                    >
                      {em.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <style jsx global>{`
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(0.95); opacity: 0.8; }
            }
            .animate-in { animation: animate-in 0.3s ease-out; }
            @keyframes animate-in {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
