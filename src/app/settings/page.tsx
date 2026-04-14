'use client';

import { useState, useRef, useEffect } from 'react';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { exportAllAsZip, importFromZip, downloadBlob } from '@/lib/zipBackup';
import { isCloudConfigured } from '@/lib/supabase';
import { getOpenAIKey, setOpenAIKey } from '@/lib/aiSummary';
import { ArrowLeft, Download, Upload, Cloud, Keyboard, CheckCircle, AlertCircle, Loader2, Sparkles, Eye, EyeOff, Moon, Sun, Palette, Image as ImageIcon, Rocket, Link as LinkIcon, Frame } from 'lucide-react';
import Link from 'next/link';
import { FRAME_OPTIONS, FrameStyle, drawFrame } from '@/lib/videoFrame';

export default function SettingsPage() {
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ count?: number; error?: string } | null>(null);
  const [openAIKey, setOpenAIKeyState] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [brandColor, setBrandColor] = useState('#7c3aed');
  const [brandLogo, setBrandLogo] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [framePreview, setFramePreview] = useState<FrameStyle>('none');
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOpenAIKeyState(getOpenAIKey());
    const savedTheme = localStorage.getItem('screensnap_theme') as 'dark' | 'light' | null;
    if (savedTheme) setTheme(savedTheme);
    setBrandColor(localStorage.getItem('screensnap_brand_color') || '#7c3aed');
    setBrandLogo(localStorage.getItem('screensnap_brand_logo') || '');
    setWebhookUrl(localStorage.getItem('screensnap_webhook_url') || '');
    setFramePreview((localStorage.getItem('screensnap_frame_style') as FrameStyle) || 'none');
  }, []);

  const handleTheme = (t: 'dark' | 'light') => {
    setTheme(t);
    localStorage.setItem('screensnap_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  // Redraw preview canvas whenever frame or brandColor changes
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    // Checkerboard bg
    ctx.fillStyle = '#0f0d1a';
    ctx.fillRect(0, 0, W, H);
    // Screen mock
    ctx.fillStyle = '#1e1b2e';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2d2a45';
    const p = 20;
    ctx.fillRect(p, p, W - p * 2, H - p * 2);
    // Fake content lines
    ctx.fillStyle = '#3d3a5c';
    [40, 55, 70, 85].forEach(y => ctx.fillRect(p + 12, y, W * 0.5, 6));
    // Cam circle mock
    ctx.beginPath();
    ctx.arc(W - 50, H - 50, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#4c3a7c';
    ctx.fill();
    ctx.strokeStyle = brandColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Draw frame overlay
    drawFrame(ctx, W, H, framePreview, brandColor, Date.now() / 1000);
  }, [framePreview, brandColor]);

  const handleExport = async () => {
    setExporting(true); setExportProgress(0);
    try { const blob = await exportAllAsZip(setExportProgress); downloadBlob(blob, `screensnap-backup-${Date.now()}.zip`); }
    catch (err) { alert('Export failed: ' + err); } finally { setExporting(false); setExportProgress(0); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setImportStatus(null);
    try {
      const count = await importFromZip(file, (pct) => setImportStatus({ count: Math.floor(pct) }));
      setImportStatus({ count });
    } catch (err) { setImportStatus({ error: String(err) }); } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveAIKey = () => {
    setOpenAIKey(openAIKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-white font-bold text-lg">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Theme */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-slate-500/15 flex items-center justify-center">{theme === 'dark' ? <Moon className="w-4 h-4 text-slate-300" /> : <Sun className="w-4 h-4 text-yellow-400" />}</div>
            <h2 className="text-white font-bold text-lg">Theme</h2>
          </div>
          <div className="flex gap-3">
            {(['dark', 'light'] as const).map(t => (
              <button key={t} onClick={() => handleTheme(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${theme === t ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
                {t === 'dark' ? <><Moon className="w-4 h-4" /> Dark</> : <><Sun className="w-4 h-4" /> Light</>}
              </button>
            ))}
          </div>
        </section>

        {/* Brand Customization */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center"><Palette className="w-4 h-4 text-pink-400" /></div>
            <h2 className="text-white font-bold text-lg">Markalama (Brand Customization)</h2>
          </div>
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Videolarınızı müşterilerinizle paylaşırken kendi şirketinizin renklerini ve logosunu gösterin.</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-slate-400 font-bold mb-1 block">Marka Rengi (Hex Color)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => { setBrandColor(e.target.value); localStorage.setItem('screensnap_brand_color', e.target.value); }}
                    className="w-10 h-10 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={e => { setBrandColor(e.target.value); localStorage.setItem('screensnap_brand_color', e.target.value); }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-1 focus:ring-pink-500 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-slate-400 font-bold mb-1 block">Firma Logo URL</label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://siteniz.com/logo.png"
                    value={brandLogo}
                    onChange={e => { setBrandLogo(e.target.value); localStorage.setItem('screensnap_brand_logo', e.target.value); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:ring-1 focus:ring-pink-500 text-sm"
                  />
                  <ImageIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Frame Style */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <span className="text-lg">🎨</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Video Çerçevesi</h2>
              <p className="text-slate-500 text-xs">Kayıt canvas'ına üst katman olarak işlenir</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Live preview canvas */}
            <div className="flex flex-col gap-3">
              <label className="text-xs text-slate-400 font-bold">Canlı Önizleme</label>
              <canvas
                ref={previewCanvasRef}
                width={320} height={180}
                className="w-full rounded-2xl border border-white/10 shadow-xl"
              />
              <p className="text-xs text-slate-500">
                Seçili: <span className="text-purple-300 font-semibold">
                  {FRAME_OPTIONS.find(f => f.value === framePreview)?.emoji}{' '}
                  {FRAME_OPTIONS.find(f => f.value === framePreview)?.label}
                </span>
              </p>
            </div>

            {/* Frame options grid */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-bold mb-1">Çerçeve Stili Seç</label>
              <div className="grid grid-cols-2 gap-2">
                {FRAME_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setFramePreview(f.value);
                      localStorage.setItem('screensnap_frame_style', f.value);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all text-left ${
                      framePreview === f.value
                        ? 'border-purple-500/60 bg-purple-600/20 text-purple-300 shadow-sm shadow-purple-500/20'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl shrink-0">{f.emoji}</span>
                    <span className="text-xs leading-tight">{f.label}</span>
                    {f.colors.length > 0 && (
                      <div className="ml-auto flex gap-0.5">
                        {f.colors.slice(0, 2).map(c => (
                          <span key={c} className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center"><Keyboard className="w-4 h-4 text-purple-400" /></div>
            <h2 className="text-white font-bold text-lg">Keyboard Shortcuts</h2>
          </div>
          <div className="space-y-3">
            {SHORTCUTS.map(s => (
              <div key={s.keys} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-slate-300 text-sm">{s.action}</span>
                <kbd className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-mono font-bold border border-white/10">{s.keys}</kbd>
              </div>
            ))}
          </div>
        </section>

        {/* AI */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center"><Sparkles className="w-4 h-4 text-violet-400" /></div>
            <div>
              <h2 className="text-white font-bold text-lg">AI Summary (OpenAI)</h2>
              <p className="text-slate-500 text-xs">Summarize transcripts with GPT-3.5-turbo</p>
            </div>
            {getOpenAIKey() ? <span className="ml-auto flex items-center gap-1 text-xs text-green-400 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Configured</span>
              : <span className="ml-auto flex items-center gap-1 text-xs text-slate-500"><AlertCircle className="w-3.5 h-3.5" /> Not set</span>}
          </div>
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">Get your API key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">platform.openai.com/api-keys</a></p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type={showKey ? 'text' : 'password'} value={openAIKey} onChange={e => setOpenAIKeyState(e.target.value)}
                  placeholder="sk-..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono outline-none focus:ring-2 focus:ring-purple-500 pr-10" />
                <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={saveAIKey} className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all">
                {keySaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            {getOpenAIKey() && <button onClick={() => { setOpenAIKey(''); setOpenAIKeyState(''); }} className="text-xs text-red-400 hover:text-red-300">Remove API key</button>}
          </div>
        </section>

        {/* Cloud */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center"><Cloud className="w-4 h-4 text-cyan-400" /></div>
            <div>
              <h2 className="text-white font-bold text-lg">Cloud Storage (Supabase)</h2>
              <p className="text-slate-500 text-xs">Required for shareable links & QR codes</p>
            </div>
            {isCloudConfigured
              ? <span className="ml-auto flex items-center gap-1 text-xs text-green-400 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Connected</span>
              : <span className="ml-auto flex items-center gap-1 text-xs text-slate-500"><AlertCircle className="w-3.5 h-3.5" /> Not configured</span>}
          </div>
          {!isCloudConfigured ? (
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
              <ol className="text-slate-400 text-sm space-y-1.5 list-decimal list-inside">
                <li>Create free account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-purple-400">supabase.com</a></li>
                <li>Create a bucket named <code className="bg-white/10 px-1.5 rounded text-purple-300">recordings</code> (set Public)</li>
                <li>Add to <code className="bg-white/10 px-1.5 rounded text-purple-300">.env.local</code>:</li>
              </ol>
              <pre className="bg-black/40 rounded-xl p-4 text-sm text-green-300 font-mono overflow-x-auto">{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}</pre>
              <p className="text-slate-500 text-xs">Restart dev server after adding the env file.</p>
            </div>
          ) : <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20"><p className="text-green-300 text-sm">✅ Cloud is configured. Upload videos in the player to get shareable links.</p></div>}
        </section>

        {/* Webhook (Projeye Gönder) */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center"><Rocket className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <h2 className="text-white font-bold text-lg">Projeye Gönder Entegrasyonu (Webhook)</h2>
              <p className="text-slate-500 text-xs">Jira, Asana, Trello veya Zapier/Make.com Bağlantısı</p>
            </div>
            {webhookUrl
              ? <span className="ml-auto flex items-center gap-1 text-xs text-green-400 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Aktif</span>
              : <span className="ml-auto flex items-center gap-1 text-xs text-slate-500"><AlertCircle className="w-3.5 h-3.5" /> Ayarlanmadı</span>}
          </div>
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Videolarınızı ve AI özetlerinizi tek tıkla şirket içi proje platformlarınıza (Jira, Trello, vb.) bir "Görev/Bilet" olarak göndermek için bir Webhook URL girin.</p>
            <div className="relative">
              <input
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={webhookUrl}
                onChange={e => { setWebhookUrl(e.target.value); localStorage.setItem('screensnap_webhook_url', e.target.value); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
              />
              <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </section>

        {/* Backup */}
        <section className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center"><Download className="w-4 h-4 text-orange-400" /></div>
            <h2 className="text-white font-bold text-lg">Backup & Restore</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-2 text-sm">Export Backup</h3>
              <p className="text-slate-400 text-xs mb-4">Download all recordings as ZIP.</p>
              {exportProgress > 0 && exportProgress < 100 && (
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3"><div className="h-full bg-orange-500 transition-all" style={{ width: `${exportProgress}%` }} /></div>
              )}
              <button onClick={handleExport} disabled={exporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-sm font-bold border border-orange-500/20 transition-all disabled:opacity-50">
                {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> {exportProgress}%</> : <><Download className="w-4 h-4" /> Export ZIP</>}
              </button>
            </div>
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-2 text-sm">Import Backup</h3>
              <p className="text-slate-400 text-xs mb-4">Restore from backup ZIP.</p>
              {importStatus && (
                <div className={`rounded-lg px-3 py-2 text-xs mb-3 ${importStatus.error ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-300'}`}>
                  {importStatus.error ? `Error: ${importStatus.error}` : `✅ Imported ${importStatus.count} recordings`}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".zip" onChange={handleImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={importing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/10 transition-all disabled:opacity-50">
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <><Upload className="w-4 h-4" /> Import ZIP</>}
              </button>
            </div>
          </div>
        </section>

        {/* --- OZEL DOMAIN / CUSTOM DOMAIN --- */}
        <section className="glass rounded-3xl p-6 border border-cyan-500/10">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-bold text-lg">Ozel Domain (Custom Domain)</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-bold">Enterprise</span>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Videolarin paylasilabilir linklerini kendi domain'inizden sunun. Ornek: <code className="bg-white/10 px-1 rounded text-cyan-300">video.sirketin.com/abc123</code>
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Kurumsal Video Domain</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://video.sirketiniz.com"
                  defaultValue={typeof window !== 'undefined' ? localStorage.getItem('screensnap_custom_domain') || '' : ''}
                  onChange={e => localStorage.setItem('screensnap_custom_domain', e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-600"
                />
                <button
                  onClick={() => alert('Domain kaydedildi. Netlify/Vercel\'de CNAME ayarini yapmaniz gerekiyor.')}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-all"
                >
                  Kaydet
                </button>
              </div>
            </div>
            <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-4 text-sm text-slate-400 space-y-1">
              <p className="font-bold text-cyan-300 text-xs uppercase tracking-wider mb-2">Nasil Yapilir?</p>
              <p>1. Domain saglayicinizda CNAME kaydi ekleyin: <code className="bg-white/10 px-1 rounded text-xs">video CNAME your-netlify-app.netlify.app</code></p>
              <p>2. Netlify {'>'} Domain Settings {'>'} Add custom domain ekleyin</p>
              <p>3. SSL otomatik aktive olur (Let's Encrypt)</p>
            </div>
          </div>
        </section>

        {/* --- BROWSER EXTENSION --- */}
        <section className="glass rounded-3xl p-6 border border-violet-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-violet-400" />
            <h2 className="text-white font-bold text-lg">Browser Extension</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20 font-bold">Chrome / Edge</span>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Herhangi bir sayfadan ScreenSnap'i acin. Google Meet, Teams ve Zoom sayfalarinda otomatik kayit butonu enjekte eder.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { icon: 'G', label: 'Google Meet', color: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
              { icon: 'T', label: 'MS Teams', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' },
              { icon: 'Z', label: 'Zoom', color: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
              { icon: 'W', label: 'Webex', color: 'bg-green-500/10 border-green-500/20 text-green-300' },
            ].map(p => (
              <div key={p.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${p.color}`}>
                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black">{p.icon}</span>
                {p.label} otomatik tespit
              </div>
            ))}
          </div>
          <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 text-sm text-slate-400 space-y-1.5">
            <p className="font-bold text-violet-300 text-xs uppercase tracking-wider mb-2">Chrome'a Kurmak icin</p>
            <p>1. <code className="bg-white/10 px-1 rounded text-xs">browser-extension/</code> klasorunu zip olarak indirin</p>
            <p>2. Chrome &rarr; Uzantilar &rarr; Gelistirici Modu'nu acin</p>
            <p>3. "Paketlenmemis yukle" &rarr; <code className="bg-white/10 px-1 rounded text-xs">browser-extension/</code> klasorunu secin</p>
            <p>4. ScreenSnap ikonu araç cubugunda gorunecek</p>
          </div>
        </section>

        {/* --- PWA INSTALL --- */}
        <section className="glass rounded-3xl p-6 border border-emerald-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-bold text-lg">Mobil Uygulama (PWA)</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-bold">iOS / Android</span>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            ScreenSnap'i telefona veya PC'ye uygulama olarak yükleyin. App store gerekmez.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-sm space-y-1">
              <p className="font-bold text-emerald-300 text-xs">iOS (Safari)</p>
              <p className="text-slate-400 text-xs">Paylasim ikonu &rarr; "Ana Ekrana Ekle"</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-sm space-y-1">
              <p className="font-bold text-emerald-300 text-xs">Android (Chrome)</p>
              <p className="text-slate-400 text-xs">Menu &rarr; "Ana ekrana ekle" / "Uygulama yukle"</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-sm space-y-1">
              <p className="font-bold text-emerald-300 text-xs">Desktop (Chrome/Edge)</p>
              <p className="text-slate-400 text-xs">Adres cubugu sagindaki yukle ikonu</p>
            </div>
          </div>
          <button
            onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(() => alert('Service Worker aktif! PWA olarak yukleyebilirsiniz.')).catch(e => alert('SW kaydi hatasi: ' + e));
              }
            }}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-300 text-sm font-bold transition-all"
          >
            <CheckCircle className="w-4 h-4" /> PWA Durumunu Kontrol Et
          </button>
        </section>

        {/* About */}
        <section className="glass rounded-3xl p-6">
          <h2 className="text-white font-bold text-lg mb-3">About ScreenSnap</h2>
          <p className="text-slate-400 text-sm">Fully browser-based screen recorder. Recordings saved locally in IndexedDB — nothing sent to any server unless cloud upload is configured.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Canvas API', 'MediaRecorder', 'Web Speech API', 'IndexedDB', 'ffmpeg.wasm', 'Supabase', 'OpenAI', 'PWA', 'MediaPipe'].map(t => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-purple-600/15 text-purple-300 border border-purple-500/20">{t}</span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
