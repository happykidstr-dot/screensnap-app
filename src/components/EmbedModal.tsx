'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface EmbedModalProps {
  videoId: string;
  title: string;
  cloudUrl?: string;
  onClose: () => void;
}

export default function EmbedModal({ videoId, title, cloudUrl, onClose }: EmbedModalProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'iframe' | 'link' | 'markdown'>('iframe');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const watchUrl = cloudUrl || `${baseUrl}/watch/${videoId}`;

  const codes = {
    iframe: `<iframe\n  src="${watchUrl}"\n  title="${title}"\n  width="640"\n  height="360"\n  frameborder="0"\n  allowfullscreen\n></iframe>`,
    link: watchUrl,
    markdown: `[![${title}](${watchUrl})](${watchUrl})`,
  };

  const code = codes[format];

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-3xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-bold">{'</>'} Embed</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {!cloudUrl && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 text-amber-300 text-sm">
              ⚠️ For working embeds, upload to cloud first (Settings → Supabase).
            </div>
          )}

          {/* Format tabs */}
          <div className="flex gap-1 mb-4">
            {(['iframe', 'link', 'markdown'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${format === f ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                {f === 'iframe' ? '🖼 iFrame' : f === 'link' ? '🔗 Link' : '📝 Markdown'}
              </button>
            ))}
          </div>

          {/* Code box */}
          <div className="relative">
            <pre className="bg-black/40 rounded-xl p-4 text-sm text-green-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {code}
            </pre>
            <button onClick={copy}
              className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
