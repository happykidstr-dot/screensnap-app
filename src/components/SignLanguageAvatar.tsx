"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Square, CheckCircle2, Volume2 } from 'lucide-react';

function SignAvatar({ isPlaying }: { isPlaying: boolean }) {
  return (
    <svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' }}>
      <defs>
        <radialGradient id="glow" cx="50%" cy="60%" r="40%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="200" rx="70" ry="30" fill="url(#glow)" />
      <rect x="75" y="115" width="50" height="70" rx="10" fill="#4f46e5" />
      <rect x="93" y="100" width="14" height="18" rx="5" fill="#fbbf24" />
      <ellipse cx="100" cy="85" rx="22" ry="24" fill="#fbbf24" />
      <path d="M78 80 Q80 58 100 60 Q120 58 122 80" fill="#1c1917" />
      <ellipse cx="91" cy="84" rx="3.5" ry="4" fill="#1c1917" />
      <ellipse cx="109" cy="84" rx="3.5" ry="4" fill="#1c1917" />
      
      {/* Left Arm */}
      <g transform="translate(75, 125)">
        <g>
          {isPlaying && <animateTransform attributeName="transform" type="rotate" values="-20; 15; -30; 10; -20" dur="1.6s" repeatCount="indefinite" />}
          <g transform="translate(-75, -125)">
            <rect x="55" y="115" width="22" height="12" rx="6" fill="#4f46e5" />
            <ellipse cx="48" cy="135" rx="11" ry="9" fill="#fbbf24" />
          </g>
        </g>
      </g>

      {/* Right Arm */}
      <g transform="translate(125, 125)">
        <g>
          {isPlaying && <animateTransform attributeName="transform" type="rotate" values="20; -15; 25; -10; 20" dur="1.6s" repeatCount="indefinite" />}
          <g transform="translate(-125, -125)">
            <rect x="123" y="115" width="22" height="12" rx="6" fill="#4f46e5" />
            <ellipse cx="152" cy="135" rx="11" ry="9" fill="#fbbf24" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export default function SignLanguageAvatar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("Merhaba! Türk İşaret Dili (TİD) tercümesi için hazır.");
  const [extractedText, setExtractedText] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isOpen && extractedText.length === 0) {
      const textElements = document.querySelectorAll('h1, h2, h3, p, label, span');
      const texts: string[] = [];
      textElements.forEach(el => {
        const t = el.textContent?.trim();
        if (t && t.length > 8 && t.length < 200) texts.push(t);
      });
      setExtractedText(texts.length > 0 ? texts : ["Sayfada metin bulunamadı."]);
    }
  }, [isMounted, isOpen, extractedText.length]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && extractedText.length > 0) {
      interval = setInterval(() => {
        setCurrentSentenceIndex(prev => {
          const next = prev + 1;
          if (next < extractedText.length) {
            setCurrentText(extractedText[next]);
            setProgress(Math.round(((next + 1) / extractedText.length) * 100));
            return next;
          } else {
            setIsPlaying(false);
            setCurrentText("Çeviri tamamlandı.");
            setProgress(100);
            return prev;
          }
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, extractedText]);

  if (!isMounted) return null;

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <>
      <button onClick={toggleOpen} className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl text-white font-semibold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        <Accessibility size={20} /> İşaret Dili
      </button>

      {isOpen && (
        <div className="fixed bottom-6 left-6 z-[9999] flex flex-col rounded-2xl overflow-hidden bg-[#0f0e1a] w-80 shadow-2xl border border-white/10">
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-700">
            <span className="font-bold text-sm text-white">TİD Tercümanı</span>
            <button onClick={toggleOpen} className="text-white/70 hover:text-white"><X size={18} /></button>
          </div>
          <div className="aspect-square bg-slate-900">
            <SignAvatar isPlaying={isPlaying} />
          </div>
          <div className="p-4 border-t border-white/5">
             <p className="text-xs italic text-indigo-200">{currentText}</p>
          </div>
          <div className="flex items-center justify-center gap-4 p-4 bg-white/5">
            {!isPlaying ? (
              <button onClick={() => setIsPlaying(true)} className="px-6 py-2 bg-indigo-600 rounded-full text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105">
                <Play size={16} /> Başlat
              </button>
            ) : (
              <button onClick={() => setIsPlaying(false)} className="px-6 py-2 bg-amber-600 rounded-full text-white text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105">
                <Pause size={16} /> Duraklat
              </button>
            )}
            <button onClick={() => { setIsPlaying(false); setCurrentSentenceIndex(0); setProgress(0); setCurrentText("Durduruldu."); }} className="p-2.5 bg-red-900/30 text-red-400 rounded-full border border-red-500/30 transition-transform hover:scale-105">
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
