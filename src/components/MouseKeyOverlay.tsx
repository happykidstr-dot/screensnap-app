'use client';

import { useEffect, useRef } from 'react';

interface MouseKeyOverlayProps {
  interactionCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  showMouse: boolean;
  showKeys: boolean;
}

interface ClickRipple { x: number; y: number; startTime: number; button: number }
interface KeyShow { key: string; startTime: number }

const IGNORED = new Set(['ShiftLeft','ShiftRight','ControlLeft','ControlRight','AltLeft','AltRight','MetaLeft','MetaRight','CapsLock']);

function formatKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('⌘');
  if (e.altKey) parts.push('⌥');
  if (e.shiftKey) parts.push('⇧');
  let key = e.key;
  if (key === ' ') key = 'Space';
  else if (key === 'ArrowUp') key = '↑';
  else if (key === 'ArrowDown') key = '↓';
  else if (key === 'ArrowLeft') key = '←';
  else if (key === 'ArrowRight') key = '→';
  else if (key === 'Enter') key = '↵';
  else if (key === 'Backspace') key = '⌫';
  else if (key === 'Tab') key = '⇥';
  else if (key === 'Escape') key = 'Esc';
  else if (key.length === 1) key = key.toUpperCase();
  parts.push(key);
  return parts.join('+');
}

export default function MouseKeyOverlay({ interactionCanvasRef, showMouse, showKeys }: MouseKeyOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<ClickRipple[]>([]);
  const keysRef = useRef<KeyShow[]>([]);
  const rafRef = useRef<number | null>(null);

  // Wire canvas to compositor
  useEffect(() => {
    interactionCanvasRef.current = canvasRef.current;
    return () => { interactionCanvasRef.current = null; };
  }, [interactionCanvasRef]);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const RIPPLE_DUR = 700;
    const KEY_DUR = 1800;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      // Click ripples
      if (showMouse) {
        ripplesRef.current = ripplesRef.current.filter(r => now - r.startTime < RIPPLE_DUR);
        for (const r of ripplesRef.current) {
          const t = (now - r.startTime) / RIPPLE_DUR;
          const radius = 8 + t * 48;
          const alpha = (1 - t) * 0.85;
          const color = r.button === 2 ? '59, 130, 246' : '239, 68, 68';
          ctx.save();
          // Outer ring
          ctx.beginPath();
          ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${color}, ${alpha})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          // Inner dot
          if (t < 0.25) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, 7, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${(1 - t / 0.25) * 0.9})`;
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // Key display
      if (showKeys) {
        keysRef.current = keysRef.current.filter(k => now - k.startTime < KEY_DUR);
        if (keysRef.current.length > 0) {
          // Show last 4 keys grouped
          const recent = keysRef.current.slice(-4);
          const text = recent.map(k => k.key).join('  ');
          const oldest = keysRef.current[0];
          const t = (now - oldest.startTime) / KEY_DUR;
          const alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;

          ctx.save();
          ctx.font = 'bold 20px "SF Mono", Consolas, monospace';
          const metrics = ctx.measureText(text);
          const pw = metrics.width + 36;
          const ph = 46;
          const px = (canvas.width - pw) / 2;
          const py = canvas.height - 90;

          // Background pill
          ctx.fillStyle = `rgba(0,0,0,${alpha * 0.82})`;
          if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, 14);
          else ctx.rect(px, py, pw, ph);
          ctx.fill();

          // Purple border
          ctx.strokeStyle = `rgba(124,58,237,${alpha * 0.9})`;
          ctx.lineWidth = 1.5;
          if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, 14);
          else ctx.rect(px, py, pw, ph);
          ctx.stroke();

          // Text
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, canvas.width / 2, py + ph / 2);
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [showMouse, showKeys]);

  // Mouse click listener
  useEffect(() => {
    if (!showMouse) return;
    const onDown = (e: MouseEvent) => {
      ripplesRef.current.push({ x: e.clientX, y: e.clientY, startTime: Date.now(), button: e.button });
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [showMouse]);

  // Key listener
  useEffect(() => {
    if (!showKeys) return;
    const onKey = (e: KeyboardEvent) => {
      if (IGNORED.has(e.code)) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keysRef.current.push({ key: formatKey(e), startTime: Date.now() });
      if (keysRef.current.length > 8) keysRef.current = keysRef.current.slice(-8);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showKeys]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-30 pointer-events-none" />;
}
