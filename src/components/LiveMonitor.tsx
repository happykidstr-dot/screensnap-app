'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Minimize2,
  Maximize2,
  X,
  GripHorizontal,
  PictureInPicture2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatDuration } from '@/hooks/useRecorder';

interface LiveMonitorProps {
  stream: MediaStream | null;
  elapsed: number;
  state: 'recording' | 'paused' | string;
  onClose?: () => void;
}

type MonitorSize = 'mini' | 'medium' | 'large';

const SIZE_MAP: Record<MonitorSize, { w: number; h: number }> = {
  mini:   { w: 240, h: 135 },
  medium: { w: 360, h: 203 },
  large:  { w: 480, h: 270 },
};

export default function LiveMonitor({ stream, elapsed, state, onClose }: LiveMonitorProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const barRef        = useRef<HTMLDivElement>(null);
  const dragStart     = useRef({ mx: 0, my: 0, bx: 0, by: 0 });

  const [pos, setPos]         = useState({ x: 0, y: 0 });
  const [inited, setInited]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [size, setSize]       = useState<MonitorSize>('medium');
  const [hidden, setHidden]   = useState(false);   // collapse to just header
  const [muted, setMuted]     = useState(true);
  const [pipActive, setPipActive] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Place top-right on first render
  useEffect(() => {
    if (inited) return;
    const w = SIZE_MAP.medium.w;
    setPos({ x: window.innerWidth - w - 24, y: 80 });
    setInited(true);
  }, [inited]);

  // Attach stream to video element
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (stream) {
      vid.srcObject = stream;
      vid.play().catch(() => {});
    } else {
      vid.srcObject = null;
    }
  }, [stream]);

  // Mute toggle
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Drag logic
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth  - SIZE_MAP[size].w - 8, dragStart.current.bx + e.clientX - dragStart.current.mx)),
        y: Math.max(0, Math.min(window.innerHeight - 48,                   dragStart.current.by + e.clientY - dragStart.current.my)),
      });
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging, size]);

  // Picture-in-Picture
  const togglePiP = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPipActive(false);
      } else {
        await vid.requestPictureInPicture();
        setPipActive(true);
        vid.addEventListener('leavepictureinpicture', () => setPipActive(false), { once: true });
      }
    } catch (err) {
      console.warn('[LiveMonitor] PiP not supported:', err);
    }
  }, []);

  if (!inited || !stream) return null;

  const { w, h } = SIZE_MAP[size];
  const isRecording = state === 'recording';

  return (
    <div
      ref={barRef}
      style={{
        left: pos.x,
        top: pos.y,
        width: w,
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: 9999,
      }}
      className="fixed select-none"
    >
      {/* Outer glow ring */}
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          borderColor: isRecording ? 'rgba(239,68,68,0.5)' : 'rgba(234,179,8,0.4)',
          boxShadow: isRecording
            ? '0 0 0 1px rgba(239,68,68,0.2), 0 8px 40px rgba(239,68,68,0.3), 0 2px 12px rgba(0,0,0,0.7)'
            : '0 0 0 1px rgba(234,179,8,0.1), 0 8px 32px rgba(0,0,0,0.6)',
          background: '#050510',
        }}
      >
        {/* ─── Drag Handle / Header ─── */}
        <div
          onMouseDown={onMouseDown}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          className="relative flex items-center justify-between px-2.5 py-1.5 gap-2"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        >
          {/* Left: status */}
          <div className="flex items-center gap-1.5 min-w-0">
            <GripHorizontal className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isRecording
              ? <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              : <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
            }
            <span className="text-white font-mono text-[11px] font-bold shrink-0">
              {formatDuration(elapsed)}
            </span>
            <span
              className="text-[10px] font-bold tracking-widest uppercase truncate"
              style={{ color: isRecording ? '#f87171' : '#facc15' }}
            >
              {isRecording ? 'REC' : 'PAUSED'}
            </span>
          </div>

          {/* Right: action buttons */}
          <div
            className="flex items-center gap-0.5 transition-opacity duration-150"
            style={{ opacity: showControls ? 1 : 0.3 }}
          >
            {/* Mute */}
            <button
              onClick={() => setMuted(v => !v)}
              title={muted ? 'Sesi aç' : 'Sessize al'}
              className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            >
              {muted
                ? <VolumeX className="w-3 h-3" />
                : <Volume2 className="w-3 h-3" />
              }
            </button>

            {/* PiP */}
            <button
              onClick={togglePiP}
              title="Picture-in-Picture (tüm pencerelerin üzerinde yüzer)"
              className={`p-1 rounded-lg transition-all ${pipActive ? 'text-cyan-400 bg-cyan-500/15' : 'text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10'}`}
            >
              <PictureInPicture2 className="w-3 h-3" />
            </button>

            {/* Hide/Show video */}
            <button
              onClick={() => setHidden(v => !v)}
              title={hidden ? 'Önizlemeyi göster' : 'Önizlemeyi gizle'}
              className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            >
              {hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>

            {/* Size cycle */}
            <button
              onClick={() => setSize(s => s === 'mini' ? 'medium' : s === 'medium' ? 'large' : 'mini')}
              title="Boyutu değiştir"
              className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            >
              {size === 'large'
                ? <Minimize2 className="w-3 h-3" />
                : <Maximize2 className="w-3 h-3" />
              }
            </button>

            {/* Close */}
            {onClose && (
              <button
                onClick={onClose}
                title="Monitörü kapat"
                className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ─── Video Feed ─── */}
        {!hidden && (
          <div className="relative" style={{ height: h - 32, background: '#000' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={muted}
              className="w-full h-full object-contain"
              style={{ display: 'block' }}
            />

            {/* No-signal overlay when stream is loading */}
            {!stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-500 text-[10px]">Sinyal bekleniyor…</span>
              </div>
            )}

            {/* Corner badge */}
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: isRecording ? '#ef4444' : '#facc15',
                  animation: isRecording ? 'pulse 1s ease-in-out infinite' : 'none',
                }}
              />
              <span className="text-white text-[9px] font-bold tracking-wider">
                {isRecording ? 'CANLI' : 'DURAKLATILDI'}
              </span>
            </div>

            {/* PiP active indicator */}
            {pipActive && (
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-cyan-500/80 backdrop-blur-sm">
                <span className="text-white text-[9px] font-bold">PiP</span>
              </div>
            )}

            {/* Scanline effect (subtle) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }}
            />
          </div>
        )}

        {/* Collapsed state */}
        {hidden && (
          <div className="px-3 py-1.5 text-center">
            <span className="text-slate-600 text-[10px]">Önizleme gizlendi</span>
          </div>
        )}
      </div>

      {/* Pulse ring animation during recording */}
      {isRecording && !hidden && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: '0 0 0 2px rgba(239,68,68,0.15)',
            animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
          }}
        />
      )}
    </div>
  );
}
