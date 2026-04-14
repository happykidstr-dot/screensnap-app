'use client';

import { useState } from 'react';
import { BookmarkPlus, ChevronRight } from 'lucide-react';
import { formatDuration } from '@/hooks/useRecorder';

export interface Chapter {
  id: string;
  time: number;   // seconds into recording
  label: string;
}

interface ChapterRecorderProps {
  elapsed: number;
  onAdd: (chapter: Chapter) => void;
  chapters: Chapter[];
}

export default function ChapterRecorder({ elapsed, onAdd, chapters }: ChapterRecorderProps) {
  const [label, setLabel] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    const text = label.trim() || `Chapter ${chapters.length + 1}`;
    onAdd({ id: `ch_${Date.now()}`, time: elapsed, label: text });
    setLabel('');
    setAdding(false);
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col items-end gap-2">
      {/* Recent chapters */}
      {chapters.slice(-3).map(c => (
        <div key={c.id} className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-purple-500/20 text-xs text-slate-400 fade-up">
          <span className="font-mono text-purple-300">{formatDuration(Math.round(c.time))}</span>
          <ChevronRight className="w-3 h-3" />
          <span>{c.label}</span>
        </div>
      ))}

      {/* Add form */}
      {adding && (
        <div className="flex gap-2 glass rounded-xl p-2 border border-white/10">
          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            placeholder={`Chapter ${chapters.length + 1}`}
            className="bg-transparent outline-none text-white text-sm w-40 placeholder:text-slate-600"
          />
          <button onClick={handleAdd} className="px-2 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold">Add</button>
        </div>
      )}

      <button
        onClick={() => setAdding(v => !v)}
        className="flex items-center gap-2 glass px-4 py-2 rounded-xl border border-purple-500/30 text-purple-300 text-sm font-semibold hover:bg-purple-600/20 transition-all"
      >
        <BookmarkPlus className="w-4 h-4" />
        {formatDuration(elapsed)} — Add Chapter
      </button>
    </div>
  );
}
