'use client';

import { useRef, useState, useEffect } from 'react';
import { VideoRecord, TimestampComment, updateVideoComments } from '@/lib/db';
import { formatDuration } from '@/hooks/useRecorder';

interface CommentTimelineProps {
  record: VideoRecord;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const EMOJIS = ['👍', '🔥', '❤️', '😮', '🎉', '📝', '⭐', '🤔'];

export default function CommentTimeline({ record, currentTime, duration, onSeek }: CommentTimelineProps) {
  const [comments, setComments] = useState<TimestampComment[]>(record.comments ?? []);
  const [addingAt, setAddingAt] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftEmoji, setDraftEmoji] = useState('📝');
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (addingAt !== null) inputRef.current?.focus(); }, [addingAt]);

  const persistComments = async (updated: TimestampComment[]) => {
    setComments(updated);
    await updateVideoComments(record.id, updated);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track || duration === 0) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pct * duration;
    setAddingAt(time);
    setDraftText('');
    setDraftEmoji('📝');
  };

  const addComment = async () => {
    if (addingAt === null) return;
    const comment: TimestampComment = {
      id: `cmt_${Date.now()}`,
      time: addingAt,
      emoji: draftEmoji,
      text: draftText.trim() || undefined,
      createdAt: Date.now(),
    };
    await persistComments([...comments, comment].sort((a, b) => a.time - b.time));
    setAddingAt(null);
    setDraftText('');
  };

  const removeComment = async (id: string) => {
    await persistComments(comments.filter(c => c.id !== id));
  };

  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-300">Comments & Reactions</h3>
        <span className="text-xs text-slate-500">Click timeline to add</span>
      </div>

      {/* Timeline bar */}
      <div
        ref={trackRef}
        className="relative h-8 bg-white/5 rounded-xl cursor-crosshair overflow-visible mb-3"
        onClick={handleTrackClick}
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/40 pointer-events-none z-10"
          style={{ left: `${playheadPct}%` }}
        />

        {/* Comment markers */}
        {comments.map(c => {
          const pct = duration > 0 ? (c.time / duration) * 100 : 0;
          return (
            <button
              key={c.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-base hover:scale-125 transition-transform z-20"
              style={{ left: `${pct}%` }}
              onClick={e => { e.stopPropagation(); onSeek(c.time); }}
              title={`${formatDuration(Math.round(c.time))} — ${c.text || c.emoji}`}
            >
              {c.emoji}
            </button>
          );
        })}
      </div>

      {/* Add comment form */}
      {addingAt !== null && (
        <div className="glass rounded-2xl p-4 mb-3 border border-purple-500/20">
          <p className="text-xs text-slate-400 mb-3">
            Adding at <span className="text-purple-300 font-mono font-bold">{formatDuration(Math.round(addingAt))}</span>
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setDraftEmoji(e)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                  draftEmoji === e ? 'bg-purple-600/30 scale-110' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addComment()}
              placeholder="Add a note… (optional)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-600"
            />
            <button onClick={addComment} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-colors">
              Add
            </button>
            <button onClick={() => setAddingAt(null)} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {comments.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/8 group cursor-pointer transition-colors"
              onClick={() => onSeek(c.time)}
            >
              <span className="text-xl shrink-0">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-xs text-purple-300 font-bold">{formatDuration(Math.round(c.time))}</span>
                {c.text && <p className="text-sm text-slate-300 truncate">{c.text}</p>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeComment(c.id); }}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition-all"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
