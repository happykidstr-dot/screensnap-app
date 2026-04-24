'use client';

import { useState } from 'react';
import { VideoRecord } from '@/lib/db';
import { Trash2, Download, FolderInput, Tag, CheckSquare, Square, X } from 'lucide-react';
import { Lang, t } from '@/lib/i18n';

interface BatchToolbarProps {
  lang: Lang;
  videos: VideoRecord[];
  selectedIds: Set<string>;
  folders: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchDelete: () => void;
  onBatchExport: () => void;
  onBatchMove: (folder: string | null) => void;
  onBatchTag: (tag: string) => void;
  onClose: () => void;
}

export default function BatchToolbar({
  lang, videos, selectedIds, folders,
  onToggleSelect, onSelectAll, onDeselectAll,
  onBatchDelete, onBatchExport, onBatchMove, onBatchTag, onClose,
}: BatchToolbarProps) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagValue, setTagValue] = useState('');

  const count = selectedIds.size;
  const allSelected = count === videos.length && videos.length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="max-w-5xl mx-auto px-4 pb-4">
        <div className="glass rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-900/30 px-5 py-3.5 flex items-center gap-3 flex-wrap">
          {/* Selection info */}
          <div className="flex items-center gap-2">
            <button onClick={allSelected ? onDeselectAll : onSelectAll}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              {allSelected ? <CheckSquare className="w-5 h-5 text-purple-400" /> : <Square className="w-5 h-5" />}
            </button>
            <span className="text-white font-bold text-sm">
              {count} {t('selected', lang)}
            </span>
          </div>

          <div className="h-6 w-px bg-white/10" />

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Batch Export */}
            <button
              onClick={onBatchExport}
              disabled={count === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 transition-all disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> {t('batchExport', lang)}
            </button>

            {/* Batch Move */}
            <div className="relative">
              <button
                onClick={() => setShowFolderMenu(v => !v)}
                disabled={count === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/25 transition-all disabled:opacity-40"
              >
                <FolderInput className="w-3.5 h-3.5" /> {t('batchMove', lang)}
              </button>
              {showFolderMenu && (
                <div className="absolute bottom-full mb-2 left-0 w-44 glass rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                  <button onClick={() => { onBatchMove(null); setShowFolderMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                    {t('noFolder', lang)}
                  </button>
                  {folders.map(f => (
                    <button key={f} onClick={() => { onBatchMove(f); setShowFolderMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                      📁 {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Batch Tag */}
            <div className="relative">
              <button
                onClick={() => setShowTagInput(v => !v)}
                disabled={count === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all disabled:opacity-40"
              >
                <Tag className="w-3.5 h-3.5" /> {t('batchTag', lang)}
              </button>
              {showTagInput && (
                <div className="absolute bottom-full mb-2 left-0 w-56 glass rounded-xl border border-white/10 shadow-xl z-20 p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagValue}
                      onChange={e => setTagValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && tagValue.trim()) {
                          onBatchTag(tagValue.trim().toLowerCase().replace(/\s+/g, '-'));
                          setTagValue('');
                          setShowTagInput(false);
                        }
                      }}
                      placeholder={lang === 'tr' ? 'Etiket adı…' : 'Tag name…'}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (tagValue.trim()) {
                          onBatchTag(tagValue.trim().toLowerCase().replace(/\s+/g, '-'));
                          setTagValue('');
                          setShowTagInput(false);
                        }
                      }}
                      className="px-2 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold">
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Batch Delete */}
            <button
              onClick={onBatchDelete}
              disabled={count === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/25 transition-all disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('batchDelete', lang)}
            </button>
          </div>

          {/* Close batch mode */}
          <button onClick={onClose}
            className="ml-auto p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
