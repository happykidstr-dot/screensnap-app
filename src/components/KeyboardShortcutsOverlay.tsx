'use client';

import { useEffect } from 'react';
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsOverlayProps {
  onClose: () => void;
}

export default function KeyboardShortcutsOverlay({ onClose }: KeyboardShortcutsOverlayProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const extraShortcuts = [
    { keys: '?', action: 'Show / hide this help panel' },
    { keys: 'Ctrl+Shift+R', action: 'Kaydı Başlat / Durdur' },
    { keys: 'Ctrl+Shift+P', action: 'Duraklat / Devam Et' },
    { keys: 'Ctrl+Shift+D', action: 'Çizim modunu aç / kapat' },
    { keys: 'Escape', action: 'Kaydı iptal et (kaydetmeden çık)' },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-tight">Klavye Kısayolları</h2>
              <p className="text-slate-500 text-xs">Keyboard Shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-2">
          {extraShortcuts.map(({ keys, action }) => (
            <div
              key={keys}
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/8 transition-all"
            >
              <span className="text-slate-300 text-sm">{action}</span>
              <kbd className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-purple-300 text-xs font-mono font-bold whitespace-nowrap">
                {keys}
              </kbd>
            </div>
          ))}
        </div>

        {/* Tip */}
        <p className="mt-5 text-center text-slate-600 text-xs">
          Input alanlarında kısayollar devre dışıdır.
        </p>
      </div>
    </div>
  );
}
