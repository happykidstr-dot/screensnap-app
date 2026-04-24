# 🎬 ScreenSnap — Kapsamlı Kullanım Kılavuzu

> **Sürüm:** 2.1 Enterprise  
> **Canlı Adres:** [https://screensnap.netlify.app](https://screensnap.netlify.app)  
> **Son Güncelleme:** Nisan 2026

---

## 📋 İçindekiler

1. [ScreenSnap Nedir?](#1-screensnap-nedir)
2. [İlk Kullanım ve Kurulum](#2-i̇lk-kullanım-ve-kurulum)
3. [Ana Ekran — Kayıt Paneli](#3-ana-ekran--kayıt-paneli)
4. [📺 Broadcast / Web TV (Sanal Stüdyo)](#4--broadcast--web-tv-sanal-stüdyo)
5. [Gelişmiş Kayıt Ayarları](#5-gelişmiş-kayıt-ayarları)
6. [📜 Teleprompter (Akıllı Metin Okuyucu)](#6--teleprompter-akıllı-metin-okuyucu)
7. [✏️ Ekran Üzerinde Canlı Çizim](#7-️-ekran-üzerinde-canlı-çizim)
8. [📸 Anlık Ekran Görüntüsü](#8--anlık-ekran-görüntüsü)
9. [🌐 Canlı Yayın (Go Live)](#9--canlı-yayın-go-live)
10. [👥 Uzaktan Konuk Sistemi](#10--uzaktan-konuk-sistemi)
11. [🖼️ Sunum Modu (PDF & Web)](#11-️-sunum-modu-pdf--web)
12. [🏢 Enterprise Çalışma Alanları (Workspaces)](#12--enterprise-çalışma-alanları-workspaces)
13. [📁 Video Kütüphanesi](#13--video-kütüphanesi)
14. [🎬 Video Oynatıcı — Tüm Özellikler](#14--video-oynatıcı--tüm-özellikler)
15. [⚙️ Ayarlar Sayfası](#15-️-ayarlar-sayfası)
16. [📖 Uygulama İçi Kılavuz Sayfası](#16--uygulama-i̇çi-kılavuz-sayfası)
17. [⌨️ Klavye Kısayolları](#17-️-klavye-kısayolları)
18. [🔧 Sık Karşılaşılan Sorunlar](#18--sık-karşılaşılan-sorunlar)

---

## 1. ScreenSnap Nedir?

**ScreenSnap**, satış ekipleri, ürün yöneticileri, eğitimciler ve her türlü profesyonel için tasarlanmış, **tarayıcı tabanlı**, **yapay zeka destekli** bir ekran kayıt ve medya yönetim platformudur.

### ScreenSnap'in Farkı

| Özellik | Rakipler (Loom vb.) | ScreenSnap |
|---|---|---|
| Kurulum | Masaüstü uygulaması indir | Tarayıcıda aç, hemen kaydet |
| Gizlilik | Video buluta yüklenir | Videolar bilgisayarınızda (offline) |
| Sanal Stüdyo | Yok | ✅ AI arka plan + 10 stüdyo teması |
| Teleprompter | Yok | ✅ Entegre, şeffaf, otomatik akış |
| AI Wiki Belgesi | Sadece kısa özet | ✅ Tam Notion/Confluence makalesi |
| Projeye Gönder | Manuel kopyala-yapıştır | ✅ Tek tıkla Jira/Trello/Zapier |
| Cloud Storage | Aylık ücret | ✅ Supabase ile aktif (kuruldu) |
| Sihirli Kırpıcı | Cloud sunucu bekler | ✅ Anında, offline (tarayıcıda) |
| Fiyat | Aylık $15–$40/kullanıcı | ✅ Ücretsiz |

---

## 2. İlk Kullanım ve Kurulum

### Adım 1: Siteye Erişin
[https://screensnap.netlify.app](https://screensnap.netlify.app) adresini açın.  
Chrome, Brave veya Edge tarayıcısı önerilir. Safari de desteklenir.

### Adım 2: Tarayıcı İzinleri
İlk kayıt başlatıldığında tarayıcınız izin ister:
- **Mikrofon izni** → "İzin Ver" tıklayın
- **Ekran paylaşımı** → Kaydetmek istediğiniz pencereyi/sekmeyi seçin
- **Kamera izni** (opsiyonel) → Webcam ile çekim için gerekli

### Adım 3: Yapay Zeka Özellikleri
> ✅ **OpenAI API anahtarı Netlify'de yapılandırıldı** — AI özeti, transkript ve wiki belgesi özellikleri ekstra kurulum gerektirmeden çalışır.

### Adım 4: Cloud Storage
> ✅ **Supabase Cloud Storage Netlify'de aktif** — Paylaşılabilir link ve QR kod özellikleri hazır.

---

## 3. Ana Ekran — Kayıt Paneli

Ana sayfada büyük bir kayıt merkezi bulunur.

### Arayüz Bölümleri

**Sol Kenar Çubuğu (Sidebar):**
- **Şirket Ağım / Enterprise** → Kurumsal başlık
- **ÇALIŞMA ALANLARI** → Departman bazlı video klasörleri
- **Tüm Videolar** → Tüm kayıtlarınız tek listede
- **SSO & Güvenlik rozeti** → Kurumsal güvenlik özeti

**Sağ Üst Header İkonları:**
- **📜 Teleprompter** → Metin okuyucu panelini açar
- **📖 (kitap)** → Uygulama içi kılavuza gider (`/guide`)
- **📷 (kamera)** → Anlık ekran görüntüsü alır
- **⚙️ (dişli)** → Ayarlar sayfasına gider

### Temel Togglelar (Açma/Kapama Düğmeleri)

| Toggle | Renk (Aktif) | Açıklama |
|---|---|---|
| 🖥️ **Ekran** | Mor | Ekranı kaydet |
| 📷 **Webcam** | Mor | Kamerayı kayda ek |
| 🎤 **Microphone** | Mor | Mikrofonu açar/kapar |
| **720p HD ▾** | — | Kalite seçimi (480p / 720p / 1080p) |

### Kayıt Başlatma
1. Ayarları belirleyin (toggle'ları açın)
2. **"Kayıt Başlat"** butonuna tıklayın (veya `Ctrl+Shift+R`)
3. 3 saniyelik beep geri sayım → Kayıt başlar
4. Tarayıcı penceresi açılır → Kaydetmek istediğiniz ekranı/sekmeyi seçin → **"Share"**

### Kayıt Sırasında
- Sağ üstte kırmızı **KAYIT · 00:00** sayacı görünür
- **Pause** → Kaydı geçici durdur
- **Durdur & Kaydet** → Kaydı bitir ve kaydet
- **Cancel** → Kaydı iptal et (silinir)

---

## 4. 📺 Broadcast / Web TV (Sanal Stüdyo)

Ana panelde **BROADCAST / WEB TV** bölümü, profesyonel haber stüdyosu kalitesinde yayın yapmanızı sağlar.

### Sahne Modları

| Sahne | Açıklama |
|---|---|
| **📺 Ekran** | Ekranınız + webcam PIP, klasik ekran kaydı |
| **📷 Kamera+PIP** | Webcam büyük plan, ekran küçük PIP — sunum için ideal |
| **🎥 Sadece Cam** | Yalnızca webcam — vlog, yüz yüze video |
| **🎬 Intro Kartı** | Başlangıç kartı sahnesi |

### Stüdyo Arka Planları
10 farklı seçenek:
- 🔵 Mavi Stüdyo (klasik haber)
- 🔴 Kırmızı Stüdyo
- 💜 Neon Işıklar
- 🌆 Şehir Manzarası (gece)
- 🌌 Galaksi
- 🌿 Tropikal Orman
- 🏠 Modern Ofis
- 🔮 Koyu Stüdyo (varsayılan)
- ✨ Altın Geometrik
- 🌈 Gradient Dalga

### 🤖 Sanal Stüdyo (AI Arka Plan Kaldırma)
**"Sanal Stüdyo" toggle'ını açın:**
- AI gerçek arka planınızı kaldırır
- Sizi seçilen stüdyo arka planına yerleştirir
- Yeşil ekran (krom) gerekmez — sadece kamera!

> 💡 **İpucu:** İyi ışık, AI'nın sizi daha iyi algılamasını sağlar. Pencere ışığı veya masa lambası kullanın.

### Overlay Kontrolleri

| Toggle | Açıklama |
|---|---|
| 🔴 **CANLI** | Kırmızı "CANLI" rozeti sol üstte görünür |
| ⏰ **Saat** | Gerçek zamanlı saat göstergesi |
| 🏷️ **Logo** | Şirket logonuzu ekranın köşesine ekler |
| 📰 **KJ Alt Yazı** | Alt yazı bandı (isim/unvan gösterimi) |
| 📺 **Haber Bandı** | Alt kayan metin bandı |

### Harici Kanallar (Toplantı Entegrasyonu)
+Zoom, +Meet, +Teams, +Webex butonlarıyla:
- Seçilen uygulama penceresi doğrudan yayın sahnesine kaynak olarak eklenir
- 4 kanala kadar eş zamanlı entegrasyon

### Ses Mikseri
- **Mikrofon** seviyesi slider ile %0–100 ayarlanır
- Sistem sesi yalnızca **Ekran** modunda çalışır

### Renk & Parlaklık Kontrolleri
- **Parlaklık** — slider ile %0–200
- **Kontrast** — slider ile %0–200
- **Doygunluk** — slider ile %0–200

### Konferans Sunumu için Önerilen Akış
```
1. Sahne: Kamera+PIP
2. Arka Plan: Koyu Stüdyo veya kurumsal seçim
3. Sanal Stüdyo (AI): Aç ✅
4. Logo: Aç
5. Teleprompter: Konuşma notlarını yapıştır
6. Kayıt Başlat → Sunum yap → Durdur & Kaydet
```

---

## 5. Gelişmiş Kayıt Ayarları

Ana panelde **"Advanced settings ▾"** metnine tıklayarak genişletilmiş ayar paneli açılır.

### Üst Satır — Özellik Toggle'ları

| Toggle | Açıklama |
|---|---|
| 📄 **Transcript** | Konuşmayı gerçek zamanlı yazıya döker (yalnızca Chrome/Edge) |
| 🔔 **Beep Sound** | 3-2-1 geri sayım ses efekti |
| 🎬 **Intro Fade** | Kayıt başında siyahtan açılış geçişi |
| 🖱️ **Mouse Highlight** | Tıklamalarda kırmızı halka animasyonu |
| ⌨️ **Key Display** | Bastığınız tuşlar ekranda görünür |
| 🌫️ **BG Blur** | Webcam arkaplanını MediaPipe ile bulanıklaştırır |
| 🎤 **Stüdyo Sesi** | AI gürültü engelleme — klima, klavye seslerini yok eder |

### Alt Satır — Görsel Ayarlar

| Ayar | Seçenekler | Açıklama |
|---|---|---|
| **Cam Shape** | Circle / Square / Rectangle | Webcam görüntüsünün şekli |
| **Cam Position** | Bottom-right / Bottom-left / Top-right / Top-left | Ekrandaki konum |
| **Cam Size** | Slider %10–40 | Webcam büyüklüğü |
| **Ring Color** | Renk seçici | Webcam çerçeve rengi |
| **Aspect Ratio** | 16:9 / 4:3 / 1:1 / 9:16 | 9:16 = TikTok/Reels dikey format |
| **Auto-stop** | Disabled / 5dk / 10dk / 15dk / 30dk / 60dk | Otomatik durdurma |

> **💡 İpucu:** Kafede, açık ofiste veya gürültülü ortamda **"Stüdyo Sesi"** toggle'ını açın. Sistem mikrofon üzerindeki klavye sesi, klima ve çevre gürültüsünü izole eder; yalnızca net insan sesi kaydedilir.

---

## 6. 📜 Teleprompter (Akıllı Metin Okuyucu)

**Hedef:** Kameraya bakarken konuşma metnini okumak. Satış sunumları, eğitim videoları için idealdir.

### Kullanım Adımları
1. Header'da **"📜 Teleprompter"** butonuna tıklayın → Sol altta şeffaf panel belirir
2. Konuşma metninizi metin kutusuna yapıştırın (Türkçe dahil her dil)
3. **Okuma Hızı** kaydırıcısını ayarlayın (0.5x = yavaş → 3x = hızlı, varsayılan 1.5x)
4. **"Hazır! Okumaya Başla"** butonuna tıklayın → Metin yukarı kaymaya başlar
5. Kaydı başlatın ve kameraya bakarak doğaçlama gibi okuyun

> **💡 İpucu:** Uzun metinlerde **paragraf araları** ekleyin — bunlar nefes molası işareti görevi görür. Hızı önceden test edin.

---

## 7. ✏️ Ekran Üzerinde Canlı Çizim

Kayıt yaparken ekrana gerçek zamanlı çizim yapabilirsiniz.

### Çizim Panelini Açma
- Header'da **"Draw"** butonuna tıklayın
- Panel turuncu renk alır → **(Drawing aktif)**

### Çizim Araçları
| Araç | Kullanım |
|---|---|
| 🖊️ **Kalem** | Serbest çizim — imza, el yazısı |
| ➡️ **Ok** | Yön göstermek için |
| ⬜ **Dikdörtgen** | Alanı dikkat çekmek için çerçevele |
| ⚪ **Daire** | Bir şeyi işaretle |
| 📤 **Yazı** | Ekrana metin ekle |
| 💡 **Fosforlu** | Sarı/şeffaf işaretçi, vurgulamak için |

- **Geri Al** (↩) → Son çizimi sil
- **Temizle** → Tüm çizimleri kaldır

> **Not:** Çizimlerin video kaydına işlenmesi için **Draw paneli açıkken kayıt yapın**. Çizimler kalıcı olarak videoyla birleşir.

---

## 8. 📸 Anlık Ekran Görüntüsü

Header'daki **📷 kamera ikonuna** tıklayarak kayıt yapmadan anlık ekran görüntüsü alırsınız.

### Screenshot Editörü
- Görüntü alındıktan sonra editör açılır
- **Kalem, Dikdörtgen, Daire, Ok, Yazı, Fosforlu** araçlarını kullanın
- Renk ve kalınlık seçin
- **PNG olarak İndir** → Bilgisayarınıza kaydedin
- **Kopyala** → Panoya kopyalayıp herhangi bir yere yapıştırın

---

## 9. 🌐 Canlı Yayın (Go Live)

**Kayıt sırasında** ekranınızı gerçek zamanlı olarak izleyicilere yayınlayın.

### Nasıl Kullanılır?
1. Kaydı başlatın
2. Header'da beliren **"📡 Go Live"** butonuna tıklayın
3. Açılan pencerede **Yayın Linki** ve **QR Kod** görünür
4. Linki katılımcılarla paylaşın
5. Katılımcılar linke tıklayarak gerçek zamanlı izleyebilir
6. İzleyici sayısı ekranda gösterilir → örn: 👁 3 viewers
7. Kaydı durdurunca yayın da sona erer

### Teknik Not
- WebRTC (PeerJS) kullanır — **sunucu gerektirmez**
- Her iki tarafın da modern tarayıcı kullanması gerekir
- VPN veya şirket güvenlik duvarları bağlantıyı kesebilir

---

## 10. 👥 Uzaktan Konuk Sistemi

**Hedef:** Başka kişileri ekranınıza/yayına bağlayıp ortak kayıt veya yayın yapmak.

### Nasıl Kullanılır?

**Host (Siz):**
1. Üst navbar'daki **"Konuk"** butonuna tıklayın
2. Panel açılır → davet linki otomatik oluşturulur
3. **📋 Kopyala** ile linki konuklara WhatsApp/mail ile gönderin

**Konuk:**
1. Linki Chrome veya Edge'de açar
2. İsmini girer → **"🎬 Yayına Bağlan"**
3. Kamera ve mikrofon izni verir → bağlandı!

### Kayıt Sırasında
Bağlı konuklar ekranın alt şeridinde grid olarak görünür:
- **1 konuk** → tam genişlik
- **2 konuk** → yan yana
- **3-4 konuk** → 2×2 grid
- Konukların isim badge'i otomatik olarak çiziliyor

> **Not:** Sunucu yok, tamamen ücretsiz, maksimum 4 konuk.

---

## 11. 🖼️ Sunum Modu (PDF & Web)

Kayıt yaparken bir **web sitesini veya PDF dosyasını** ekranınıza yükleyin.

### Başlatma
1. **"🌐 Sunum Modu Yükle"** butonuna tıklayın
2. İki seçenek:

**Seçenek 1: Web Sitesi URL**
- URL kutusuna adres yazın → Site ScreenSnap içinde belirir

**Seçenek 2: PDF Dosyası**
- PDF'i sürükle-bırak veya "Dosya Seç"
- **Draw araçlarıyla** üzerine çizim yapabilirsiniz

---

## 12. 🏢 Enterprise Çalışma Alanları (Workspaces)

Sol kenar çubuğu kurumsal organizasyonu sağlar.

### Yeni Çalışma Alanı Oluşturma
1. "Çalışma Alanları" başlığının yanındaki **⊕ ikonuna** tıklayın
2. Örn: `Pazarlama`, `Satış Pitchleri`, `IK_Egitimler`
3. Enter'a basın → Çalışma alanı oluşturulur

---

## 13. 📁 Video Kütüphanesi

Ana ekranda **"Tüm Videolar"** bölümü tüm kayıtlarınızı listeler.

### Video Kartı Bilgileri
- **Küçük resim (Thumbnail)**
- **Başlık** — tıklayarak düzenleyebilirsiniz
- **Süre** ⏱ ve **Dosya boyutu** 📦
- **Oluşturma tarihi** 🗓
- **🗑 Sil** butonu

---

## 14. 🎬 Video Oynatıcı — Tüm Özellikler

Herhangi bir videoya tıklayarak tam özellikli oynatıcıyı açın.

### Düzenleme Araçları

#### ✂️ Trim — Video Kırpma
Sol ve sağ tutamaçları sürükleyerek başlangıç/bitiş belirleyin → **"Apply Trim"**

#### ✨ Sihirli Kırpıcı (Magic Cut)
Konuşmanızdaki sessiz anları otomatik tespit eder ve keser.

#### 🖼️ Thumbnail
Video oynatılırken istediğiniz kareyi → **"Capture"**

### Dışa Aktarma

| Format | Açıklama |
|---|---|
| **⬇ WebM** | Ham kayıt dosyası — anında indir |
| **📹 MP4** | ffmpeg.wasm ile tarayıcıda dönüştür |
| **🎞 GIF** | İlk 10 saniyeden animasyonlu GIF |
| **🗜 Compress** | Hedef MB boyutu gir, küçült |

### Paylaşım ve Dağıtım

| Yöntem | Açıklama |
|---|---|
| **☁ Upload** | Supabase'e yükle → paylaşılabilir link al ✅ Aktif |
| **📱 QR Kod** | Cloud URL'den QR kod oluştur ✅ Aktif |
| **</> Embed** | iFrame / Link / Markdown kodu üret |
| **📤 Share** | Tarayıcı native paylaşım menüsü |
| **📧 Email** | Mailto linki açar |
| **🐦 Tweet** | Twitter/X'te cloud linki paylaş |

### AI Özellikleri

> ✅ **OpenAI API anahtarı yapılandırıldı** — ekstra kurulum gerekmez.

Video oynatıcıda **"✨ AI Summary"** sekmesi → **"Generate"**:

| Çıktı | Açıklama |
|---|---|
| **📝 AI Özeti** | 4–5 cümlelik profesyonel özet |
| **📌 Önemli Noktalar** | 5–8 maddelik bullet-list |
| **📧 Satış E-posta Taslağı** | Konu satırı dahil profesyonel email |
| **📚 Wiki / Notion Belgesi** | Başlıklı, formatlanmış Markdown doküman |

---

## 15. ⚙️ Ayarlar Sayfası

Sağ üstteki ⚙️ ikonuna veya `/settings` adresine gidin.

### 🌗 Tema
- **Dark** (varsayılan) / **Light**

### 🎨 Markalama
- **Marka Rengi** (Hex kodu) — örn: `#7c3aed`
- **Firma Logo URL**

### 🤖 AI Summary (OpenAI)
> ✅ **Netlify'de yapılandırıldı** — ek kurulum gerekmez.  
Kendi anahtarınızı kullanmak isterseniz: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### ☁️ Cloud Storage (Supabase)
> ✅ **Netlify'de aktif** — paylaşılabilir link ve QR kod çalışıyor.  
Proje: `hxtxxmldlqwmgbsrwsym.supabase.co` / Bucket: `recordings`

### 🚀 Webhook (Projeye Gönder)
- Zapier, Make, n8n, Jira veya Trello webhook URL'nizi girin

### 📦 Backup & Restore
- **Export ZIP** → Tüm kayıtları tek ZIP'te indir
- **Import ZIP** → Yedek ZIP'ten kayıtları geri yükle

> ⚠️ **Önemli:** Veriler tarayıcının IndexedDB deposunda saklanır. "Tarayıcı verilerini temizle" yaparsanız silinir — düzenli ZIP yedeği alın!

---

## 16. 📖 Uygulama İçi Kılavuz Sayfası

Header'daki **📖 kitap ikonuna** tıklayarak `/guide` sayfasına ulaşın.

### Akordeon Bölümler

| Bölüm | İçerik |
|---|---|
| 🚀 İlk Kaydını Al | 6 adımlı başlangıç rehberi |
| 📺 Broadcast / Sanal Stüdyo | 6 adımlı stüdyo kurulum rehberi |
| ⚙️ Kayıt Seçenekleri | Tüm toggle ve ayarların açıklaması |
| 🎬 Kayıt Sırasında | Draw, Chapter, Go Live, Pause/Resume |
| 📜 Teleprompter | 5 adımlı rehber |
| 📤 Paylaşım Yöntemleri | WebM/MP4, GIF, Cloud, QR, Embed |
| 📡 Canlı Yayın | 4 adımlı Go Live rehberi |
| 👥 Konuk Sistemi | 4 adımlı rehber |
| ✨ AI Özet | Kullanım ve çıktılar |
| ☁️ Cloud Storage | Supabase durumu ve kullanım |
| 📦 Yedekleme & Geri Yükleme | ZIP export/import |
| ⌨️ Klavye Kısayolları | Tüm kısayol listesi |
| ❓ Sık Sorulan Sorular | En yaygın 8 sorun ve çözüm |

---

## 17. ⌨️ Klavye Kısayolları

| Kısayol | Eylem |
|---|---|
| `Ctrl+Shift+R` | Kaydı Başlat / Durdur |
| `Ctrl+Shift+P` | Kaydı Duraklat / Devam Ettir |
| `Ctrl+Shift+D` | Çizim Modunu Aç/Kapat |
| `Escape` | Kaydı İptal Et (kaydetmez) |

---

## 18. 🔧 Sık Karşılaşılan Sorunlar

### "Kayıt başlamıyor"
- Tarayıcının mikrofon ve ekran kaydı iznini verdiğinden emin olun
- Chrome/Brave/Edge'de çalışır; Firefox'ta kısıtlamalar olabilir

### "Ses kaydedilmiyor"
- **Microphone** toggle'ının mor (aktif) olduğunu kontrol edin
- Başka bir uygulama (Zoom, Teams) mikrofonu kullanıyor olabilir → kapatın

### "Sanal Stüdyo (AI) çalışmıyor"
- BROADCAST / WEB TV bölümünde **"Sanal Stüdyo"** toggle'ını açın
- Yeşil ışık = AI aktif. İlk yüklemede 1-2 saniye bekleyin
- İyi ışık sağlayın — karanlık ortamlarda AI yüzü doğru algılayamaz

### "Kamera görünmüyor"
- Başka bir uygulama kamerayı kullanıyor olabilir → kapatın
- **Webcam** toggle'ının açık olduğunu doğrulayın

### "AI özeti çalışmıyor"
- OpenAI API anahtarı Netlify'de yapılandırıldı ✅
- Transcript bulunmayan videolar özetlenemez → Advanced Settings → **Transcript** toggle açık kaydedin

### "Cloud Upload / QR Kod çalışmıyor"
- Supabase entegrasyonu Netlify'de aktif ✅
- Video oynatıcıdaki "☁ Upload" butonunu tıklayın
- Hata alıyorsanız sayfayı yenileyin (F5)

### "Sihirli Kırpıcı çok kısa video oluşturdu"
- Doğal konuşma temposu kullanın
- Gürültülü ortamdaysa **Stüdyo Sesi** toggle ile tekrar çekin

### "Sayfa açılmıyor / Internal Server Error"
- `F5` ile sayfayı yenileyin
- `Ctrl+Shift+Del` → Cache ve çerezleri temizleyin
- Farklı tarayıcı deneyin (Chrome ya da Brave önerilir)

### "Konuk bağlanamıyor"
- Host'un kaydı aktif ve **Konuk** paneli açık olmalı
- Konuk Chrome veya Edge kullanmalı
- Şirket VPN veya kurumsal güvenlik duvarı P2P bağlantısını engelleyebilir

---

## 📝 Teknik Altyapı

| Teknoloji | Kullanım Amacı |
|---|---|
| Next.js 15 + React | Frontend framework |
| TypeScript | Tip güvenliği |
| MediaRecorder API | Ekran & ses kaydı |
| Web Speech API | Gerçek zamanlı transcript |
| BodyPix / MediaPipe | AI arka plan kaldırma (Sanal Stüdyo) |
| ffmpeg.wasm | Tarayıcıda MP4 dönüşümü (sunucu yok) |
| modern-gif | GIF export |
| IndexedDB | Yerel video depolama |
| PeerJS (WebRTC) | Canlı yayın & konuk sistemi |
| Supabase | Cloud depolama ✅ Aktif |
| OpenAI GPT-4o | AI özet ve doküman üretimi ✅ Aktif |
| Netlify | Hosting ve deployment |

---

*Bu kılavuz ScreenSnap v2.1 Enterprise için hazırlanmıştır. Nisan 2026. Ekibinizle paylaşabilirsiniz.*
