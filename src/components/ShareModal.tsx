'use client';

import { useState } from 'react';
import { X, Copy, Code, Lock, Clock, Link, Check, Share2 } from 'lucide-react';
import { Lang, t } from '@/lib/i18n';

interface ShareModalProps {
  lang: Lang;
  videoTitle: string;
  cloudUrl?: string;
  onClose: () => void;
}

export default function ShareModal({ lang, videoTitle, cloudUrl, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiry, setExpiry] = useState('never');
  const [activeTab, setActiveTab] = useState<'link' | 'embed' | 'social'>('link');

  const shareUrl = cloudUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/watch/local`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const embedCode = `<iframe src="${shareUrl}" width="640" height="360" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>`;

  const socialLinks = [
    { name: 'X / Twitter', icon: '𝕏', color: 'bg-black/60 border-white/20 text-white hover:bg-white/10', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(videoTitle)}&url=${encodeURIComponent(shareUrl)}` },
    { name: 'LinkedIn', icon: 'in', color: 'bg-blue-700/20 border-blue-500/30 text-blue-300 hover:bg-blue-700/30', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
    { name: 'Facebook', icon: 'f', color: 'bg-blue-600/20 border-blue-400/30 text-blue-300 hover:bg-blue-600/30', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: 'WhatsApp', icon: '💬', color: 'bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30', url: `https://wa.me/?text=${encodeURIComponent(videoTitle + ' ' + shareUrl)}` },
    { name: 'Telegram', icon: '✈️', color: 'bg-sky-600/20 border-sky-500/30 text-sky-300 hover:bg-sky-600/30', url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(videoTitle)}` },
    { name: 'Email', icon: '✉️', color: 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30', url: `mailto:?subject=${encodeURIComponent(videoTitle)}&body=${encodeURIComponent(`İzlemek için: ${shareUrl}`)}` },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-md border border-purple-500/20 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-cyan-500/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{t('shareVideo', lang)}</h2>
            <p className="text-slate-500 text-xs truncate max-w-[240px]">{videoTitle}</p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex rounded-xl border border-white/10 overflow-hidden bg-white/5 mb-5 p-0.5 gap-0.5">
          {(['link', 'embed', 'social'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
              {tab === 'link' && <><Link className="w-3.5 h-3.5" /> {t('shareLink2', lang)}</>}
              {tab === 'embed' && <><Code className="w-3.5 h-3.5" /> {t('embedCode', lang)}</>}
              {tab === 'social' && <><Share2 className="w-3.5 h-3.5" /> Social</>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            {/* Share URL */}
            <div>
              <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">{t('shareLink2', lang)}</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-purple-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                  {shareUrl}
                </div>
                <button onClick={() => copyToClipboard(shareUrl, 'link')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${copied === 'link' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'}`}>
                  {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password protection */}
            <div className="p-3 rounded-2xl border border-white/8 bg-white/3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-300 font-semibold">{t('passwordProtect', lang)}</span>
                </div>
                <button onClick={() => setShowPassword(v => !v)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${showPassword ? 'bg-amber-600' : 'bg-white/15'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${showPassword ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              {showPassword && (
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={lang === 'tr' ? 'Şifre belirle…' : 'Set password…'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600"
                />
              )}
            </div>

            {/* Expiry */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/8 bg-white/3">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300 font-semibold">{t('expiresIn', lang)}</span>
              <div className="ml-auto flex gap-1">
                {[
                  { v: 'never', l: lang === 'tr' ? 'Asla' : 'Never' },
                  { v: '24h', l: '24h' },
                  { v: '7d', l: '7d' },
                  { v: '30d', l: '30d' },
                ].map(o => (
                  <button key={o.v} onClick={() => setExpiry(o.v)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${expiry === o.v ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300 bg-white/5'}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'embed' && (
          <div className="space-y-3">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('embedCode', lang)}</label>
            <div className="bg-black/40 rounded-xl p-3 border border-white/10">
              <code className="text-xs text-cyan-300 font-mono break-all leading-relaxed">{embedCode}</code>
            </div>
            <button onClick={() => copyToClipboard(embedCode, 'embed')}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${copied === 'embed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>
              {copied === 'embed' ? '✅ Kopyalandı!' : `📋 ${lang === 'tr' ? 'Kodu Kopyala' : 'Copy Code'}`}
            </button>
            <div className="rounded-xl overflow-hidden border border-white/10" style={{ aspectRatio: '16/9' }}>
              <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-slate-900 flex items-center justify-center">
                <p className="text-slate-500 text-xs">{lang === 'tr' ? 'Embed önizlemesi' : 'Embed preview'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="grid grid-cols-2 gap-2">
            {socialLinks.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${s.color}`}>
                <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm font-black">{s.icon}</span>
                <span className="text-sm font-semibold">{s.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
