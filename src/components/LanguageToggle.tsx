'use client';

import { Lang } from '@/lib/i18n';

interface LanguageToggleProps {
  lang: Lang;
  onChange: (lang: Lang) => void;
}

export default function LanguageToggle({ lang, onChange }: LanguageToggleProps) {
  return (
    <button
      onClick={() => onChange(lang === 'tr' ? 'en' : 'tr')}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-sm font-semibold"
      title={lang === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
    >
      <span className="text-base leading-none">{lang === 'tr' ? '🇹🇷' : '🇬🇧'}</span>
      <span className="hidden sm:inline text-xs">{lang === 'tr' ? 'TR' : 'EN'}</span>
    </button>
  );
}
