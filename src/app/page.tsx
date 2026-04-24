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
import ShareModal from '@/components/ShareModal';
import {
  Monitor, Camera, Mic, MicOff, CameraOff, MonitorOff,
  Square, Pause, Play, Circle, Trash2, Clock,
  HardDrive, LayoutGrid, Video, Search, Tag, PenLine, X,
  ChevronDown, Zap, Settings, Folder, FolderPlus, Headphones,
  AudioLines, Mouse, Keyboard, Timer, Radio, Wifi, WifiOff, Users, BookOpen, Camera as CameraIcon, FileText,
  Hash, ShieldAlert, Building2, BarChart3, Download, CheckSquare, Share2
} from 'lucide-react';
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
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  
  // ─── i18n ───
  const [lang, setLang] = useState<Lang>('tr');
  useEffect(() => { setLang(getSavedLang()); }, []);
  const changeLang = (l: Lang) => { setLang(l); saveLang(l); };

  // ─── Batch mode ───
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    onSaved: () => loadVideos(),
    onDrawGuests: guestRoom.guests.length > 0
      ? (ctx, outW, outH) => {
          // Define a bounding box for the guests: on the right side
          const margin = Math.round(Math.min(outW, outH) * 0.03);
          const gW = Math.round(outW * 0.25); // Max 25% width per guest
          const gH = outH - (margin * 2);     // Almost full height to stack vertically
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
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [liveChapters, setLiveChapters] = useState<Chapter[]>([]);
  const [showLiveQR, setShowLiveQR] = useState(false);
  const [screenshotData, setScreenshotData] = useState<ImageData | null>(null);
  const [screenshotSize, setScreenshotSize] = useState({ w: 0, h: 0 });
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [presentationUrl, setPresentationUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);

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

  const allTags = [...new Set(videos.flatMap(v => v.tags ?? []))];
  const filteredVideos = videos.filter(v => {
    if (activeFolder && v.folder !== activeFolder) return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTag && !(v.tags ?? []).includes(activeTag)) return false;
    return true;
  });

  const handleDeleteFromList = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('deleteConfirm', lang))) { await deleteVideo(id); loadVideos(); }
  };

  // ─── Batch Operations ───
  const toggleBatchSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const handleBatchDelete = async () => {
    if (!confirm(t('confirmBatchDelete', lang))) return;
    for (const id of selectedIds) await deleteVideo(id);
    setSelectedIds(new Set());
    loadVideos();
  };
  const handleBatchExport = async () => {
    for (const id of selectedIds) {
      const v = videos.find(x => x.id === id);
      if (!v) continue;
      const url = URL.createObjectURL(v.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${v.title}.${v.blob.type.includes('audio') ? 'webm' : 'webm'}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  const handleBatchMove = async (folder: string | null) => {
    for (const id of selectedIds) await updateVideoFolder(id, folder || undefined);
    loadVideos();
  };
  const handleBatchTag = async (tag: string) => {
    for (const id of selectedIds) {
      const v = videos.find(x => x.id === id);
      if (!v) continue;
      const tags = [...new Set([...(v.tags || []), tag])];
      await updateVideoTags(id, tags);
    }
    loadVideos();
  };

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
      {showSignLanguage && <SignLanguagePanel onClose={() => setShowSignLanguage(false)} />}

      {/* ── Floating Sign Language Button ── */}
      <button
        id="btn-sign-language"
        onClick={() => setShowSignLanguage(v => !v)}
        title="Türk İşaret Dili (TİD)"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 18px',
          borderRadius: '16px',
          background: showSignLanguage
            ? 'linear-gradient(135deg, #5b21b6, #1d4ed8)'
            : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
          border: '1px solid rgba(167,139,250,0.4)',
          color: 'white',
          fontWeight: 800,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={e => { if (!showSignLanguage) (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
        onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        <span style={{ fontSize: '20px' }}>🤟</span>
        <span>İşaret Dili</span>
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
          onAddChapter={() => {
            const label = `Chapter ${liveChapters.length + 1}`;
            handleAddChapter({ id: `ch_${Date.now()}`, time: recorder.elapsed, label });
          }}
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
        <SaveDialogWithFolder folders={folders} onSave={saveDialog.confirm} onDiscard={saveDialog.discard} />
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">ScreenSnap</span>
          </div>
          <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/15 border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-400 recording-dot" />
                  <span className="text-red-300 text-sm font-semibold font-mono">
                    {recorder.state === 'paused' ? 'PAUSED · ' : 'REC · '}{formatDuration(recorder.elapsed)}
                  </span>
                </div>
                <button onClick={() => setIsDrawing(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${isDrawing ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                  <PenLine className="w-4 h-4" /> {isDrawing ? 'Drawing' : 'Draw'}
                </button>
                {/* Go Live button */}
                <button onClick={handleGoLive}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${liveShare.isLive ? 'bg-red-500/20 border border-red-500/40 text-red-300 animate-pulse' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                  {liveShare.isLive ? <><Wifi className="w-4 h-4" /> Live ({liveShare.viewerCount})</> : <><Radio className="w-4 h-4" /> Go Live</>}
                </button>
                {/* Guest Invite button */}
                <button onClick={() => { setShowGuestPanel(v => !v); if (!guestRoom.isRoomOpen) guestRoom.openRoom(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${guestRoom.isRoomOpen ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                  <Users className="w-4 h-4" /> Konuk {guestRoom.guests.length > 0 ? `(${guestRoom.guests.length})` : ''}
                </button>
              </>
            )}
            {isSaving && <div className="flex items-center gap-2 text-purple-300 text-sm"><div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> Processing…</div>}
            {/* Exit Presentation & Start Record in Presentation Mode */}
            {presentationUrl && !isActive && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setLiveChapters([]); recorder.start(); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all"
                >
                  <Circle className="w-4 h-4 text-red-300" /> Kaydı Başlat
                </button>
                <button
                  onClick={() => setPresentationUrl(null)}
                  className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all"
                >
                  Siteden Çık
                </button>
              </div>
            )}
            <Link href="/analytics" title={t('analytics', lang)} className="p-2 rounded-xl text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"><BarChart3 className="w-5 h-5" /></Link>
            <Link href="/guide" title={t('guide', lang)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors"><BookOpen className="w-5 h-5" /></Link>
            {/* Screenshot button */}
            <button
              onClick={takeScreenshot}
              title={t('screenshot', lang)}
              className="p-2 rounded-xl text-slate-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
            >
              <CameraIcon className="w-5 h-5" />
            </button>
            <Link href="/settings" className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors"><Settings className="w-5 h-5" /></Link>
          </div>
        </div>
      </header>

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

        <main className="flex-1 px-6 py-10 min-w-0">
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
          <section className="mb-14">
            <div className="glass rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-purple-600/8 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/30 to-cyan-500/20 border border-white/10 mb-6 shadow-xl">
                  {isActive ? <div className="w-5 h-5 rounded-sm bg-red-400 recording-dot" /> : recorder.audioOnly ? <AudioLines className="w-9 h-9 text-purple-400" /> : recorder.webcamOnly ? <Camera className="w-9 h-9 text-cyan-400" /> : <Monitor className="w-9 h-9 text-purple-400" />}
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
                  {isActive ? (recorder.state === 'paused' ? '⏸ Kayıt Duraklatıldı' : '🔴 Kayıt Devam Ediyor') : recorder.audioOnly ? 'Sadece Ses Kaydı' : recorder.webcamOnly ? 'Webcam Kaydı' : 'Ekranı Kaydet'}
                </h1>
                <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">
                  {isActive
                    ? (recorder.state === 'paused'
                        ? 'Devam et veya durdur ve kaydet.'
                        : (recorder.webcamOnly || recorder.audioOnly)
                            ? 'Kamera kaydediliyor — aşağıdaki Stop & Save ile bitirin.'
                            : 'Kaydetmek istediğiniz pencereye geçin.')
                    : 'Ayarları yapın ve Başlat\'a basın. Kısayol: Ctrl+Shift+R'}
                </p>

                {/* ─── BIG RECORDING INDICATOR ─── */}
                {isActive && recorder.state === 'recording' && (
                  <div className="mb-6">
                    <div className="inline-flex flex-col items-center gap-3 px-8 py-5 rounded-3xl bg-red-600/15 border-2 border-red-500/40 shadow-xl shadow-red-500/20">
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full bg-red-500 recording-dot shadow-lg shadow-red-500/50" />
                        <span className="text-red-400 font-black text-xl tracking-widest">KAYIT EDİYOR</span>
                      </div>
                      <div className="text-white font-mono text-5xl font-black tabular-nums" style={{ textShadow: '0 0 30px rgba(239,68,68,0.6)' }}>
                        {String(Math.floor(recorder.elapsed / 60)).padStart(2,'0')}:{String(recorder.elapsed % 60).padStart(2,'0')}
                      </div>
                      <p className="text-red-300/70 text-xs">Durdurmak için aşağıdaki <strong>Stop &amp; Save</strong> butonuna basın</p>
                    </div>
                  </div>
                )}
                {/* ─── LIVE OUTPUT MONITOR ─── */}
                {isActive && (recorder.liveStream || recorder.camPreviewStream) && (
                  <div className="mb-6">
                    <p className="text-slate-500 text-xs mb-2 text-center">
                      {recorder.liveStream ? '📺 Canlı Yayın Önizlemesi' : '📷 Canlı Kamera Önizleme'}
                    </p>
                    <div className="relative rounded-2xl overflow-hidden mx-auto shadow-2xl border border-white/10"
                         style={{ maxWidth: 480, aspectRatio: '16/9', background: '#000' }}>
                      <video
                        autoPlay muted playsInline
                        ref={el => { if (el) el.srcObject = (recorder.liveStream || recorder.camPreviewStream); }}
                        className="w-full h-full object-contain"
                        style={{ transform: !recorder.liveStream ? 'scaleX(-1)' : 'none' }}
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500 recording-dot" />
                        <span className="text-white text-[10px] font-bold tracking-wider">CANLI</span>
                      </div>
                      {/* Virtual Studio status badge */}
                      {recorder.withVirtualStudio && (
                        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-sm ${
                          recorder.vsModelReady
                            ? 'bg-emerald-500/80 text-white'
                            : recorder.vsModelError
                              ? 'bg-red-500/80 text-white'
                              : 'bg-amber-500/80 text-white animate-pulse'
                        }`}>
                          {recorder.vsModelReady
                            ? '✅ AI Hazır'
                            : recorder.vsModelError
                              ? '❌ AI Yüklenemedi'
                              : '⏳ AI Yükleniyor...'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio visualizer */}
                {isActive && recorder.state !== 'paused' && <div className="mb-6"><AudioVisualizer level={recorder.audioLevel} isActive /></div>}

                {/* Settings (idle) */}
                {recorder.state === 'idle' && (
                  <div className="space-y-4 mb-8">
                    {/* Main toggles — 3 modes */}
                    <div className="flex flex-wrap justify-center gap-2">
                      {/* Mode selector */}
                      <div className="flex rounded-2xl border border-white/10 overflow-hidden bg-white/5 p-0.5 gap-0.5">
                        {/* Screen */}
                        <button
                          onClick={() => { recorder.setAudioOnly(false); recorder.setWebcamOnly(false); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                            !recorder.audioOnly && !recorder.webcamOnly
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}>
                          <Monitor className="w-4 h-4" /> Ekran
                        </button>
                        {/* Webcam Only */}
                        <button
                          onClick={() => { recorder.setAudioOnly(false); recorder.setWebcamOnly(true); recorder.setWithCam(true); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                            recorder.webcamOnly
                              ? 'bg-cyan-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}>
                          <Camera className="w-4 h-4" /> Webcam
                        </button>
                        {/* Audio Only */}
                        <button
                          onClick={() => { recorder.setAudioOnly(true); recorder.setWebcamOnly(false); recorder.setWithCam(false); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                            recorder.audioOnly
                              ? 'bg-slate-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}>
                          <Headphones className="w-4 h-4" /> Sadece Ses
                        </button>
                      </div>

                      {/* Webcam toggle (screen mode only) */}
                      {!recorder.audioOnly && !recorder.webcamOnly && (
                        <Toggle active={recorder.withCam} onToggle={() => recorder.setWithCam(v => !v)} icon={recorder.withCam ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />} label="Webcam" />
                      )}
                      {/* Microphone */}
                      <Toggle active={recorder.withMic} onToggle={() => recorder.setWithMic(v => !v)} icon={recorder.withMic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />} label="Microphone" />
                      {/* System audio — only works in actual screen recording modes */}
                      {!recorder.audioOnly && !recorder.webcamOnly && recorder.broadcastScene !== 'cam-only' && recorder.broadcastScene !== 'intro' && (
                        <div className="flex flex-col items-center gap-0.5">
                          <Toggle active={recorder.withSystemAudio} onToggle={() => recorder.setWithSystemAudio(v => !v)} icon={recorder.withSystemAudio ? <Monitor className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />} label="Sistem Sesi" />
                          {recorder.withSystemAudio && (
                            <span className="text-[9px] text-amber-400/80 text-center leading-tight">Ekran paylaşırken<br/>"Ses paylaş" ✓ seçin</span>
                          )}
                        </div>
                      )}
                      {/* Quality (screen/webcam modes) */}
                      {!recorder.audioOnly && (
                        <div className="relative">
                          <select value={recorder.quality} onChange={e => recorder.setQuality(e.target.value as Quality)}
                            style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}
                            className="appearance-none flex items-center gap-2 px-4 py-2 pr-8 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-purple-500">
                            <option value="480p" style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>480p</option>
                            <option value="720p" style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>720p HD</option>
                            <option value="1080p" style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>1080p Full HD</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}
                    </div>

                    {/* Quick-access: Logo + KJ visible without opening advanced */}
                    {!recorder.audioOnly && (
                      <div className="w-full space-y-2 px-1">

                        {/* ── Logo Row ── */}
                        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl border border-white/8 bg-white/4">
                          <span className="text-xs text-slate-400 font-semibold shrink-0">🏷️ Logo</span>
                          {/* Toggle */}
                          <button
                            onClick={() => recorder.setLogoWatermark(v => !v)}
                            className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${recorder.logoWatermark ? 'bg-purple-600' : 'bg-white/15'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${recorder.logoWatermark ? 'translate-x-4' : ''}`} />
                          </button>
                          {recorder.logoWatermark && (
                            <>
                              {/* Logo preview */}
                              {recorder.logoUrl ? (
                                <img src={recorder.logoUrl} alt="logo" className="h-6 w-auto max-w-[60px] object-contain opacity-85 rounded shrink-0" />
                              ) : (
                                <span className="text-slate-600 text-xs shrink-0">Logo yok</span>
                              )}
                              {/* Upload */}
                              <label className="cursor-pointer px-2.5 py-1 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-all text-[11px] font-bold shrink-0">
                                📁 Yükle
                                <input type="file" accept="image/*,.svg" className="hidden" onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    recorder.setLogoUrl(reader.result as string);
                                    localStorage.setItem('screensnap_brand_logo', reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }} />
                              </label>
                              {/* Size slider */}
                              <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                                <span className="text-[10px] text-slate-500 shrink-0">Boyut</span>
                                <input
                                  type="range" min={4} max={22} step={1}
                                  value={recorder.logoSize}
                                  onChange={e => recorder.setLogoSize(+e.target.value)}
                                  className="flex-1 accent-purple-500 h-1"
                                />
                                <span className="text-[10px] text-slate-400 w-7 shrink-0">{recorder.logoSize}%</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* ── KJ Row ── */}
                        <div className="p-2.5 rounded-2xl border border-white/8 bg-white/4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-semibold shrink-0">📺 KJ Alt Yazı</span>
                            {/* Toggle */}
                            <button
                              onClick={() => recorder.setKjEnabled(v => !v)}
                              className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${recorder.kjEnabled ? 'bg-cyan-600' : 'bg-white/15'}`}
                            >
                              <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${recorder.kjEnabled ? 'translate-x-4' : ''}`} />
                            </button>
                            {recorder.kjEnabled && (
                              <span className="text-[10px] text-slate-500">İsim ve ünvan gir → kayıt sırasında ekranda görünür</span>
                            )}
                          </div>
                          {recorder.kjEnabled && (
                            <div className="flex gap-2 flex-wrap">
                              <input
                                type="text"
                                placeholder="Ad Soyad (Satır 1)"
                                value={recorder.kjLine1}
                                onChange={e => recorder.setKjLine1(e.target.value)}
                                maxLength={60}
                                className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-600"
                              />
                              <input
                                type="text"
                                placeholder="Ünvan / Şirket (Satır 2 — opsiyonel)"
                                value={recorder.kjLine2}
                                onChange={e => recorder.setKjLine2(e.target.value)}
                                maxLength={70}
                                className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-600"
                              />
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* ── Broadcast Panel ── */}
                    {!recorder.audioOnly && (
                      <div className="w-full px-1">
                        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 p-3 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-purple-300 tracking-wider uppercase">📡 Broadcast / Web TV</span>
                            <div className="flex-1 h-px bg-purple-500/20" />
                          </div>

                          {/* Scene switcher */}
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Sahne</label>
                            <div className="flex gap-1.5 flex-wrap">
                              {([
                                { v: 'screen',   label: '🖥️ Ekran' },
                                { v: 'cam-big',  label: '🎙️ Kamera+PIP' },
                                { v: 'cam-only', label: '🎥 Sadece Cam' },
                                { v: 'intro',    label: '🎬 Intro Kartı' },
                              ] as const).map(s => (
                                <button key={s.v}
                                  onClick={() => recorder.setBroadcastScene(s.v)}
                                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                    recorder.broadcastScene === s.v
                                      ? 'border-purple-500/60 bg-purple-600/30 text-purple-200'
                                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                                  }`}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                            {recorder.broadcastScene === 'intro' && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <input type="text" placeholder="Başlık (örn: Canlı Yayın Başlıyor)"
                                  value={recorder.introTitle} onChange={e => recorder.setIntroTitle(e.target.value)}
                                  className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600" />
                                <input type="text" placeholder="Alt başlık (opsiyonel)"
                                  value={recorder.introSubtitle} onChange={e => recorder.setIntroSubtitle(e.target.value)}
                                  className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600" />
                              </div>
                            )}
                          </div>

                          {/* Studio Backgrounds */}
                          {recorder.broadcastScene !== 'screen' && (
                            <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                🎨 Stüdyo Arka Planı
                                {recorder.webtvBg && (
                                  <button onClick={() => recorder.setWebtvBg(null)} className="text-[9px] text-red-400/70 hover:text-red-400 ml-auto transition-colors">✕ Kaldır</button>
                                )}
                              </label>
                              {/* AI Studio Backgrounds */}
                              <p className="text-[9px] text-purple-400/70 font-bold uppercase tracking-widest mb-1.5">✨ AI Stüdyo</p>
                                <div className="grid grid-cols-5 gap-1.5 mb-2">
                                  {[
                                    { n: 's1', label: '📡 Haber Stüdyo', path: '/webtv-bg/studio1.jpg' },
                                    { n: 's2', label: '🔵 Neon Lab', path: '/webtv-bg/studio2.jpg' },
                                    { n: 's3', label: '🌆 Şehir Manzarası', path: '/webtv-bg/studio3.jpg' },
                                    { n: 's4', label: '🎙️ Podcast Odası', path: '/webtv-bg/studio4.jpg' },
                                    { n: 's5', label: '💜 Mor Gradyan', path: '/webtv-bg/studio5.jpg' },
                                    { n: 's6', label: '🌌 Galaksi', path: '/webtv-bg/studio6.jpg' },
                                  ].map(({ n, label, path }) => {
                                    const isActive = recorder.webtvBg === path;
                                    return (
                                      <button key={n} title={label}
                                        onClick={() => recorder.setWebtvBg(isActive ? null : path)}
                                        className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-video ${isActive ? 'border-purple-400 shadow-lg shadow-purple-500/30 scale-105' : 'border-white/15 hover:border-white/40 hover:scale-102'}`}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={`${path}?v=3`} alt={label} className="w-full h-full object-cover" />
                                        {isActive && (
                                          <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                            <span className="text-white text-[10px]">✓</span>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              {/* Classic TV Backgrounds */}
                              <p className="text-[9px] text-amber-400/70 font-bold uppercase tracking-widest mb-1.5">📺 Haber / TV</p>
                                <div className="grid grid-cols-5 gap-1.5">
                                  {[
                                    { n: 1, label: '🏛️ Koyu Stüdyo', path: '/webtv-bg/bg1.png' },
                                    { n: 2, label: '📺 Breaking News', path: '/webtv-bg/bg2.png' },
                                    { n: 3, label: '💻 Teknoloji', path: '/webtv-bg/bg3.png' },
                                    { n: 4, label: '🌃 İstanbul Gece', path: '/webtv-bg/bg4.png' },
                                    { n: 5, label: '🌊 Mor Dalga', path: '/webtv-bg/bg5.png' },
                                    { n: 6, label: '🏢 Kurumsal', path: '/webtv-bg/bg6.png' },
                                    { n: 7, label: '🌌 Uzay', path: '/webtv-bg/bg7.png' },
                                    { n: 8, label: '🌿 Doğa', path: '/webtv-bg/bg8.png' },
                                    { n: 9, label: '✨ Lüks Altın', path: '/webtv-bg/bg9.png' },
                                  ].map(({ n, label, path }) => {
                                    const isActive = recorder.webtvBg === path;
                                    return (
                                      <button key={n} title={label}
                                        onClick={() => recorder.setWebtvBg(isActive ? null : path)}
                                        className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-video ${isActive ? 'border-purple-400 shadow-lg shadow-purple-500/30 scale-105' : 'border-white/15 hover:border-white/40 hover:scale-102'}`}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={`${path}?v=2`} alt={label} className="w-full h-full object-cover" />
                                        {isActive && (
                                          <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                            <span className="text-white text-[10px]">✓</span>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              {recorder.webtvBg && (
                                <p className="text-[10px] text-purple-300/60 mt-1 text-center font-medium">
                                  {(() => {
                                    const allBgs = [
                                      { l: '📡 Haber Stüdyo', p: '/webtv-bg/studio1.jpg' },
                                      { l: '🔵 Neon Lab', p: '/webtv-bg/studio2.jpg' },
                                      { l: '🌆 Şehir Manzarası', p: '/webtv-bg/studio3.jpg' },
                                      { l: '🎙️ Podcast Odası', p: '/webtv-bg/studio4.jpg' },
                                      { l: '💜 Mor Gradyan', p: '/webtv-bg/studio5.jpg' },
                                      { l: '🌌 Galaksi', p: '/webtv-bg/studio6.jpg' },
                                      { l: '🏛️ Koyu Stüdyo', p: '/webtv-bg/bg1.png' },
                                      { l: '📺 Breaking News', p: '/webtv-bg/bg2.png' },
                                      { l: '💻 Teknoloji', p: '/webtv-bg/bg3.png' },
                                      { l: '🌃 İstanbul Gece', p: '/webtv-bg/bg4.png' },
                                      { l: '🌊 Mor Dalga', p: '/webtv-bg/bg5.png' },
                                      { l: '🏢 Kurumsal', p: '/webtv-bg/bg6.png' },
                                      { l: '🌌 Uzay', p: '/webtv-bg/bg7.png' },
                                      { l: '🌿 Doğa', p: '/webtv-bg/bg8.png' },
                                      { l: '✨ Lüks Altın', p: '/webtv-bg/bg9.png' },
                                    ];
                                    return allBgs.find(b => b.p === recorder.webtvBg)?.l || 'Özel Görsel';
                                  })()} seçildi
                                </p>
                              )}

                              {/* ── Sanal Stüdyo: AI arka plan kaldırma ── */}
                              {(recorder.webcamOnly || recorder.broadcastScene === 'cam-only') && recorder.webtvBg && (
                                <div className={`mt-2 rounded-xl border p-3 transition-colors ${
                                  recorder.withVirtualStudio
                                    ? 'border-emerald-500/40 bg-emerald-500/8'
                                    : 'border-white/10 bg-white/3'
                                }`}>
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-bold text-slate-300 leading-tight">🟩 Sanal Stüdyo</p>
                                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                        AI ile gerçek arka planını kaldır, stüdyoda oturuyormuş gibi görün
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => recorder.setWithVirtualStudio(v => !v)}
                                      className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                                        recorder.withVirtualStudio ? 'bg-emerald-500' : 'bg-white/15'
                                      }`}
                                    >
                                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                        recorder.withVirtualStudio ? 'translate-x-5' : ''
                                      }`} />
                                    </button>
                                  </div>
                                  {recorder.withVirtualStudio && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-300/70">
                                      <span className="animate-pulse">⏳</span>
                                      <span>Kayıt başlayınca AI modeli yüklenir (~3-5sn). Bu sürede normal görünürsünüz, hazır olunca arka plan kalkar.</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Overlay badges row */}
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5">
                              <span className="text-[11px] text-slate-400 font-semibold">🔴 CANLI</span>
                              <button onClick={() => recorder.setLiveBadge(v => !v)}
                                className={`relative w-8 h-4 rounded-full transition-colors ${recorder.liveBadge ? 'bg-red-600' : 'bg-white/15'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${recorder.liveBadge ? 'translate-x-4' : ''}`} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5">
                              <span className="text-[11px] text-slate-400 font-semibold">🕐 Saat</span>
                              <button onClick={() => recorder.setClockEnabled(v => !v)}
                                className={`relative w-8 h-4 rounded-full transition-colors ${recorder.clockEnabled ? 'bg-blue-600' : 'bg-white/15'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${recorder.clockEnabled ? 'translate-x-4' : ''}`} />
                              </button>
                              {recorder.clockEnabled && (
                                <div className="flex gap-1">
                                  {(['tl', 'tr'] as const).map(p => (
                                    <button key={p} onClick={() => recorder.setClockPosition(p)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${recorder.clockPosition === p ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40' : 'text-slate-500 hover:text-slate-300'}`}>
                                      {p === 'tl' ? '↖' : '↗'}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5">
                              <span className="text-[11px] text-slate-400 font-semibold">🏛️ Haber Masası</span>
                              <button onClick={() => recorder.setWithNewsDesk(v => !v)}
                                className={`relative w-8 h-4 rounded-full transition-colors ${recorder.withNewsDesk ? 'bg-purple-600' : 'bg-white/15'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${recorder.withNewsDesk ? 'translate-x-4' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* ── Harici Kanallar (Zoom / Meet / Teams) ── */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-300 font-bold shrink-0">📡 Harici Kanallar</span>
                              <div className="flex-1 h-px bg-white/10" />
                              <span className="text-[10px] text-slate-600">{guestRoom.guests.length}/{4} slot</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {([
                                { p: 'zoom'  as const, label: 'Zoom',  icon: 'Z', cls: 'bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/35' },
                                { p: 'meet'  as const, label: 'Meet',  icon: 'G', cls: 'bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/35' },
                                { p: 'teams' as const, label: 'Teams', icon: 'T', cls: 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/35' },
                                { p: 'webex' as const, label: 'Webex', icon: 'W', cls: 'bg-teal-600/20 border-teal-500/30 text-teal-300 hover:bg-teal-600/35' },
                                { p: 'other' as const, label: 'Diğer', icon: '+', cls: 'bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/35' },
                              ]).map(({ p, label, icon, cls }) => (
                                <button
                                  key={p}
                                  onClick={() => {
                                    if (!isActive) guestRoom.openRoom();
                                    guestRoom.addExternalChannel(p);
                                  }}
                                  disabled={guestRoom.guests.length >= 4}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
                                  title={`${label} penceresini yayin sahnesine ekle`}
                                >
                                  <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[10px] font-black">{icon}</span>
                                  +{label}
                                </button>
                              ))}
                            </div>
                            {/* Active external channels list */}
                            {guestRoom.guests.filter(g => g.source === 'external').length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-emerald-400 font-semibold">🟢 Aktif Pencere Kaynakları</p>
                                {guestRoom.guests.filter(g => g.source === 'external').map(g => (
                                  <div key={g.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${
                                        g.platform === 'zoom'  ? 'bg-blue-400'   :
                                        g.platform === 'meet'  ? 'bg-green-400'  :
                                        g.platform === 'teams' ? 'bg-indigo-400' :
                                        g.platform === 'webex' ? 'bg-teal-400'   : 'bg-purple-400'
                                      }`} />
                                      <span className="text-xs text-white font-semibold">{g.name}</span>
                                    </div>
                                    <button onClick={() => guestRoom.removeGuest(g.id)} className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-[10px] text-slate-600 leading-tight">
                              Seçilen uygulama penceresi (Zoom, Meet, Teams…) doğrudan yayın sahnesine kaynak olarak eklenir.
                            </p>
                          </div>

                          {/* Ticker */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-semibold shrink-0">📰 Haber Bandı</span>
                              <button onClick={() => recorder.setTickerEnabled(v => !v)}
                                className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${recorder.tickerEnabled ? 'bg-amber-600' : 'bg-white/15'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${recorder.tickerEnabled ? 'translate-x-4' : ''}`} />
                              </button>
                              {recorder.tickerEnabled && (
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <span className="text-[10px] text-slate-500">Hız</span>
                                  <input type="range" min={30} max={200} step={10} value={recorder.tickerSpeed}
                                    onChange={e => recorder.setTickerSpeed(+e.target.value)}
                                    className="w-16 accent-amber-500 h-1" />
                                  <span className="text-[10px] text-slate-400 w-8">{recorder.tickerSpeed}</span>
                                </div>
                              )}
                            </div>
                            {recorder.tickerEnabled && (
                              <textarea
                                placeholder="Kayan yazı metni... (örn: AB Fon Başvuruları 2026 Açıldı | Erasmus+ Son Başvuru: 15 Mayıs)"
                                value={recorder.tickerText}
                                onChange={e => recorder.setTickerText(e.target.value)}
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600 resize-none"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Advanced toggle */}
                    <button onClick={() => setShowAdvanced(v => !v)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 mx-auto">
                      <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /> Advanced settings
                    </button>

                    {showAdvanced && (
                      <div className="flex flex-wrap justify-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 text-left">
                        {/* Transcript */}
                        <Toggle active={recorder.withTranscript} onToggle={() => recorder.setWithTranscript(v => !v)} icon={<span className="text-sm">📝</span>} label="Transcript" />
                        {/* Countdown sound */}
                        <Toggle active={recorder.withCountdownSound} onToggle={() => recorder.setWithCountdownSound(v => !v)} icon={<span className="text-sm">🔔</span>} label="Beep Sound" />
                        {/* Intro fade */}
                        <Toggle active={recorder.withIntroFade} onToggle={() => recorder.setWithIntroFade(v => !v)} icon={<span className="text-sm">🌊</span>} label="Intro Fade" />
                        {/* Mouse highlight */}
                        <Toggle active={recorder.showMouseHighlight} onToggle={() => recorder.setShowMouseHighlight(v => !v)} icon={<Mouse className="w-4 h-4" />} label="Mouse Highlight" />
                        {/* Key display */}
                        <Toggle active={recorder.showKeyDisplay} onToggle={() => recorder.setShowKeyDisplay(v => !v)} icon={<Keyboard className="w-4 h-4" />} label="Key Display" />
                        {/* Background removal/blur */}
                        {!recorder.audioOnly && recorder.withCam && (
                          <div className="flex flex-wrap gap-2">
                            <Toggle active={recorder.withBgBlur} onToggle={() => recorder.setWithBgBlur(v => !v)} icon={<span className="text-sm">🌫️</span>} label="Bulanıklaştır" />
                            <Toggle active={recorder.withVirtualStudio} onToggle={() => recorder.setWithVirtualStudio(v => !v)} icon={<span className="text-sm">👤</span>} label="AI Arka Planı Kaldır" accent="cyan" />
                          </div>
                        )}
                        {/* Virtual BG Image picker */}
                        {!recorder.audioOnly && recorder.withCam && (
                          <VirtualBgPicker
                            value={recorder.webtvBg}
                            onChange={recorder.setWebtvBg}
                            onVirtualStudio={recorder.setWithVirtualStudio}
                            virtualStudio={recorder.withVirtualStudio}
                          />
                        )}
                        {/* Studio Audio */}
                        {recorder.withMic && (
                          <Toggle active={recorder.studioAudio} onToggle={() => recorder.setStudioAudio(v => !v)} icon={<span className="text-sm">🎙️</span>} label="Stüdyo Sesi" accent="cyan" />
                        )}

                        <div className="w-full border-t border-white/5 pt-3 mt-1 flex flex-wrap gap-3">
                          {/* Webcam shape */}
                          {!recorder.audioOnly && recorder.withCam && (
                            <AdvSelect label="Cam Shape" value={recorder.webcamShape} onChange={v => recorder.setWebcamShape(v as WebcamShape)}
                              options={[['circle', '● Circle'], ['rounded', '▣ Rounded'], ['square', '■ Square']]} />
                          )}
                          {/* Webcam position */}
                          {!recorder.audioOnly && recorder.withCam && (
                            <AdvSelect label="Cam Position" value={recorder.webcamPosition} onChange={v => recorder.setWebcamPosition(v as WebcamPosition)}
                              options={[['br', '↘ Bottom-right'], ['bl', '↙ Bottom-left'], ['tr', '↗ Top-right'], ['tl', '↖ Top-left']]} />
                          )}
                          {/* Webcam size */}
                          {!recorder.audioOnly && recorder.withCam && (
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-slate-500">Cam Size: {recorder.webcamSizePct}%</label>
                              <input type="range" min={10} max={40} step={2} value={recorder.webcamSizePct} onChange={e => recorder.setWebcamSizePct(+e.target.value)}
                                className="w-32 accent-purple-500" />
                            </div>
                          )}
                          {/* Webcam ring color */}
                          {!recorder.audioOnly && recorder.withCam && (
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-slate-500">Ring Color</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={recorder.webcamRingColor} onChange={e => recorder.setWebcamRingColor(e.target.value)}
                                  className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                                <span className="text-xs text-slate-400 font-mono">{recorder.webcamRingColor}</span>
                              </div>
                            </div>
                          )}
                          {/* Aspect ratio */}
                          {!recorder.audioOnly && (
                            <AdvSelect label="Aspect Ratio" value={recorder.aspectRatio} onChange={v => recorder.setAspectRatio(v as AspectRatio)}
                              options={[['16:9', '16:9 Widescreen'], ['4:3', '4:3 Classic'], ['1:1', '1:1 Square'], ['9:16', '9:16 Vertical']]} />
                          )}
                          {/* Auto-stop */}
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500 flex items-center gap-1"><Timer className="w-3 h-3" /> Auto-stop</label>
                            <div className="relative">
                              <select value={recorder.autoStopMinutes} onChange={e => recorder.setAutoStopMinutes(+e.target.value)}
                                style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}
                                className="appearance-none px-3 py-2 pr-7 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-semibold cursor-pointer outline-none">
                                <option value={0} style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>Disabled</option>
                                <option value={5} style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>5 min</option>
                                <option value={10} style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>10 min</option>
                                <option value={15} style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>15 min</option>
                                <option value={30} style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>30 min</option>
                                <option value={60} style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>60 min</option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                          {/* Transcript lang */}
                          {recorder.withTranscript && (
                            <AdvSelect label="Transcript Lang" value={recorder.transcriptLang} onChange={v => recorder.setTranscriptLang(v)}
                              options={[['tr-TR', '🇹🇷 Türkçe'], ['en-US', '🇺🇸 English'], ['de-DE', '🇩🇪 Deutsch'], ['fr-FR', '🇫🇷 Français'], ['es-ES', '🇪🇸 Español']]} />
                          )}
                          {/* Frame Style */}
                          {!recorder.audioOnly && (
                            <div className="w-full border-t border-white/5 pt-3 mt-1">
                              <label className="text-xs text-slate-500 mb-2 block">🎨 Video Çerçevesi — seçmeden önce üzerine gel</label>
                              <FramePickerWithPreview
                                value={recorder.frameStyle}
                                brandColor={typeof window !== 'undefined' ? localStorage.getItem('screensnap_brand_color') || '#7c3aed' : '#7c3aed'}
                                onChange={(v) => recorder.setFrameStyle(v as FrameStyle)}
                              />
                            </div>
                          )}

                          {/* Logo Watermark */}
                          {!recorder.audioOnly && (
                            <LogoWatermarkPicker
                              enabled={recorder.logoWatermark}
                              onToggle={() => recorder.setLogoWatermark(v => !v)}
                              logoUrl={recorder.logoUrl}
                              onLogoUrl={(url) => { recorder.setLogoUrl(url); localStorage.setItem('screensnap_brand_logo', url); }}
                              position={recorder.logoPosition}
                              onPosition={recorder.setLogoPosition}
                            />
                          )}

                          {/* KJ / Lower Third */}
                          {!recorder.audioOnly && (
                            <KJPicker
                              enabled={recorder.kjEnabled}
                              onToggle={() => recorder.setKjEnabled(v => !v)}
                              line1={recorder.kjLine1}
                              line2={recorder.kjLine2}
                              onLine1={recorder.setKjLine1}
                              onLine2={recorder.setKjLine2}
                              style={recorder.kjStyle}
                              onStyle={recorder.setKjStyle}
                              position={recorder.kjPosition}
                              onPosition={recorder.setKjPosition}
                              duration={recorder.kjDuration}
                              onDuration={recorder.setKjDuration}
                              brandColor={typeof window !== 'undefined' ? localStorage.getItem('screensnap_brand_color') || '#7c3aed' : '#7c3aed'}
                            />
                          )}

                        </div>
                      </div>
                    )}

                    {/* ─── AUDIO MIXER ─── */}
                    {!recorder.audioOnly && (
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          🎚️ Ses Mikseri
                        </label>
                        <div className="space-y-3">
                          {recorder.withMic && (
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 w-20 shrink-0">🎙 Mikrofon</span>
                              <input type="range" min={0} max={150} step={5} value={recorder.micVolume}
                                onChange={e => recorder.setMicVolume(+e.target.value)}
                                className="flex-1 accent-purple-500" />
                              <span className="text-xs font-mono text-slate-400 w-8 text-right">{recorder.micVolume}%</span>
                            </div>
                          )}
                          {recorder.withSystemAudio && !recorder.webcamOnly && recorder.broadcastScene !== 'cam-only' && recorder.broadcastScene !== 'intro' && (
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 w-20 shrink-0">🖥 Sistem</span>
                              <input type="range" min={0} max={150} step={5} value={recorder.systemVolume}
                                onChange={e => recorder.setSystemVolume(+e.target.value)}
                                className="flex-1 accent-cyan-500" />
                              <span className="text-xs font-mono text-slate-400 w-8 text-right">{recorder.systemVolume}%</span>
                            </div>
                          )}
                          {/* Cam-only / webcam modes: system audio not capturable */}
                          {recorder.withSystemAudio && (recorder.webcamOnly || recorder.broadcastScene === 'cam-only' || recorder.broadcastScene === 'intro') && (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                              <span className="text-amber-400 text-xs">⚠️</span>
                              <p className="text-xs text-amber-300/80">Sistem sesi sadece <strong>Ekran</strong> modunda çalışır. Bu modda sadece mikrofon kaydedilir.</p>
                            </div>
                          )}
                          {!recorder.withMic && !recorder.withSystemAudio && (
                            <p className="text-xs text-slate-600">Mikrofon veya sistem sesini etkinleştirin.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ─── COLOR GRADING ─── */}
                    {!recorder.audioOnly && (
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          🎨 Renk & Parlaklık
                        </label>
                        <div className="space-y-3">
                          {[
                            { label: '☀️ Parlaklık', key: 'videoBrightness', set: 'setVideoBrightness', min: 50, max: 150, accent: 'accent-yellow-400' },
                            { label: '◑ Kontrast',   key: 'videoContrast',   set: 'setVideoContrast',   min: 50, max: 150, accent: 'accent-blue-400' },
                            { label: '🎨 Doygunluk', key: 'videoSaturation', set: 'setVideoSaturation', min: 0,  max: 200, accent: 'accent-pink-400' },
                          ].map(({ label, key, set, min, max, accent }) => (
                            <div key={key} className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
                              <input type="range" min={min} max={max} step={5}
                                value={(recorder as Record<string,unknown>)[key] as number}
                                onChange={e => ((recorder as Record<string,unknown>)[set] as (v:number)=>void)(+e.target.value)}
                                className={`flex-1 ${accent}`} />
                              <span className="text-xs font-mono text-slate-400 w-8 text-right">
                                {(recorder as Record<string,unknown>)[key] as number}%
                              </span>
                              <button onClick={() => ((recorder as Record<string,unknown>)[set] as (v:number)=>void)(100)}
                                className="text-[10px] text-slate-600 hover:text-slate-400">↺</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ─── SCOREBOARD ─── */}
                    {!recorder.audioOnly && (
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            🏆 Skor Tablosu
                          </label>
                          <button onClick={() => recorder.setScoreboardEnabled(v => !v)}
                            className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${recorder.scoreboardEnabled ? 'bg-amber-600' : 'bg-white/15'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${recorder.scoreboardEnabled ? 'translate-x-4' : ''}`} />
                          </button>
                        </div>
                        {recorder.scoreboardEnabled && (
                          <div className="grid grid-cols-2 gap-3">
                            {/* Left Team */}
                            <div className="space-y-2">
                              <p className="text-[10px] text-slate-500 font-bold">EV TAKIMI</p>
                              <input value={recorder.scoreLeft.name}
                                onChange={e => recorder.setScoreLeft(s => ({ ...s, name: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-purple-500" />
                              <div className="flex items-center gap-2">
                                <button onClick={() => recorder.setScoreLeft(s => ({ ...s, score: Math.max(0, s.score - 1) }))}
                                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold">-</button>
                                <span className="flex-1 text-center font-mono font-black text-xl text-white">{recorder.scoreLeft.score}</span>
                                <button onClick={() => recorder.setScoreLeft(s => ({ ...s, score: s.score + 1 }))}
                                  className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold">+</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="color" value={recorder.scoreLeft.color}
                                  onChange={e => recorder.setScoreLeft(s => ({ ...s, color: e.target.value }))}
                                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                                <span className="text-xs text-slate-500">Renk</span>
                              </div>
                            </div>
                            {/* Right Team */}
                            <div className="space-y-2">
                              <p className="text-[10px] text-slate-500 font-bold">MİSAFİR</p>
                              <input value={recorder.scoreRight.name}
                                onChange={e => recorder.setScoreRight(s => ({ ...s, name: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm outline-none focus:ring-1 focus:ring-purple-500" />
                              <div className="flex items-center gap-2">
                                <button onClick={() => recorder.setScoreRight(s => ({ ...s, score: Math.max(0, s.score - 1) }))}
                                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold">-</button>
                                <span className="flex-1 text-center font-mono font-black text-xl text-white">{recorder.scoreRight.score}</span>
                                <button onClick={() => recorder.setScoreRight(s => ({ ...s, score: s.score + 1 }))}
                                  className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold">+</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="color" value={recorder.scoreRight.color}
                                  onChange={e => recorder.setScoreRight(s => ({ ...s, color: e.target.value }))}
                                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                                <span className="text-xs text-slate-500">Renk</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  {recorder.state === 'idle' && (
                    <>
                      <button id="btn-start-recording" onClick={() => { setLiveChapters([]); recorder.start(); }}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white font-bold text-lg shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.03] active:scale-95">
                        <Circle className="w-5 h-5 text-red-300" /> {recorder.audioOnly ? t('startRecordingAudio', lang) : t('startRecording', lang)}
                      </button>
                      <button onClick={() => setShowPresets(true)}
                        className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-purple-500/10 text-slate-300 hover:text-purple-300 font-bold border border-white/10 hover:border-purple-500/30 transition-all">
                        <Zap className="w-5 h-5" /> {t('presets', lang)}
                      </button>
                      <button onClick={() => setShowUrlDialog(true)}
                        className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold border border-white/10 transition-all">
                        {t('presentationMode', lang)}
                      </button>
                    </>
                  )}
                  {recorder.state === 'recording' && (
                    <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
                      <button onClick={recorder.stop}
                        className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xl shadow-xl shadow-red-600/40 transition-all hover:scale-[1.02] active:scale-95 border-2 border-red-400/30">
                        <Square className="w-6 h-6" /> ⏹ DURDUR &amp; KAYDET
                      </button>
                      <div className="flex gap-2 w-full">
                        <button onClick={recorder.pause}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all">
                          <Pause className="w-4 h-4" /> Duraklat
                        </button>
                        <button onClick={recorder.cancel}
                          className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 font-bold transition-all text-sm">
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
                  {recorder.state === 'paused' && (
                    <>
                      <button onClick={recorder.resume} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all"><Play className="w-5 h-5" /> Resume</button>
                      <button onClick={recorder.stop} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all"><Square className="w-5 h-5" /> Stop & Save</button>
                      <button onClick={recorder.cancel} className="px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 font-bold transition-all">Cancel</button>
                    </>
                  )}
                  {isSaving && (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-purple-300 font-medium">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> Processing…
                    </div>
                  )}
                </div>

                {recorder.state === 'idle' && (
                  <p className="mt-5 text-slate-600 text-xs flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" />
                    {recorder.audioOnly ? 'Audio only · No screen capture' : `${recorder.quality} · ${recorder.aspectRatio} · Webcam composited into video`} · Saves locally
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── VIDEO LIBRARY ── */}
          <section>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">{activeFolder ? activeFolder : t('myRecordings', lang)}</h2>
                {videos.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-600/20 text-purple-300 text-xs font-semibold border border-purple-500/20">
                    {filteredVideos.length}{videos.length !== filteredVideos.length ? `/${videos.length}` : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Batch mode toggle */}
                {videos.length > 0 && (
                  <button onClick={() => { setBatchMode(v => !v); setSelectedIds(new Set()); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${batchMode ? 'bg-purple-600/20 border border-purple-500/40 text-purple-300' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                    <CheckSquare className="w-3.5 h-3.5" /> {batchMode ? (lang === 'tr' ? 'Seçim Modu' : 'Select Mode') : (lang === 'tr' ? 'Çoklu Seç' : 'Multi-Select')}
                  </button>
                )}
                {videos.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder={t('search', lang)} value={search} onChange={e => setSearch(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-purple-500 w-48" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                )}
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                <button onClick={() => setActiveTag(null)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!activeTag ? 'bg-purple-600/30 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'}`}>All</button>
                {allTags.map(t => (
                  <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeTag === t ? 'bg-purple-600/30 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'}`}>
                    <Tag className="w-3 h-3" /> {t}
                  </button>
                ))}
              </div>
            )}

            {loadingVideos ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => <div key={i} className="glass rounded-2xl h-48 animate-pulse" />)}
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="glass rounded-3xl p-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                  {search || activeTag ? <Search className="w-8 h-8 text-slate-600" /> : <Video className="w-8 h-8 text-slate-600" />}
                </div>
                <p className="text-slate-400 font-medium">{search || activeTag ? 'No recordings match.' : activeFolder ? `No recordings in "${activeFolder}" yet.` : 'No recordings yet.'}</p>
                {(search || activeTag) && <button onClick={() => { setSearch(''); setActiveTag(null); }} className="mt-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-all">Clear Filters</button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredVideos.map((v, i) => (
                  <div key={v.id} className="relative">
                    {batchMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBatchSelect(v.id); }}
                        className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.has(v.id) ? 'bg-purple-600 border-purple-400 text-white' : 'bg-black/50 border-white/30 text-transparent hover:border-purple-400'}`}
                      >
                        {selectedIds.has(v.id) && <span className="text-xs font-bold">✓</span>}
                      </button>
                    )}
                    <VideoCard record={v} index={i} folders={folders}
                      onClick={() => batchMode ? toggleBatchSelect(v.id) : setSelectedVideo(v)}
                      onDelete={e => handleDeleteFromList(v.id, e)}
                      onMoveFolder={async (folder) => { await updateVideoFolder(v.id, folder || undefined); loadVideos(); }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
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

      {/* Batch Toolbar */}
      {batchMode && selectedIds.size > 0 && (
        <BatchToolbar
          lang={lang}
          videos={filteredVideos}
          selectedIds={selectedIds}
          folders={folders}
          onToggleSelect={toggleBatchSelect}
          onSelectAll={() => setSelectedIds(new Set(filteredVideos.map(v => v.id)))}
          onDeselectAll={() => setSelectedIds(new Set())}
          onBatchDelete={handleBatchDelete}
          onBatchExport={handleBatchExport}
          onBatchMove={handleBatchMove}
          onBatchTag={handleBatchTag}
          onClose={() => { setBatchMode(false); setSelectedIds(new Set()); }}
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
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Toggle({ active, onToggle, icon, label, accent = 'default' }: {
  active: boolean; onToggle: () => void; icon: React.ReactNode; label: string; accent?: 'default' | 'cyan';
}) {
  const on = accent === 'cyan' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-purple-600/20 border-purple-500/40 text-purple-300';
  return (
    <button onClick={onToggle} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${active ? on : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}>
      {icon} {label}
    </button>
  );
}

// ─── Logo Watermark Picker ───────────────────────────────────────────────────
function LogoWatermarkPicker({ enabled, onToggle, logoUrl, onLogoUrl, position, onPosition }: {
  enabled: boolean;
  onToggle: () => void;
  logoUrl: string;
  onLogoUrl: (url: string) => void;
  position: 'br' | 'tr' | 'bl' | 'tl';
  onPosition: (p: 'br' | 'tr' | 'bl' | 'tl') => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState(logoUrl);
  const [imgError, setImgError] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onLogoUrl(reader.result as string);
      setUrlDraft(reader.result as string);
      setImgError(false);
    };
    reader.readAsDataURL(file);
  };

  const POSITIONS: { value: 'br' | 'tr' | 'bl' | 'tl'; label: string; icon: string }[] = [
    { value: 'tl', label: 'Sol Üst',  icon: '↖' },
    { value: 'tr', label: 'Sağ Üst',  icon: '↗' },
    { value: 'bl', label: 'Sol Alt',  icon: '↙' },
    { value: 'br', label: 'Sağ Alt',  icon: '↘' },
  ];

  return (
    <div className="w-full border-t border-white/5 pt-3 mt-1">
      {/* Header row with toggle */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-slate-500 flex items-center gap-1.5">
          🏷️ Logo Watermark
          <span className="text-slate-600 font-normal">— kayıt sırasında köşede görünür</span>
        </label>
        <button
          onClick={onToggle}
          className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-white/10'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3 pl-1">
          {/* Current logo preview + actions */}
          <div className="flex items-center gap-3">
            {logoUrl && !imgError ? (
              <div className="w-16 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-1 shrink-0">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-10 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0">
                <span className="text-slate-600 text-xs">Logo yok</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5 flex-1">
              {/* Upload from file */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/15 border border-purple-500/25 text-purple-300 text-xs font-semibold hover:bg-purple-600/25 transition-all"
              >
                📁 Dosyadan Yükle
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleFile} />
              {/* Or enter URL */}
              <button
                onClick={() => setShowUrlInput(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:text-white hover:border-white/20 transition-all"
              >
                🔗 URL ile Ekle
              </button>
            </div>
          </div>

          {/* URL input */}
          {showUrlInput && (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://sirketiniz.com/logo.png"
                value={urlDraft}
                onChange={e => setUrlDraft(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600"
              />
              <button
                onClick={() => { onLogoUrl(urlDraft); setImgError(false); setShowUrlInput(false); }}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
              >
                Uygula
              </button>
            </div>
          )}

          {/* Position */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Köşe Konumu</p>
            <div className="grid grid-cols-2 gap-1.5 w-32">
              {POSITIONS.map(p => (
                <button
                  key={p.value}
                  onClick={() => onPosition(p.value)}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    position === p.value
                      ? 'bg-purple-600/25 border-purple-500/50 text-purple-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span className="text-[10px]">{p.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mini visual preview of position */}
          <div className="w-28 h-16 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-1 rounded-lg bg-slate-800/50 flex items-center justify-center">
              <span className="text-[8px] text-slate-600">Ekran</span>
            </div>
            {logoUrl && !imgError && (
              <img
                src={logoUrl}
                alt=""
                className={`absolute w-7 h-auto object-contain opacity-80 ${
                  position === 'br' ? 'bottom-1 right-1' :
                  position === 'tr' ? 'top-1 right-1' :
                  position === 'bl' ? 'bottom-1 left-1' :
                  'top-1 left-1'
                }`}
              />
            )}
            {(!logoUrl || imgError) && (
              <div className={`absolute w-6 h-4 rounded bg-purple-500/40 border border-purple-500/50 flex items-center justify-center ${
                position === 'br' ? 'bottom-1 right-1' :
                position === 'tr' ? 'top-1 right-1' :
                position === 'bl' ? 'bottom-1 left-1' :
                'top-1 left-1'
              }`}>
                <span className="text-[7px] text-purple-300">L</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KJ / Lower Third Picker ─────────────────────────────────────────────────
function KJPicker({ enabled, onToggle, line1, line2, onLine1, onLine2, style, onStyle, position, onPosition, duration, onDuration, brandColor }: {
  enabled: boolean; onToggle: () => void;
  line1: string; line2: string;
  onLine1: (v: string) => void; onLine2: (v: string) => void;
  style: KJStyle; onStyle: (v: KJStyle) => void;
  position: KJPosition; onPosition: (v: KJPosition) => void;
  duration: number; onDuration: (v: number) => void;
  brandColor: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width; const H = canvas.height;

    // Mock screen
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#090716'); bg.addColorStop(1, '#17142d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#13112a'; ctx.fillRect(8, 8, W - 16, H - 16);
    ctx.fillStyle = '#1c1938'; ctx.fillRect(8, 8, W - 16, 16);
    ctx.fillStyle = '#2a2650'; ctx.fillRect(14, 12, 55, 8);
    ['#342f60','#29264d','#342f60'].forEach((c,i) => {
      ctx.fillStyle = c; ctx.fillRect(16, 34 + i*14, W * 0.35, 6);
    });

    drawKJ(ctx, W, H, line1 || 'Ad Soyad', line2 || 'Ünvan / Şirket', style, position, brandColor, 1);
  }, [enabled, line1, line2, style, position, brandColor]);

  return (
    <div className="w-full border-t border-white/5 pt-3 mt-1">
      {/* Header + toggle */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-slate-500 flex items-center gap-1.5">
          📺 KJ / Alt Yazı (Lower Third)
          <span className="text-slate-600">— konuşmacı adı/ünvanı</span>
        </label>
        <button
          onClick={onToggle}
          className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-white/10'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
        </button>
      </div>

      {enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Left: inputs + controls */}
          <div className="space-y-2">
            {/* Line 1 */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Satır 1 — İsim / Başlık</label>
              <input
                type="text"
                placeholder="Ali Ulusoy"
                value={line1}
                onChange={e => onLine1(e.target.value)}
                maxLength={60}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600"
              />
            </div>
            {/* Line 2 */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Satır 2 — Ünvan / Şirket (opsiyonel)</label>
              <input
                type="text"
                placeholder="Proje Direktörü | Project Factory"
                value={line2}
                onChange={e => onLine2(e.target.value)}
                maxLength={70}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600"
              />
            </div>

            {/* Style */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Stil</label>
              <div className="flex flex-wrap gap-1.5">
                {KJ_STYLE_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => onStyle(s.value)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      style === s.value
                        ? 'border-purple-500/60 bg-purple-600/20 text-purple-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                    }`}>
                    <span>{s.emoji}</span><span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Konum</label>
              <div className="flex flex-wrap gap-1.5">
                {KJ_POSITION_OPTIONS.map(p => (
                  <button key={p.value} onClick={() => onPosition(p.value)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      position === p.value
                        ? 'border-cyan-500/60 bg-cyan-600/20 text-cyan-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                    }`}>
                    <span>{p.icon}</span><span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">
                Gösterim Süresi: {duration === 0 ? 'Her Zaman' : `İlk ${duration} sn`}
              </label>
              <input
                type="range" min={0} max={30} step={1} value={duration}
                onChange={e => onDuration(+e.target.value)}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                <span>Her Zaman</span><span>30 sn</span>
              </div>
            </div>
          </div>

          {/* Right: live preview canvas */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Önizleme</label>
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl" style={{ aspectRatio: '16/9' }}>
              <canvas ref={canvasRef} width={320} height={180} className="w-full h-full block" />
            </div>
            <p className="text-[10px] text-slate-600">Kameraya başlandığında gelecek gerçek içerikle birlikte görünür</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Frame Picker with Live Canvas Preview ───────────────────────────────────
function FramePickerWithPreview({ value, brandColor, onChange }: {
  value: FrameStyle;
  brandColor: string;
  onChange: (v: FrameStyle) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<FrameStyle>(value);
  const rafIdRef = useRef<number | null>(null);

  // Keep hovered in sync when external value changes
  useEffect(() => { setHovered(value); }, [value]);

  useEffect(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    const ANIMATED: FrameStyle[] = ['neon-cyan', 'neon-green', 'dots-pattern', 'retro-vhs'];

    const paint = (t: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // bg gradient
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#090716'); bg.addColorStop(1, '#17142d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // inner panel
      ctx.fillStyle = '#13112a'; ctx.fillRect(10, 10, W - 20, H - 20);
      // chrome bar
      ctx.fillStyle = '#1c1938'; ctx.fillRect(10, 10, W - 20, 20);
      ctx.fillStyle = '#2a2650'; ctx.fillRect(16, 15, 68, 10);
      // Fake text lines
      [[22,42,'#342f60',W*0.38],[22,57,'#29264d',W*0.28],[22,72,'#342f60',W*0.33],[22,87,'#29264d',W*0.22]].forEach(([x,y,c,w]) => {
        ctx.fillStyle = c as string; ctx.fillRect(x as number, y as number, w as number, 7);
      });
      // Fake image block
      ctx.fillStyle = '#201d42'; ctx.fillRect(W*0.52, 38, W*0.36, H*0.44);
      ctx.fillStyle = '#2e2b56'; ctx.fillRect(W*0.54, 42, W*0.32, H*0.34);
      // Webcam circle
      const cr = 26, cx = W - cr - 16, cy = H - cr - 12;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.clip();
      const cg = ctx.createRadialGradient(cx-6,cy-6,3,cx,cy,cr);
      cg.addColorStop(0,'#5540a8'); cg.addColorStop(1,'#281963');
      ctx.fillStyle = cg; ctx.fillRect(cx-cr,cy-cr,cr*2,cr*2);
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx,cy,cr,0,Math.PI*2);
      ctx.strokeStyle = brandColor; ctx.lineWidth = 2.5; ctx.stroke();
      // Frame overlay
      drawFrame(ctx, W, H, hovered, brandColor, t);
    };

    if (ANIMATED.includes(hovered)) {
      const loop = () => {
        paint(Date.now() / 1000);
        rafIdRef.current = requestAnimationFrame(loop);
      };
      rafIdRef.current = requestAnimationFrame(loop);
    } else {
      paint(Date.now() / 1000);
    }

    return () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };
  }, [hovered, brandColor]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {FRAME_OPTIONS.map(f => (
          <button
            key={f.value}
            onMouseEnter={() => setHovered(f.value)}
            onMouseLeave={() => setHovered(value)}
            onClick={() => onChange(f.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              value === f.value
                ? 'border-purple-500/70 bg-purple-600/25 text-purple-300 shadow shadow-purple-600/20'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-purple-400/40 hover:bg-purple-500/10'
            }`}
          >
            <span>{f.emoji}</span>
            <span className="hidden lg:inline">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Live canvas preview */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-black/40" style={{ aspectRatio: '16/9' }}>
        <canvas ref={canvasRef} width={480} height={270} className="w-full h-full block" />
        {/* Bottom label */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-sm border border-white/10">
          <span className="text-white text-xs font-semibold">
            {FRAME_OPTIONS.find(f => f.value === hovered)?.emoji}{' '}
            {FRAME_OPTIONS.find(f => f.value === hovered)?.label}
          </span>
          {hovered !== value
            ? <span className="text-slate-500 text-[10px]">önizleme</span>
            : value !== 'none' && <span className="text-purple-400 text-[10px] font-bold">● aktif</span>
          }
        </div>
        {/* Animated badge */}
        {(['neon-cyan','neon-green','dots-pattern','retro-vhs'] as FrameStyle[]).includes(hovered) && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 border border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-300 font-semibold">animasyonlu</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AdvSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}
          className="appearance-none px-3 py-2 pr-7 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-purple-500">
          {options.map(([v, l]) => <option key={v} value={v} style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>{l}</option>)}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

function VideoCard({ record, index, onClick, onDelete, folders, onMoveFolder }: {
  record: VideoRecord; index: number; onClick: () => void; onDelete: (e: React.MouseEvent) => void;
  folders: string[]; onMoveFolder: (folder: string | null) => void;
}) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const isAudio = record.blob.type.includes('audio');

  return (
    <div className="glass rounded-2xl overflow-hidden cursor-pointer group fade-up border border-white/5 hover:border-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-900/20"
      style={{ animationDelay: `${index * 60}ms` }} onClick={onClick}>
      <div className="aspect-video bg-slate-900 relative overflow-hidden">
        {isAudio ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/40 to-slate-900">
            <AudioLines className="w-10 h-10 text-purple-400 mb-2" />
            <span className="text-purple-300 text-xs font-medium">Audio Recording</span>
          </div>
        ) : record.thumbnail ? (
          <img src={record.thumbnail} alt={record.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/20"><Video className="w-6 h-6 text-purple-400" /></div>
          </div>
        )}
        {!isAudio && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all scale-0 group-hover:scale-100">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs font-mono font-bold">{formatDuration(record.duration)}</div>
        {record.cloudUrl && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500/80 flex items-center justify-center" title="Cloud uploaded"><span className="text-white text-[8px] font-bold">☁</span></div>}
        {record.chapters && record.chapters.length > 0 && <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-purple-300 text-[10px] font-bold">{record.chapters.length} ch</div>}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-white text-sm font-semibold truncate group-hover:text-purple-300 transition-colors">{record.title}</p>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100">
            {folders.length > 0 && (
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowFolderMenu(v => !v)} className="p-1.5 rounded-lg text-slate-500 hover:text-purple-300 hover:bg-purple-500/10"><Folder className="w-3.5 h-3.5" /></button>
                {showFolderMenu && (
                  <div className="absolute right-0 bottom-8 w-40 glass rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                    <button onClick={() => { onMoveFolder(null); setShowFolderMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white">No folder</button>
                    {folders.map(f => (
                      <button key={f} onClick={() => { onMoveFolder(f); setShowFolderMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/10 ${record.folder === f ? 'text-purple-300' : 'text-slate-400 hover:text-white'}`}>
                        {record.folder === f ? '✓ ' : ''}{f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {record.folder && <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1"><Folder className="w-3 h-3" />{record.folder}</p>}
        {record.tags && record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {record.tags.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-purple-600/15 text-purple-400 border border-purple-500/20">{t}</span>)}
          </div>
        )}
        <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(record.duration)}</span>
          <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatBytes(record.size)}</span>
        </div>
      </div>
    </div>
  );
}

function SaveDialogWithFolder({ folders, onSave, onDiscard }: {
  folders: string[]; onSave: (title: string, tags: string[], folder?: string) => void; onDiscard: () => void;
}) {
  const [title, setTitle] = useState(`Recording ${new Date().toLocaleString()}`);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [folder, setFolder] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const addTag = () => {
    const val = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (val && !tags.includes(val)) setTags(prev => [...prev, val]);
    setTagInput('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-purple-500/20">
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">💾 Save Recording</h2>
          <p className="text-slate-400 text-sm mt-1">Name your recording before saving.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Title</label>
            <input ref={inputRef} type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><Tag className="w-3 h-3" /> Tags</label>
            <div className="min-h-[46px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-purple-500">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-purple-600/30 text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-500/30">
                  {t}<button onClick={() => setTags(p => p.filter(x => x !== t))} className="ml-0.5 text-purple-400 hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ' || e.key === ',') { e.preventDefault(); addTag(); } }}
                onBlur={addTag} placeholder={tags.length === 0 ? 'demo, work, tutorial…' : ''}
                className="flex-1 min-w-[80px] bg-transparent outline-none text-white text-sm placeholder:text-slate-600" />
            </div>
          </div>
          {folders.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><Folder className="w-3 h-3" /> Folder</label>
              <div className="relative">
                <select value={folder} onChange={e => setFolder(e.target.value)}
                  style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer">
                  <option value="" style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>No folder</option>
                  {folders.map(f => <option key={f} value={f} style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>{f}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onDiscard} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all">Discard</button>
          <button onClick={() => onSave(title, tags, folder || undefined)} className="flex-[2] px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all">Save Recording</button>
        </div>
      </div>
    </div>
  );
}
// ─── Virtual Background Picker ───────────────────────────────────────────────
