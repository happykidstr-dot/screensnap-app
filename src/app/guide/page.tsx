'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Video, Mic, Monitor, Camera, Keyboard, Cloud, Sparkles, Radio, BookOpen, HelpCircle, Archive, Settings } from 'lucide-react';

const sections = [
  {
    id: 'baslangic',
    icon: <Video className="w-5 h-5" />,
    color: 'from-purple-600 to-violet-700',
    title: '🚀 İlk Kaydını Al',
    steps: [
      { step: '1', title: 'Uygulamayı aç', desc: 'Tarayıcında şu adresi aç:', code: 'http://localhost:3002' },
      { step: '2', title: 'Ayarları seç', desc: 'Screen, Webcam, Microphone ve System Audio toggle\'larını istediğin gibi aç/kapat. Mor = aktif.' },
      { step: '3', title: 'Kaydı başlat', desc: '"Start Recording" butonuna tıkla. 3-2-1 geri sayımı başlar (bip sesi duyarsın).' },
      { step: '4', title: 'Ekranı seç', desc: 'Tarayıcı senden ekran seçmeni ister. Hangi pencere veya ekranı kaydetmek istiyorsan seç → "Share" tıkla.' },
      { step: '5', title: 'Kayıt yap', desc: 'İstediğin pencereye geç, ne kaydetmek istiyorsan yap. ScreenSnap arka planda kayıt yapar.' },
      { step: '6', title: 'Durdur ve kaydet', desc: 'ScreenSnap\'e geri dön → "Stop & Save" → İsim ver → "Save Recording".' },
    ],
  },
  {
    id: 'ayarlar',
    icon: <Settings className="w-5 h-5" />,
    color: 'from-blue-600 to-cyan-600',
    title: '⚙️ Kayıt Seçenekleri',
    content: [
      { label: 'Screen kapalı', value: 'Sadece ses kaydeder (podcast / not modu)' },
      { label: 'Webcam kapalı', value: 'Sadece ekran görüntüsü' },
      { label: '480p / 720p / 1080p', value: 'Kalite seçimi — 720p çoğu kullanım için ideal' },
      { label: 'Transcript', value: 'Konuşmalarını gerçek zamanlı yazıya döker' },
      { label: 'Beep Sound', value: '3-2-1 geri sayım beep sesi' },
      { label: 'Intro Fade', value: 'Kayıt başında siyahtan açılış efekti' },
      { label: '🖱 Mouse Highlight', value: 'Tıklamalarda kırmızı halka animasyonu' },
      { label: '⌨️ Key Display', value: 'Bastığın tuşlar ekranda görünür' },
      { label: '🌫️ BG Blur', value: 'Webcam\'de arkaplanı bulanıklaştır' },
      { label: '📐 Aspect Ratio', value: '16:9 / 4:3 / 1:1 / 9:16 (TikTok) seçimi' },
      { label: 'Cam Size', value: 'Slider ile webcam boyutunu %10–40 arası ayarla' },
      { label: 'Ring Color', value: 'Webcam çerçeve rengini seç' },
      { label: '⏰ Auto-stop', value: '5 / 10 / 15 / 30 / 60 dakika sonra otomatik dur' },
    ],
  },
  {
    id: 'sirasinda',
    icon: <Monitor className="w-5 h-5" />,
    color: 'from-orange-500 to-red-600',
    title: '🎬 Kayıt Sırasında',
    content: [
      { label: '✏️ Draw (Çizim)', value: 'Header\'daki "Draw" butonuyla ekrana çizim yap, ok işareti ekle' },
      { label: '📖 Chapter Ekle', value: 'Sağ üstteki butonla bölüm işareti ekle (kayıt içinde zaman damgası)' },
      { label: '📡 Go Live', value: 'Header\'daki "Go Live" ile başkalarının canlı izlemesine izin ver' },
      { label: '⏸ Pause / Resume', value: 'Kaydı duraklat / devam ettir' },
      { label: '❌ Cancel', value: 'Kaydı iptal et, kaydetme' },
    ],
  },
  {
    id: 'paylasim',
    icon: <Cloud className="w-5 h-5" />,
    color: 'from-cyan-500 to-teal-600',
    title: '📤 Paylaşım Yöntemleri',
    content: [
      { label: '⬇️ WebM / MP4 İndir', value: 'Orijinal dosyayı ya da ffmpeg ile dönüştürülmüş MP4\'ü indir' },
      { label: '🎞 GIF Export', value: 'İlk 10 saniyeden animasyonlu GIF oluştur' },
      { label: '🗜 Compress', value: 'Hedef boyut gir (MB), dosyayı küçült' },
      { label: '☁️ Cloud Upload', value: 'Supabase\'e yükle, paylaşılabilir link al' },
      { label: '🔗 QR Kod', value: 'Cloud URL\'den QR kod oluştur, PNG olarak indir' },
      { label: '</> Embed', value: 'iFrame / Link / Markdown kodu üret' },
      { label: '📧 Email', value: 'Email istemcini aç, link ile gönder' },
      { label: '🐦 Tweet', value: 'Twitter/X\'te cloud linki paylaş' },
    ],
  },
  {
    id: 'live',
    icon: <Radio className="w-5 h-5" />,
    color: 'from-red-500 to-pink-600',
    title: '📡 Canlı Yayın (Go Live)',
    steps: [
      { step: '1', title: 'Kaydı başlat', desc: '"Start Recording" ile kaydı başlat.' },
      { step: '2', title: 'Go Live tıkla', desc: 'Header\'da beliren "Go Live" butonuna tıkla.' },
      { step: '3', title: 'Linki paylaş', desc: 'Oluşturulan linki kopyala (örn: /live/abc123) ve arkadaşına gönder.' },
      { step: '4', title: 'İzleyin', desc: 'Arkadaşın linki açar → Seni canlı izler. Kaç kişinin izlediği header\'da görünür.' },
    ],
    note: '💡 Sunucu gerekmez! PeerJS ile tarayıcıdan tarayıcıya direkt bağlantı.',
  },
  {
    id: 'ai',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-violet-600 to-purple-800',
    title: '✨ AI Özet',
    steps: [
      { step: '1', title: 'API anahtarı al', desc: 'platform.openai.com/api-keys → Yeni anahtar oluştur (sk-... ile başlar).' },
      { step: '2', title: 'Settings\'e ekle', desc: '⚙ Settings → AI Summary bölümüne anahtarı gir → "Save".' },
      { step: '3', title: 'Transcript açık kaydet', desc: 'Advanced Settings → Transcript toggle\'ını aç → Kayıt yap.' },
      { step: '4', title: 'Özet oluştur', desc: 'Video oynatıcı → "AI Summary" sekmesi → "Generate" butonuna tıkla.' },
    ],
    note: '📝 Çıktı: 2-3 cümlelik özet + 5 anahtar nokta',
  },
  {
    id: 'yedek',
    icon: <Archive className="w-5 h-5" />,
    color: 'from-orange-500 to-amber-600',
    title: '📦 Yedekleme & Geri Yükleme',
    content: [
      { label: 'Export ZIP', value: 'Settings → Backup → "Export ZIP" → Tüm kayıtlar tek dosyada indirilir' },
      { label: 'Import ZIP', value: 'Settings → Backup → "Import ZIP" → Yedekteki kayıtlar geri yüklenir' },
      { label: '⚠️ Önemli', value: 'Veriler tarayıcıda saklanır. "Tarayıcı verilerini temizle" yaparsanız silinir!' },
    ],
  },
  {
    id: 'kisayollar',
    icon: <Keyboard className="w-5 h-5" />,
    color: 'from-slate-600 to-gray-700',
    title: '⌨️ Klavye Kısayolları',
    content: [
      { label: 'Ctrl + Shift + R', value: 'Kaydı Başlat / Durdur' },
      { label: 'Ctrl + Shift + P', value: 'Duraklat / Devam Ettir' },
      { label: 'Ctrl + Shift + D', value: 'Çizim modunu aç/kapat' },
      { label: 'Escape', value: 'Kaydı iptal et (kaydetmez)' },
    ],
  },
  {
    id: 'sss',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'from-emerald-600 to-teal-700',
    title: '❓ Sık Sorulan Sorular',
    faqs: [
      { q: 'Ses kaydedilmiyor', a: 'Microphone veya System Audio toggle\'larının mor (aktif) olduğunu kontrol et.' },
      { q: 'Webcam kaydın içinde görünmüyor', a: 'Webcam toggle açık mı? Kayıt başlarken kamera iznini verdin mi?' },
      { q: 'Transcript çalışmıyor', a: 'Yalnızca Chrome/Edge\'de çalışır. Advanced Settings\'ten Transcript toggle\'ını aç.' },
      { q: 'MP4 indirmesi çok yavaş', a: 'ffmpeg.wasm ilk seferinde CDN\'den yüklenir. İnternet bağlantını kontrol et.' },
      { q: 'BG Blur çalışmıyor', a: 'İlk kullanımda MediaPipe modeli (~2MB) yüklenir. Birkaç saniye bekle.' },
      { q: 'Kayıtlarım nerede?', a: 'Tarayıcının IndexedDB deposunda. Tarayıcı verilerini temizlersen silinir — ZIP yedeği al!' },
    ],
  },
];

