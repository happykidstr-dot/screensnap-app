'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';

interface CamPreviewProps {
  stream: MediaStream | null;
  /** Called whenever the user drags/snaps the cam. xPct & yPct are 0-1 normalized. */
  onPositionChange?: (xPct: number, yPct: number) => void;
  /** Initial corner from settings: tl | tr | bl | br */
  initialPosition?: 'tl' | 'tr' | 'bl' | 'br';
}

const SIZES = { sm: { w: 120, h: 90 }, md: { w: 176, h: 132 }, lg: { w: 240, h: 180 } };
const PADDING = 16;
type SizeKey = 'sm' | 'md' | 'lg';

const CORNERS = [
  { label: '↖', xPct: 0,   yPct: 0   },
  { label: '↗', xPct: 1,   yPct: 0   },
  { label: '↙', xPct: 0,   yPct: 1   },
  { label: '↘', xPct: 1,   yPct: 1   },
];

export default function CamPreview({ stream, onPositionChange, initialPosition = 'br' }: CamPreviewProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [pos, setPos]               = useState({ x: 0, y: 0 });
  const [size, setSize]             = useState<SizeKey>('md');
  const [initialized, setInitialized] = useState(false);
  const [dragging, setDragging]     = useState(false);
  const [showControls, setShowControls] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });

  const { w, h } = SIZES[size];

  // Notify parent of normalized position
  const notifyPosition = useCallback((px: number, py: number, pw: number, ph: number) => {
    if (!onPositionChange) return;
    const xPct = Math.max(0, Math.min(1, px / Math.max(1, window.innerWidth  - pw)));
    const yPct = Math.max(0, Math.min(1, py / Math.max(1, window.innerHeight - ph)));
    onPositionChange(xPct, yPct);
  }, [onPositionChange]);

  // Place at the configured corner on first render
  useEffect(() => {
    if (initialized || !stream) return;
    const isLeft = initialPosition.includes('l');
    const isTop  = initialPosition.includes('t');
    const x = isLeft ? PADDING : window.innerWidth  - w - PADDING;
    const y = isTop  ? PADDING : window.innerHeight - h - PADDING;
    setPos({ x, y });
    setInitialized(true);
    notifyPosition(x, y, w, h);
  }, [stream, initialized, w, h, notifyPosition, initialPosition]);


  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  // --- Dragging ---
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const nx = Math.max(0, Math.min(window.innerWidth  - w, dragStart.current.bx + e.clientX - dragStart.current.mx));
      const ny = Math.max(0, Math.min(window.innerHeight - h, dragStart.current.by + e.clientY - dragStart.current.my));
      setPos({ x: nx, y: ny });
      notifyPosition(nx, ny, w, h);
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging, w, h, notifyPosition]);

  // Snap to corner
  const snapToCorner = (xPct: number, yPct: number) => {
    const nx = xPct === 0 ? PADDING : window.innerWidth  - w - PADDING;
    const ny = yPct === 0 ? PADDING : window.innerHeight - h - PADDING;
    setPos({ x: nx, y: ny });
    onPositionChange?.(xPct, yPct);
  };

  // Cycle size
  const cycleSize = () => {
    const order: SizeKey[] = ['sm', 'md', 'lg'];
    const next = order[(order.indexOf(size) + 1) % order.length];
    setSize(next);
    setPos(p => ({
      x: Math.min(p.x, window.innerWidth  - SIZES[next].w - PADDING),
      y: Math.min(p.y, window.innerHeight - SIZES[next].h - PADDING),
    }));
  };

  if (!stream || !initialized) return null;

  return (
    <div
      ref={wrapRef}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !dragging && setShowControls(false)}
      style={{
        left: pos.x,
        top: pos.y,
        width: w,
        height: h,
        cursor: dragging ? 'grabbing' : 'grab',
        transition: dragging ? 'none' : 'width 0.2s, height 0.2s',
      }}
      className="fixed z-[300] select-none rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-500/60 bg-black"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover scale-x-[-1]"
      />

      {/* Purple ring overlay */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-purple-500/30 pointer-events-none" />

      {/* "Drag to reposition" hint badge */}
      {!showControls && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/50 text-white/40 text-[9px] font-medium whitespace-nowrap pointer-events-none select-none">
          sürükle
        </div>
      )}

      {/* Hover controls */}
      <div
        style={{ opacity: showControls ? 1 : 0, transition: 'opacity 0.18s' }}
        className="absolute inset-0 flex flex-col pointer-events-none"
      >
        {/* Top bar – drag handle + size toggle */}
        <div className="flex items-center justify-between px-1.5 pt-1 pointer-events-auto">
          <GripHorizontal className="w-3.5 h-3.5 text-white/60 shrink-0" />
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={cycleSize}
            title="Boyutu değiştir"
            className="p-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/60 transition"
          >
            {size === 'lg' ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>

        {/* Corner snap buttons */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 pointer-events-auto">
          {CORNERS.map((c, i) => (
            <button
              key={i}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => snapToCorner(c.xPct, c.yPct)}
              title="Bu köşeye taşı"
              className="flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 text-xs font-bold transition rounded-sm m-0.5"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
