"use client";

import React, { useRef, useEffect, useState } from 'react';
import { FrameStyle, FRAME_OPTIONS, drawFrame } from '../lib/videoFrame';

export function FramePickerWithPreview({ value, brandColor, onChange }: {
  value: FrameStyle;
  brandColor: string;
  onChange: (v: FrameStyle) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<FrameStyle>(value);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => { setHovered(value); }, [value]);

  useEffect(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width; const H = canvas.height;
    const ANIMATED: FrameStyle[] = ['neon-cyan', 'neon-green', 'dots-pattern', 'retro-vhs'];

    const paint = (t: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#090716'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#13112a'; ctx.fillRect(10, 10, W - 20, H - 20);
      
      // Fake webcam circle
      const cr = 24, cx = W - cr - 16, cy = H - cr - 12;
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = '#281963'; ctx.fill();
      ctx.strokeStyle = brandColor; ctx.lineWidth = 2; ctx.stroke();
      
      drawFrame(ctx, W, H, hovered, brandColor, t);
    };

    if (ANIMATED.includes(hovered)) {
      const loop = () => { paint(Date.now() / 1000); rafIdRef.current = requestAnimationFrame(loop); };
      rafIdRef.current = requestAnimationFrame(loop);
    } else {
      paint(0);
    }
    return () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };
  }, [hovered, brandColor]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FRAME_OPTIONS.map(f => (
          <button
            key={f.value}
            onMouseEnter={() => setHovered(f.value)}
            onMouseLeave={() => setHovered(value)}
            onClick={() => onChange(f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
              value === f.value ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'border-white/10 bg-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10 mx-auto" style={{ maxWidth: 240, aspectRatio: '16/9' }}>
        <canvas ref={canvasRef} width={320} height={180} className="w-full h-full block" />
      </div>
    </div>
  );
}
