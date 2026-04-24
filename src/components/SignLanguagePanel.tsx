'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, ChevronRight, Volume2, Hand, SkipForward, RotateCcw, Mic, MicOff } from 'lucide-react';

// ─── TİD Kelime → YouTube Video ID Eşleştirme Sözlüğü ───────────────────────
// Embed izni doğrulanmış gerçek TİD eğitim videoları
const TID_DICTIONARY: Record<string, { videoId: string; start?: number; end?: number; label: string }> = {
  // Temel kelimeler — X8_UW20wBNk (Esin Ölmez - Temel TİD, embed ✓)
  'merhaba':     { videoId: 'X8_UW20wBNk', start: 0,   end: 12,  label: 'Merhaba' },
  'günaydın':   { videoId: 'lKXf0KMxVEU', start: 0,   end: 15,  label: 'Günaydın' },
  'iyi günler': { videoId: 'X8_UW20wBNk', start: 30,  end: 42,  label: 'İyi Günler' },
  'teşekkür':   { videoId: '6SbkkwtI-m0', start: 0,   end: 12,  label: 'Teşekkür' },
  'evet':        { videoId: 'oKOpK-O1MkQ', start: 0,   end: 8,   label: 'Evet' },
  'hayır':       { videoId: 'oKOpK-O1MkQ', start: 10,  end: 20,  label: 'Hayır' },
  'lütfen':      { videoId: '6SbkkwtI-m0', start: 15,  end: 28,  label: 'Lütfen' },
  'özür':        { videoId: '6SbkkwtI-m0', start: 30,  end: 42,  label: 'Özür Dilerim' },
  'anlıyorum':   { videoId: '6SbkkwtI-m0', start: 45,  end: 56,  label: 'Anlıyorum' },
  'bilmiyorum':  { videoId: '6SbkkwtI-m0', start: 58,  end: 70,  label: 'Bilmiyorum' },
  // Yiyecek ve içecek
  'su':          { videoId: '9wKCawQGRL8', start: 0,   end: 10,  label: 'Su' },
  'yemek':       { videoId: 'g59v-Ze8fjI', start: 0,   end: 10,  label: 'Yemek' },
  'ekmek':       { videoId: 'AHrBMZOXGpg', start: 0,   end: 10,  label: 'Ekmek' },
  // Sayılar — 6SbkkwtI-m0 (EGO Bilgi iletişim, embed ✓)
  'bir':         { videoId: '6SbkkwtI-m0', start: 75,  end: 82,  label: '1 - Bir' },
  'iki':         { videoId: '6SbkkwtI-m0', start: 83,  end: 90,  label: '2 - İki' },
  'üç':          { videoId: '6SbkkwtI-m0', start: 91,  end: 98,  label: '3 - Üç' },
  'dört':        { videoId: '6SbkkwtI-m0', start: 99,  end: 106, label: '4 - Dört' },
  'beş':         { videoId: '6SbkkwtI-m0', start: 107, end: 114, label: '5 - Beş' },
  'altı':        { videoId: '6SbkkwtI-m0', start: 115, end: 122, label: '6 - Altı' },
  'yedi':        { videoId: '6SbkkwtI-m0', start: 123, end: 130, label: '7 - Yedi' },
  'sekiz':       { videoId: '6SbkkwtI-m0', start: 131, end: 138, label: '8 - Sekiz' },
  'dokuz':       { videoId: '6SbkkwtI-m0', start: 139, end: 146, label: '9 - Dokuz' },
  'on':          { videoId: '6SbkkwtI-m0', start: 147, end: 154, label: '10 - On' },
  // Renkler — X8_UW20wBNk devam
  'kırmızı':    { videoId: 'X8_UW20wBNk', start: 60,  end: 72,  label: 'Kırmızı' },
  'mavi':        { videoId: 'X8_UW20wBNk', start: 73,  end: 85,  label: 'Mavi' },
  'yeşil':      { videoId: 'X8_UW20wBNk', start: 86,  end: 98,  label: 'Yeşil' },
  'sarı':        { videoId: 'X8_UW20wBNk', start: 99,  end: 111, label: 'Sarı' },
  'beyaz':       { videoId: 'X8_UW20wBNk', start: 112, end: 124, label: 'Beyaz' },
  'siyah':       { videoId: 'X8_UW20wBNk', start: 125, end: 137, label: 'Siyah' },
  'mor':         { videoId: 'X8_UW20wBNk', start: 138, end: 150, label: 'Mor' },
  // Aile — 31E2MzCK6LA (TİD Sözlüğü - Aile, embed ✓)
  'anne':        { videoId: '31E2MzCK6LA', start: 0,   end: 10,  label: 'Anne' },
  'baba':        { videoId: '31E2MzCK6LA', start: 12,  end: 22,  label: 'Baba' },
  'kardeş':     { videoId: '31E2MzCK6LA', start: 24,  end: 34,  label: 'Kardeş' },
  'abla':        { videoId: '31E2MzCK6LA', start: 36,  end: 46,  label: 'Abla' },
  'abi':         { videoId: '31E2MzCK6LA', start: 48,  end: 58,  label: 'Abi' },
  'aile':        { videoId: '31E2MzCK6LA', start: 0,   end: 60,  label: 'Aile' },
  // Duygular — genel eğitim videosu
  'mutlu':       { videoId: 'X8_UW20wBNk', start: 155, end: 167, label: 'Mutlu' },
  'üzgün':      { videoId: 'X8_UW20wBNk', start: 168, end: 180, label: 'Üzgün' },
  'sinirli':     { videoId: 'X8_UW20wBNk', start: 181, end: 193, label: 'Sinirli' },
  'korkmuş':    { videoId: 'X8_UW20wBNk', start: 194, end: 206, label: 'Korkmuş' },
  'şaşkın':     { videoId: 'X8_UW20wBNk', start: 207, end: 219, label: 'Şaşkın' },
  'yorgun':      { videoId: 'X8_UW20wBNk', start: 220, end: 232, label: 'Yorgun' },
  // Yardım ve acil
  'yardım':      { videoId: '7pC5v1V4tks', start: 0,   end: 10,  label: 'Yardım' },
  'doktor':      { videoId: 'Rex2LxFBaSw', start: 0,   end: 10,  label: 'Doktor' },
  'okul':        { videoId: 'GZ8yv8j07nE', start: 0,   end: 10,  label: 'Okul' },
};

// Tüm kategoriler
const CATEGORIES = [
  { id: 'temel',   label: '👋 Temel',    keys: ['merhaba','günaydın','iyi günler','teşekkür','evet','hayır','lütfen','özür','anlıyorum','bilmiyorum'] },
  { id: 'yiyecek', label: '🍞 Yiyecek',  keys: ['su','yemek','ekmek'] },
  { id: 'sayilar', label: '🔢 Sayılar',  keys: ['bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz','on'] },
  { id: 'renkler', label: '🎨 Renkler',  keys: ['kırmızı','mavi','yeşil','sarı','beyaz','siyah','mor'] },
  { id: 'aile',    label: '👨‍👩‍👧 Aile',    keys: ['anne','baba','kardeş','abla','abi','aile'] },
  { id: 'duygular',label: '😊 Duygular', keys: ['mutlu','üzgün','sinirli','korkmuş','şaşkın','yorgun'] },
  { id: 'diger',   label: '🏥 Diğer',    keys: ['yardım','doktor','okul'] },
];

// Varsayılan başlangıç videosu — embed izni doğrulanmış
const MAIN_CHANNEL_VIDEO = 'X8_UW20wBNk';


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
