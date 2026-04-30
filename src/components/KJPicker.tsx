"use client";

import React, { useRef, useEffect } from 'react';
import { KJStyle, KJPosition, KJ_STYLE_OPTIONS, KJ_POSITION_OPTIONS, drawKJ } from '../lib/videoFrame';

export function KJPicker({ enabled, onToggle, line1, line2, onLine1, onLine2, style, onStyle, position, onPosition, duration, onDuration, brandColor }: {
  enabled: boolean; onToggle: () => void;
  line1: string; line2: string;
  onLine1: (v: string) => void; onLine2: (v: string) => void;
  style: KJStyle; onStyle: (v: KJStyle) => void;
  position: KJPosition; onPosition: (v: KJPosition) => void;
  duration: number; onDuration: (v: number) => void;
  brandColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width; const H = canvas.height;

    // Mock screen bg
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#090716'); bg.addColorStop(1, '#17142d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#13112a'; ctx.fillRect(8, 8, W - 16, H - 16);
    
    drawKJ(ctx, W, H, line1 || 'Ad Soyad', line2 || 'Ünvan / Şirket', style, position, brandColor, 1);
  }, [enabled, line1, line2, style, position, brandColor]);

  return (
    <div className="w-full border-t border-white/5 pt-3 mt-1">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-widest">
          📺 KJ / Alt Yazı (Lower Third)
        </label>
        <button
          onClick={onToggle}
          className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-white/10'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
        </button>
      </div>

      {enabled && (
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Ad Soyad"
              value={line1}
              onChange={e => onLine1(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] outline-none focus:ring-1 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Ünvan / Şirket"
              value={line2}
              onChange={e => onLine2(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] outline-none focus:ring-1 focus:ring-purple-500"
            />

            <div className="flex flex-wrap gap-1.5">
              {KJ_STYLE_OPTIONS.map(s => (
                <button key={s.value} onClick={() => onStyle(s.value)}
                  className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                    style === s.value ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'border-white/10 bg-white/5 text-slate-500'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {KJ_POSITION_OPTIONS.map(p => (
                <button key={p.value} onClick={() => onPosition(p.value)}
                  className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all ${
                    position === p.value ? 'bg-cyan-600/20 border-cyan-500 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-500'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                <span>SÜRE: {duration === 0 ? 'Sürekli' : `${duration} sn`}</span>
              </div>
              <input type="range" min={0} max={30} step={1} value={duration} onChange={e => onDuration(+e.target.value)} className="w-full accent-purple-500 h-1" />
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/10" style={{ aspectRatio: '16/9' }}>
            <canvas ref={canvasRef} width={320} height={180} className="w-full h-full block" />
          </div>
        </div>
      )}
    </div>
  );
}
