'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRecorder, formatDuration, formatBytes, Quality, WebcamShape, WebcamPosition, AspectRatio, SaveInfo } from '@/hooks/useRecorder';
import { FRAME_OPTIONS, FrameStyle, drawFrame, KJ_STYLE_OPTIONS, KJ_POSITION_OPTIONS, KJStyle, KJPosition, drawKJ } from '@/lib/videoFrame';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLiveShare } from '@/hooks/useLiveShare';
import { useGuestRoom } from '@/hooks/useGuestRoom';
import { getAllVideos, deleteVideo, VideoRecord, getAllFolders, updateVideoFolder, updateVideoTags } from '@/lib/db';
import { Lang, t, getSavedLang, saveLang } from '@/lib/i18n';
import { RecordingPreset } from '@/lib/presets';
import AudioVisualizer from '@/components/AudioVisualizer';
import DrawOverlay from '@/components/DrawOverlay';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import MouseKeyOverlay from '@/components/MouseKeyOverlay';
import ChapterRecorder, { Chapter } from '@/components/ChapterRecorder';
import FloatingRecordBar from '@/components/FloatingRecordBar';
import CamPreview from '@/components/CamPreview';
import ScreenshotModal from '@/components/ScreenshotModal';
import Teleprompter from '@/components/Teleprompter';
import VirtualBgPicker from '@/components/VirtualBgPicker';
import LanguageToggle from '@/components/LanguageToggle';
import PresetManager from '@/components/PresetManager';
import BatchToolbar from '@/components/BatchToolbar';
import SignLanguagePanel from '@/components/SignLanguagePanel';
import SignLanguageAvatar from '@/components/SignLanguageAvatar';
import ShareModal from '@/components/ShareModal';
import LiveCaptions from '@/components/LiveCaptions';
import LiveMonitor from '@/components/LiveMonitor';
import SaveDialog from '@/components/SaveDialog';
import { LibrarySection } from '@/components/LibrarySection';
import { RecorderSection } from '@/components/RecorderSection';
import {
  Monitor, Camera, Mic, MicOff, CameraOff, MonitorOff,
  Square, Pause, Play, Circle, Trash2, Clock,
  HardDrive, LayoutGrid, Video, Search, Tag, PenLine, X,
  ChevronDown, Zap, Settings, Folder, FolderPlus, Headphones,
  AudioLines, Mouse, Keyboard, Timer, Radio, Wifi, WifiOff, Users, BookOpen, Camera as CameraIcon, FileText,
  Hash, ShieldAlert, Building2, BarChart3, Download, CheckSquare, Share2
} from 'lucide-react';
import { toast } from '@/components/Toast';
import Link from 'next/link';

