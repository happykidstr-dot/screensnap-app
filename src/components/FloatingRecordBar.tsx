'use client';

import { useState, useRef, useEffect } from 'react';
import { Square, Pause, Play, GripHorizontal, BookmarkPlus, MonitorPlay } from 'lucide-react';
import { formatDuration } from '@/hooks/useRecorder';

interface FloatingRecordBarProps {
  state: 'recording' | 'paused';
  elapsed: number;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onAddChapter?: () => void;
  /** Called when user wants to re-open the live monitor */
  onShowMonitor?: () => void;
}

/**
 * Always-visible floating mini-bar during recording.
 * Draggable. Stays on screen regardless of scroll position.
 * Lets the user stop/pause without navigating back to the main panel.
 */
export default function FloatingRecordBar({
  state, elapsed, onStop, onPause, onResume, onAddChapter, onShowMonitor,
}: FloatingRecordBarProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [chapterAdded, setChapterAdded] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const barRef = useRef<HTMLDivElement>(null);

  // Center-bottom on first render
  useEffect(() => {
    if (initialized) return;
    setPos({ x: window.innerWidth / 2 - 150, y: window.innerHeight - 80 });
    setInitialized(true);
  }, [initialized]);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // don't drag from buttons
    e.preventDefault();
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: pos.x, by: pos.y };
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      setPos({
        x: dragStart.current.bx + e.clientX - dragStart.current.mx,
        y: dragStart.current.by + e.clientY - dragStart.current.my,
      });
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging]);

  const handleChapter = () => {
    onAddChapter?.();
    setChapterAdded(true);
    setTimeout(() => setChapterAdded(false), 1500);
  };

  if (!initialized) return null;

  return (
    <div
      ref={barRef}
      onMouseDown={onMouseDown}
      style={{ left: pos.x, top: pos.y, cursor: dragging ? 'grabbing' : 'grab' }}
      className="fixed z-[200] select-none"
    >
      <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${state === 'paused' ? 'bg-slate-900/95 border-slate-600/50' : 'bg-slate-900/95 border-red-500/30'}`}
        style={{ boxShadow: state === 'recording' ? '0 0 24px rgba(239,68,68,0.25)' : '0 8px 32px rgba(0,0,0,0.5)' }}>

        {/* Drag handle */}
        <GripHorizontal className="w-4 h-4 text-slate-600 shrink-0" />

        {/* Recording dot + timer */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
          {state === 'recording'
            ? <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
            : <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />}
          <span className="text-white font-mono text-sm font-bold min-w-[44px]">{formatDuration(elapsed)}</span>
          {state === 'paused' && <span className="text-yellow-400 text-xs font-semibold">PAUSED</span>}
        </div>

        {/* Live Monitor shortcut button */}
        {onShowMonitor && (
          <button
            title="Canlı Monitörü Göster"
            onClick={onShowMonitor}
            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/15 transition-all"
          >
            <MonitorPlay className="w-4 h-4" />
          </button>
        )}

        {/* Chapter bookmark */}
        <button
          title="Add Chapter (bookmark current time)"
          onClick={handleChapter}
          className={`p-1.5 rounded-lg transition-all ${chapterAdded ? 'bg-purple-500/30 text-purple-300' : 'text-slate-500 hover:text-purple-300 hover:bg-purple-500/15'}`}
        >
          <BookmarkPlus className="w-4 h-4" />
        </button>

        {/* Pause / Resume */}
        {state === 'recording'
          ? <button onClick={onPause} title="Pause (Ctrl+Shift+P)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <Pause className="w-4 h-4" />
            </button>
          : <button onClick={onResume} title="Resume"
              className="p-1.5 rounded-lg text-yellow-400 hover:text-white hover:bg-yellow-500/15 transition-all">
              <Play className="w-4 h-4" />
            </button>}

        {/* Stop & Save */}
        <button
          onClick={onStop}
          title="Stop & Save (Ctrl+Shift+R)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95"
        >
          <Square className="w-3.5 h-3.5" /> Stop
        </button>
      </div>
    </div>
  );
}
