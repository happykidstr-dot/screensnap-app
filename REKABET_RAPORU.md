# ScreenSnap vs Loom: Kapsamlı Rekabet ve Özellik Raporu

ScreenSnap uygulamasının geliştirilmesi boyunca, piyasanın lideri olan Loom'un ötesine geçmeyi amaçlayan yepyeni bir mimari inşa edildi. Bu rapor, ekibinizin yapacağı detaylı incelemeler için her iki platformun Güçlü/Zayıf yönlerini ve sahip oldukları/olmadıkları özellikleri özetlemektedir.

---

## 🏆 1. ScreenSnap'te Olup Loom'da OLMAYAN Özellikler (Avantajlarımız)

ScreenSnap, bir tarayıcı uygulaması olarak Loom'un "Enterprise" masaüstü özelliklerini dahi geride bırakan devasa pratik yeteneklere sahiptir:

1. **📜 Entegre Şeffaf Teleprompter (Akıllı Okuyucu):**
   - **Loom:** Bir metni okumak zorundaysanız, not defterini ekranın kenarına sıkıştırıp oradan okumaya çalışırsınız ki bu, göz kontaktını bozar.
   - **ScreenSnap:** Doğrudan kayıt arayüzüne entegre edilen, ekranın altında şeffaf olarak asılı duran ve kaydı başlattığınız an kameraya bakarken otomatik kayan bir *Teleprompter* içerir. Pazarlama ve satış sunumları için oyun değiştiricidir.

2. **🚀 Projeye Gönder (Jira / Webhook Entegrasyonu):**
   - **Loom:** Sadece videonun linkini kopyalar, Jira'ya gidip manuel yapıştırırsınız. Ekstra eklenti gerektirir.
   - **ScreenSnap:** Video modalındaki "🚀 Projeye Gönder" butonuyla, videoyu ve Yapay Zeka özetini **tek tıkla** Zapier, Jira, Trello gibi tüm platformlara bilet (task) olarak anında pushlar.

3. **✨ Yapay Zeka Dokümantasyon Çevirmeni (Video-to-Wiki):**
   - **Loom:** AI ile sadece kısa özet ve başlıklar çıkarır.
   - **ScreenSnap:** AI ile yalnızca özet yazmakla kalmaz; o videodan adım adım bir kullanım kılavuzu oluşturur ve bunu kopyalanabilir tam bir **Şirket Dokümantasyonu (Notion/Confluence makalesi)** olarak kullanıma sunar.

4. **✨ Canlı Sunum Modu (İçerik İçi Çizim):**
   - **Loom:** Ekranınızı çekersiniz. Çizim araçları için ücretli pakete geçmelisiniz.
   - **ScreenSnap:** Doğrudan uygulamanın içine bir PDF veya Web URL'si yükleyebilirsiniz. Sizi program dışına itmeden içeriği açar ve üzerine akıllı kalem aracıyla (Draw Overlay) canlı çizim yaparak sunum yapmanızı sağlar.

5. **✨ Sihirli Kırpıcı (Offline Magic Cut):**
   - **Loom:** Bekleme anlarını (sessizlikleri) otomatik kesmek (Magic Cut) için videoyu devasa bulut sunucularına yollar, işlemesi dakikalar sürer.
   - **ScreenSnap:** Web Audio API ile lokalde, kullanıcının bilgisayarının gücünü kullanarak saniyeler içinde sessiz anları bulup anında "Trim" eder (Offline AI Processing konsepti).

6. **🛠️ Kişiselleştirme (Variables):**
   - **Loom:** Yok.
   - **ScreenSnap:** Kayıt sonrasında videonun içine izleyicinin ismini veya şirket adını "*Merhaba [Ziyaretçi_Adı], bu video sana özel!*" şeklinde basan bir değişken (Variable) katmanı sunar.

7. **Local-First ve Gizlilik (Sıfır Sunucu Maliyeti):**
   - **Loom:** Çekilen her videoyu kendi sunucularına yüklemeye zorlar.
   - **ScreenSnap:** Videoları kullanıcının kendi tarayıcısında (IndexedDB) yerel olarak tutar. Kullanıcı "Cloud" butonuna basmadığı veya link istemediği sürece video asla internete düşmez.

---

## ⚖️ 2. Loom'da Olup ScreenSnap'te OLAN Ortak Özellikler

