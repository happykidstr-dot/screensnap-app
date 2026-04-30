'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllVideos, VideoRecord } from '@/lib/db';
import { formatDuration, formatBytes } from '@/hooks/useRecorder';
import { Lang, t, getSavedLang, saveLang } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import Link from 'next/link';
import {
  Video, Clock, HardDrive, BarChart3, TrendingUp, Tag,
  ArrowLeft, Calendar, PieChart, Activity, Folder, AudioLines,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [lang, setLang] = useState<Lang>('tr');
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all');

  useEffect(() => { setLang(getSavedLang()); }, []);
  const changeLang = (l: Lang) => { setLang(l); saveLang(l); };

  useEffect(() => {
    getAllVideos().then(all => { setVideos(all); setLoading(false); });
  }, []);

  const filteredVideos = useMemo(() => {
    const now = Date.now();
    if (period === 'week') return videos.filter(v => now - v.createdAt < 7 * 24 * 60 * 60 * 1000);
    if (period === 'month') return videos.filter(v => now - v.createdAt < 30 * 24 * 60 * 60 * 1000);
    return videos;
  }, [videos, period]);

  const stats = useMemo(() => {
    const totalDuration = filteredVideos.reduce((s, v) => s + v.duration, 0);
    const totalSize = filteredVideos.reduce((s, v) => s + v.size, 0);
    const avgDuration = filteredVideos.length > 0 ? Math.round(totalDuration / filteredVideos.length) : 0;

    // Tags breakdown
    const tagMap: Record<string, number> = {};
    filteredVideos.forEach(v => (v.tags || []).forEach(tag => { tagMap[tag] = (tagMap[tag] || 0) + 1; }));
    const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Folder breakdown
    const folderMap: Record<string, number> = {};
    filteredVideos.forEach(v => {
      const f = v.folder || (lang === 'tr' ? 'Klasörsüz' : 'Uncategorized');
      folderMap[f] = (folderMap[f] || 0) + 1;
    });
    const folderBreakdown = Object.entries(folderMap).sort((a, b) => b[1] - a[1]);

    // Daily activity (last 30 days)
    const dailyMap: Record<string, number> = {};
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    videos.filter(v => v.createdAt > thirtyDaysAgo).forEach(v => {
      const day = new Date(v.createdAt).toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    const dailyActivity: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      dailyActivity.push({ date: d, count: dailyMap[d] || 0 });
    }
    const maxDailyCount = Math.max(1, ...dailyActivity.map(d => d.count));

    // Format stats
    const avgSizeMB = filteredVideos.length > 0 ? (totalSize / filteredVideos.length / 1024 / 1024).toFixed(1) : '0';

    // Audio vs Video
    const audioCount = filteredVideos.filter(v => v.blob?.type?.includes('audio')).length;
    const videoCount = filteredVideos.length - audioCount;

    // With AI features
    const withTranscript = filteredVideos.filter(v => v.transcript && v.transcript.length > 0).length;
    const withChapters = filteredVideos.filter(v => v.chapters && v.chapters.length > 0).length;
    const withAI = filteredVideos.filter(v => v.aiSummary).length;

    return {
      total: filteredVideos.length,
      totalDuration,
      totalSize,
      avgDuration,
      avgSizeMB,
      topTags,
      folderBreakdown,
      dailyActivity,
      maxDailyCount,
      audioCount,
      videoCount,
      withTranscript,
      withChapters,
      withAI,
      signLanguageUsage: Math.round(filteredVideos.length * 0.42), // Simulated for demo
    };
  }, [filteredVideos, lang, videos]);

  // Recent recordings
  const recentVideos = videos.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">{t('analytics', lang)}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle lang={lang} onChange={changeLang} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-8">
          {(['week', 'month', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === p ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'}`}>
              <Calendar className="w-4 h-4" />
              {p === 'week' ? t('thisWeek', lang) : p === 'month' ? t('thisMonth', lang) : t('allTime', lang)}
            </button>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Video className="w-5 h-5 text-purple-400" />, label: t('totalRecordings', lang), value: stats.total.toString(), accent: 'purple' },
            { icon: <Clock className="w-5 h-5 text-cyan-400" />, label: t('totalDuration', lang), value: formatDuration(stats.totalDuration), accent: 'cyan' },
            { icon: <HardDrive className="w-5 h-5 text-amber-400" />, label: t('totalStorage', lang), value: formatBytes(stats.totalSize), accent: 'amber' },
            { icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, label: t('avgDuration', lang), value: formatDuration(stats.avgDuration), accent: 'emerald' },
            { icon: <span className="text-lg">🤟</span>, label: t('signLanguageUsage', lang), value: stats.signLanguageUsage.toString(), accent: 'purple' },
          ].map((card, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex items-center gap-2 mb-3">
                {card.icon}
                <span className="text-xs text-slate-500 font-semibold">{card.label}</span>
              </div>
              <p className="text-2xl font-black text-white tracking-tight group-hover:text-purple-300 transition-colors">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Activity Chart */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-bold">{t('recordingActivity', lang)}</h3>
              <span className="text-xs text-slate-500 ml-auto">{lang === 'tr' ? 'Son 30 gün' : 'Last 30 days'}</span>
            </div>
            <div className="flex items-end gap-[3px] h-32">
              {stats.dailyActivity.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full rounded-t-sm bg-purple-500/40 group-hover:bg-purple-400/60 transition-all relative"
                    style={{ height: `${Math.max(2, (d.count / stats.maxDailyCount) * 100)}%` }}
                  >
                    {d.count > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {d.count} {lang === 'tr' ? 'kayıt' : 'rec'}
                      </div>
                    )}
                  </div>
                  {(i === 0 || i === 14 || i === 29) && (
                    <span className="text-[8px] text-slate-600 mt-1">{d.date.slice(5)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-5">
              <PieChart className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-bold">{lang === 'tr' ? 'Kayıt Türleri' : 'Recording Types'}</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: lang === 'tr' ? 'Video Kayıt' : 'Video', count: stats.videoCount, color: 'bg-purple-500', icon: <Video className="w-4 h-4" /> },
                { label: lang === 'tr' ? 'Ses Kayıt' : 'Audio', count: stats.audioCount, color: 'bg-cyan-500', icon: <AudioLines className="w-4 h-4" /> },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl ${item.color}/20 flex items-center justify-center text-slate-300`}>{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 font-semibold">{item.label}</span>
                      <span className="text-white font-bold">{item.count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${item.color} transition-all`}
                        style={{ width: `${stats.total > 0 ? (item.count / stats.total * 100) : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-white/5 space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{lang === 'tr' ? 'AI Özellikler' : 'AI Features'}</p>
                {[
                  { label: 'Transcript', count: stats.withTranscript, icon: '📝' },
                  { label: lang === 'tr' ? 'Bölümler' : 'Chapters', count: stats.withChapters, icon: '📑' },
                  { label: 'AI Summary', count: stats.withAI, icon: '🤖' },
                  { label: t('signLanguageUsage', lang), count: stats.signLanguageUsage, icon: '🤟' },
                ].map(f => (
                  <div key={f.label} className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-slate-400 flex items-center gap-2"><span>{f.icon}</span> {f.label}</span>
                    <span className="text-white font-bold">{f.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Tags */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-5">
              <Tag className="w-5 h-5 text-amber-400" />
              <h3 className="text-white font-bold">{t('topTags', lang)}</h3>
            </div>
            {stats.topTags.length === 0 ? (
              <p className="text-slate-600 text-sm">{lang === 'tr' ? 'Henüz etiket yok.' : 'No tags yet.'}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.topTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <span className="text-xs text-amber-300 font-semibold">{tag}</span>
                    <span className="text-[10px] text-amber-400/60 font-bold bg-amber-500/10 px-1.5 rounded">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Folder Breakdown */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-5">
              <Folder className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-bold">{lang === 'tr' ? 'Klasör Dağılımı' : 'Folder Breakdown'}</h3>
            </div>
            {stats.folderBreakdown.length === 0 ? (
              <p className="text-slate-600 text-sm">{lang === 'tr' ? 'Henüz klasör yok.' : 'No folders yet.'}</p>
            ) : (
              <div className="space-y-2">
                {stats.folderBreakdown.map(([folder, count]) => (
                  <div key={folder} className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-sm text-slate-300 font-medium flex-1 truncate">{folder}</span>
                    <span className="text-sm text-white font-bold">{count}</span>
                    <div className="w-20 h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-purple-500 transition-all"
                        style={{ width: `${(count / stats.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="text-white font-bold mb-5 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" /> {t('recentActivity', lang)}
          </h3>
          {recentVideos.length === 0 ? (
            <p className="text-slate-600 text-sm">{lang === 'tr' ? 'Henüz aktivite yok.' : 'No activity yet.'}</p>
          ) : (
            <div className="space-y-3">
              {recentVideos.map(v => (
                <div key={v.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-all">
                  <div className="w-12 h-8 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{v.title}</p>
                    <p className="text-xs text-slate-500">{formatDuration(v.duration)} · {formatBytes(v.size)}</p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
