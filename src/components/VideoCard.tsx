'use client';

import React, { useState } from 'react';
import { Play, Trash2, Folder, Clock, HardDrive, Video, AudioLines } from 'lucide-react';
import { VideoRecord } from '@/lib/db';
import { formatDuration, formatBytes } from '@/hooks/useRecorder';

interface VideoCardProps {
  record: VideoRecord;
  index: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  folders: string[];
  onMoveFolder: (folder: string | null) => void;
}

export default function VideoCard({ record, index, onClick, onDelete, folders, onMoveFolder }: VideoCardProps) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const isAudio = record.blob.type.includes('audio');

  return (
    <div className="glass rounded-2xl overflow-hidden cursor-pointer group fade-up border border-white/5 hover:border-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-900/20"
      style={{ animationDelay: `${index * 60}ms` }} onClick={onClick}>
      <div className="aspect-video bg-slate-900 relative overflow-hidden">
        {isAudio ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/40 to-slate-900">
            <AudioLines className="w-10 h-10 text-purple-400 mb-2" />
            <span className="text-purple-300 text-xs font-medium">Audio Recording</span>
          </div>
        ) : record.thumbnail ? (
          <img src={record.thumbnail} alt={record.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/20"><Video className="w-6 h-6 text-purple-400" /></div>
          </div>
        )}
        {!isAudio && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all scale-0 group-hover:scale-100">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs font-mono font-bold">{formatDuration(record.duration)}</div>
        {record.cloudUrl && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500/80 flex items-center justify-center" title="Cloud uploaded"><span className="text-white text-[8px] font-bold">☁</span></div>}
        {record.chapters && record.chapters.length > 0 && <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-purple-300 text-[10px] font-bold">{record.chapters.length} ch</div>}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-white text-sm font-semibold truncate group-hover:text-purple-300 transition-colors">{record.title}</p>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100">
            {folders.length > 0 && (
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowFolderMenu(v => !v)} className="p-1.5 rounded-lg text-slate-500 hover:text-purple-300 hover:bg-purple-500/10"><Folder className="w-3.5 h-3.5" /></button>
                {showFolderMenu && (
                  <div className="absolute right-0 bottom-8 w-40 glass rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                    <button onClick={() => { onMoveFolder(null); setShowFolderMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white">No folder</button>
                    {folders.map(f => (
                      <button key={f} onClick={() => { onMoveFolder(f); setShowFolderMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/10 ${record.folder === f ? 'text-purple-300' : 'text-slate-400 hover:text-white'}`}>
                        {record.folder === f ? '✓ ' : ''}{f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {record.folder && <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1"><Folder className="w-3 h-3" />{record.folder}</p>}
        {record.tags && record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {record.tags.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-purple-600/15 text-purple-400 border border-purple-500/20">{t}</span>)}
          </div>
        )}
        <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(record.duration)}</span>
          <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatBytes(record.size)}</span>
        </div>
      </div>
    </div>
  );
}
