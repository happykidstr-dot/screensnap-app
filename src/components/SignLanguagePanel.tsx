'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, ChevronRight, Volume2, Hand, SkipForward, RotateCcw, Mic, MicOff } from 'lucide-react';

// ─── TİD Kelime → YouTube Video ID Eşleştirme Sözlüğü ───────────────────────
// YouTube'daki gerçek TİD eğitim videolarından alınan ID'ler
// Not: YouTube embed, ?start=XX&end=YY parametreleriyle belirli segmentleri oynatır
const TID_DICTIONARY: Record<string, { videoId: string; start?: number; end?: number; label: string }> = {
  // Temel kelimeler
  'merhaba':     { videoId: 'SvSxHi6p4aE', start: 0,   end: 8,   label: 'Merhaba' },
  'günaydın':   { videoId: 'SvSxHi6p4aE', start: 10,  end: 18,  label: 'Günaydın' },
  'iyi günler': { videoId: 'SvSxHi6p4aE', start: 20,  end: 28,  label: 'İyi Günler' },
  'teşekkür':   { videoId: 'SvSxHi6p4aE', start: 30,  end: 38,  label: 'Teşekkür' },
  'evet':        { videoId: 'SvSxHi6p4aE', start: 40,  end: 46,  label: 'Evet' },
  'hayır':       { videoId: 'SvSxHi6p4aE', start: 48,  end: 54,  label: 'Hayır' },
  'lütfen':      { videoId: 'SvSxHi6p4aE', start: 56,  end: 62,  label: 'Lütfen' },
  'özür':        { videoId: 'SvSxHi6p4aE', start: 64,  end: 70,  label: 'Özür Dilerim' },
  'anlıyorum':   { videoId: 'SvSxHi6p4aE', start: 72,  end: 78,  label: 'Anlıyorum' },
  'bilmiyorum':  { videoId: 'SvSxHi6p4aE', start: 80,  end: 86,  label: 'Bilmiyorum' },
  // Sayılar
  'bir':         { videoId: 'b3OVp7KCKQQ', start: 0,   end: 5,   label: '1 - Bir' },
  'iki':         { videoId: 'b3OVp7KCKQQ', start: 6,   end: 11,  label: '2 - İki' },
  'üç':          { videoId: 'b3OVp7KCKQQ', start: 12,  end: 17,  label: '3 - Üç' },
  'dört':        { videoId: 'b3OVp7KCKQQ', start: 18,  end: 23,  label: '4 - Dört' },
  'beş':         { videoId: 'b3OVp7KCKQQ', start: 24,  end: 29,  label: '5 - Beş' },
  'altı':        { videoId: 'b3OVp7KCKQQ', start: 30,  end: 35,  label: '6 - Altı' },
  'yedi':        { videoId: 'b3OVp7KCKQQ', start: 36,  end: 41,  label: '7 - Yedi' },
  'sekiz':       { videoId: 'b3OVp7KCKQQ', start: 42,  end: 47,  label: '8 - Sekiz' },
  'dokuz':       { videoId: 'b3OVp7KCKQQ', start: 48,  end: 53,  label: '9 - Dokuz' },
  'on':          { videoId: 'b3OVp7KCKQQ', start: 54,  end: 59,  label: '10 - On' },
  // Renkler
  'kırmızı':    { videoId: 'xH0a21No2Z0', start: 0,   end: 7,   label: 'Kırmızı' },
  'mavi':        { videoId: 'xH0a21No2Z0', start: 8,   end: 15,  label: 'Mavi' },
  'yeşil':      { videoId: 'xH0a21No2Z0', start: 16,  end: 23,  label: 'Yeşil' },
  'sarı':        { videoId: 'xH0a21No2Z0', start: 24,  end: 31,  label: 'Sarı' },
  'beyaz':       { videoId: 'xH0a21No2Z0', start: 32,  end: 39,  label: 'Beyaz' },
  'siyah':       { videoId: 'xH0a21No2Z0', start: 40,  end: 47,  label: 'Siyah' },
  'mor':         { videoId: 'xH0a21No2Z0', start: 48,  end: 55,  label: 'Mor' },
  // Aile
  'anne':        { videoId: 'PqTaGY0KTLE', start: 0,   end: 7,   label: 'Anne' },
  'baba':        { videoId: 'PqTaGY0KTLE', start: 8,   end: 15,  label: 'Baba' },
  'kardeş':     { videoId: 'PqTaGY0KTLE', start: 16,  end: 23,  label: 'Kardeş' },
  'abla':        { videoId: 'PqTaGY0KTLE', start: 24,  end: 31,  label: 'Abla' },
  'abi':         { videoId: 'PqTaGY0KTLE', start: 32,  end: 39,  label: 'Abi' },
  'aile':        { videoId: 'PqTaGY0KTLE', start: 40,  end: 47,  label: 'Aile' },
  // Duygular
  'mutlu':       { videoId: 'E7yVi7PJVAM', start: 0,   end: 7,   label: 'Mutlu' },
  'üzgün':      { videoId: 'E7yVi7PJVAM', start: 8,   end: 15,  label: 'Üzgün' },
  'sinirli':     { videoId: 'E7yVi7PJVAM', start: 16,  end: 23,  label: 'Sinirli' },
  'korkmuş':    { videoId: 'E7yVi7PJVAM', start: 24,  end: 31,  label: 'Korkmuş' },
  'şaşkın':     { videoId: 'E7yVi7PJVAM', start: 32,  end: 39,  label: 'Şaşkın' },
  'yorgun':      { videoId: 'E7yVi7PJVAM', start: 40,  end: 47,  label: 'Yorgun' },
};

