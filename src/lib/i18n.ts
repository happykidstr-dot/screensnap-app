// ─── ScreenSnap i18n System ──────────────────────────────────────────────────
// Supports: Turkish (tr) and English (en)

export type Lang = 'tr' | 'en';

const STORAGE_KEY = 'screensnap_lang';

export function getSavedLang(): Lang {
  if (typeof window === 'undefined') return 'tr';
  return (localStorage.getItem(STORAGE_KEY) as Lang) || 'tr';
}

export function saveLang(lang: Lang) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
}

export const translations = {
  // ─── Header ─────────────────────────────────────────────────────
  teleprompter: { tr: 'Teleprompter', en: 'Teleprompter' },
  guide: { tr: 'Kullanım Kılavuzu', en: 'User Guide' },
  screenshot: { tr: 'Ekran Görüntüsü Al', en: 'Take Screenshot' },
  settings: { tr: 'Ayarlar', en: 'Settings' },
  recording: { tr: 'KAYIT', en: 'REC' },
  paused: { tr: 'DURAKLATILDI', en: 'PAUSED' },
  draw: { tr: 'Çiz', en: 'Draw' },
  drawing: { tr: 'Çizim', en: 'Drawing' },
  goLive: { tr: 'Canlı Yayın', en: 'Go Live' },
  guest: { tr: 'Konuk', en: 'Guest' },
  processing: { tr: 'İşleniyor…', en: 'Processing…' },

  // ─── Enterprise Sidebar ─────────────────────────────────────────
  myNetwork: { tr: 'Şirket Ağım', en: 'My Network' },
  enterprise: { tr: 'Enterprise', en: 'Enterprise' },
  workspaces: { tr: 'Çalışma Alanları', en: 'Workspaces' },
  newWorkspace: { tr: 'Yeni Alan Oluştur', en: 'Create Workspace' },
  allVideos: { tr: 'Tüm Videolar', en: 'All Videos' },
  ssoSecurity: { tr: 'SSO & Güvenlik', en: 'SSO & Security' },
  ssoDesc: { tr: 'Ekibinizin videoları uçtan uca şifrelenmiştir. Video içi güvenlikten izinleri ayarlayabilirsiniz.', en: 'Your team\'s videos are end-to-end encrypted. You can manage permissions from in-video security.' },

  // ─── Record Panel ───────────────────────────────────────────────
  recordScreen: { tr: 'Ekranı Kaydet', en: 'Record Screen' },
  audioRecording: { tr: 'Sadece Ses Kaydı', en: 'Audio Only Recording' },
  webcamRecording: { tr: 'Webcam Kaydı', en: 'Webcam Recording' },
  recordingActive: { tr: '🔴 Kayıt Devam Ediyor', en: '🔴 Recording in Progress' },
  recordingPaused: { tr: '⏸ Kayıt Duraklatıldı', en: '⏸ Recording Paused' },
  configureAndStart: { tr: "Ayarları yapın ve Başlat'a basın. Kısayol: Ctrl+Shift+R", en: 'Configure settings and press Start. Shortcut: Ctrl+Shift+R' },
  resumeOrStop: { tr: 'Devam et veya durdur ve kaydet.', en: 'Resume or stop and save.' },
  cameraRecording: { tr: 'Kamera kaydediliyor — aşağıdaki Stop & Save ile bitirin.', en: 'Camera recording — finish with Stop & Save below.' },
  switchToWindow: { tr: 'Kaydetmek istediğiniz pencereye geçin.', en: 'Switch to the window you want to record.' },
  isRecording: { tr: 'KAYIT EDİYOR', en: 'RECORDING' },
  stopHint: { tr: 'Durdurmak için aşağıdaki <strong>Stop & Save</strong> butonuna basın', en: 'Press the <strong>Stop & Save</strong> button below to stop' },

  // ─── Mode buttons ───────────────────────────────────────────────
  screen: { tr: 'Ekran', en: 'Screen' },
  webcam: { tr: 'Webcam', en: 'Webcam' },
  audioOnly: { tr: 'Sadece Ses', en: 'Audio Only' },
  microphone: { tr: 'Mikrofon', en: 'Microphone' },
  systemAudio: { tr: 'Sistem Sesi', en: 'System Audio' },
  systemAudioHint: { tr: 'Ekran paylaşırken\n"Ses paylaş" ✓ seçin', en: 'When sharing screen\ncheck "Share audio" ✓' },

  // ─── Logo & KJ ─────────────────────────────────────────────────
  logo: { tr: 'Logo', en: 'Logo' },
  noLogo: { tr: 'Logo yok', en: 'No logo' },
  upload: { tr: 'Yükle', en: 'Upload' },
  size: { tr: 'Boyut', en: 'Size' },
  kjSubtitle: { tr: 'KJ Alt Yazı', en: 'KJ Subtitle' },
  kjHint: { tr: 'İsim ve ünvan gir → kayıt sırasında ekranda görünür', en: 'Enter name and title → shown on screen during recording' },
  nameLine1: { tr: 'Ad Soyad (Satır 1)', en: 'Full Name (Line 1)' },
  titleLine2: { tr: 'Ünvan / Şirket (Satır 2 — opsiyonel)', en: 'Title / Company (Line 2 — optional)' },

  // ─── Broadcast ──────────────────────────────────────────────────
  broadcastWebTV: { tr: '📡 Broadcast / Web TV', en: '📡 Broadcast / Web TV' },
  scene: { tr: 'Sahne', en: 'Scene' },
  sceneScreen: { tr: '🖥️ Ekran', en: '🖥️ Screen' },
  sceneCamPip: { tr: '🎙️ Kamera+PIP', en: '🎙️ Camera+PIP' },
  sceneCamOnly: { tr: '🎥 Sadece Cam', en: '🎥 Cam Only' },
  sceneIntro: { tr: '🎬 Intro Kartı', en: '🎬 Intro Card' },
  introTitle: { tr: 'Başlık (örn: Canlı Yayın Başlıyor)', en: 'Title (e.g. Going Live)' },
  introSubtitle: { tr: 'Alt başlık (opsiyonel)', en: 'Subtitle (optional)' },
  studioBackground: { tr: '🎨 Stüdyo Arka Planı', en: '🎨 Studio Background' },
  remove: { tr: 'Kaldır', en: 'Remove' },
  virtualStudio: { tr: '🟩 Sanal Stüdyo', en: '🟩 Virtual Studio' },
  virtualStudioDesc: { tr: 'AI ile gerçek arka planını kaldır, stüdyoda oturuyormuş gibi görün', en: 'Remove real background with AI, look like you\'re in a studio' },
  virtualStudioLoadHint: { tr: 'Kayıt başlayınca AI modeli yüklenir (~3-5sn).', en: 'AI model loads when recording starts (~3-5s).' },
  live: { tr: 'CANLI', en: 'LIVE' },
  clock: { tr: 'Saat', en: 'Clock' },
  externalChannels: { tr: '📡 Harici Kanallar', en: '📡 External Channels' },
  externalChannelsHint: { tr: 'Seçilen uygulama penceresi (Zoom, Meet, Teams…) doğrudan yayın sahnesine kaynak olarak eklenir.', en: 'Selected app window (Zoom, Meet, Teams…) is added as a source to the broadcast scene.' },
  newsBand: { tr: '📰 Haber Bandı', en: '📰 News Ticker' },
  speed: { tr: 'Hız', en: 'Speed' },
  tickerPlaceholder: { tr: 'Kayan yazı metni...', en: 'Scrolling text content...' },
  advancedSettings: { tr: 'Gelişmiş ayarlar', en: 'Advanced settings' },

  // ─── Audio Mixer ────────────────────────────────────────────────
  audioMixer: { tr: '🎚️ Ses Mikseri', en: '🎚️ Audio Mixer' },
  micLabel: { tr: '🎙 Mikrofon', en: '🎙 Microphone' },
  systemLabel: { tr: '🖥 Sistem', en: '🖥 System' },
  systemAudioScreenOnly: { tr: 'Sistem sesi sadece <strong>Ekran</strong> modunda çalışır. Bu modda sadece mikrofon kaydedilir.', en: 'System audio only works in <strong>Screen</strong> mode. Only microphone is recorded in this mode.' },
  enableMicOrSystem: { tr: 'Mikrofon veya sistem sesini etkinleştirin.', en: 'Enable microphone or system audio.' },

  // ─── Color Grading ─────────────────────────────────────────────
  colorGrading: { tr: '🎨 Renk & Parlaklık', en: '🎨 Color & Brightness' },
  brightness: { tr: '☀️ Parlaklık', en: '☀️ Brightness' },
  contrast: { tr: '◑ Kontrast', en: '◑ Contrast' },
  saturation: { tr: '🎨 Doygunluk', en: '🎨 Saturation' },

  // ─── Scoreboard ─────────────────────────────────────────────────
  scoreboard: { tr: '🏆 Skor Tablosu', en: '🏆 Scoreboard' },
  homeTeam: { tr: 'EV TAKIMI', en: 'HOME TEAM' },
  awayTeam: { tr: 'MİSAFİR', en: 'AWAY' },
  color: { tr: 'Renk', en: 'Color' },

  // ─── Action Buttons ─────────────────────────────────────────────
  startRecording: { tr: 'Kaydı Başlat', en: 'Start Recording' },
  startRecordingAudio: { tr: 'Ses Kaydını Başlat', en: 'Start Audio Recording' },
  presentationMode: { tr: '🌐 Sunum Modu Yükle', en: '🌐 Load Presentation' },
  stopAndSave: { tr: '⏹ DURDUR & KAYDET', en: '⏹ STOP & SAVE' },
  pause: { tr: 'Duraklat', en: 'Pause' },
  cancel: { tr: 'İptal', en: 'Cancel' },
  resume: { tr: 'Devam Et', en: 'Resume' },
  exitSite: { tr: 'Siteden Çık', en: 'Exit Site' },

  // ─── Video Library ──────────────────────────────────────────────
  myRecordings: { tr: 'Kayıtlarım', en: 'My Recordings' },
  search: { tr: 'Ara…', en: 'Search…' },
  noRecordings: { tr: 'Henüz kayıt yok.', en: 'No recordings yet.' },
  noMatch: { tr: 'Eşleşen kayıt yok.', en: 'No recordings match.' },
  clearFilters: { tr: 'Filtreleri Temizle', en: 'Clear Filters' },
  deleteConfirm: { tr: 'Bu kaydı silmek istediğinize emin misiniz?', en: 'Are you sure you want to delete this recording?' },

  // ─── Save Dialog ────────────────────────────────────────────────
  saveRecording: { tr: '💾 Kaydı Kaydet', en: '💾 Save Recording' },
  saveDesc: { tr: 'Kaydetmeden önce kaydınıza isim verin.', en: 'Name your recording before saving.' },
  title: { tr: 'Başlık', en: 'Title' },
  tags: { tr: 'Etiketler', en: 'Tags' },
  folder: { tr: 'Klasör', en: 'Folder' },
  noFolder: { tr: 'Klasör yok', en: 'No folder' },
  discard: { tr: 'Sil', en: 'Discard' },
  save: { tr: 'Kaydı Kaydet', en: 'Save Recording' },

  // ─── Guest Panel ────────────────────────────────────────────────
  guestInvite: { tr: '👥 Konuk Davet Et', en: '👥 Invite Guests' },
  maxGuests: { tr: 'Maks. 4 konuk • WebRTC P2P', en: 'Max 4 guests • WebRTC P2P' },
  connected: { tr: 'Bağlı', en: 'Connected' },
  guestLink: { tr: '📎 Konuk Davet Linki', en: '📎 Guest Invite Link' },
  copied: { tr: '✅ Kopyalandı', en: '✅ Copied' },
  copy: { tr: '📋 Kopyala', en: '📋 Copy' },
  guestLinkHint: { tr: 'Bu linki konuklara gönderin. Herkese aynı link gönderilir.', en: 'Send this link to guests. Same link for everyone.' },
  connectedGuests: { tr: '🟢 Bağlı Konuklar', en: '🟢 Connected Guests' },
  guestHint: { tr: 'Konukların görüntüsü kayıt sırasında ekranın altında grid olarak görünür.', en: 'Guest feeds appear as a grid at the bottom during recording.' },
  noGuests: { tr: 'Henüz bağlı konuk yok.', en: 'No connected guests yet.' },
  shareLink: { tr: 'Linki paylaşın, bağlandıklarında burada görünecekler.', en: 'Share the link, they will appear here when connected.' },
  addExternalChannel: { tr: '📡 Harici Kanal Ekle', en: '📡 Add External Channel' },
  closeRoom: { tr: 'Odayı Kapat', en: 'Close Room' },
  creatingRoom: { tr: 'Oda oluşturuluyor…', en: 'Creating room…' },

  // ─── Live Share ─────────────────────────────────────────────────
  youAreLive: { tr: 'Canlıdasınız!', en: "You're Live!" },
  shareLiveLink: { tr: 'Bu linki veya QR kodu izleyicilerle paylaşın:', en: 'Share this link or QR code with viewers:' },
  copyLink: { tr: 'Linki Kopyala', en: 'Copy Link' },
  continueRecording: { tr: 'Kayda Devam', en: 'Continue Recording' },
  stopLiveStream: { tr: 'Canlı Yayını Durdur', en: 'Stop Live Stream' },
  viewerWatching: { tr: 'izleyici izliyor', en: 'viewer watching' },
  viewersWatching: { tr: 'izleyici izliyor', en: 'viewers watching' },

  // ─── Countdown ──────────────────────────────────────────────────
  recordingIn: { tr: 'Kayıt başlıyor…', en: 'Recording in…' },

  // ─── Presentation Mode Dialog ───────────────────────────────────
  presentationTitle: { tr: 'Sunum Modu: İçerik Yükle', en: 'Presentation Mode: Load Content' },
  presentationDesc: { tr: 'Sunum yapmak için bir Web Sitesi adresi girin veya bilgisayarınızdan bir PDF dosyası seçin.', en: 'Enter a website URL or select a PDF file from your computer to present.' },
  optionWebsite: { tr: 'Seçenek 1: Web Sitesi', en: 'Option 1: Website' },
  optionUpload: { tr: 'Seçenek 2: Belge Yükle (PDF/Resim)', en: 'Option 2: Upload Document (PDF/Image)' },
  selectFile: { tr: 'Bilgisayardan Dosya Seç', en: 'Select File from Computer' },
  pptHint: { tr: 'PowerPoint kullanmak isterseniz önce PDF\'e çevirip yükleyebilirsiniz.', en: 'To use PowerPoint, convert to PDF first then upload.' },
  open: { tr: 'Aç', en: 'Open' },
  or: { tr: 'VEYA', en: 'OR' },

  // ─── Presets ────────────────────────────────────────────────────
  presets: { tr: '💾 Kayıt Şablonları', en: '💾 Recording Presets' },
  savePreset: { tr: 'Şablon Kaydet', en: 'Save Preset' },
  loadPreset: { tr: 'Şablon Yükle', en: 'Load Preset' },
  deletePreset: { tr: 'Şablonu Sil', en: 'Delete Preset' },
  presetName: { tr: 'Şablon Adı', en: 'Preset Name' },
  presetSaved: { tr: 'Şablon kaydedildi!', en: 'Preset saved!' },
  presetLoaded: { tr: 'Şablon yüklendi!', en: 'Preset loaded!' },
  noPresets: { tr: 'Henüz şablon yok.', en: 'No presets yet.' },
  builtInPresets: { tr: 'Hazır Şablonlar', en: 'Built-in Presets' },
  customPresets: { tr: 'Özel Şablonlar', en: 'Custom Presets' },

  // ─── Analytics ──────────────────────────────────────────────────
  analytics: { tr: '📊 Analitik', en: '📊 Analytics' },
  totalRecordings: { tr: 'Toplam Kayıt', en: 'Total Recordings' },
  totalDuration: { tr: 'Toplam Süre', en: 'Total Duration' },
  totalStorage: { tr: 'Toplam Depolama', en: 'Total Storage' },
  avgDuration: { tr: 'Ort. Süre', en: 'Avg. Duration' },
  thisWeek: { tr: 'Bu Hafta', en: 'This Week' },
  thisMonth: { tr: 'Bu Ay', en: 'This Month' },
  allTime: { tr: 'Tüm Zamanlar', en: 'All Time' },
  recordingActivity: { tr: 'Kayıt Aktivitesi', en: 'Recording Activity' },
  storageUsage: { tr: 'Depolama Kullanımı', en: 'Storage Usage' },
  topTags: { tr: 'En Çok Kullanılan Etiketler', en: 'Most Used Tags' },
  recentActivity: { tr: 'Son Aktivite', en: 'Recent Activity' },

  // ─── Batch Operations ───────────────────────────────────────────
  selectAll: { tr: 'Tümünü Seç', en: 'Select All' },
  deselectAll: { tr: 'Seçimi Kaldır', en: 'Deselect All' },
  selected: { tr: 'seçildi', en: 'selected' },
  batchDelete: { tr: 'Toplu Sil', en: 'Batch Delete' },
  batchExport: { tr: 'Toplu İndir', en: 'Batch Export' },
  batchMove: { tr: 'Taşı', en: 'Move' },
  batchTag: { tr: 'Etiketle', en: 'Tag' },
  confirmBatchDelete: { tr: 'Seçili kayıtları silmek istediğinize emin misiniz?', en: 'Are you sure you want to delete selected recordings?' },

  // ─── Share ──────────────────────────────────────────────────────
  share: { tr: 'Paylaş', en: 'Share' },
  shareVideo: { tr: 'Videoyu Paylaş', en: 'Share Video' },
  shareLink2: { tr: 'Paylaşım Linki', en: 'Share Link' },
  embedCode: { tr: 'Embed Kodu', en: 'Embed Code' },
  passwordProtect: { tr: '🔒 Şifre Koruması', en: '🔒 Password Protection' },
  setPassword: { tr: 'Şifre Belirle', en: 'Set Password' },
  expiresIn: { tr: 'Son Kullanma', en: 'Expires In' },
  never: { tr: 'Asla', en: 'Never' },
  hours24: { tr: '24 Saat', en: '24 Hours' },
  days7: { tr: '7 Gün', en: '7 Days' },
  days30: { tr: '30 Gün', en: '30 Days' },

  // ─── AI Features ────────────────────────────────────────────────
  aiAutoChapters: { tr: '🤖 Otomatik Bölümler', en: '🤖 Auto Chapters' },
  aiGenerating: { tr: 'AI bölümleri oluşturuluyor…', en: 'AI generating chapters…' },
  aiChaptersReady: { tr: 'Otomatik bölümler hazır!', en: 'Auto chapters ready!' },
  generateChapters: { tr: 'Bölümleri Oluştur', en: 'Generate Chapters' },

  // ─── PWA ────────────────────────────────────────────────────────
  installApp: { tr: 'Uygulamayı Yükle', en: 'Install App' },
  installDesc: { tr: 'ScreenSnap\'i masaüstünüze yükleyin, çevrimdışı kullanın.', en: 'Install ScreenSnap to your desktop, use offline.' },

  // ─── Misc ───────────────────────────────────────────────────────
  livePreview: { tr: '📺 Canlı Yayın Önizlemesi', en: '📺 Live Broadcast Preview' },
  liveCamPreview: { tr: '📷 Canlı Kamera Önizleme', en: '📷 Live Camera Preview' },
  aiReady: { tr: '✅ AI Hazır', en: '✅ AI Ready' },
  aiFailed: { tr: '❌ AI Yüklenemedi', en: '❌ AI Failed' },
  aiLoading: { tr: '⏳ AI Yükleniyor...', en: '⏳ AI Loading...' },
  activeWindowSources: { tr: '🟢 Aktif Pencere Kaynakları', en: '🟢 Active Window Sources' },
  slot: { tr: 'slot', en: 'slot' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  return translations[key]?.[lang] ?? key;
}
