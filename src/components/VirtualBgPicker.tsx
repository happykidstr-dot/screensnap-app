'use client';
import { useState, useRef } from 'react';

// ─── Virtual Background Picker ───────────────────────────────────────────────
// Advanced Settings'te webcam arka planı için görsel seçici.
// Seçilen preset/custom image webtvBg state'ine yazılır.
// AI Sanal Studio toggle da buradan açılır.
export default function VirtualBgPicker({
  value, onChange, virtualStudio, onVirtualStudio,
}: {
  value: string | null;
  onChange: (bg: string | null) => void;
  virtualStudio: boolean;
  onVirtualStudio: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const presets = [
    { emoji: 'Studio', path: '/webtv-bg/bg1.png' },
    { emoji: 'News',   path: '/webtv-bg/bg2.png' },
    { emoji: 'Tech',   path: '/webtv-bg/bg3.png' },
    { emoji: 'Night',  path: '/webtv-bg/bg4.png' },
    { emoji: 'Galaxy', path: '/webtv-bg/bg7.png' },
    { emoji: 'Office', path: '/webtv-bg/bg6.png' },
  ];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-0.5 relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Sanal Arka Plan (Virtual Background)"
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
          value
            ? 'border-teal-500/50 bg-teal-500/15 text-teal-300'
            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
        }`}
      >
        <span className="text-base">BG</span>
        <span className="text-[10px] leading-none">Sanal BG</span>
        {value && <span className="w-2 h-2 rounded-full bg-teal-400 mt-0.5" />}
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 bg-slate-900 border border-white/10 rounded-2xl p-3 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white">Sanal Arka Plan</p>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white text-xs">X</button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* None / Off */}
            <button
              onClick={() => { onChange(null); onVirtualStudio(false); }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-semibold transition-all ${
                !value ? 'border-teal-500/60 bg-teal-500/15 text-teal-300' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base">Off</span>
              <span>Kapalı</span>
            </button>

            {presets.map(p => (
              <button key={p.path}
                onClick={() => onChange(p.path)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border overflow-hidden transition-all ${
                  value === p.path ? 'border-teal-500/60 scale-105 shadow-lg shadow-teal-500/20' : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.path} alt={p.emoji} className="w-full h-10 object-cover rounded-lg" />
                <span className="text-[9px] text-slate-300">{p.emoji}</span>
              </button>
            ))}
          </div>

          {/* Custom upload */}
          <label className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-dashed border-white/20 hover:border-teal-500/50 hover:bg-teal-500/5 text-slate-400 hover:text-teal-300 text-xs font-semibold cursor-pointer transition-all">
            <span>Upload</span>
            <span>Kendi Gorselini Yukle</span>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>

          {value?.startsWith('data:') && (
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="custom bg" className="w-10 h-6 object-cover rounded" />
              <span className="text-[10px] text-teal-300 flex-1">Ozel gorsel aktif</span>
              <button onClick={() => onChange(null)} className="text-red-400 hover:text-red-300 text-xs">X</button>
            </div>
          )}

          {/* AI Virtual Studio toggle */}
          <div className={`rounded-xl border p-2.5 transition-colors ${virtualStudio ? 'border-emerald-500/40 bg-emerald-900/20' : 'border-white/10 bg-white/3'}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-slate-300">AI Arka Plan Kaldir</p>
                <p className="text-[9px] text-slate-500 leading-tight">Gercek arka plani MediaPipe ile sil</p>
              </div>
              <button
                onClick={() => { onVirtualStudio(v => !v); if (!value) onChange('/webtv-bg/bg1.png'); }}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${virtualStudio ? 'bg-emerald-500' : 'bg-white/15'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${virtualStudio ? 'translate-x-4' : ''}`} />
              </button>
            </div>
            {virtualStudio && (
              <p className="text-[9px] text-emerald-300 mt-1.5">
                Kayit baslaynca AI modeli yuklenir (3-5sn)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
