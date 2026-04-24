"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Square, CheckCircle2, Volume2 } from 'lucide-react';

function SignAvatar({ isPlaying }: { isPlaying: boolean }) {
  return (
    <svg
      viewBox="0 0 200 260"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' }}
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="60%" r="40%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="200" rx="70" ry="30" fill="url(#glow)" />

      <rect x="75" y="115" width="50" height="70" rx="10" fill="#4f46e5" />
      <path d="M88 115 L100 130 L112 115" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />

      <rect x="93" y="100" width="14" height="18" rx="5" fill="#fbbf24" />
      <ellipse cx="100" cy="85" rx="22" ry="24" fill="#fbbf24" />
      <path d="M78 80 Q80 58 100 60 Q120 58 122 80" fill="#1c1917" />
      <ellipse cx="78" cy="85" rx="5" ry="7" fill="#f59e0b" />
      <ellipse cx="122" cy="85" rx="5" ry="7" fill="#f59e0b" />
      <ellipse cx="91" cy="84" rx="3.5" ry="4" fill="#1c1917" />
      <ellipse cx="109" cy="84" rx="3.5" ry="4" fill="#1c1917" />
      <circle cx="92.5" cy="83" r="1.2" fill="white" />
      <circle cx="110.5" cy="83" r="1.2" fill="white" />
      <path d="M92 94 Q100 100 108 94" fill="none" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M87 78 Q91 76 95 78" fill="none" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M105 78 Q109 76 113 78" fill="none" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" />

      <g style={{ transformOrigin: '75px 125px', animation: isPlaying ? 'leftArm 1.6s ease-in-out infinite alternate' : 'none' }}>
        <rect x="55" y="115" width="22" height="12" rx="6" fill="#4f46e5" />
        <g style={{ transformOrigin: '55px 122px', animation: isPlaying ? 'leftHand 1.6s ease-in-out infinite alternate' : 'none' }}>
          <ellipse cx="48" cy="135" rx="11" ry="9" fill="#fbbf24" />
          <rect x="38" y="126" width="5" height="10" rx="2.5" fill="#f59e0b" />
          <rect x="44" y="124" width="5" height="12" rx="2.5" fill="#f59e0b" />
          <rect x="50" y="124" width="5" height="12" rx="2.5" fill="#f59e0b" />
          <rect x="56" y="126" width="5" height="10" rx="2.5" fill="#f59e0b" />
          <ellipse cx="37" cy="137" rx="4" ry="3" fill="#f59e0b" transform="rotate(-30 37 137)" />
        </g>
      </g>

      <g style={{ transformOrigin: '125px 125px', animation: isPlaying ? 'rightArm 1.6s ease-in-out infinite alternate-reverse' : 'none' }}>
        <rect x="123" y="115" width="22" height="12" rx="6" fill="#4f46e5" />
        <g style={{ transformOrigin: '145px 122px', animation: isPlaying ? 'rightHand 1.6s ease-in-out infinite alternate-reverse' : 'none' }}>
          <ellipse cx="152" cy="135" rx="11" ry="9" fill="#fbbf24" />
          <rect x="157" y="126" width="5" height="10" rx="2.5" fill="#f59e0b" />
          <rect x="151" y="124" width="5" height="12" rx="2.5" fill="#f59e0b" />
          <rect x="145" y="124" width="5" height="12" rx="2.5" fill="#f59e0b" />
          <rect x="139" y="126" width="5" height="10" rx="2.5" fill="#f59e0b" />
          <ellipse cx="163" cy="137" rx="4" ry="3" fill="#f59e0b" transform="rotate(30 163 137)" />
        </g>
      </g>

      <rect x="80" y="183" width="18" height="45" rx="8" fill="#312e81" />
      <rect x="102" y="183" width="18" height="45" rx="8" fill="#312e81" />
      <ellipse cx="89" cy="228" rx="13" ry="7" fill="#1e1b4b" />
      <ellipse cx="111" cy="228" rx="13" ry="7" fill="#1e1b4b" />

      {isPlaying && (
        <>
          <circle cx="85" cy="250" r="3" fill="#6366f1">
            <animate attributeName="opacity" values="1;0;1" dur="0.8s" begin="0s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="250" r="3" fill="#818cf8">
            <animate attributeName="opacity" values="1;0;1" dur="0.8s" begin="0.27s" repeatCount="indefinite" />
          </circle>
          <circle cx="115" cy="250" r="3" fill="#a5b4fc">
            <animate attributeName="opacity" values="1;0;1" dur="0.8s" begin="0.54s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      <style>{`
        @keyframes leftArm {
          0%   { transform: rotate(-20deg) translateY(0px); }
          30%  { transform: rotate(15deg) translateY(-10px); }
          60%  { transform: rotate(-30deg) translateY(5px); }
          100% { transform: rotate(10deg) translateY(-5px); }
        }
        @keyframes rightArm {
          0%   { transform: rotate(20deg) translateY(0px); }
          30%  { transform: rotate(-15deg) translateY(-10px); }
          60%  { transform: rotate(25deg) translateY(8px); }
          100% { transform: rotate(-10deg) translateY(-3px); }
        }
        @keyframes leftHand {
          0%   { transform: rotate(0deg); }
          40%  { transform: rotate(-40deg); }
          80%  { transform: rotate(20deg); }
          100% { transform: rotate(-15deg); }
        }
        @keyframes rightHand {
          0%   { transform: rotate(0deg); }
          40%  { transform: rotate(40deg); }
          80%  { transform: rotate(-20deg); }
          100% { transform: rotate(15deg); }
        }
      `}</style>
    </svg>
  );
}

export default function SignLanguageAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("Merhaba! Türk İşaret Dili (TİD) tercümesi için hazır.");
  const [hasError, setHasError] = useState(false);
  const [extractedText, setExtractedText] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && extractedText.length === 0) {
      try {
        const textElements = document.querySelectorAll('h1, h2, h3, p, label, span');
        const texts: string[] = [];
        textElements.forEach(el => {
          const t = el.textContent?.trim();
          if (t && t.length > 8 && t.length < 200) texts.push(t);
        });
        setExtractedText(texts.length > 0 ? texts : ["Bu sayfada çevrilecek metin bulunamadı."]);
      } catch {
        setHasError(true);
        setCurrentText("Bu içerik şu anda çevrilemiyor.");
      }
    }
  }, [isOpen, extractedText.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && extractedText.length > 0) {
      interval = setInterval(() => {
        if (currentSentenceIndex < extractedText.length) {
          setCurrentText(extractedText[currentSentenceIndex]);
          setCurrentSentenceIndex(p => p + 1);
          setProgress(Math.round(((currentSentenceIndex + 1) / extractedText.length) * 100));
        } else {
          setIsPlaying(false);
          setCurrentText("Çeviri tamamlandı.");
          setProgress(100);
        }
      }, 3200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, extractedText, currentSentenceIndex]);

  const handleStart = () => {
    if (hasError) return;
    setIsPlaying(true);
    if (currentSentenceIndex >= extractedText.length) {
      setCurrentSentenceIndex(0);
      setProgress(0);
    }
  };

  const handlePause = () => setIsPlaying(false);

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentSentenceIndex(0);
    setProgress(0);
    setCurrentText("Çeviri durduruldu. Tekrar başlatmak için Başlat butonuna basın.");
  };

  const toggleOpen = () => {
    if (isOpen) {
      setIsPlaying(false);
      setCurrentSentenceIndex(0);
      setProgress(0);
    } else {
      setCurrentText("Merhaba! Türk İşaret Dili (TİD) tercümesi için hazır.");
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleOpen}
          id="sign-language-fab"
          className="fixed bottom-6 left-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl text-white font-semibold text-sm transition-all hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}
          title="İşaret Dili Desteği (TİD)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
            <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
          <span className="hidden md:inline">İşaret Dili</span>
        </button>
      )}

      {isOpen && (
        <div
          id="sign-language-panel"
          className="fixed bottom-6 left-6 z-[9999] flex flex-col rounded-2xl overflow-hidden"
          style={{ width: 'min(320px, calc(100vw - 48px))', boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)', background: '#0f0e1a' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ background: 'linear-gradient(90deg,#4338ca,#6d28d9)' }}>
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
              <span className="font-bold text-sm text-white">TİD Tercümanı</span>
              <span className="ml-1 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">AI</span>
            </div>
            <button onClick={toggleOpen} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          <div className="relative" style={{ aspectRatio: '4/3', background: 'linear-gradient(180deg,#1e1b4b,#0f0e1a)' }}>
            {hasError ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400 p-4 text-center">
                <span className="text-3xl">⚠️</span>
                <p className="text-sm font-semibold">Bağlantı Hatası</p>
              </div>
            ) : (
              <SignAvatar isPlaying={isPlaying} />
            )}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
              style={{ background: isPlaying ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.15)', color: isPlaying ? 'white' : 'rgba(255,255,255,0.7)' }}>
              {isPlaying && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />}
              <CheckCircle2 size={10} />
              {isPlaying ? 'CANLI' : 'HAZIR'}
            </div>
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', minHeight: '64px' }}>
            <div className="flex items-start gap-2">
              <Volume2 size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#818cf8' }} />
              <p className="text-xs leading-relaxed italic" style={{ color: '#c7d2fe' }}>{currentText}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {!isPlaying ? (
              <button onClick={handleStart} disabled={hasError} id="sign-language-play"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
                <Play size={15} className="ml-0.5" />
                Başlat
              </button>
            ) : (
              <button onClick={handlePause} id="sign-language-pause"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', boxShadow: '0 4px 15px rgba(217,119,6,0.4)' }}>
                <Pause size={15} />
                Duraklat
              </button>
            )}
            <button onClick={handleStop} disabled={!isPlaying && currentSentenceIndex === 0} id="sign-language-stop"
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
              <Square size={14} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
