'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Tag } from 'lucide-react';

interface SaveDialogProps {
  defaultTitle: string;
  thumbnail?: string;
  onSave: (title: string, tags: string[]) => void;
  onDiscard: () => void;
}

export default function SaveDialog({ defaultTitle, thumbnail, onSave, onDiscard }: SaveDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const addTag = () => {
    const val = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (val && !tags.includes(val)) {
      setTags(prev => [...prev, val]);
    }
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
    if (e.key === ',' || e.key === ' ') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="glass rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        style={{ border: '1px solid rgba(124,58,237,0.3)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 flex items-center justify-center">
              <span className="text-base">💾</span>
            </div>
            <h2 className="text-white font-bold text-lg">Save Recording</h2>
          </div>
          <p className="text-slate-400 text-sm">Give your recording a name before saving.</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Thumbnail preview */}
          {thumbnail && (
            <div className="rounded-xl overflow-hidden border border-white/10 aspect-video bg-black">
              <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Title</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tags.length === 0 && onSave(title, tags)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="My Recording"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Tags <span className="font-normal normal-case">(press Space or Enter to add)</span>
            </label>
            <div className="min-h-[46px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-purple-500 transition-all">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-purple-600/30 text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-500/30">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-purple-400 hover:text-white ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                className="flex-1 min-w-[80px] bg-transparent outline-none text-white text-sm placeholder:text-slate-600"
                placeholder={tags.length === 0 ? 'demo, work, tutorial…' : ''}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-semibold transition-all text-sm"
          >
            Discard
          </button>
          <button
            onClick={() => onSave(title, tags)}
            className="flex-[2] px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white font-bold transition-all shadow-lg shadow-purple-600/30 text-sm"
          >
            Save Recording
          </button>
        </div>
      </div>
    </div>
  );
}