// ─── Save Dialog Bridge ──────────────────────────────────────────────────────
function useSaveDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const resolverRef = useRef<((info: SaveInfo | null) => void) | null>(null);

  const requestTitle = useCallback((): Promise<SaveInfo | null> => {
    return new Promise(resolve => { resolverRef.current = resolve; setIsOpen(true); });
  }, []);

  const confirm = (title: string, tags: string[], folder?: string) => {
    resolverRef.current?.({ title, tags, folder }); resolverRef.current = null; setIsOpen(false);
  };
  const discard = () => { resolverRef.current?.(null); resolverRef.current = null; setIsOpen(false); };
  return { isOpen, requestTitle, confirm, discard };
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const saveDialog = useSaveDialog();
  const [showGuestPanel, setShowGuestPanel] = useState(false);
  const [copiedGuestLink, setCopiedGuestLink] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const [lastFinalTranscript, setLastFinalTranscript] = useState('');
  // Ref to share live caption text with recorder canvas (burns into recorded video)
  const captionTextRef = useRef<string>('');
  
  // ─── i18n ───
  const [lang, setLang] = useState<Lang>('tr');
  useEffect(() => { setLang(getSavedLang()); }, []);
  const changeLang = (l: Lang) => { setLang(l); saveLang(l); };

  // ─── Presets ───
  const [showPresets, setShowPresets] = useState(false);

  // ─── Share ───
  const [shareVideo, setShareVideo] = useState<VideoRecord | null>(null);

  // ─── PWA Install ───
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as any).prompt();
    setShowInstallBanner(false);
  };

  // React state to hold the live composition stream so we can pass it to guests
  const [broadcastStream, setBroadcastStream] = useState<MediaStream | null>(null);

  const guestRoom = useGuestRoom(broadcastStream);

  const recorder = useRecorder({
    onRequestTitle: saveDialog.requestTitle,
    onSaved: () => { loadVideos(); toast('Kayıt kütüphaneye eklendi!', 'success'); },
    captionRef: captionTextRef,
    onDrawGuests: guestRoom.guests.length > 0
      ? (ctx, outW, outH) => {
          const margin = Math.round(Math.min(outW, outH) * 0.03);
          const gW = Math.round(outW * 0.25);
          const gH = outH - (margin * 2);
          guestRoom.drawGuestGrid(ctx, outW - gW - margin, margin, gW, gH);
        }
      : undefined,
  });

  // Sync recorder's live stream state to broadcastStream (for guest room)
  // recorder.liveStream is a proper React state, so this effect fires reliably
  useEffect(() => {
    setBroadcastStream(recorder.liveStream);
  }, [recorder.liveStream]);
  const liveShare = useLiveShare();

  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [liveChapters, setLiveChapters] = useState<Chapter[]>([]);
  const [showLiveQR, setShowLiveQR] = useState(false);
  const [screenshotData, setScreenshotData] = useState<ImageData | null>(null);
  const [screenshotSize, setScreenshotSize] = useState({ w: 0, h: 0 });
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [presentationUrl, setPresentationUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  // ─── Live Monitor (floating PiP-like preview during recording) ───
  const [showLiveMonitor, setShowLiveMonitor] = useState(false);
  // Auto-show monitor when recording starts; auto-hide when idle
  useEffect(() => {
    if (recorder.state === 'recording' || recorder.state === 'paused') {
      setShowLiveMonitor(true);
    } else if (recorder.state === 'idle') {
      setShowLiveMonitor(false);
    }
  }, [recorder.state]);

  const loadVideos = useCallback(async () => {
    const [all, fols] = await Promise.all([getAllVideos(), getAllFolders()]);
    setVideos(all); setFolders(fols); setLoadingVideos(false);
  }, []);
  useEffect(() => { loadVideos(); }, [loadVideos]);

  useKeyboardShortcuts({
    state: recorder.state, start: recorder.start, stop: recorder.stop,
    pause: recorder.pause, resume: recorder.resume, cancel: recorder.cancel,
    toggleDraw: () => setIsDrawing(v => !v),
  });

  // ─── Preset Loading ───
  const handleLoadPreset = (preset: RecordingPreset) => {
    const c = preset.config;
    recorder.setAudioOnly(c.audioOnly);
    recorder.setWebcamOnly(c.webcamOnly);
    recorder.setWithCam(c.withCam);
    recorder.setWithMic(c.withMic);
    recorder.setWithSystemAudio(c.withSystemAudio);
    recorder.setQuality(c.quality as Quality);
    recorder.setAspectRatio(c.aspectRatio as AspectRatio);
    recorder.setWebcamShape(c.webcamShape as WebcamShape);
    recorder.setWebcamPosition(c.webcamPosition as WebcamPosition);
    recorder.setWebcamSizePct(c.webcamSizePct);
    recorder.setWithTranscript(c.withTranscript);
    recorder.setWithCountdownSound(c.withCountdownSound);
    recorder.setWithIntroFade(c.withIntroFade);
    recorder.setShowMouseHighlight(c.showMouseHighlight);
    recorder.setShowKeyDisplay(c.showKeyDisplay);
    recorder.setWithBgBlur(c.withBgBlur);
    recorder.setFrameStyle(c.frameStyle as FrameStyle);
    recorder.setLogoWatermark(c.logoWatermark);
    recorder.setKjEnabled(c.kjEnabled);
    if (c.kjLine1) recorder.setKjLine1(c.kjLine1);
    if (c.kjLine2) recorder.setKjLine2(c.kjLine2);
    recorder.setBroadcastScene(c.broadcastScene);
    recorder.setLiveBadge(c.liveBadge);
    recorder.setClockEnabled(c.clockEnabled);
    recorder.setTickerEnabled(c.tickerEnabled);
    if (c.tickerText) recorder.setTickerText(c.tickerText);
    recorder.setScoreboardEnabled(c.scoreboardEnabled);
    recorder.setStudioAudio(c.studioAudio);
    setShowPresets(false);
  };
  const getCurrentConfig = (): RecordingPreset['config'] => ({
    audioOnly: recorder.audioOnly,
    webcamOnly: recorder.webcamOnly,
    withCam: recorder.withCam,
    withMic: recorder.withMic,
    withSystemAudio: recorder.withSystemAudio,
    quality: recorder.quality as '480p' | '720p' | '1080p',
    aspectRatio: recorder.aspectRatio as '16:9' | '4:3' | '1:1' | '9:16',
    webcamShape: recorder.webcamShape as 'circle' | 'rounded' | 'square',
    webcamPosition: recorder.webcamPosition as 'br' | 'bl' | 'tr' | 'tl',
    webcamSizePct: recorder.webcamSizePct,
    withTranscript: recorder.withTranscript,
    withCountdownSound: recorder.withCountdownSound,
    withIntroFade: recorder.withIntroFade,
    showMouseHighlight: recorder.showMouseHighlight,
    showKeyDisplay: recorder.showKeyDisplay,
    withBgBlur: recorder.withBgBlur,
    frameStyle: recorder.frameStyle,
    logoWatermark: recorder.logoWatermark,
    kjEnabled: recorder.kjEnabled,
    kjLine1: recorder.kjLine1,
    kjLine2: recorder.kjLine2,
    broadcastScene: recorder.broadcastScene as 'screen' | 'cam-big' | 'cam-only' | 'intro',
    liveBadge: recorder.liveBadge,
    clockEnabled: recorder.clockEnabled,
    tickerEnabled: recorder.tickerEnabled,
    tickerText: recorder.tickerText,
    scoreboardEnabled: recorder.scoreboardEnabled,
    studioAudio: recorder.studioAudio,
  });

  const handleAddChapter = (ch: Chapter) => {
    setLiveChapters(prev => [...prev, ch]);
    recorder.addChapter(ch.label);
  };

  const isActive = recorder.state === 'recording' || recorder.state === 'paused';
  const isCountdown = recorder.state === 'countdown';
  const isSaving = recorder.state === 'saving';

  // Stop live share when recording stops
  useEffect(() => {
    if (!isActive && liveShare.isLive) liveShare.stop();
  }, [isActive, liveShare]);

  const handleGoLive = async () => {
    if (!recorder.liveStreamRef.current) return;
    if (liveShare.isLive) { liveShare.stop(); return; }
    await liveShare.start(recorder.liveStreamRef.current);
    setShowLiveQR(true);
  };

  const takeScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      // @ts-ignore — ImageCapture is available in modern browsers
      const capture = new (window as any).ImageCapture(track);
      const bitmap = await capture.grabFrame();
      track.stop();
      const canvas = document.createElement('canvas');
      canvas.width  = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      setScreenshotData(imgData);
      setScreenshotSize({ w: bitmap.width, h: bitmap.height });
      setShowScreenshot(true);
    } catch (err) {
      console.warn('Screenshot failed', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Sign Language Panel ── */}

      {/* ── Live Captions ── */}
      <LiveCaptions
        isRecording={recorder.state === 'recording'}
        enabled={showCaptions}
        onCaptionChange={(text) => { 
          captionTextRef.current = text;
          // Eğer text final bir değerse (LiveCaptions'da interim olmayan çağrılar var) 
          // Burada basit bir debouncing veya state kontrolü ile Avatar'a paslıyoruz.
          // Not: LiveCaptions bileşenini değiştirmek yerine burada yakalıyoruz.
        }}
        onFinalCaption={(text) => setLastFinalTranscript(text)}
      />

      {/* ── Live Captions Toggle Button ── */}
      <button
        id="btn-live-captions"
        onClick={() => setShowCaptions(v => !v)}
        title="Canlı Altyazı (kayıt sırasında konuşmanızı altyazıya çevirir)"
        style={{
          position: 'fixed',
          bottom: '100px',
          left: '24px',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: '14px',
          background: showCaptions
            ? 'linear-gradient(135deg, #065f46, #0f766e)'
            : 'rgba(30,30,40,0.85)',
          boxShadow: showCaptions ? '0 6px 24px rgba(16,185,129,0.4)' : '0 4px 16px rgba(0,0,0,0.4)',
          border: showCaptions ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.1)',
          color: 'white',
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
        onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
        onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        <span style={{ fontSize: '16px' }}>CC</span>
        <span>{showCaptions ? 'Altyazı Açık' : 'Altyazı'}</span>
        {showCaptions && recorder.state === 'recording' && (
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#34d399',
            display: 'inline-block',
          }} />
        )}
      </button>


      {/* Screenshot Modal */}
      {showScreenshot && screenshotData && (
        <ScreenshotModal
          imageData={screenshotData}
          canvasWidth={screenshotSize.w}
          canvasHeight={screenshotSize.h}
          onClose={() => setShowScreenshot(false)}
        />
      )}
      {/* Overlays */}
      {isDrawing && isActive && <DrawOverlay annotationCanvasRef={recorder.annotationCanvasRef} onClose={() => setIsDrawing(false)} />}
      {(recorder.showMouseHighlight || recorder.showKeyDisplay) && isActive && (
        <MouseKeyOverlay interactionCanvasRef={recorder.interactionCanvasRef} showMouse={recorder.showMouseHighlight} showKeys={recorder.showKeyDisplay} />
      )}

      {/* Presentation Mode Iframe */}
      {presentationUrl && (
        <div className={`fixed inset-0 pt-[72px] bg-slate-950 ${isActive && isDrawing ? 'z-[35] pointer-events-none' : 'z-20'}`}>
          <iframe
            src={presentationUrl}
            className="w-full h-full border-none"
            title="Presentation"
            {...(presentationUrl?.startsWith('blob:') ? {} : { sandbox: "allow-same-origin allow-scripts allow-popups allow-forms" })}
          />
        </div>
      )}
      {isActive && <ChapterRecorder elapsed={recorder.elapsed} chapters={liveChapters} onAdd={handleAddChapter} />}

      {/* Floating stop/pause mini-bar — visible at all times during recording */}
      {isActive && (
        <FloatingRecordBar
          state={recorder.state as 'recording' | 'paused'}
          elapsed={recorder.elapsed}
          onStop={recorder.stop}
          onPause={recorder.pause}
          onResume={recorder.resume}
          onShowMonitor={() => setShowLiveMonitor(true)}
          onAddChapter={() => {
            const label = `Chapter ${liveChapters.length + 1}`;
            handleAddChapter({ id: `ch_${Date.now()}`, time: recorder.elapsed, label });
          }}
        />
      )}

      {/* ── Floating Live Monitor (canvas output preview in all modes) ── */}
      {showLiveMonitor && (recorder.liveStream || recorder.camPreviewStream) && (
        <LiveMonitor
          stream={recorder.liveStream ?? recorder.camPreviewStream}
          elapsed={recorder.elapsed}
          state={recorder.state}
          onClose={() => setShowLiveMonitor(false)}
        />
      )}

      {/* Floating Teleprompter window */}
      {showTeleprompter && (
        <Teleprompter 
          isRecording={recorder.state === 'recording'} 
          onClose={() => setShowTeleprompter(false)} 
        />
      )}

      {/* Draggable webcam overlay during recording */}
      {isActive && recorder.withCam && !recorder.audioOnly && (
        <CamPreview
          stream={recorder.camStreamRef.current}
          onPositionChange={recorder.setCamLivePosition}
          initialPosition={recorder.webcamPosition}
        />
      )}

      {/* Live share QR */}
      {showLiveQR && liveShare.peerId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-red-500/20">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
              <h2 className="text-white font-bold text-lg">You're Live!</h2>
            </div>
            <p className="text-slate-400 text-sm mb-4">Share this link or QR code with viewers:</p>
            <div className="bg-black/30 rounded-xl px-4 py-3 mb-4 border border-white/10">
              <p className="text-purple-300 text-xs font-mono break-all">{liveShare.getLiveUrl(liveShare.peerId)}</p>
            </div>
            {liveShare.viewerCount > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-bold">{liveShare.viewerCount} viewer{liveShare.viewerCount !== 1 ? 's' : ''} watching</span>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(liveShare.getLiveUrl(liveShare.peerId!)); }}
                className="flex-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all">Copy Link</button>
              <button onClick={() => setShowLiveQR(false)}
                className="flex-1 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all">Continue Recording</button>
            </div>
            <button onClick={() => { liveShare.stop(); setShowLiveQR(false); }}
              className="mt-3 text-xs text-slate-500 hover:text-red-400 transition-colors">Stop Live Stream</button>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {saveDialog.isOpen && (
        <SaveDialog 
          defaultTitle={`Recording ${new Date().toLocaleString()}`}
          folders={folders} 
          onSave={saveDialog.confirm} 
          onDiscard={saveDialog.discard} 
        />
      )}

      {/* URL / PDF Dialog */}
      {showUrlDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl relative">
            <button onClick={() => setShowUrlDialog(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-2">Sunum Modu: İçerik Yükle</h3>
            <p className="text-slate-400 text-sm mb-6">Sunum yapmak için bir Web Sitesi adresi girin veya bilgisayarınızdan bir PDF dosyası seçin. ScreenSnap üzerinden ayrılmadan üzerine çizim yapabilirsiniz.</p>
            
            <div className="space-y-6">
              {/* Option 1: URL */}
              <div>
                <label className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 block">Seçenek 1: Web Sitesi</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://ornek.com"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        let finalUrl = urlInput;
                        if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
                        setPresentationUrl(finalUrl);
                        setShowUrlDialog(false);
                      }
                    }}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-purple-500 text-sm"
                  />
                  <button 
                    onClick={() => {
                      let finalUrl = urlInput;
                      if (finalUrl && !finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
                      setPresentationUrl(finalUrl || null);
                      setShowUrlDialog(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm"
                  >Aç</button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs text-slate-500 font-bold">VEYA</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Option 2: PDF/Image Upload */}
              <div>
                <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 block">Seçenek 2: Belge Yükle (PDF/Resim)</label>
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-xl py-4 cursor-pointer transition-all">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300 text-sm font-semibold">Bilgisayardan Dosya Seç</span>
                  <input 
                    type="file" 
                    accept=".pdf, image/*" 
                    className="hidden" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const fileUrl = URL.createObjectURL(file);
                        setPresentationUrl(fileUrl);
                        setShowUrlDialog(false);
                      }
                    }} 
                  />
                </label>
                <p className="text-xs text-slate-500 mt-2 text-center">PowerPoint (Sunum) kullanmak isterseniz önce PDF'e çevirip öyle yükleyebilirsiniz.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight hidden xs:block">ScreenSnap</span>
          </div>

          {/* Center: recording status (mobile) */}
          {isActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 flex-1 sm:flex-none justify-center sm:justify-start max-w-[180px] sm:max-w-none mx-auto sm:mx-0">
              <span className="w-2 h-2 rounded-full bg-red-400 recording-dot shrink-0" />
              <span className="text-red-300 text-xs sm:text-sm font-semibold font-mono truncate">
                {recorder.state === 'paused' ? 'PAUSED · ' : 'REC · '}{formatDuration(recorder.elapsed)}
              </span>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <LanguageToggle lang={lang} onChange={changeLang} />
            <button
              onClick={() => setShowTeleprompter(v => !v)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-sm font-semibold shadow-sm"
              title="Teleprompter"
            >
              📜 Teleprompter
            </button>
            {isActive && (
              <>
                <button onClick={() => setIsDrawing(v => !v)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${isDrawing ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                  <PenLine className="w-4 h-4" /> {isDrawing ? 'Drawing' : 'Draw'}
                </button>
                <button onClick={handleGoLive}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${liveShare.isLive ? 'bg-red-500/20 border border-red-500/40 text-red-300 animate-pulse' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                  {liveShare.isLive ? <><Wifi className="w-4 h-4" /> Live ({liveShare.viewerCount})</> : <><Radio className="w-4 h-4" /> Go Live</>}
                </button>
                <button onClick={() => { setShowGuestPanel(v => !v); if (!guestRoom.isRoomOpen) guestRoom.openRoom(); }}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${guestRoom.isRoomOpen ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                  <Users className="w-4 h-4" /> Konuk {guestRoom.guests.length > 0 ? `(${guestRoom.guests.length})` : ''}
                </button>
              </>
            )}
            {isSaving && <div className="flex items-center gap-1.5 text-purple-300 text-xs sm:text-sm"><div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /><span className="hidden sm:inline">Processing…</span></div>}
            {presentationUrl && !isActive && (
              <div className="flex items-center gap-2">
                <button onClick={() => { setLiveChapters([]); recorder.start(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all">
                  <Circle className="w-3.5 h-3.5 text-red-300" /> <span className="hidden xs:inline">Kaydı Başlat</span>
                </button>
                <button onClick={() => setPresentationUrl(null)}
                  className="px-2.5 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-all">Çık</button>
              </div>
            )}
            {/* Icon links — hidden on mobile (moved to bottom nav) */}
            <Link href="/analytics" title={t('analytics', lang)} className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"><BarChart3 className="w-5 h-5" /></Link>
            <Link href="/guide" title={t('guide', lang)} className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors"><BookOpen className="w-5 h-5" /></Link>
            <button onClick={takeScreenshot} title={t('screenshot', lang)} className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors">
              <CameraIcon className="w-5 h-5" />
            </button>
            <Link href="/settings" className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors"><Settings className="w-5 h-5" /></Link>
          </div>
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="mobile-nav sm:hidden" aria-label="Mobile navigation">
        <Link href="/" className="flex flex-col items-center justify-center flex-1 py-3 gap-1 text-slate-500 hover:text-purple-300 transition-colors">
          <Video className="w-5 h-5" />
          <span className="text-[10px] font-bold">Kayıt</span>
        </Link>
        <Link href="/analytics" className="flex flex-col items-center justify-center flex-1 py-3 gap-1 text-slate-500 hover:text-cyan-300 transition-colors">
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-bold">Analitik</span>
        </Link>
        <button onClick={takeScreenshot} className="flex flex-col items-center justify-center flex-1 py-3 gap-1 text-slate-500 hover:text-purple-300 transition-colors">
          <CameraIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold">Ekran Al</span>
        </button>
        <Link href="/guide" className="flex flex-col items-center justify-center flex-1 py-3 gap-1 text-slate-500 hover:text-white transition-colors">
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold">Kılavuz</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center justify-center flex-1 py-3 gap-1 text-slate-500 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold">Ayarlar</span>
        </Link>
      </nav>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* ── ENTERPRISE WORKSPACES SIDEBAR ── */}
        <aside className="w-56 shrink-0 px-4 py-8 hidden lg:block border-r border-white/5 bg-black/20">
          <div className="flex items-center gap-2 mb-6 px-2">
             <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <Building2 className="w-4 h-4 text-purple-400" />
             </div>
             <div>
                <h3 className="text-sm font-bold text-white leading-tight">{t('myNetwork', lang)}</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">{t('enterprise', lang)}</span>
             </div>
          </div>

          {/* Quick links */}
          <div className="mb-4 px-2 space-y-1">
            <Link href="/analytics" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border-l-2 border-transparent hover:border-cyan-500 transition-all">
              <BarChart3 className="w-4 h-4" /> {t('analytics', lang)}
            </Link>
          </div>
          
          <div className="flex items-center justify-between mb-3 mt-4 px-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('workspaces', lang)}</span>
            <button onClick={() => setShowNewFolder(v => !v)} className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10" title={t('newWorkspace', lang)}><FolderPlus className="w-4 h-4" /></button>
          </div>
          
          {showNewFolder && (
            <div className="mb-3 flex gap-1 px-2">
              <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newFolderName.trim()) { setFolders(p => [...new Set([...p, newFolderName.trim()])]); setActiveFolder(newFolderName.trim()); setNewFolderName(''); setShowNewFolder(false); } }}
                placeholder="Örn: Pazarlama Alanı" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:ring-1 focus:ring-purple-500" />
              <button onClick={() => { if (newFolderName.trim()) { setFolders(p => [...new Set([...p, newFolderName.trim()])]); setActiveFolder(newFolderName.trim()); setNewFolderName(''); setShowNewFolder(false); } }} className="text-xs px-2 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all">+</button>
            </div>
          )}
          
          <div className="space-y-1">
            <button onClick={() => setActiveFolder(null)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${!activeFolder ? 'bg-purple-600/15 border-l-2 border-purple-500 text-purple-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
              <LayoutGrid className="w-4 h-4" /> {t('allVideos', lang)} <span className="ml-auto text-xs opacity-60 bg-white/10 px-1.5 rounded">{videos.length}</span>
            </button>
            {folders.map(f => (
              <button key={f} onClick={() => setActiveFolder(f === activeFolder ? null : f)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeFolder === f ? 'bg-purple-600/15 border-l-2 border-purple-500 text-purple-300' : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}>
                <Hash className="w-4 h-4" /> <span className="truncate">{f}</span>
                <span className="ml-auto text-xs opacity-60 bg-white/10 px-1.5 rounded">{videos.filter(v => v.folder === f).length}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 px-2">
             <div className="flex items-start gap-3 bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/20 p-3 rounded-xl cursor-default group">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                   <h4 className="text-amber-500 text-xs font-bold mb-1">SSO & Güvenlik</h4>
                   <p className="text-slate-400 text-[10px] leading-tight">Ekibinizin videoları uçtan uca şifrelenmiştir. Video içi güvenlikten izinleri ayarlayabilirsiniz.</p>
                </div>
             </div>
          </div>
        </aside>

        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 min-w-0 pb-mobile-nav sm:pb-10">
          {/* ── COUNTDOWN ── */}
          {isCountdown && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-white/60 text-lg mb-4">Recording in…</p>
                <div key={recorder.countdown} className="text-purple-400 font-black text-9xl fade-up" style={{ textShadow: '0 0 80px rgba(124,58,237,0.9)' }}>{recorder.countdown}</div>
              </div>
            </div>
          )}

          {/* ── GUEST ROOM PANEL ── */}
          {showGuestPanel && (
            <section className="mb-6">
              <div className="glass rounded-3xl p-6 border border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">👥 Konuk Davet Et</p>
                      <p className="text-[10px] text-slate-500">Maks. 4 konuk • WebRTC P2P</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {guestRoom.guests.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {guestRoom.guests.length} Bağlı
                      </span>
                    )}
                    <button onClick={() => setShowGuestPanel(false)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Room link */}
                {guestRoom.isRoomOpen && guestRoom.guestJoinUrl ? (
                  <div className="mb-4">
                    <p className="text-[10px] text-slate-400 font-semibold mb-1.5">📎 Konuk Davet Linki</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-purple-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                        {guestRoom.guestJoinUrl}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(guestRoom.guestJoinUrl);
                          setCopiedGuestLink(true);
                          setTimeout(() => setCopiedGuestLink(false), 2000);
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          copiedGuestLink
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                        }`}
                      >
                        {copiedGuestLink ? '✅ Kopyalandı' : '📋 Kopyala'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5">
                      Bu linki konuklara gönderin. Herkese aynı link gönderilir. Konuklar Chrome/Edge tarayıcısında açmalı.
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 flex items-center gap-2 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    Oda oluşturuluyor…
                  </div>
                )}

                {/* Connected guests */}
                {guestRoom.guests.length > 0 ? (
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold mb-2">🟢 Bağlı Konuklar</p>
                    <div className="grid grid-cols-2 gap-2">
                      {guestRoom.guests.map(g => (
                        <div key={g.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span className="text-xs text-white font-semibold truncate">{g.name}</span>
                          </div>
                          <button onClick={() => guestRoom.removeGuest(g.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2">
                      Konukların görüntüsü kayıt sırasında ekranın altında grid olarak görünür.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-600 text-sm">
                    Henüz bağlı konuk yok.<br />
                    <span className="text-[11px]">Linki paylaşın, bağlandıklarında burada görünecekler.</span>
                  </div>
                )}

                {/* Close room */}
                {/* External channel quick-add during recording */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider">📡 Harici Kanal Ekle</p>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { p: 'zoom'  as const, label: 'Zoom',  cls: 'bg-blue-600/20 border-blue-500/30 text-blue-300' },
                      { p: 'meet'  as const, label: 'Meet',  cls: 'bg-green-600/20 border-green-500/30 text-green-300' },
                      { p: 'teams' as const, label: 'Teams', cls: 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300' },
                      { p: 'other' as const, label: 'Diğer', cls: 'bg-purple-600/20 border-purple-500/30 text-purple-300' },
                    ]).map(({ p, label, cls }) => (
                      <button key={p}
                        onClick={() => guestRoom.addExternalChannel(p)}
                        disabled={guestRoom.guests.length >= 4}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all disabled:opacity-40 ${cls}`}
                      >+{label}</button>
                    ))}
                  </div>
                  {guestRoom.guests.filter(g => g.source === 'external').length > 0 && (
                    <div className="mt-2 space-y-1">
                      {guestRoom.guests.filter(g => g.source === 'external').map(g => (
                        <div key={g.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/5">
                          <span className="text-[11px] text-slate-300 font-semibold">📡 {g.name}</span>
                          <button onClick={() => guestRoom.removeGuest(g.id)} className="p-0.5 text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => { guestRoom.closeRoom(); setShowGuestPanel(false); }}
                  className="mt-4 w-full py-2 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-300 hover:bg-red-500/10 text-xs font-semibold transition-all">
                  Odayı Kapat
                </button>
              </div>
            </section>
          )}

          {/* ── RECORDER PANEL ── */}
          <RecorderSection
            recorder={recorder}
            guestRoom={guestRoom}
            lang={lang}
            isSaving={isSaving}
            setShowPresets={setShowPresets}
            setShowUrlDialog={setShowUrlDialog}
            setLiveChapters={setLiveChapters}
          />

          {/* ── VIDEO LIBRARY ── */}
          <LibrarySection
            videos={videos}
            folders={folders}
            loadingVideos={loadingVideos}
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            loadVideos={loadVideos}
            setSelectedVideo={setSelectedVideo}
            lang={lang}
          />
        </main>
      </div>

      {selectedVideo && (
        <VideoPlayerModal record={selectedVideo} onClose={() => setSelectedVideo(null)}
          onDeleted={() => { setSelectedVideo(null); loadVideos(); }} onSaved={loadVideos} />
      )}

      {/* Preset Manager Modal */}
      {showPresets && (
        <PresetManager
          lang={lang}
          onLoadPreset={handleLoadPreset}
          onSaveCurrentAsPreset={getCurrentConfig}
          onClose={() => setShowPresets(false)}
        />
      )}

      {/* Share Modal */}
      {shareVideo && (
        <ShareModal
          lang={lang}
          videoTitle={shareVideo.title}
          cloudUrl={shareVideo.cloudUrl}
          onClose={() => setShareVideo(null)}
        />
      )}


      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="glass rounded-2xl p-4 border border-purple-500/30 shadow-2xl shadow-purple-900/30 glow-purple max-w-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm mb-1">{t('installApp', lang)}</p>
                <p className="text-slate-400 text-xs mb-3">{t('installDesc', lang)}</p>
                <div className="flex gap-2">
                  <button onClick={handleInstall}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all">
                    {lang === 'tr' ? 'Yükle' : 'Install'}
                  </button>
                  <button onClick={() => setShowInstallBanner(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 text-xs font-semibold hover:text-white transition-all">
                    {lang === 'tr' ? 'Sonra' : 'Later'}
                  </button>
                </div>
              </div>
              <button onClick={() => setShowInstallBanner(false)} className="text-slate-600 hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Sign Language AI Avatar (v5) ── */}
      <SignLanguageAvatar 
        externalText={lastFinalTranscript} 
        recorderState={recorder.state as any} 
      />
    </div>
  );
}



// ─── Virtual Background Picker ───────────────────────────────────────────────
