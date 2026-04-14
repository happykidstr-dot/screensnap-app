'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import { updateVideoThumbnail } from '@/lib/db';

interface ThumbnailPickerProps {
  videoId: string;
  blob: Blob;
  duration: number;
  currentThumbnail?: string;
  onClose: () => void;
  onChanged: (newThumb: string) => void;
}

const FRAME_COUNT = 12;

export default function ThumbnailPicker({ videoId, blob, duration, currentThumbnail, onClose, onChanged }: ThumbnailPickerProps) {
  const [frames, setFrames] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(currentThumbnail ?? null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const extract = async () => {
      const url = URL.createObjectURL(blob);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.preload = 'metadata';

      await new Promise<void>(r => { video.onloadedmetadata = () => r(); video.load(); });

      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 180;
      const ctx = canvas.getContext('2d')!;
      const result: string[] = [];

      const framesReal = Math.min(FRAME_COUNT, Math.floor(duration * 2));

      for (let i = 0; i < framesReal; i++) {
        if (cancelled) break;
        const t = (i / framesReal) * duration;
        video.currentTime = t;
        await new Promise<void>(r => { video.onseeked = () => r(); });
        ctx.drawImage(video, 0, 0, 320, 180);
        result.push(canvas.toDataURL('image/jpeg', 0.7));
      }

      URL.revokeObjectURL(url);
      if (!cancelled) { setFrames(result); setLoading(false); }
    };
    extract();
    return () => { cancelled = true; };
  }, [blob, duration]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await updateVideoThumbnail(videoId, selected);
    onChanged(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-bold">🖼 Choose Thumbnail</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3 text-slate-400">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Extracting frames…
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {frames.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(f)}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.03] ${
                    selected === f ? 'border-purple-500 shadow-lg shadow-purple-500/30' : 'border-white/10'
                  }`}
                >
                  <img src={f} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
                  {selected === f && (
                    <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-semibold transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-bold transition-all"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Set as Thumbnail
          </button>
        </div>
      </div>
    </div>
  );
}
