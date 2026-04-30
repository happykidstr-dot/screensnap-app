"use client";

import React, { useState, useRef } from 'react';

export function LogoWatermarkPicker({ enabled, onToggle, logoUrl, onLogoUrl, position, onPosition }: {
  enabled: boolean;
  onToggle: () => void;
  logoUrl: string;
  onLogoUrl: (url: string) => void;
  position: 'br' | 'tr' | 'bl' | 'tl';
  onPosition: (p: 'br' | 'tr' | 'bl' | 'tl') => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState(logoUrl);
  const [imgError, setImgError] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onLogoUrl(reader.result as string);
      setUrlDraft(reader.result as string);
      setImgError(false);
    };
    reader.readAsDataURL(file);
  };

  const POSITIONS: { value: 'br' | 'tr' | 'bl' | 'tl'; label: string; icon: string }[] = [
    { value: 'tl', label: 'Sol Üst',  icon: '↖' },
    { value: 'tr', label: 'Sağ Üst',  icon: '↗' },
    { value: 'bl', label: 'Sol Alt',  icon: '↙' },
    { value: 'br', label: 'Sağ Alt',  icon: '↘' },
  ];

  return (
    <div className="w-full border-t border-white/5 pt-3 mt-1">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-widest">
          🏷️ Logo Watermark
        </label>
        <button
          onClick={onToggle}
          className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-white/10'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 pl-1">
          <div className="flex items-center gap-3">
            {logoUrl && !imgError ? (
              <div className="w-16 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-1.5 shrink-0">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-12 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0">
                <span className="text-slate-600 text-[10px]">Logo yok</span>
              </div>
            )}
            <div className="flex flex-col gap-2 flex-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/15 border border-purple-500/25 text-purple-300 text-[10px] font-bold hover:bg-purple-600/25 transition-all"
              >
                📁 Dosyadan Yükle
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleFile} />
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold hover:text-white hover:border-white/20 transition-all"
              >
                🔗 URL ile Ekle
              </button>
            </div>
          </div>

          {showUrlInput && (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://.../logo.png"
                value={urlDraft}
                onChange={e => setUrlDraft(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600"
              />
              <button
                onClick={() => { onLogoUrl(urlDraft); setImgError(false); setShowUrlInput(false); }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition-all"
              >
                Uygula
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
            {POSITIONS.map(p => (
              <button
                key={p.value}
                onClick={() => onPosition(p.value)}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                  position === p.value
                    ? 'bg-purple-600/25 border-purple-500/50 text-purple-200'
                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