Uygulamamız Loom'un temel işlevselliğinin tamamını barındıracak kapasiteye ulaştı:
*   **Video Kesme & Kırpma (Trim Editor)**
*   **Farklı Kamera Şekilleri (Yuvarlak, Kare, Dikdörtgen webcam)**
*   **Aksiyon Butonları (Call-To-Action / CTA Yönlendirmeleri)**
*   **Video Bölümleri ve İşaretleyiciler (Live Chapters)**
*   **Otomatik GIF ve Thumbnail Yaratma**
*   **Bulut Paylaşım (Supabase Cloud Link & QR Kod)**
*   **Ses İzolasyonu (Stüdyo Sesi / Noise Suppression Constraints)**
*   **Ekip Klasörleme / Çalışma Alanları Ağacı (Workspace Sidebar)**

---

## 🚧 3. Loom'da Olup Bizde Mükemmel/Eksik Olan veya Geliştirilebilecek Özellikler (Roadmap Dağarcığı)

Her ne kadar inanılmaz güçlü olsak da "Loom Enterprise" seviyesi trilyon dolarlık bir ekosistemdir. Şu özellikler Loom'da native/gerçekçi iken bizde Mock (Tasarım/Vizyon) aşamasındadır:

1. **İleri Düzey İzlenme Analitiği (Heatmaps & Viewer Tracks):**
   - **Loom:** Videoyu kimin (hangi mail) yüzde kaçına kadar izlediğini, saniye saniye sunucudan analiz edip gönderir.
   - **Bizdeki Durum:** Etkileşim Isı Haritası (Heatmap) arayüzümüz görsel ve konsept olarak mevcuttur ancak şu anda gerçek zamanlı veri toplamak için arkada çalışan 7/24 bir Node.js websocket sunucusu yoktur. İleride Bulut entegrasyonuna bağlanarak canlıya alınır.

2. **Gelişmiş SSO, Azure AD & Güvenlik Kilidi:**
   - **Loom:** Okta veya Microsoft Azure AD ile bağlanılmış kurumsal e-posta ile giriş kısıtlamaları barındırır.
   - **Bizdeki Durum:** Şifreli kilit ve Otomatik İmha (Retention) arayüzümüz tasarlandı. Ancak bunun tam çalışması için şirketlerin Active Directory altyapılarına (SAML/SSO API) backend bağlanması gerekir.

3. **Masaüstü (Desktop) Donanım Gücü (PIP System):**
   - **Loom:** Masaüstüne indirilen (Mac/Windows exe) uygulaması bulunur. Bu sayede tarayıcı kapansa da sistemin her yerinde ekranın köşesinde kalabilir (Picture-in-picture / Borderless Window).
   - **Bizdeki Durum:** Yalnızca tarayıcı (Brave, Chrome, Safari) üzerinden çalışır. Web API'leri çok gelişse de tamamen başka bir programa (örn: Excel) geçtiğinizde kameramızın kutusu Excel'in *en üstünde* havada asılı kalamayabilir (Bunun için modern Chromium PIP API'leri mevcuttur ancak native bir *.exe* kadar özgür değildir).

4. **Gerçek Zamanlı Otomatik Diller Arası Altyazı Desteği (Live Captions & Translation):**
   - **Loom:** Video oynatılırken otomatik altyazıyı İspanyolca kaydedip Fransızcaya anlık çevirebilir.
   - **Bizdeki Durum:** Altyazı (Transcript) özelliğimiz Web Speech API tabanlıdır ve dili algılayıp İngilizce/Türkçe döker, ancak eşzamanlı izleyiciye 8 ayrı dilde otomatik dublaj atma veya subtitle basımı gibi kompleks video render servislerimiz henüz yoktur.

---

## 🎯 Sonuç: Şirket İçi Sunum Özeti

**ScreenSnap**, "Mevcut Loom özelliklerini kopyalamakla" kalmamış, Loom'un çok can sıkan hantallıklarını veya eksiklerini (Teleprompter olmaması, videoların sürekli buluta gitme derdi, Jira/Webhook yetersizliği) bir avantaj olarak lehine çevirmiştir.

Güncel durumda ekibinize şunu rahatlıkla söyleyebilirsiniz:
> *"Loom, harika bir Cloud-Video deposudur. Fakat ScreenSnap; Satış, Dokümantasyon, Yapay Zeka analizleri ve Canlı Sunum yapmayı tek ekranda toplayan daha zeki bir Medya/Stüdyo işletim sistemidir."*
