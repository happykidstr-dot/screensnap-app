"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, Search, X, CheckSquare, Tag, Video, 
  CheckCircle2
} from 'lucide-react';
import VideoCard from './VideoCard';
import BatchToolbar from './BatchToolbar';
import { deleteVideo, updateVideoFolder, updateVideoTags } from '../lib/db';
import { t } from '../lib/translations';
import { toast } from './Toast';
import { VideoRecord } from '../lib/db';

interface LibrarySectionProps {
  videos: VideoRecord[];
  folders: string[];
  loadingVideos: boolean;
  activeFolder: string | null;
  setActiveFolder: (folder: string | null) => void;
  loadVideos: () => void;
  setSelectedVideo: (video: VideoType | null) => void;
  lang: 'en' | 'tr';
}

export function LibrarySection({
  videos,
  folders,
  loadingVideos,
  activeFolder,
  setActiveFolder,
  loadVideos,
  setSelectedVideo,
  lang
}: LibrarySectionProps) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Filter Logic ───
  const filteredVideos = useMemo(() => {
    let list = videos;
    if (activeFolder) list = list.filter(v => v.folder === activeFolder);
    if (activeTag)    list = list.filter(v => v.tags?.includes(activeTag));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(v => v.title.toLowerCase().includes(s) || v.tags?.some(t => t.toLowerCase().includes(s)));
    }
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [videos, activeFolder, activeTag, search]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    videos.forEach(v => v.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [videos]);

  // ─── Handlers ───
  const toggleBatchSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteFromList = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('deleteConfirm', lang))) { 
      await deleteVideo(id); 
      loadVideos(); 
      toast(lang === 'tr' ? 'Video silindi.' : 'Video deleted.', 'info');
    }
  };

  const handleBatchDelete = async () => {
    if (confirm(`Delete ${selectedIds.size} recordings?`)) {
      for (const id of selectedIds) await deleteVideo(id);
      setSelectedIds(new Set()); 
      setBatchMode(false); 
      loadVideos();
      toast(`${selectedIds.size} ${lang === 'tr' ? 'video silindi.' : 'videos deleted.'}`, 'info');
    }
  };

  const handleBatchExport = async () => {
    for (const id of selectedIds) {
      const v = videos.find(x => x.id === id);
      if (!v) continue;
      const url = URL.createObjectURL(v.blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `${v.title}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast(`${selectedIds.size} ${lang === 'tr' ? 'video indiriliyor...' : 'videos downloading...'}`, 'success');
  };

  const handleBatchMove = async (folder: string | null) => {
    for (const id of selectedIds) await updateVideoFolder(id, folder || undefined);
    loadVideos();
    toast(lang === 'tr' ? 'Videolar taşındı.' : 'Videos moved.', 'success');
  };

  const handleBatchTag = async (tag: string) => {
    for (const id of selectedIds) {
      const v = videos.find(x => x.id === id);
      if (!v) continue;
      const tags = [...new Set([...(v.tags || []), tag])];
      await updateVideoTags(id, tags);
    }
    loadVideos();
    toast(lang === 'tr' ? 'Etiketler güncellendi.' : 'Tags updated.', 'success');
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <LayoutGrid className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activeFolder ? activeFolder : t('myRecordings', lang)}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {filteredVideos.length} {lang === 'tr' ? 'VİDEO' : 'RECORDINGS'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Batch toggle */}
          {videos.length > 0 && (
            <button 
              onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                batchMode 
                  ? 'bg-purple-600 border border-purple-400 text-white shadow-lg shadow-purple-600/20' 
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> 
              {batchMode ? (lang === 'tr' ? 'Seçimi Bitir' : 'Done') : (lang === 'tr' ? 'Çoklu Seç' : 'Multi-Select')}
            </button>
          )}

          {/* Search */}
          {videos.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder={t('search', lang)} 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-purple-500/50 w-48 transition-all focus:w-64" 
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tags Bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 p-1">
          <button 
            onClick={() => setActiveTag(null)} 
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              !activeTag 
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' 
                : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button 
              key={tag} 
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeTag === tag 
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' 
                  : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" /> {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loadingVideos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-3xl bg-white/5 border border-white/10 aspect-video animate-pulse" />
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="rounded-3xl p-20 text-center border border-dashed border-white/10 bg-white/2">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/5 flex items-center justify-center">
            {search || activeTag ? <Search className="w-10 h-10 text-slate-700" /> : <Video className="w-10 h-10 text-slate-700" />}
          </div>
          <h3 className="text-white font-bold text-lg mb-2">
            {search || activeTag ? (lang === 'tr' ? 'Eşleşen kayıt bulunamadı' : 'No results found') : (lang === 'tr' ? 'Henüz kayıt yok' : 'No recordings yet')}
          </h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm">
            {search || activeTag 
              ? (lang === 'tr' ? 'Arama kriterlerini değiştirerek tekrar deneyin.' : 'Try adjusting your search or filters.') 
              : (lang === 'tr' ? 'Hemen ilk kaydınızı başlatın ve burada görün.' : 'Start your first recording and it will appear here.')}
          </p>
          {(search || activeTag) && (
            <button 
              onClick={() => { setSearch(''); setActiveTag(null); }} 
              className="mt-6 px-6 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold border border-white/10 transition-all"
            >
              Filters Clear
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((v, i) => (
            <div key={v.id} className="relative group">
              {batchMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBatchSelect(v.id); }}
                  className={`absolute top-4 left-4 z-20 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                    selectedIds.has(v.id) 
                      ? 'bg-purple-600 border-purple-400 text-white shadow-lg' 
                      : 'bg-black/40 border-white/30 text-transparent hover:border-purple-400 backdrop-blur-md'
                  }`}
                >
                  {selectedIds.has(v.id) && <CheckCircle2 className="w-4 h-4" />}
                </button>
              )}
              <VideoCard 
                record={v} 
                index={i} 
                folders={folders}
                onClick={() => batchMode ? toggleBatchSelect(v.id) : setSelectedVideo(v)}
                onDelete={e => handleDeleteFromList(v.id, e)}
                onMoveFolder={async (folder) => { 
                  await updateVideoFolder(v.id, folder || undefined); 
                  loadVideos(); 
                  toast(lang === 'tr' ? 'Klasör güncellendi.' : 'Folder updated.', 'success');
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Batch Toolbar */}
      {batchMode && selectedIds.size > 0 && (
        <BatchToolbar
          lang={lang}
          videos={filteredVideos}
          selectedIds={selectedIds}
          folders={folders}
          onToggleSelect={toggleBatchSelect}
          onSelectAll={() => setSelectedIds(new Set(filteredVideos.map(v => v.id)))}
          onDeselectAll={() => setSelectedIds(new Set())}
          onBatchDelete={handleBatchDelete}
          onBatchExport={handleBatchExport}
          onBatchMove={handleBatchMove}
          onBatchTag={handleBatchTag}
          onClose={() => { setBatchMode(false); setSelectedIds(new Set()); }}
        />
      )}
    </section>
  );
}
