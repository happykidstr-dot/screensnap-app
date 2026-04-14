'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SpotlightOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

/**
 * Ekran Zoom / Spotlight — video oynatma sırasında bir alana tıklayarak
 * o bölgeye zoom yapar. Tekrar tıklamak veya Escape ile çıkar.
 */
export default function SpotlightOverlay({ videoRef }: SpotlightOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [active, setActive] = useState(false);
  const [zoom, setZoom] = useState({ x: 0.5, y: 0.5, scale: 2.5 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.paused || video.ended) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { clientWidth: w, clientHeight: h } = canvas;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    // Draw zoomed region
    const srcW = video.videoWidth / zoom.scale;
    const srcH = video.videoHeight / zoom.scale;
    const srcX = Math.max(0, video.videoWidth * zoom.x - srcW / 2);
    const srcY = Math.max(0, video.videoHeight * zoom.y - srcH / 2);

    ctx.drawImage(
      video,
      srcX, srcY, srcW, srcH,
      0, 0, w, h
    );

    // Crosshair hint
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, h / 2); ctx.lineTo(w / 2 + 10, h / 2);
    ctx.moveTo(w / 2, h / 2 - 10); ctx.lineTo(w / 2, h / 2 + 10);
    ctx.stroke();

    animRef.current = requestAnimationFrame(draw);
  }, [videoRef, zoom]);

  useEffect(() => {
    if (active) {
      animRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [active, draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    setZoom(z => ({ ...z, x: relX, y: relY }));
  };

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        title="Spotlight / Zoom (Z)"
        className="absolute bottom-12 right-3 z-20 px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur text-white text-xs font-bold border border-white/20 hover:bg-white/20 transition-all flex items-center gap-1.5"
      >
        🔍 Zoom
      </button>
    );
  }

  return (
    <div className="absolute inset-0 z-20">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleClick}
        style={{ background: '#000' }}
      />
      {/* Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/70 backdrop-blur rounded-xl px-3 py-2 border border-white/10">
        <span className="text-white text-xs font-semibold">🔍 {zoom.scale.toFixed(1)}×</span>
        <input
          type="range" min={1.5} max={5} step={0.5}
          value={zoom.scale}
          onChange={e => setZoom(z => ({ ...z, scale: +e.target.value }))}
          className="w-20 accent-purple-500"
        />
        <button
          onClick={() => setActive(false)}
          className="ml-1 text-xs text-slate-400 hover:text-white font-bold bg-white/10 px-2 py-1 rounded-lg transition-colors"
        >✕ Çık</button>
      </div>
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/50 text-xs">
        Tıkladığınız noktaya zoom yapar · Escape veya ✕ ile çıkın
      </p>
    </div>
  );
}
