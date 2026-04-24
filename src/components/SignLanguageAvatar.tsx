"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Accessibility, X, Play, Pause, Square, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignLanguageAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("Hoş geldiniz. Türk İşaret Dili (TİD) tercümesi için hazır.");
  const [hasError, setHasError] = useState(false);
  const [extractedText, setExtractedText] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && extractedText.length === 0) {
      try {
        const textElements = document.querySelectorAll('h1, h2, h3, p, button');
        const texts: string[] = [];
        textElements.forEach(el => {
          if (el.textContent?.trim()) {
            texts.push(el.textContent.trim());
          }
        });
        if (texts.length > 0) {
          setExtractedText(texts);
        } else {
          setExtractedText(["Bu sayfada çevrilecek metin bulunamadı."]);
        }
      } catch (err) {
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
          setCurrentSentenceIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentText("Çeviri tamamlandı.");
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, extractedText, currentSentenceIndex]);

  const handleStart = () => {
    if (hasError) return;
    setIsPlaying(true);
    if (currentSentenceIndex >= extractedText.length) {
      setCurrentSentenceIndex(0);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentSentenceIndex(0);
    setCurrentText("Çeviri durduruldu. TİD desteği hazır.");
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentSentenceIndex(0);
      setHasError(false);
      setCurrentText("Hoş geldiniz. Türk İşaret Dili (TİD) tercümesi için hazır.");
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 left-6 z-50 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-3 shadow-lg transition-all transform hover:scale-105"
          title="İşaret Dili Desteği (TİD)"
        >
          <Accessibility size={24} />
          <span className="font-medium hidden md:inline">İşaret Dili</span>
        </button>
      )}

      {isOpen && (
        <div
          ref={containerRef}
          className="fixed bottom-6 left-6 z-50 w-72 md:w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <Accessibility size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                TİD Tercümanı
              </span>
            </div>
            <button
              onClick={toggleOpen}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {hasError ? (
              <div className="flex flex-col items-center gap-3 text-red-500 p-4 text-center">
                <AlertCircle size={40} />
                <p className="text-sm font-medium">Bağlantı Hatası</p>
                <p className="text-xs opacity-80">Yapay zeka servisine ulaşılamıyor.</p>
              </div>
            ) : isPlaying ? (
              <div className="relative w-full h-full flex items-center justify-center bg-indigo-900/10">
                <div className="w-24 h-24 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin absolute opacity-20"></div>
                <div className="flex flex-col items-center animate-pulse">
                  <Accessibility size={64} className="text-indigo-600 dark:text-indigo-400 mb-2" />
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium tracking-wider">ÇEVİRİ YAPILIYOR</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-400 dark:text-gray-500 p-4 text-center">
                <Accessibility size={48} className="mb-3 opacity-50" />
                <p className="text-sm">Çeviriyi başlatmak için oynat butonuna basın.</p>
              </div>
            )}

            <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-green-600 flex items-center gap-1 shadow-sm">
              <CheckCircle2 size={12} />
              AI DESTEKLİ
            </div>
          </div>

          <div className="p-4 flex-1 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-300 min-h-[40px] italic">
              "{currentText}"
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 flex justify-center gap-4">
            {!isPlaying ? (
              <button
                onClick={handleStart}
                disabled={hasError}
                className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-transform hover:scale-105"
              >
                <Play size={18} className="ml-1" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="w-10 h-10 flex items-center justify-center bg-amber-500 text-white rounded-full hover:bg-amber-600 shadow-md transition-transform hover:scale-105"
              >
                <Pause size={18} />
              </button>
            )}

            <button
              onClick={handleStop}
              disabled={!isPlaying && currentSentenceIndex === 0}
              className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
