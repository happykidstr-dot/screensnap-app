"use client";

import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Square, Accessibility } from 'lucide-react';

export default function SignLanguageAvatar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("Merhaba! Türk İşaret Dili (TİD) tercümesi için hazır.");
  const [extractedText, setExtractedText] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isOpen && extractedText.length === 0) {
      try {
        const textElements = document.querySelectorAll('h1, h2, h3, p, label, span');
        const texts: string[] = [];
        textElements.forEach(el => {
          const t = el.textContent?.trim();
          if (t && t.length > 10 && t.length < 250 && !t.includes('{')) {
             texts.push(t);
          }
        });
        setExtractedText(texts.length > 0 ? texts : ["Sayfada tercüme edilecek metin bulunamadı."]);
      } catch (e) {
        console.error(e);
      }
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
            return next;
          } else {
            setIsPlaying(false);
            setCurrentText("Tercüme tamamlandı.");
            return prev;
          }
        });
      }, 3500);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPlaying, extractedText]);

  if (!isMounted) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-full text-white font-semibold shadow-2xl transition-transform hover:scale-110 active:scale-95" 
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        <Accessibility size={20} /> İşaret Dili
      </button>

      {isOpen && (
        <div className="fixed bottom-6 left-6 z-[9999] flex flex-col rounded-2xl overflow-hidden bg-[#0f0e1a] w-80 shadow-2xl border border-white/10">
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-700">
            <span className="font-bold text-sm text-white">TİD Tercümanı</span>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          
          <div className="aspect-square bg-slate-900 flex items-center justify-center relative">
            <svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <radialGradient id="grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4338ca" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0f0e1a" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="130" r="100" fill="url(#grad)" />
              
              <rect x="75" y="115" width="50" height="70" rx="10" fill="#4f46e5" />
              <rect x="93" y="100" width="14" height="18" rx="5" fill="#fbbf24" />
              <ellipse cx="100" cy="85" rx="22" ry="24" fill="#fbbf24" />
              <path d="M78 80 Q80 58 100 60 Q120 58 122 80" fill="#1c1917" />
              
              {/* Left Arm */}
              <g transform="translate(75, 130)">
                {isPlaying && <animateTransform attributeName="transform" type="rotate" values="0; -30; 10; -20; 0" dur="2s" repeatCount="indefinite" additive="sum" />}
                <rect x="-20" y="0" width="20" height="10" rx="5" fill="#fbbf24" />
              </g>
              
              {/* Right Arm */}
              <g transform="translate(125, 130)">
                {isPlaying && <animateTransform attributeName="transform" type="rotate" values="0; 30; -10; 20; 0" dur="2s" repeatCount="indefinite" additive="sum" />}
                <rect x="0" y="0" width="20" height="10" rx="5" fill="#fbbf24" />
              </g>
            </svg>
          </div>

          <div className="p-4 border-t border-white/5 min-h-[80px] bg-white/5">
             <p className="text-xs italic text-indigo-100 leading-relaxed">{currentText}</p>
          </div>

          <div className="flex items-center justify-center gap-4 p-4 bg-indigo-900/20">
            {isPlaying ? (
              <button onClick={() => setIsPlaying(false)} className="px-6 py-2 bg-amber-600 rounded-full text-white text-sm font-bold flex items-center gap-2 shadow-lg transition-all hover:bg-amber-500">
                <Pause size={16} /> Duraklat
              </button>
            ) : (
              <button onClick={() => {
                if (currentSentenceIndex >= extractedText.length) {
                  setCurrentSentenceIndex(0);
                  setCurrentText(extractedText[0] || "Başlatılıyor...");
                }
                setIsPlaying(true);
              }} className="px-6 py-2 bg-indigo-600 rounded-full text-white text-sm font-bold flex items-center gap-2 shadow-lg transition-all hover:bg-indigo-500">
                <Play size={16} /> Başlat
              </button>
            )}
            <button onClick={() => { setIsPlaying(false); setCurrentSentenceIndex(0); setCurrentText("Durduruldu."); }} className="p-2.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700 transition-all hover:bg-slate-700 hover:text-white">
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
