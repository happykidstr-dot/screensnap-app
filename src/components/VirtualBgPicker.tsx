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
    // ── Yerel arka planlar (public/webtv-bg/) ──────────────────────
    { name: 'BG 1',          path: '/webtv-bg/bg1.png' },
    { name: 'BG 2',          path: '/webtv-bg/bg2.png' },
    { name: 'BG 3',          path: '/webtv-bg/bg3.png' },
    { name: 'BG 4',          path: '/webtv-bg/bg4.png' },
    { name: 'BG 5',          path: '/webtv-bg/bg5.png' },
    { name: 'BG 6',          path: '/webtv-bg/bg6.png' },
    { name: 'Galaxy',        path: '/webtv-bg/bg7.png' },
    { name: 'BG 8',          path: '/webtv-bg/bg8.png' },
    { name: 'BG 9',          path: '/webtv-bg/bg9.png' },
    { name: 'BG 10',         path: '/webtv-bg/bg10.png' },
    { name: 'Studio 1',      path: '/webtv-bg/studio1.jpg' },
    { name: 'Studio 2',      path: '/webtv-bg/studio2.jpg' },
    { name: 'Studio 3',      path: '/webtv-bg/studio3.jpg' },
    { name: 'Studio 4',      path: '/webtv-bg/studio4.jpg' },
    { name: 'Studio 5',      path: '/webtv-bg/studio5.jpg' },
    { name: 'Studio 6',      path: '/webtv-bg/studio6.jpg' },
    // ── Unsplash preset'leri ────────────────────────────────────────
    { name: 'Office Modern', path: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Gradient Blue', path: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Minimal Studio',path: 'https://images.unsplash.com/photo-1582192732843-fbca5ff9c2d1?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Tech Loft',     path: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Space Neon',    path: 'https://images.unsplash.com/photo-1516339901600-af13a73858a5?auto=format&fit=crop&q=80&w=2000' },
    { name: 'Cyber Studio',  path: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2000' },
    { name: 'News Room',     path: 'https://images.unsplash.com/photo-1595760780346-f972eb4c7096?auto=format&fit=crop&q=80&w=2000' },
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-[360px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <p className="text-sm font-bold text-white flex items-center gap-2">🖼️ Sanal Arka Plan</p>
            <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors">✕</button>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {/* None / Off */}
            <button
              onClick={() => { onChange(null); onVirtualStudio(false); }}
              className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border aspect-video transition-all ${
                !value ? 'border-teal-500 bg-teal-500/15 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl opacity-60">🚫</span>
              <span className="text-xs font-bold">Kapalı</span>
            </button>

            {presets.map(p => (
              <button key={p.path}
                onClick={() => onChange(p.path)}
                className={`relative flex flex-col items-center p-1 rounded-xl border overflow-hidden transition-all group ${
                  value === p.path ? 'border-teal-500 bg-teal-500/10 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.path} alt={p.name} className="w-full aspect-video object-cover rounded-lg" />
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90%] text-[10px] text-white text-center font-bold bg-black/70 backdrop-blur-sm py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity truncate px-2">
                  {p.name}
                </span>
                {value === p.path && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white shadow-md">
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
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
                onClick={() => { onVirtualStudio(v => !v); if (!value) onChange(presets[0].path); }}
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