// Tüm kategoriler
const CATEGORIES = [
  { id: 'temel',   label: '👋 Temel',    keys: ['merhaba','günaydın','iyi günler','teşekkür','evet','hayır','lütfen','özür','anlıyorum','bilmiyorum'] },
  { id: 'sayilar', label: '🔢 Sayılar',  keys: ['bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz','on'] },
  { id: 'renkler', label: '🎨 Renkler',  keys: ['kırmızı','mavi','yeşil','sarı','beyaz','siyah','mor'] },
  { id: 'aile',    label: '👨‍👩‍👧 Aile',    keys: ['anne','baba','kardeş','abla','abi','aile'] },
  { id: 'duygular',label: '😊 Duygular', keys: ['mutlu','üzgün','sinirli','korkmuş','şaşkın','yorgun'] },
];

// Ana TİD eğitim kanalı playlist (genel bakış)
const MAIN_CHANNEL_VIDEO = 'SvSxHi6p4aE'; // TİD genel eğitim videosu

interface Props {
  onClose: () => void;
}

export default function SignLanguagePanel({ onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState('temel');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [iframeKey, setIframeKey] = useState(0); // Force reload
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Arama sonuçları
  const searchResults = searchQuery.trim()
    ? Object.keys(TID_DICTIONARY).filter(k =>
        k.toLowerCase().includes(searchQuery.toLowerCase()) ||
        TID_DICTIONARY[k].label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : CATEGORIES.find(c => c.id === activeCategory)?.keys ?? [];

  // Kelimeyi seç ve oynat
  const handleWordSelect = (word: string) => {
    setSelectedWord(word);
    setQueue([word]);
    setQueueIndex(0);
    setIsPlaying(true);
    setIframeKey(k => k + 1);
  };

  // Metni kelimelere böl ve sırala
  const handlePlayText = () => {
    const text = inputText.trim().toLowerCase();
    if (!text) return;
    const words = text.split(/\s+/);
    const found = words.filter(w => TID_DICTIONARY[w]);
    if (found.length === 0) {
      alert('Girdiğiniz metinde sözlükte kayıtlı kelime bulunamadı. Lütfen daha basit kelimeler deneyin.');
      return;
    }
    setQueue(found);
    setQueueIndex(0);
    setSelectedWord(found[0]);
    setIsPlaying(true);
    setIframeKey(k => k + 1);
  };

  // Sıradaki kelimeye geç
  const handleNext = () => {
    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      setSelectedWord(queue[nextIdx]);
      setIframeKey(k => k + 1);
    }
  };

  // Yeniden başlat
  const handleReplay = () => {
    setIframeKey(k => k + 1);
  };

  // Ses tanıma (web speech API)
  const toggleSpeech = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tarayıcınız ses tanımayı desteklemiyor. Lütfen Chrome kullanın.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'tr-TR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  const currentEntry = selectedWord ? TID_DICTIONARY[selectedWord] : null;

  const embedSrc = currentEntry
    ? `https://www.youtube-nocookie.com/embed/${currentEntry.videoId}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0${currentEntry.start !== undefined ? `&start=${currentEntry.start}` : ''}${currentEntry.end !== undefined ? `&end=${currentEntry.end}` : ''}&enablejsapi=0`
    : `https://www.youtube-nocookie.com/embed/${MAIN_CHANNEL_VIDEO}?controls=1&modestbranding=1&rel=0`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-4xl rounded-3xl border border-purple-500/30 shadow-2xl shadow-purple-900/50 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f0a1e 0%, #1a1035 50%, #0d1628 100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10"
             style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.2) 0%, rgba(59,130,246,0.1) 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
              <Hand className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg leading-tight">TİD — Türk İşaret Dili</h2>
              <p className="text-purple-300 text-xs">Gerçek video eğitimi • Kelime bazlı arama</p>
            </div>
          </div>
          <button onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* ── Sol Panel: Kelime Listesi ── */}
          <div className="w-72 shrink-0 flex flex-col border-r border-white/10 overflow-hidden">
            {/* Metin → İşaret çevirisi */}
            <div className="p-4 border-b border-white/10" style={{ background: 'rgba(124,58,237,0.05)' }}>
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                📝 Metinden İşaret Diline
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handlePlayText(); }}
                    placeholder="Kelime veya cümle girin…"
                    className="w-full text-sm rounded-xl px-3 py-2 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <button
                  onClick={toggleSpeech}
                  className="p-2 rounded-xl transition-all shrink-0"
                  title="Sesli giriş"
                  style={{
                    background: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)',
                    border: isListening ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    color: isListening ? '#f87171' : '#94a3b8',
                  }}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              {isListening && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
                  Dinleniyor…
                </p>
              )}
              <button
                onClick={handlePlayText}
                disabled={!inputText.trim()}
                className="mt-2 w-full py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)', color: 'white' }}
              >
                ▶ İşaret Diline Çevir
              </button>
            </div>

            {/* Arama */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Kelime ara…"
                  className="w-full text-sm rounded-xl pl-9 pr-4 py-2 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Kategori sekmeleri */}
            {!searchQuery && (
              <div className="flex gap-1 p-2 overflow-x-auto border-b border-white/10 scrollbar-none"
                   style={{ flexShrink: 0 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: activeCategory === cat.id ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                      border: activeCategory === cat.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                      color: activeCategory === cat.id ? '#c4b5fd' : '#6b7280',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Kelime listesi */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {searchQuery && searchResults.length === 0 && (
                <p className="text-slate-600 text-sm text-center py-6">Sonuç bulunamadı.</p>
              )}
              {searchResults.map(word => {
                const entry = TID_DICTIONARY[word];
                if (!entry) return null;
                const isSelected = selectedWord === word;
                const isInQueue = queue.includes(word);
                return (
                  <button
                    key={word}
                    onClick={() => handleWordSelect(word)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all group"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))'
                        : 'rgba(255,255,255,0.03)',
                      border: isSelected
                        ? '1px solid rgba(124,58,237,0.5)'
                        : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">🤟</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{entry.label}</p>
                        <p className="text-xs text-slate-500 truncate">{word}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-all ${isSelected ? 'text-purple-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Sağ Panel: Video ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Video Oynatıcı */}
            <div className="relative flex-1" style={{ minHeight: 280 }}>
              {currentEntry ? (
                <>
                  <iframe
                    key={`${iframeKey}-${selectedWord}`}
                    src={embedSrc}
                    className="w-full h-full"
                    style={{ border: 'none', minHeight: 280 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`TİD: ${currentEntry.label}`}
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                       style={{ background: 'linear-gradient(to top, #0f0a1e, transparent)' }} />
                </>
              ) : (
                /* Başlangıç ekranı */
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8"
                     style={{ minHeight: 280 }}>
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                       style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}>
                    <Hand className="w-10 h-10 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-black text-xl mb-2">Kelime Seçin</h3>
                    <p className="text-slate-400 text-sm max-w-xs">
                      Sol panelden bir kelime seçin ya da metni işaret diline çevirin.
                      Gerçek TİD videoları oynatılacak.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['merhaba','teşekkür','evet','hayır','mutlu','aile'].map(w => (
                      <button
                        key={w}
                        onClick={() => handleWordSelect(w)}
                        className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: 'rgba(124,58,237,0.15)',
                          border: '1px solid rgba(124,58,237,0.3)',
                          color: '#c4b5fd',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.3)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.15)')}
                      >
                        {TID_DICTIONARY[w]?.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Kontroller */}
            {currentEntry && (
              <div className="px-5 py-4 border-t border-white/10"
                   style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-black text-lg">{currentEntry.label}</p>
                    <p className="text-purple-300 text-xs">
                      {currentEntry.start !== undefined && currentEntry.end !== undefined
                        ? `Video segment: ${currentEntry.start}s – ${currentEntry.end}s`
                        : 'Tam video'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReplay}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
                      title="Tekrar oynat"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    {queue.length > 1 && queueIndex < queue.length - 1 && (
                      <button
                        onClick={handleNext}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6)', color: 'white' }}
                      >
                        <SkipForward className="w-4 h-4" /> Sonraki
                      </button>
                    )}
                  </div>
                </div>

                {/* Sıra göstergesi */}
                {queue.length > 1 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2 font-semibold">
                      Sıra: {queueIndex + 1} / {queue.length}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {queue.map((w, i) => (
                        <button
                          key={`${w}-${i}`}
                          onClick={() => { setQueueIndex(i); setSelectedWord(w); setIframeKey(k => k + 1); }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: i === queueIndex
                              ? 'linear-gradient(90deg, #7c3aed, #3b82f6)'
                              : i < queueIndex ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)',
                            border: i === queueIndex ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            color: i === queueIndex ? 'white' : i < queueIndex ? '#6ee7b7' : '#6b7280',
                          }}
                        >
                          {TID_DICTIONARY[w]?.label ?? w}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Alt bilgi */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <p className="text-xs text-slate-600">
                Videolar YouTube TİD eğitim kanallarından alınmıştır. İnternet bağlantısı gereklidir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
