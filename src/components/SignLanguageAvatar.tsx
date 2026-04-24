"use client";

import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Square, Accessibility } from 'lucide-react';

export default function SignLanguageAvatar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("Merhaba! Türk İşaret Dili (TİD) tercümesi için hazır.");

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          
          <div className="aspect-square bg-slate-900 flex items-center justify-center">
            <svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="100" cy="80" r="40" fill="#fbbf24" />
              <rect x="60" y="120" width="80" height="100" rx="20" fill="#4f46e5" />
              {isPlaying && (
                <g>
                  <rect x="40" y="140" width="30" height="10" rx="5" fill="#fbbf24">
                    <animateTransform attributeName="transform" type="rotate" values="0 70 140; -40 70 140; 0 70 140" dur="1s" repeatCount="indefinite" />
                  </rect>
                  <rect x="130" y="140" width="30" height="10" rx="5" fill="#fbbf24">
                    <animateTransform attributeName="transform" type="rotate" values="0 130 140; 40 130 140; 0 130 140" dur="1s" repeatCount="indefinite" />
                  </rect>
                </g>
              )}
            </svg>
          </div>

          <div className="p-4 border-t border-white/5 min-h-[64px]">
             <p className="text-xs italic text-indigo-200">{currentText}</p>
          </div>

          <div className="flex items-center justify-center gap-4 p-4 bg-white/5">
            {isPlaying ? (
              <button onClick={() => setIsPlaying(false)} className="px-6 py-2 bg-amber-600 rounded-full text-white text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                <Pause size={16} /> Duraklat
              </button>
            ) : (
              <button onClick={() => setIsPlaying(true)} className="px-6 py-2 bg-indigo-600 rounded-full text-white text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                <Play size={16} /> Başlat
              </button>
            )}
            <button onClick={() => { setIsPlaying(false); setCurrentText("Durduruldu."); }} className="p-2.5 bg-red-900/30 text-red-400 rounded-full border border-red-500/30 transition-transform hover:scale-105 active:scale-95">
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
