# 🎬 ScreenSnap — Kapsamlı Kullanım Kılavuzu

> **Sürüm:** 2.0 Enterprise  
> **Canlı Adres:** [https://screensnap.netlify.app](https://screensnap.netlify.app)  
> **Son Güncelleme:** Nisan 2026

---

## 📋 İçindekiler

1. [ScreenSnap Nedir?](#1-screensnap-nedir)
2. [İlk Kullanım ve Kurulum](#2-i̇lk-kullanım-ve-kurulum)
3. [Ana Ekran — Kayıt Paneli](#3-ana-ekran--kayıt-paneli)
4. [Gelişmiş Kayıt Ayarları](#4-gelişmiş-kayıt-ayarları)
5. [📜 Teleprompter (Akıllı Metin Okuyucu)](#5--teleprompter-akıllı-metin-okuyucu)
6. [✏️ Ekran Üzerinde Canlı Çizim](#6-️-ekran-üzerinde-canlı-çizim)
7. [📸 Anlık Ekran Görüntüsü](#7--anlık-ekran-görüntüsü)
8. [🌐 Canlı Yayın (Go Live)](#8--canlı-yayın-go-live)
9. [👥 Uzaktan Konuk Sistemi](#9--uzaktan-konuk-sistemi)
10. [🖼️ Sunum Modu (PDF & Web)](#10-️-sunum-modu-pdf--web)
11. [🏢 Enterprise Çalışma Alanları (Workspaces)](#11--enterprise-çalışma-alanları-workspaces)
12. [📁 Video Kütüphanesi](#12--video-kütüphanesi)
13. [🎬 Video Oynatıcı — Tüm Özellikler](#13--video-oynatıcı--tüm-özellikler)
14. [⚙️ Ayarlar Sayfası](#14-️-ayarlar-sayfası)
15. [📖 Uygulama İçi Kılavuz Sayfası](#15--uygulama-i̇çi-kılavuz-sayfası)
16. [⌨️ Klavye Kısayolları](#16-️-klavye-kısayolları)
17. [🔧 Sık Karşılaşılan Sorunlar](#17--sık-karşılaşılan-sorunlar)

---

## 1. ScreenSnap Nedir?

**ScreenSnap**, satış ekipleri, ürün yöneticileri, eğitimciler ve her türlü profesyonel için tasarlanmış, **tarayıcı tabanlı**, **yapay zeka destekli** bir ekran kayıt ve medya yönetim platformudur.

### ScreenSnap'in Farkı

| Özellik | Rakipler (Loom vb.) | ScreenSnap |
|---|---|---|
| Kurulum | Masaüstü uygulaması indir | Tarayıcıda aç, hemen kaydet |
| Gizlilik | Video buluta yüklenir | Videolar bilgisayarınızda (offline) |
| Teleprompter | Yok | ✅ Entegre, şeffaf, otomatik akış |
| AI Wiki Belgesi | Sadece kısa özet | ✅ Tam Notion/Confluence makalesi |
| Projeye Gönder | Manuel kopyala-yapıştır | ✅ Tek tıkla Jira/Trello/Zapier |
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

### Adım 3: Yapay Zeka için API Anahtarı (Opsiyonel)
AI özeti, email taslağı ve wiki belgesi özellikleri için:
1. [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) adresinden OpenAI API anahtarı alın
2. ScreenSnap'te sağ üst → ⚙️ **Ayarlar** → **AI Bölümü** → Anahtarı girin → Kaydet

---

## 3. Ana Ekran — Kayıt Paneli

Ana sayfada büyük bir kayıt merkezi bulunur.

*Şekil 1: ScreenSnap ana ekranı — Sol sidebar (Enterprise/Çalışma Alanları), merkez kayıt paneli ve sağ üst header ikonları*

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
| 🖥️ **Screen** | Mor | Ekranı kaydet veya sadece ses |
| 📷 **Webcam** | Mor | Kamerayı kayda ek |
| 🎤 **Microphone** | Mor | Mikrofonu açar/kapar |
| 🔊 **System Audio** | Mor | Bilgisayar sesini kaydeder |
| **720p HD ▾** | — | Kalite seçimi (480p / 720p / 1080p) |

### Kayıt Başlatma
1. Ayarları belirleyin (toggle'ları açın)
2. **"Start Recording"** butonuna tıklayın (veya `Ctrl+Shift+R`)
3. 3 saniyelik beep geri sayım → Kayıt başlar
4. Tarayıcı penceresi açılır → Kaydetmek istediğiniz ekranı/sekmeyi seçin → **"Share"**

### Kayıt Sırasında
- Sağ üstte kırmızı **REC · 00:00** sayacı görünür
- **Pause** → Kaydı geçici durdur
- **Stop & Save** → Kaydı bitir ve kaydet
- **Cancel** → Kaydı iptal et (silinir)

---

## 4. Gelişmiş Kayıt Ayarları

Ana panelde **"Advanced settings ▾"** metnine tıklayarak genişletilmiş ayar paneli açılır.

*Şekil 2: Advanced settings paneli — Transcript, Beep Sound, Mouse Highlight, Key Display, BG Blur, Stüdyo Sesi toggle'ları ve Cam Shape/Position/Size/Ratio ayarları*

### Üst Satır — Özellik Toggle'ları

| Toggle | Açıklama |
|---|---|
| 📄 **Transcript** | Konuşmayı gerçek zamanlı yazıya döker (yalnızca Chrome/Edge) |
| 🔔 **Beep Sound** | 3-2-1 geri sayım ses efekti |
| 🎬 **Intro Fade** | Kayıt başında siyahtan açılış geçişi |
| 🖱️ **Mouse Highlight** | Tıklamalarda kırmızı halka animasyonu |
| ⌨️ **Key Display** | Bastığınız tuşlar ekranda görünür |
| 🌫️ **BG Blur** | Webcam arkaplanını MediaPipe ile bulanıklaştırır |
| 🎤 **Stüdyo Sesi** | Yapay zeka gürültü engelleme (turkuaz renk) |

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

## 5. 📜 Teleprompter (Akıllı Metin Okuyucu)

**Hedef:** Kameraya bakarken konuşma metnini okumak. Satış sunumları, eğitim videoları için idealdir.

*Şekil 3: Teleprompter paneli — Metin alanı, Okuma Hızı kaydırıcısı ve "Hazır! Okumaya Başla" butonu*

### Kullanım Adımları
1. Header'da **"📜 Teleprompter"** butonuna tıklayın → Sol altta şeffaf panel belirir
2. Konuşma metninizi metin kutusuna yapıştırın (Türkçe dahil her dil)
3. **Okuma Hızı** kaydırıcısını ayarlayın (0.5x = yavaş → 3x = hızlı)
4. **"Hazır! Okumaya Başla"** butonuna tıklayın → Metin yukarı kaymaya başlar
5. Kaydı başlatın ve kameraya bakarak doğaçlama gibi okuyun

> **💡 İpucu:** Uzun metinlerde **paragraf araları** ekleyin — bunlar nefes molası işareti görevi görür. Hızı önceden test edin.

---

## 6. ✏️ Ekran Üzerinde Canlı Çizim

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

## 7. 📸 Anlık Ekran Görüntüsü

Header'daki **📷 kamera ikonuna** tıklayarak kayıt yapmadan anlık ekran görüntüsü alırsınız.

### Screenshot Editörü
- Görüntü alındıktan sonra editör açılır
- **Kalem, Dikdörtgen, Daire, Ok, Yazı, Fosforlu** araçlarını kullanın
- Renk ve kalınlık seçin
- **PNG olarak İndir** → Bilgisayarınıza kaydedin
- **Kopyala** → Panoya kopyalayıp herhangi bir yere yapıştırın

---

## 8. 🌐 Canlı Yayın (Go Live)

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

## 9. 👥 Uzaktan Konuk Sistemi

**Hedef:** Başka kişileri ekranınıza/yayına bağlayıp ortak kayıt veya yayın yapmak.

### 👥 Nasıl Kullanılır?

**Host (Siz):**
1. Üst navbar'daki **"Konuk"** butonuna tıklayın
2. Panel açılır → davet linki otomatik oluşturulur *(PeerJS sunucusu sizin için oda açıyor)*
3. **📋 Kopyala** ile linki konuklara WhatsApp/mail ile gönderin

**Konuk (Ekiple yayın):**
1. Linki Chrome veya Edge'de açar
2. İsmini girer → **"🎬 Yayına Bağlan"**
3. Kamera ve mikrofon izni verir → bağlandı!

### 🎥 Kayıt Sırasında
Bağlı konuklar ekranın alt şeridinde grid olarak görünür:
- **1 konuk** → tam genişlik
- **2 konuk** → yan yana
- **3-4 konuk** → 2×2 grid
- Konukların isim badge'i (etiketi) otomatik olarak çiziliyor

### 🏗️ Mimari ve Gizlilik

```
Host (Chrome) ←──WebRTC P2P──→ Konuk 1 (Chrome)
              ←──WebRTC P2P──→ Konuk 2 (Chrome)
              ←──WebRTC P2P──→ Konuk 3 (Chrome)
              ←──WebRTC P2P──→ Konuk 4 (Chrome)
```

> **Not:** Sunucu yok, tamamen ücretsiz, maksimum 4 konuk — *tıpkı vMix Call gibi!*

---

## 10. 🖼️ Sunum Modu (PDF & Web)

Kayıt yaparken bir **web sitesini veya PDF dosyasını** ekranınıza yükleyin.

### Başlatma
1. Kayıt başlatılmamışken **"🌐 Sunum Modu Yükle"** butonuna tıklayın
2. İki seçenek sunulur:

**Seçenek 1: Web Sitesi URL**
- URL kutusuna adres yazın (örn: `canva.com/dosyaniz`)
- Enter veya "Aç" tıklayın → Site ScreenSnap içinde belirir

**Seçenek 2: PDF Dosyası (Sürükle-Bırak)**
- PDF dosyanızı alandan içine sürükleyin veya "Dosya Seç" ile açın
- PDF sayfaları görüntülenir → **Draw araçlarıyla** üzerine çizim yapabilirsiniz

### Sunum Kaydı
- Sunum modu açıkken sağ üstte **"Kaydı Başlat"** butonu çıkar
- Sunum yaparken kaydedin → **"Siteden Çık"** ile sunum modunu kapatın

---

## 11. 🏢 Enterprise Çalışma Alanları (Workspaces)

Sol kenar çubuğu kurumsal organizasyonu sağlar.

*Şekil 4: Sol sidebar — Enterprise başlığı, Çalışma Alanları ve Tüm Videolar bölümü*

### Yeni Çalışma Alanı Oluşturma
1. "Çalışma Alanları" başlığının yanındaki **⊕ ikonuna** tıklayın
2. Örn: `Pazarlama`, `Satış Pitchleri`, `IK_Egitimler`, `Ürün Demo`
3. Enter'a basın → Çalışma alanı oluşturulur
4. Video kaydederken o alana taşıyabilirsiniz

### Videoya Klasör Atama
Video kutucuğunun üzerindeki **"..."** menüsünden **"Move to Folder"** seçeneğini kullanın.

---

## 12. 📁 Video Kütüphanesi

Ana ekranda **"My Recordings"** bölümü tüm kayıtlarınızı listeler.

### Arama
- Sağ üstteki 🔍 kutucuğa video adını yazın → Anlık filtreleme

### Video Kartı Bilgileri
Her video kartında:
- **Küçük resim (Thumbnail)** — otomatik frame veya seçilen görsel
- **Başlık** — tıklayarak düzenleyebilirsiniz
- **Süre** ⏱ ve **Dosya boyutu** 📦
- **Oluşturma tarihi** 🗓
- **🗑 Sil** butonu

---

## 13. 🎬 Video Oynatıcı — Tüm Özellikler

Herhangi bir videoya tıklayarak tam özellikli oynatıcıyı açın.

### Oynatıcı Kontrolleri
- Oynatma, ileri/geri sarma
- **Hız seçimi:** 0.5x · 1x · 1.25x · 1.5x · 2x
- **Süre, boyut ve tarih** bilgisi üst barda

---

### Düzenleme Araçları

#### ✂️ Trim — Video Kırpma
1. **"Trim"** butonuna tıklayın
2. Grafik görünür — sol ve sağ tutamaçları sürükleyin
3. Başlangıç ve bitiş süresini belirleyin
4. **"Apply Trim"** → Kırpılmış yeni video oluşturulur

#### ✨ Sihirli Kırpıcı (Magic Cut) — EN GÜÇLÜ ÖZELLİK
**Konuşmanızdaki sessiz anları otomatik tespit eder ve keser.**

1. **"✨ Sihirli Kırp"** butonuna tıklayın
2. Sistem ses dalgalarını analiz eder (yeşil progress bar)
3. 1 saniyeden uzun sessizlikleri otomatik keser
4. Yeni, akıcı video `"✨ [VideoAdı] (Magic Cut)"` olarak kütüphaneye eklenir

> **💡 İpucu:** Kayıt sırasında "eee, ıı, hmm" gibi duraksamalarda birkaç saniye sustaysanız, Sihirli Kırpıcı bunları temizler. Daha akıcı bir video elde edersiniz.

#### 🖼️ Thumbnail (Video Küçük Resmi)
1. **"Thumbnail"** butonuna tıklayın
2. Video oynatılırken **istediğiniz kareye** gelin
3. **"Capture"** → O kare thumbnail olarak ayarlanır

---

### Dışa Aktarma

| Format | Açıklama |
|---|---|
| **⬇ WebM** | Ham kayıt dosyası — anında indir |
| **📹 MP4** | ffmpeg.wasm ile tarayıcıda dönüştür → indir |
| **🎞 GIF** | İlk 10 saniyeden 480×270px animasyonlu GIF oluştur |
| **🗜 Compress** | Hedef MB boyutu gir, kaliteyi koruyarak küçült |

---

### Paylaşım ve Dağıtım

| Yöntem | Açıklama |
|---|---|
| **☁ Upload** | Supabase'e yükle → paylaşılabilir link al |
| **📱 QR Kod** | Cloud URL'den QR kod oluştur, PNG olarak indir |
| **</> Embed** | iFrame / Link / Markdown kodu üret |
| **📤 Share** | Tarayıcı native paylaşım menüsü |
| **📧 Email** | Mailto linki açar, video bilgileri otomatik eklenir |
| **🐦 Tweet** | Twitter/X'te cloud linki paylaş |

#### 🎯 CTA (Call to Action) Butonu
Videoyu izleyen kişilere bir eylem yaptırın:
1. **"Etkileşim (CTA)"** butonuna tıklayın
2. **"Buton Metni"** kutusuna yazın → örn: `Demo Talebi`
3. **"Buton URL"** kutusuna link girin → örn: `calendly.com/siz`
4. **"Kaydet"** → Video oynatılırken izleyiciye büyük buton görünür

#### 🚀 Projeye Gönder (Jira / Trello / Webhook)
Önce Ayarlar → **Webhook** bölümüne URL girin, sonra:
1. **"🚀 Projeye Gönder"** butonuna tıklayın
2. **Görev Başlığı** ve **Notlar** girin
3. **"Webhook'a Gönder"** → JSON payload olarak iletilir

```json
{
  "video_title": "...",
  "video_duration": 180,
  "ai_summary": "...",
  "key_points": [...],
  "created_at": "...",
  "task_title": "...",
  "notes": "..."
}
```

---

### AI Özellikleri

> **Gereklilik:** ⚙️ Ayarlar → OpenAI API Anahtarı girilmiş olmalı.

Video oynatıcıda **"✨ AI Summary"** sekmesine tıklayın → **"Generate"** butonuna basın:

| Çıktı | Açıklama |
|---|---|
| **📝 AI Özeti** | 4–5 cümlelik profesyonel özet |
| **📌 Önemli Noktalar** | 5–8 maddelik bullet-list, sunuma kopyalanabilir |
| **📧 Satış E-posta Taslağı** | Konu satırı dahil profesyonel email taslağı |
| **📚 Wiki / Notion Belgesi** | Başlıklı, formatlanmış Markdown doküman |

---

### Yorumlar ve Reaksiyonlar

#### 💬 Zaman Damgalı Yorumlar
1. Video oynatılırken istediğiniz saniyede durdurun
2. **"Comments"** sekmesinde emoji seçin ve metin girin
3. **"Yorum Ekle"** → O saniyeye zaman damgası ile kaydedilir
4. Yoruma tıklayınca video o noktaya atlar

#### 📹 Video Reaksiyon Bırakma (Async)
1. Video oynatılırken istediğiniz **saniyede durdurun**
2. **"⊕ Reaksiyon Ekle"** butonuna tıklayın
3. Kamera açılır → **Maksimum 10 saniye** video yanıt kaydedin
4. **"Bitir"** → Reaksiyon o zaman damgasına bağlanır

---

### Analitik (Isı Haritası)

**"📊 Analytics"** sekmesine tıklayın:
- **🔴 Kırmızı/Turuncu çubuklar** → İzleyicinin en çok dikkat ettiği bölgeler
- **🔵 Mavi/Mor çubuklar** → Dikkat dağılan veya atlanan bölgeler
- **Çubuğa tıklarsanız:** Video o noktaya atlar

---

### Güvenlik Sekmesi

**"🛡️ Security"** sekmesinde:
- **⏰ Otomatik İmha:** Paylaşımdan 24 saat / 7 gün / 30 gün sonra sil
- **🔒 Şifreli Erişim:** Link açılırken izleyiciden şifre iste

---

## 14. ⚙️ Ayarlar Sayfası

Sağ üstteki ⚙️ ikonuna veya `/settings` adresine gidin.

*Şekil 5: Ayarlar sayfası — Tema, Markalama ve Klavye Kısayolları bölümleri*

*Şekil 6: Ayarlar sayfası — AI Summary, Cloud Storage (Supabase), Webhook, Backup & Restore bölümleri*

### 🌗 Tema
- **Dark** (varsayılan) / **Light** — Koyu veya açık arayüz modu

### 🎨 Markalama (Brand Customization)
- **Marka Rengi** (Hex kodu) — CTA butonları ve vurgularda kullanılır, örn: `#7c3aed`
- **Firma Logo URL** — Şirket logo URL'si

### 🤖 AI Summary (OpenAI)
1. [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → Yeni API anahtarı oluşturun
2. `sk-...` ile başlayan anahtarı alın
3. Ayarlar → **AI Summary** kutusuna yapıştırın → **"Save"**

### ☁️ Cloud Storage (Supabase)
1. [supabase.com](https://supabase.com) → Ücretsiz hesap açın ve proje oluşturun
2. Storage → `recordings` adlı bucket oluşturun → **Public** yapın
3. Proje ayarlarından **URL** ve **Anon Key** kopyalayın
4. ScreenSnap Ayarlar → Cloud Storage bölümüne girin

### 🚀 Webhook (Projeye Gönder)
- Zapier, Make, n8n, Jira veya Trello webhook URL'nizi girin
- Artık video oynatıcıdan tek tıkla proje platformuna gönderebilirsiniz

### 📦 Backup & Restore
- **Export ZIP** → Tüm kayıtları tek ZIP dosyasında indirir
- **Import ZIP** → Yedek ZIP'ten kayıtları geri yükler

> ⚠️ **Önemli:** Veriler tarayıcının IndexedDB deposunda saklanır. "Tarayıcı verilerini temizle" yaparsanız silinir — düzenli ZIP yedeği alın!

---

## 15. 📖 Uygulama İçi Kılavuz Sayfası

Header'daki **📖 kitap ikonuna** tıklayarak `/guide` sayfasına ulaşın.

*Şekil 7: Kılavuz sayfası — Hero bölümü, Hızlı Başlangıç (8 Adım) ve akordeon bölümler*

*Şekil 8: "🚀 İlk Kaydını Al" akordeon bölümü genişletilmiş hali — 6 adımlı rehber*

### Kılavuz Sayfasının Akordeon Bölümleri

| Bölüm | İçerik |
|---|---|
| 🚀 İlk Kaydını Al | 6 adımlı başlangıç rehberi |
| ⚙️ Kayıt Seçenekleri | Tüm toggle ve ayarların açıklaması |
| 🎬 Kayıt Sırasında | Draw, Chapter, Go Live, Pause/Resume |
| 📤 Paylaşım Yöntemleri | WebM/MP4, GIF, Cloud, QR, Embed |
| 📡 Canlı Yayın | 4 adımlı Go Live rehberi |
| ✨ AI Özet | API anahtarı kurulumu ve kullanımı |
| 📦 Yedekleme & Geri Yükleme | ZIP export/import |
| ⌨️ Klavye Kısayolları | Tüm kısayol listesi |
| ❓ Sık Sorulan Sorular | En yaygın 6 sorun ve çözüm |

---

## 16. ⌨️ Klavye Kısayolları

| Kısayol | Eylem |
|---|---|
| `Ctrl+Shift+R` | Kaydı Başlat / Durdur |
| `Ctrl+Shift+P` | Kaydı Duraklat / Devam Ettir |
| `Ctrl+Shift+D` | Çizim Modunu Aç/Kapat |
| `Escape` | Kaydı İptal Et (kaydetmez) |

---

## 17. 🔧 Sık Karşılaşılan Sorunlar

### "Kayıt başlamıyor"
- Tarayıcının mikrofon ve ekran kaydı iznini verdiğinden emin olun
- `chrome://settings/content/microphone` adresinden izinleri kontrol edin
- Chrome/Brave/Edge'de çalışır; Firefox'ta kısıtlamalar olabilir

### "Ses kaydedilmiyor"
- **Microphone** toggle'ının mor (aktif) olduğunu kontrol edin
- Sistem sesini istiyorsanız **System Audio** toggle'ını açın
- Başka bir uygulama (Zoom, Teams) mikrofonu kullanıyor olabilir → kapatın

### "Kamera görünmüyor"
- Başka bir uygulama kamerayı monopolize etmiş olabilir → kapatın
- **Webcam** toggle'ının açık olduğunu doğrulayın

### "AI özeti çalışmıyor"
- Ayarlar → **AI Summary** bölümünde OpenAI API anahtarı girildi mi?
- Transcript bulunmayan videolar özetlenemez → Advanced Settings → **Transcript** toggle açık kaydedin

### "Sihirli Kırpıcı çok kısa video oluşturdu"
- Doğal konuşma temposu kullanın
- Gürültülü ortamdaysa **Stüdyo Sesi** toggle ile tekrar çekin

### "Cloud upload çalışmıyor"
- Ayarlar → Supabase URL ve Anon Key doğru girildi mi?
- Supabase bucket'ın **Public** olduğunu doğrulayın

### "Sayfa açılmıyor / Internal Server Error"
- `F5` ile sayfayı yenileyin
- `Ctrl+Shift+Del` → Cache ve çerezleri temizleyin
- Farklı tarayıcı deneyin (Chrome ya da Brave önerilir)

### "Konuk bağlanamıyor"
- Host'un kaydı aktif ve **Konuk** paneli açık olmalı
- Konuk Chrome veya Edge kullanmalı (Firefox WebRTC'de sorun çıkarabilir)
- Aynı ağdaysanız doğrudan bağlanır; farklı ağdaysanız PeerJS STUN sunucuları devreye girer
- Şirket VPN veya kurumsal güvenlik duvarı P2P bağlantısını engelleyebilir

---

## 📝 Destek ve Geliştirme

Bu uygulama açık kaynak kodlu ve geliştirmeye açıktır.

**Teknik Altyapı:**

| Teknoloji | Kullanım Amacı |
|---|---|
| Next.js 15 + React | Frontend framework |
| TypeScript | Tip güvenliği |
| MediaRecorder API | Ekran & ses kaydı |
| Web Speech API | Gerçek zamanlı transcript |
| ffmpeg.wasm | Tarayıcıda MP4 dönüşümü (sunucu yok) |
| modern-gif | GIF export |
| IndexedDB | Yerel video depolama |
| PeerJS (WebRTC) | Tarayıcıdan tarayıcıya canlı yayın & konuk sistemi |
| Supabase | Cloud depolama (opsiyonel) |
| OpenAI GPT-4o | AI özet ve doküman üretimi |
| Netlify | Hosting ve deployment |

---

*Bu kılavuz ScreenSnap v2.0 Enterprise için hazırlanmıştır. Ekibinizle paylaşabilirsiniz.*