export default function GuidePage() {
  const [open, setOpen] = useState<string | null>('baslangic');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-lg">📖 Kullanım Kılavuzu</h1>
            <p className="text-slate-500 text-xs">Hiç bilmeyen biri için adım adım rehber</p>
          </div>
          <Link href="/" className="ml-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all">
            Uygulamayı Aç →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/5" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-6">
            <BookOpen className="w-3.5 h-3.5" /> Türkçe Kullanım Rehberi
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            ScreenSnap ile <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Ekranını Kaydet</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Tüm özellikler, adım adım. 5 dakikada ilk kaydını al.
          </p>

          {/* Quick stats */}
          <div className="flex justify-center gap-8 mt-10">
            {[['18+', 'Özellik'], ['0', 'Hesap Gereksinimi'], ['100%', 'Tarayıcıda']].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-white">{num}</div>
                <div className="text-slate-500 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Start Box */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="glass rounded-2xl p-6 border border-purple-500/20 mb-4">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <span className="text-xl">⚡</span> Hızlı Başlangıç (8 Adım)
          </h3>
          <ol className="space-y-2">
            {[
              'http://localhost:3002 adresi aç',
              'Screen + Webcam + Mic toggle\'larını aç (mor = aktif)',
              '"Start Recording" butonuna tıkla',
              'Geri sayım biter, tarayıcıdan ekranını seç → "Share"',
              'İstediğin şeyi yap (sunum, demo, not…)',
              'ScreenSnap\'e geri dön → "Stop & Save"',
              'İsim ver → "Save Recording"',
              'Video kütüphanenide görünür! 🎉',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        {/* Sections accordion */}
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.id} className="glass rounded-2xl overflow-hidden border border-white/5">
              <button
                onClick={() => setOpen(open === section.id ? null : section.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors"
              >
                <div className={`w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white shadow-lg`}>
                  {section.icon}
                </div>
                <span className="text-white font-semibold flex-1">{section.title}</span>
                {open === section.id
                  ? <ChevronDown className="w-4 h-4 text-slate-400" />
                  : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>

              {open === section.id && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                  {/* Steps variant */}
                  {'steps' in section && section.steps && (
                    <ol className="space-y-3">
                      {section.steps.map((s) => (
                        <li key={s.step} className="flex gap-3">
                          <span className={`shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${section.color} text-white text-xs font-black flex items-center justify-center`}>{s.step}</span>
                          <div>
                            <p className="text-white text-sm font-semibold">{s.title}</p>
                            <p className="text-slate-400 text-sm mt-0.5">{s.desc}</p>
                            {'code' in s && s.code && (
                              <code className="inline-block mt-1.5 px-3 py-1 rounded-lg bg-black/40 text-green-300 text-xs font-mono border border-white/10">{s.code}</code>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Content / table variant */}
                  {'content' in section && section.content && (
                    <div className="space-y-2">
                      {section.content.map((c, i) => (
                        <div key={i} className="flex gap-3 py-2 border-b border-white/5 last:border-0">
                          <span className="shrink-0 font-mono text-xs text-purple-300 bg-purple-600/10 border border-purple-500/20 px-2.5 py-1 rounded-lg whitespace-nowrap">{c.label}</span>
                          <span className="text-slate-400 text-sm">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FAQ variant */}
                  {'faqs' in section && section.faqs && (
                    <div className="space-y-3">
                      {section.faqs.map((faq, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <p className="text-white text-sm font-semibold mb-1">❓ {faq.q}</p>
                          <p className="text-slate-400 text-sm">→ {faq.a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {'note' in section && section.note && (
                    <div className="mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm">
                      {section.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-10 glass rounded-3xl p-8 text-center border border-purple-500/20">
          <h3 className="text-white font-bold text-xl mb-2">Hazır mısın?</h3>
          <p className="text-slate-400 mb-6">Kılavuzu anladıysan uygulamayı açıp ilk kaydını yapabilirsin.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white font-bold text-lg shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.03]">
            🎬 İlk Kaydımı Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
