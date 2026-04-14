'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { saveVideo, VideoRecord, TranscriptSegment, Chapter } from '@/lib/db';
import { TranscriptRecorder } from '@/lib/transcript';
import { BackgroundBlur } from '@/lib/bgBlur';
import { drawFrame, FrameStyle, drawKJ } from '@/lib/videoFrame';
import { drawTicker, drawClock, drawLiveBadge, drawIntroCard, drawCamBigScene, KJQueueItem, resetTickerOffset, drawScoreboard } from '@/lib/broadcastOverlays';

export type RecorderState = 'idle' | 'countdown' | 'recording' | 'paused' | 'saving';
export type Quality = '480p' | '720p' | '1080p';
export type WebcamShape = 'circle' | 'square' | 'rounded';
export type WebcamPosition = 'tl' | 'tr' | 'bl' | 'br';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';
export interface SaveInfo { title: string; tags: string[]; folder?: string }

const QUALITY_PRESETS: Record<Quality, { width: number; height: number; fps: number }> = {
  '480p':  { width: 854,  height: 480,  fps: 30 },
  '720p':  { width: 1280, height: 720,  fps: 30 },
  '1080p': { width: 1920, height: 1080, fps: 30 },
};

// Countdown beep via Web Audio API
function playBeep(freq = 880, duration = 0.12, vol = 0.25) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), 1000);
  } catch { /* non-fatal */ }
}

interface UseRecorderOptions {
  onSaved?: (id: string) => void;
  onRequestTitle?: () => Promise<SaveInfo | null>;
  /** Optional callback: draw extra content (e.g. guest video grid) onto the output canvas each frame */
  onDrawGuests?: (ctx: CanvasRenderingContext2D, outW: number, outH: number) => void;
}

export function useRecorder({ onSaved, onRequestTitle, onDrawGuests }: UseRecorderOptions = {}) {
  const onDrawGuestsRef = useRef<((ctx: CanvasRenderingContext2D, outW: number, outH: number) => void) | undefined>(undefined);
  useEffect(() => { onDrawGuestsRef.current = onDrawGuests; }, [onDrawGuests]);

  const [state, setState] = useState<RecorderState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  // ─── Settings ───────────────────────────────────────────────────
  const [withCam, setWithCam] = useState(true);
  const [withMic, setWithMic] = useState(true);
  const [withSystemAudio, setWithSystemAudio] = useState(true);
  const [audioOnly, setAudioOnly] = useState(false);
  const [webcamOnly, setWebcamOnly] = useState(false); // no screen, just cam
  const [webtvBg, setWebtvBg] = useState<string | null>(null); // /webtv-bg/bgN.png or null
  const webtvBgRef = useRef<string | null>(null);
  const webtvBgImgRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    webtvBgRef.current = webtvBg;
    if (webtvBg) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = webtvBg;
      img.onload = () => { webtvBgImgRef.current = img; };
    } else {
      webtvBgImgRef.current = null;
    }
  }, [webtvBg]);

  // ─── Webcam preview stream (for live monitor during recording) ────
  const [camPreviewStream, setCamPreviewStream] = useState<MediaStream | null>(null);


  // ─── Audio Mixer ──────────────────────────────────────────────────
  const [micVolume, setMicVolume] = useState(100);       // 0-150
  const [systemVolume, setSystemVolume] = useState(100); // 0-150
  const micGainRef = useRef<GainNode | null>(null);
  const systemGainRef = useRef<GainNode | null>(null);
  useEffect(() => { if (micGainRef.current) micGainRef.current.gain.value = micVolume / 100; }, [micVolume]);
  useEffect(() => { if (systemGainRef.current) systemGainRef.current.gain.value = systemVolume / 100; }, [systemVolume]);

  // ─── Color / Grading Filter ───────────────────────────────────────
  const [videoBrightness, setVideoBrightness] = useState(100); // 50-150
  const [videoContrast, setVideoContrast]     = useState(100); // 50-150
  const [videoSaturation, setVideoSaturation] = useState(100); // 0-200
  const videoFilterRef = useRef('none');
  useEffect(() => {
    const b = videoBrightness, c = videoContrast, s = videoSaturation;
    videoFilterRef.current = (b === 100 && c === 100 && s === 100) ? 'none' : `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
  }, [videoBrightness, videoContrast, videoSaturation]);

  // ─── Scoreboard ───────────────────────────────────────────────────
  const [scoreboardEnabled, setScoreboardEnabled] = useState(false);
  const [scoreLeft,  setScoreLeft]  = useState({ name: 'EV', score: 0, color: '#3b82f6' });
  const [scoreRight, setScoreRight] = useState({ name: 'MİS', score: 0, color: '#ef4444' });
  const scoreboardEnabledRef = useRef(false);
  const scoreLeftRef  = useRef({ name: 'EV',  score: 0, color: '#3b82f6' });
  const scoreRightRef = useRef({ name: 'MİS', score: 0, color: '#ef4444' });
  useEffect(() => { scoreboardEnabledRef.current = scoreboardEnabled; }, [scoreboardEnabled]);
  useEffect(() => { scoreLeftRef.current  = scoreLeft;  }, [scoreLeft]);
  useEffect(() => { scoreRightRef.current = scoreRight; }, [scoreRight]);

  // ─── Scene Transition ─────────────────────────────────────────────
  const sceneTransOpacityRef = useRef(1);
  const sceneTransTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggerSceneTransition = useCallback(() => {
    if (sceneTransTimerRef.current) clearInterval(sceneTransTimerRef.current);
    sceneTransOpacityRef.current = 0;
    let t = 0;
    sceneTransTimerRef.current = setInterval(() => {
      t += 33;
      sceneTransOpacityRef.current = Math.min(1, t / 400);
      if (t >= 400) { clearInterval(sceneTransTimerRef.current!); sceneTransTimerRef.current = null; }
    }, 33);
  }, []);

  const [quality, setQuality] = useState<Quality>('720p');
  const [webcamShape, setWebcamShape] = useState<WebcamShape>('circle');
  const [webcamPosition, setWebcamPosition] = useState<WebcamPosition>('br');
  const [webcamSizePct, setWebcamSizePct] = useState(22);    // % of recording height
  const [webcamRingColor, setWebcamRingColor] = useState('#7c3aed');
  const [withTranscript, setWithTranscript] = useState(false);
  const [transcriptLang, setTranscriptLang] = useState('tr-TR');
  const [withIntroFade, setWithIntroFade] = useState(false);
  const [withCountdownSound, setWithCountdownSound] = useState(true);
  const [showMouseHighlight, setShowMouseHighlight] = useState(false);
  const [showKeyDisplay, setShowKeyDisplay] = useState(false);
  const [autoStopMinutes, setAutoStopMinutes] = useState(0); // 0 = disabled
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [withBgBlur, setWithBgBlur] = useState(false);
  const [withVirtualStudio, setWithVirtualStudio] = useState(false); // AI bg removal + studio image replace
  const withVirtualStudioRef = useRef(false);
  useEffect(() => { withVirtualStudioRef.current = withVirtualStudio; }, [withVirtualStudio]);

  // ─── Virtual Studio model ready indicator (must be after withVirtualStudio) ───
  const [vsModelReady, setVsModelReady] = useState(false);
  const [vsModelError, setVsModelError] = useState<string | null>(null);
  useEffect(() => {
    if (!withVirtualStudio) { setVsModelReady(false); setVsModelError(null); return; }
    setVsModelError(null);
    const poll = setInterval(() => {
      const bg = bgBlurRef.current;
      if (bg?.loaded) { setVsModelReady(true); clearInterval(poll); }
      else if (bg?.error) { setVsModelError(bg.error); clearInterval(poll); }
    }, 500);
    return () => clearInterval(poll);
  }, [withVirtualStudio, state]);
  const [studioAudio, setStudioAudio] = useState(false);
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('none');
  const frameStyleRef = useRef<FrameStyle>('none');
  useEffect(() => { frameStyleRef.current = frameStyle; }, [frameStyle]);

  // ─── Logo watermark ──────────────────────────────────────────────
  const [logoWatermark, setLogoWatermark] = useState(false);
  const [logoPosition, setLogoPosition] = useState<'br' | 'tr' | 'bl' | 'tl'>('br');
  const [logoSize, setLogoSize] = useState(9); // % of video height, 5-25
  const [logoUrl, setLogoUrl] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('screensnap_brand_logo') || '') : ''
  );
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoWatermarkRef = useRef(false);
  const logoPositionRef = useRef<'br' | 'tr' | 'bl' | 'tl'>('br');
  const logoSizeRef = useRef(9);
  const logoUrlRef = useRef('');
  useEffect(() => { logoWatermarkRef.current = logoWatermark; }, [logoWatermark]);
  useEffect(() => { logoPositionRef.current = logoPosition; }, [logoPosition]);
  useEffect(() => { logoSizeRef.current = logoSize; }, [logoSize]);
  useEffect(() => {
    logoUrlRef.current = logoUrl;
    if (logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      img.onload = () => { logoImgRef.current = img; };
      img.onerror = () => { logoImgRef.current = null; };
    } else {
      logoImgRef.current = null;
    }
  }, [logoUrl]);

  // ─── KJ (Lower Third) overlay ───────────────────────────────────────────
  const [kjEnabled, setKjEnabled] = useState(false);
  const [kjLine1, setKjLine1] = useState('');
  const [kjLine2, setKjLine2] = useState('');
  const [kjStyle, setKjStyle] = useState<'bar' | 'glass' | 'neon' | 'branded' | 'minimal'>('bar');
  const [kjPosition, setKjPosition] = useState<'bl' | 'bc' | 'br' | 'tl'>('bl');
  const [kjDuration, setKjDuration] = useState<number>(0); // 0 = always, N = first N seconds
  const kjEnabledRef = useRef(false);
  const kjLine1Ref = useRef('');
  const kjLine2Ref = useRef('');
  const kjStyleRef = useRef<'bar' | 'glass' | 'neon' | 'branded' | 'minimal'>('bar');
  const kjPositionRef = useRef<'bl' | 'bc' | 'br' | 'tl'>('bl');
  const kjDurationRef = useRef<number>(0);
  useEffect(() => { kjEnabledRef.current = kjEnabled; }, [kjEnabled]);
  useEffect(() => { kjLine1Ref.current = kjLine1; }, [kjLine1]);
  useEffect(() => { kjLine2Ref.current = kjLine2; }, [kjLine2]);
  useEffect(() => { kjStyleRef.current = kjStyle; }, [kjStyle]);
  useEffect(() => { kjPositionRef.current = kjPosition; }, [kjPosition]);
  useEffect(() => { kjDurationRef.current = kjDuration; }, [kjDuration]);

  // ─── Broadcast / Web TV ───────────────────────────────────────────
  type BroadcastScene = 'screen' | 'cam-big' | 'cam-only' | 'intro';
  const [broadcastScene, setBroadcastScene] = useState<BroadcastScene>('screen');
  const broadcastSceneRef = useRef<BroadcastScene>('screen');
  useEffect(() => { broadcastSceneRef.current = broadcastScene; }, [broadcastScene]);

  const [tickerEnabled, setTickerEnabled] = useState(false);
  const [tickerText, setTickerText] = useState('');
  const [tickerSpeed, setTickerSpeed] = useState(80);
  const tickerEnabledRef = useRef(false);
  const tickerTextRef = useRef('');
  const tickerSpeedRef = useRef(80);
  useEffect(() => { tickerEnabledRef.current = tickerEnabled; }, [tickerEnabled]);
  useEffect(() => { tickerTextRef.current = tickerText; }, [tickerText]);
  useEffect(() => { tickerSpeedRef.current = tickerSpeed; }, [tickerSpeed]);

  const [clockEnabled, setClockEnabled] = useState(false);
  const [clockPosition, setClockPosition] = useState<'tl' | 'tr'>('tr');
  const clockEnabledRef = useRef(false);
  const clockPositionRef = useRef<'tl' | 'tr'>('tr');
  useEffect(() => { clockEnabledRef.current = clockEnabled; }, [clockEnabled]);
  useEffect(() => { clockPositionRef.current = clockPosition; }, [clockPosition]);

  const [liveBadge, setLiveBadge] = useState(false);
  const [liveBadgePosition, setLiveBadgePosition] = useState<'tl' | 'tr'>('tl');
  const liveBadgeRef = useRef(false);
  const liveBadgePosRef = useRef<'tl' | 'tr'>('tl');
  useEffect(() => { liveBadgeRef.current = liveBadge; }, [liveBadge]);
  useEffect(() => { liveBadgePosRef.current = liveBadgePosition; }, [liveBadgePosition]);

  const [introTitle, setIntroTitle] = useState('');
  const [introSubtitle, setIntroSubtitle] = useState('');
  const introTitleRef = useRef('');
  const introSubtitleRef = useRef('');
  useEffect(() => { introTitleRef.current = introTitle; }, [introTitle]);
  useEffect(() => { introSubtitleRef.current = introSubtitle; }, [introSubtitle]);

  const [kjQueue, setKjQueue] = useState<KJQueueItem[]>([]);
  const kjQueueRef = useRef<KJQueueItem[]>([]);
  useEffect(() => { kjQueueRef.current = kjQueue; }, [kjQueue]);

  // ─── Internal refs ───────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioRafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef(0);
  const isCancellingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const transcriptRef = useRef<TranscriptRecorder | null>(null);
  const chaptersRef = useRef<Chapter[]>([]);
  const introStartRef = useRef<number>(0);
  const bgBlurRef = useRef<BackgroundBlur | null>(null);
  /** Live share: expose the final media stream so PeerJS can broadcast it */
  const liveStreamRef = useRef<MediaStream | null>(null);
  /** Live cam position (normalized 0-1 of output canvas). -1 = use webcamPosition setting */
  const liveCamXPctRef = useRef<number>(-1);
  const liveCamYPctRef = useRef<number>(-1);
  const liveCamDiamRef = useRef<number>(-1);  // actual pixel size in output canvas

  /** Overlay canvases — compositor draws both onto the output */
  const annotationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  // ─── Timer ────────────────────────────────────────────────────────
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopTimerRef.current) { clearTimeout(autoStopTimerRef.current); autoStopTimerRef.current = null; }
  };
  const startTimer = (base = 0) => {
    startTimeRef.current = Date.now() - base * 1000;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  };

  // ─── Cleanup ──────────────────────────────────────────────────────
  const stopAllStreams = useCallback(() => {
    if (rafRef.current) { clearInterval(rafRef.current); rafRef.current = null; }
    if (audioRafRef.current) { cancelAnimationFrame(audioRafRef.current); audioRafRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    camStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null; camStreamRef.current = null;
    bgBlurRef.current?.destroy(); bgBlurRef.current = null;
    liveStreamRef.current = null;
    setAudioLevel(0);
  }, []);

  // ─── Add chapter ──────────────────────────────────────────────────
  const addChapter = useCallback((label: string) => {
    const chapter: Chapter = { id: `ch_${Date.now()}`, time: elapsedRef.current, label };
    chaptersRef.current = [...chaptersRef.current, chapter];
  }, []);

  // ─── Set live cam position (called from CamPreview drag) ──────────
  const setCamLivePosition = useCallback((xPct: number, yPct: number) => {
    liveCamXPctRef.current = Math.max(0, Math.min(1, xPct));
    liveCamYPctRef.current = Math.max(0, Math.min(1, yPct));
  }, []);

  const resetCamLivePosition = useCallback(() => {
    liveCamXPctRef.current = -1;
    liveCamYPctRef.current = -1;
  }, []);

  // ─── Draw cam on canvas ───────────────────────────────────────────
  const drawCam = useCallback((
    ctx: CanvasRenderingContext2D,
    camVid: HTMLVideoElement,
    camDiam: number, camX: number, camY: number,
    shape: WebcamShape, ringColor: string
  ) => {
    ctx.save();
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(camX + camDiam / 2, camY + camDiam / 2, camDiam / 2, 0, Math.PI * 2);
      ctx.clip();
    } else if (shape === 'rounded') {
      const r = camDiam * 0.18;
      if (ctx.roundRect) ctx.roundRect(camX, camY, camDiam, camDiam, r); else ctx.rect(camX, camY, camDiam, camDiam);
      ctx.clip();
    }
    ctx.drawImage(camVid, camX, camY, camDiam, camDiam);
    ctx.restore();
    // Ring
    if (shape !== 'square') {
      ctx.save();
      ctx.beginPath();
      if (shape === 'circle') ctx.arc(camX + camDiam / 2, camY + camDiam / 2, camDiam / 2 + 2, 0, Math.PI * 2);
      else { const r = camDiam * 0.18 + 2; if (ctx.roundRect) ctx.roundRect(camX - 2, camY - 2, camDiam + 4, camDiam + 4, r); else ctx.rect(camX - 2, camY - 2, camDiam + 4, camDiam + 4); }
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  // ─── START ────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    chunksRef.current = [];
    chaptersRef.current = [];
    isCancellingRef.current = false;
    setElapsed(0); elapsedRef.current = 0;

    // Countdown with optional sound
    setState('countdown');
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      if (withCountdownSound) playBeep(i === 1 ? 1320 : 880, 0.15);
      await new Promise(r => setTimeout(r, 1000));
    }
    if (withCountdownSound) playBeep(1760, 0.2); // final beep

    try {
      // ── Audio-only ────────────────────────────────────────────────
      if (audioOnly) {
        const audioConstraints = { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        };
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
        camStreamRef.current = micStream;
        if (withTranscript) { transcriptRef.current = new TranscriptRecorder(transcriptLang); transcriptRef.current.start(transcriptLang); }

        try {
          const actx = new AudioContext(); audioCtxRef.current = actx;
          const analyser = actx.createAnalyser(); analyser.fftSize = 256;
          actx.createMediaStreamSource(micStream).connect(analyser);
          const arr = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => { analyser.getByteFrequencyData(arr); setAudioLevel(Math.min(100, (arr.reduce((a,b)=>a+b,0)/arr.length/128)*200)); audioRafRef.current = requestAnimationFrame(tick); };
          tick();
        } catch { /* non-fatal */ }

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        const recorder = new MediaRecorder(micStream, { mimeType });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          stopTimer();
          const transcript = transcriptRef.current?.stop() ?? []; transcriptRef.current = null;
          if (isCancellingRef.current) { isCancellingRef.current = false; stopAllStreams(); setState('idle'); setElapsed(0); return; }
          setState('saving');
          const blob = new Blob(chunksRef.current, { type: mimeType });
          let saveInfo: SaveInfo | null = { title: `Audio ${new Date().toLocaleString()}`, tags: [] };
          if (onRequestTitle) saveInfo = await onRequestTitle();
          if (!saveInfo) { stopAllStreams(); setState('idle'); setElapsed(0); return; }
          await saveVideo({ id: `rec_${Date.now()}`, title: saveInfo.title, blob, duration: elapsedRef.current, size: blob.size, createdAt: Date.now(), tags: saveInfo.tags, folder: saveInfo.folder, transcript, chapters: chaptersRef.current });
          stopAllStreams(); setState('idle'); setElapsed(0); onSaved?.(`rec_${Date.now()}`);
        };
        recorder.start(250); setState('recording'); startTimer(0);

        // Auto-stop
        if (autoStopMinutes > 0) {
          autoStopTimerRef.current = setTimeout(() => { if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop(); }, autoStopMinutes * 60_000);
        }
        return;
      }

      // ── Webcam-only recording (no screen capture) ───────────────────
      if (webcamOnly) {
        const audioConstraints = withMic ? { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        } : false;
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: 30 },
          audio: audioConstraints,
        });
        camStreamRef.current = camStream;
        setCamPreviewStream(camStream); // expose for live monitor
        if (withTranscript) { transcriptRef.current = new TranscriptRecorder(transcriptLang); transcriptRef.current.start(transcriptLang); }

        // Canvas output — 16:9 webcam
        const preset = QUALITY_PRESETS[quality];
        let outW = preset.width; let outH = preset.height;
        if (aspectRatio === '1:1') { outW = outH = Math.min(outW, outH); }
        else if (aspectRatio === '4:3') { outH = Math.round(outW * 3 / 4); }
        const canvas = document.createElement('canvas');
        canvas.width = outW; canvas.height = outH;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        const camVid = document.createElement('video');
        camVid.srcObject = camStream; camVid.muted = true; camVid.playsInline = true;
        await camVid.play();

        // If virtual studio is requested, initialise the MediaPipe segmenter
        if (withVirtualStudio || withBgBlur) {
          bgBlurRef.current = new BackgroundBlur(outW, outH);
          bgBlurRef.current.load().catch(() => { /* non-fatal */ });
        }

        introStartRef.current = Date.now();
        resetTickerOffset();

        const drawCamOnly = () => {
          try {
            const nowMs = Date.now();
            const brandColor = localStorage.getItem('screensnap_brand_color') || '#7c3aed';

            // Background gradient
            // Background: webtv bg image or gradient
            if (webtvBgImgRef.current) {
              // Draw bg image letterboxed
              const bw = webtvBgImgRef.current.naturalWidth || 1920;
              const bh = webtvBgImgRef.current.naturalHeight || 1080;
              const bAspect = bw / bh;
              const cAspect = outW / outH;
              let bsx = 0, bsy = 0, bsw = bw, bsh = bh;
              if (bAspect > cAspect) { bsw = bsh * cAspect; bsx = (bw - bsw) / 2; }
              else { bsh = bsw / cAspect; bsy = (bh - bsh) / 2; }
              ctx.drawImage(webtvBgImgRef.current, bsx, bsy, bsw, bsh, 0, 0, outW, outH);
            } else {
              const bg = ctx.createLinearGradient(0, 0, 0, outH);
              bg.addColorStop(0, '#0d0b1e'); bg.addColorStop(1, '#1a1530');
              ctx.fillStyle = bg; ctx.fillRect(0, 0, outW, outH);
            }

            // Color/grading filter
            ctx.filter = videoFilterRef.current;

            // ── Virtual Studio: AI background removal + studio image ─────
            // IMPORTANT: only use AI path when model is fully loaded
            // (otherwise resultCanvas is empty/transparent → person disappears)
            const vsReady = withVirtualStudioRef.current && bgBlurRef.current?.loaded;

            if (vsReady && webtvBgImgRef.current) {
              // AI background replace: studio image as BG, person as FG
              bgBlurRef.current!.processFrameWithBg(camVid, webtvBgImgRef.current);
              ctx.drawImage(bgBlurRef.current!.resultCanvas, 0, 0, outW, outH);
            } else if (vsReady) {
              // Virtual studio on but no bg image: blur fallback
              bgBlurRef.current!.processFrame(camVid);
              ctx.drawImage(bgBlurRef.current!.resultCanvas, 0, 0, outW, outH);
            } else {
              // Normal: draw webcam (fit to canvas, letterboxed) on top of already-drawn bg
              const vw = camVid.videoWidth || 1280;
              const vh = camVid.videoHeight || 720;
              const srcAspect = vw / vh;
              const dstAspect = outW / outH;
              let sx = 0, sy = 0, sw = vw, sh = vh;
              if (Math.abs(srcAspect - dstAspect) > 0.01) {
                if (srcAspect > dstAspect) { sw = sh * dstAspect; sx = (vw - sw) / 2; }
                else { sh = sw / dstAspect; sy = (vh - sh) / 2; }
              }
              ctx.drawImage(camVid, sx, sy, sw, sh, 0, 0, outW, outH);
            }
            ctx.filter = 'none';

            // Frame overlay
            if (frameStyleRef.current !== 'none') drawFrame(ctx, outW, outH, frameStyleRef.current, brandColor, nowMs / 1000);

            // Logo
            if (logoWatermarkRef.current && logoImgRef.current) {
              const img = logoImgRef.current;
              const pad = 18;
              const maxH = Math.round(outH * (logoSizeRef.current / 100));
              const scale = maxH / img.naturalHeight;
              const lw = Math.round(img.naturalWidth * scale), lh = maxH;
              const pos = logoPositionRef.current;
              const lx = (pos === 'br' || pos === 'tr') ? outW - lw - pad : pad;
              const ly = (pos === 'br' || pos === 'bl') ? outH - lh - pad : pad;
              ctx.save(); ctx.globalAlpha = 0.92; ctx.drawImage(img, lx, ly, lw, lh); ctx.restore();
            }

            // KJ overlay
            if (kjEnabledRef.current && (kjLine1Ref.current || kjLine2Ref.current)) {
              const elapsedSec = (nowMs - introStartRef.current) / 1000;
              if (kjDurationRef.current === 0 || elapsedSec <= kjDurationRef.current)
                drawKJ(ctx, outW, outH, kjLine1Ref.current, kjLine2Ref.current, kjStyleRef.current, kjPositionRef.current, brandColor, elapsedSec);
            }

            // Broadcast overlays
            if (tickerEnabledRef.current && tickerTextRef.current) drawTicker(ctx, outW, outH, tickerTextRef.current, nowMs, tickerSpeedRef.current, brandColor);
            if (clockEnabledRef.current) drawClock(ctx, outW, outH, clockPositionRef.current, true);
            if (liveBadgeRef.current) drawLiveBadge(ctx, outW, outH, nowMs, liveBadgePosRef.current);
            if (scoreboardEnabledRef.current) drawScoreboard(ctx, outW, outH, scoreLeftRef.current, scoreRightRef.current);
            // Scene fade-in
            if (sceneTransOpacityRef.current < 1) { ctx.save(); ctx.fillStyle = `rgba(0,0,0,${1-sceneTransOpacityRef.current})`; ctx.fillRect(0,0,outW,outH); ctx.restore(); }
          } catch (e) { console.warn('[ScreenSnap] webcamOnly draw error:', e); }
          // NOTE: no self-scheduling — setInterval handles this automatically
        };
        // Start interval-based draw loop (continues even when tab is backgrounded)
        rafRef.current = setInterval(drawCamOnly, 33) as unknown as number;
        drawCamOnly(); // draw first frame immediately

        // Audio visualizer
        try {
          const actx = new AudioContext(); audioCtxRef.current = actx;
          const analyser = actx.createAnalyser(); analyser.fftSize = 256;
          if (withMic) { actx.createMediaStreamSource(camStream).connect(analyser); }
          const arr = new Uint8Array(analyser.frequencyBinCount);
          const tickAudio = () => { analyser.getByteFrequencyData(arr); setAudioLevel(Math.min(100, (arr.reduce((a,b)=>a+b,0)/arr.length/128)*200)); audioRafRef.current = requestAnimationFrame(tickAudio); };
          tickAudio();
        } catch { /* non-fatal */ }

        const canvasStream = canvas.captureStream(30);
        const audioTracks = withMic ? camStream.getAudioTracks() : [];
        const finalStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
        liveStreamRef.current = finalStream;

        const hasAudio = withMic && camStream.getAudioTracks().length > 0;
        const mimeType = hasAudio
          ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm')
          : (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm');
        const recorder = new MediaRecorder(finalStream, { mimeType, videoBitsPerSecond: 5_000_000 });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          if (rafRef.current) { clearInterval(rafRef.current); rafRef.current = null; }
          stopTimer();
          const transcript = transcriptRef.current?.stop() ?? []; transcriptRef.current = null;
          if (isCancellingRef.current) { isCancellingRef.current = false; stopAllStreams(); setState('idle'); setElapsed(0); return; }
          setState('saving');
          const blob = new Blob(chunksRef.current, { type: mimeType });
          let thumbnail: string | undefined;
          try { thumbnail = await generateThumbnail(blob); } catch { /* non-fatal */ }
          let saveInfo: SaveInfo | null = { title: `Webcam ${new Date().toLocaleString()}`, tags: [] };
          if (onRequestTitle) saveInfo = await onRequestTitle();
          if (!saveInfo) { stopAllStreams(); setState('idle'); setElapsed(0); return; }
          const record: VideoRecord = { id: `rec_${Date.now()}`, title: saveInfo.title, blob, duration: elapsedRef.current, size: blob.size, createdAt: Date.now(), thumbnail, tags: saveInfo.tags, folder: saveInfo.folder, transcript, chapters: chaptersRef.current };
          await saveVideo(record);
          stopAllStreams(); setState('idle'); setElapsed(0); onSaved?.(record.id);
        };
        recorder.start(250); setState('recording'); startTimer(0);
        if (autoStopMinutes > 0) {
          autoStopTimerRef.current = setTimeout(() => { if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop(); }, autoStopMinutes * 60_000);
        }
        return;
      }

      // ── Auto-redirect: cam-only / intro scenes don't need screen capture ──
      // If the user has selected cam-only or intro broadcast scene,
      // treat it exactly like webcamOnly mode (no screen share needed).
      const sceneNeedsScreen = broadcastSceneRef.current === 'screen' || broadcastSceneRef.current === 'cam-big';
      if (!sceneNeedsScreen) {
        // Redirect into webcam-only path by re-triggering with webcamOnly flag
        // We just set the ref so the draw loop in webcamOnly path picks up the scene
        // Simply fall into webcamOnly branch below (duplicate minimal logic)
        // → already handled by webcamOnly path above if user sets mode correctly
        // For scenes that don't need a screen, force webcam path immediately:
        const preset2 = QUALITY_PRESETS[quality];
        let outW2 = preset2.width, outH2 = preset2.height;
        if (aspectRatio === '1:1') { outW2 = outH2 = Math.min(outW2, outH2); }
        else if (aspectRatio === '4:3') { outH2 = Math.round(outW2 * 3 / 4); }
        const canvas2 = document.createElement('canvas');
        canvas2.width = outW2; canvas2.height = outH2;
        const ctx2 = canvas2.getContext('2d') as CanvasRenderingContext2D;

        let sceneCamStream: MediaStream | null = null;
        try {
          const audioC = withMic ? { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
          } : false;
          sceneCamStream = await navigator.mediaDevices.getUserMedia({ video: { width: preset2.width, height: preset2.height, frameRate: 30 }, audio: audioC });
          camStreamRef.current = sceneCamStream;
        } catch { console.warn('[ScreenSnap] Camera/mic access denied for scene mode'); }

        const sceneCamVid = document.createElement('video');
        if (sceneCamStream) {
          sceneCamVid.srcObject = sceneCamStream;
          sceneCamVid.muted = true;
          sceneCamVid.playsInline = true;
          await sceneCamVid.play();
        }

        // Init AI background removal if requested
        if (withVirtualStudio || withBgBlur) {
          bgBlurRef.current = new BackgroundBlur(outW2, outH2);
          bgBlurRef.current.load().catch(() => { /* non-fatal */ });
        }

        if (withTranscript) { transcriptRef.current = new TranscriptRecorder(transcriptLang); transcriptRef.current.start(transcriptLang); }
        introStartRef.current = Date.now(); resetTickerOffset();

        const drawScene = () => {
          try {
            const nowMs = Date.now();
            const brandColor = localStorage.getItem('screensnap_brand_color') || '#7c3aed';
            const scene = broadcastSceneRef.current;
            // Background
            if (webtvBgImgRef.current) {
              const bw = webtvBgImgRef.current.naturalWidth || 1920, bh = webtvBgImgRef.current.naturalHeight || 1080;
              const bA = bw/bh, cA = outW2/outH2; let bsx=0,bsy=0,bsw=bw,bsh=bh;
              if(bA>cA){bsw=bsh*cA;bsx=(bw-bsw)/2;}else{bsh=bsw/cA;bsy=(bh-bsh)/2;}
              ctx2.drawImage(webtvBgImgRef.current,bsx,bsy,bsw,bsh,0,0,outW2,outH2);
            } else {
              const bg = ctx2.createLinearGradient(0,0,0,outH2); bg.addColorStop(0,'#0d0b1e'); bg.addColorStop(1,'#1a1530'); ctx2.fillStyle=bg; ctx2.fillRect(0,0,outW2,outH2);
            }
            if (scene === 'intro') {
              drawIntroCard(ctx2, outW2, outH2, logoImgRef.current, introTitleRef.current, introSubtitleRef.current, brandColor, nowMs);
            } else if (scene === 'cam-big' && sceneCamVid.readyState >= 2) {
              const vsReady = withVirtualStudioRef.current && bgBlurRef.current?.loaded;
              const activeCam = vsReady ? (bgBlurRef.current!.processFrame(sceneCamVid), bgBlurRef.current!.resultCanvas as unknown as HTMLVideoElement) : sceneCamVid;
              drawCamBigScene(ctx2, outW2, outH2, null as any, activeCam, brandColor, drawCam, webcamShape, webcamRingColor, webtvBgImgRef.current);
            } else if (sceneCamStream && sceneCamVid.readyState >= 2) {
              const vsReady = withVirtualStudioRef.current && bgBlurRef.current?.loaded;
              if (vsReady && webtvBgImgRef.current) {
                bgBlurRef.current!.processFrameWithBg(sceneCamVid, webtvBgImgRef.current);
                ctx2.drawImage(bgBlurRef.current!.resultCanvas, 0, 0, outW2, outH2);
              } else if (vsReady) {
                bgBlurRef.current!.processFrame(sceneCamVid);
                ctx2.drawImage(bgBlurRef.current!.resultCanvas, 0, 0, outW2, outH2);
              } else {
                const vw = sceneCamVid.videoWidth||1280, vh = sceneCamVid.videoHeight||720;
                const sA=vw/vh, dA=outW2/outH2; let sx=0,sy=0,sw=vw,sh=vh;
                if(Math.abs(sA-dA)>0.01){if(sA>dA){sw=sh*dA;sx=(vw-sw)/2;}else{sh=sw/dA;sy=(vh-sh)/2;}}
                ctx2.drawImage(sceneCamVid,sx,sy,sw,sh,0,0,outW2,outH2);
              }
            }
            // Overlays
            if (frameStyleRef.current !== 'none') drawFrame(ctx2, outW2, outH2, frameStyleRef.current, brandColor, nowMs/1000);
            if (logoWatermarkRef.current && logoImgRef.current) { const img=logoImgRef.current,pad=18,maxH=Math.round(outH2*(logoSizeRef.current/100)),scale=maxH/img.naturalHeight,lw=Math.round(img.naturalWidth*scale),lh=maxH,pos=logoPositionRef.current,lx=(pos==='br'||pos==='tr')?outW2-lw-pad:pad,ly=(pos==='br'||pos==='bl')?outH2-lh-pad:pad; ctx2.save();ctx2.globalAlpha=0.92;ctx2.drawImage(img,lx,ly,lw,lh);ctx2.restore(); }
            if (kjEnabledRef.current&&(kjLine1Ref.current||kjLine2Ref.current)){const es=(nowMs-introStartRef.current)/1000;if(kjDurationRef.current===0||es<=kjDurationRef.current)drawKJ(ctx2,outW2,outH2,kjLine1Ref.current,kjLine2Ref.current,kjStyleRef.current,kjPositionRef.current,brandColor,es);}
            if (tickerEnabledRef.current&&tickerTextRef.current) drawTicker(ctx2,outW2,outH2,tickerTextRef.current,nowMs,tickerSpeedRef.current,brandColor);
            if (clockEnabledRef.current) drawClock(ctx2,outW2,outH2,clockPositionRef.current,true);
            if (liveBadgeRef.current) drawLiveBadge(ctx2,outW2,outH2,nowMs,liveBadgePosRef.current);
          } catch(e) { console.warn('[ScreenSnap] scene draw error:',e); }
        };
        rafRef.current = setInterval(drawScene, 33) as unknown as number;
        drawScene();

        const canvasStream2 = canvas2.captureStream(preset2.fps);

        // ── Audio setup for scene-based recording (mic + system via AudioContext) ──
        const audioTracks2: MediaStreamTrack[] = [];
        try {
          const actx2 = new AudioContext(); audioCtxRef.current = actx2;
          const dest2 = actx2.createMediaStreamDestination();
          const analyser2 = actx2.createAnalyser(); analyser2.fftSize = 256;
          const arr2 = new Uint8Array(analyser2.frequencyBinCount);
          let conn2 = false;
          const tickAud2 = () => { analyser2.getByteFrequencyData(arr2); setAudioLevel(Math.min(100,(arr2.reduce((a,b)=>a+b,0)/arr2.length/128)*200)); audioRafRef.current = requestAnimationFrame(tickAud2); };
          tickAud2();
          // Microphone
          if (withMic && sceneCamStream?.getAudioTracks().length) {
            const mg = actx2.createGain(); mg.gain.value = micVolume / 100; micGainRef.current = mg;
            actx2.createMediaStreamSource(new MediaStream(sceneCamStream.getAudioTracks())).connect(mg);
            mg.connect(dest2); if (!conn2) { mg.connect(analyser2); conn2 = true; }
          }
          dest2.stream.getAudioTracks().forEach(t => audioTracks2.push(t));
        } catch { /* non-fatal */ }

        const finalStream2 = new MediaStream([...canvasStream2.getVideoTracks(), ...audioTracks2]);
        liveStreamRef.current = finalStream2;
        const hasAudio2 = audioTracks2.length > 0;
        const mimeType2 = hasAudio2 ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm') : (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm');
        const bps2 = quality === '1080p' ? 8_000_000 : quality === '720p' ? 5_000_000 : 2_500_000;
        const recorder2 = new MediaRecorder(finalStream2, { mimeType: mimeType2, videoBitsPerSecond: bps2 });
        mediaRecorderRef.current = recorder2;
        recorder2.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder2.onstop = async () => {
          if (rafRef.current) { clearInterval(rafRef.current); rafRef.current = null; }
          stopTimer();
          const transcript = transcriptRef.current?.stop() ?? []; transcriptRef.current = null;
          if (isCancellingRef.current) { isCancellingRef.current = false; stopAllStreams(); setState('idle'); setElapsed(0); return; }
          setState('saving');
          const blob2 = new Blob(chunksRef.current, { type: mimeType2 });
          let thumbnail2: string | undefined;
          try { thumbnail2 = await generateThumbnail(blob2); } catch { /* non-fatal */ }
          let saveInfo2: SaveInfo | null = { title: `Broadcast ${new Date().toLocaleString()}`, tags: [] };
          if (onRequestTitle) saveInfo2 = await onRequestTitle();
          if (!saveInfo2) { stopAllStreams(); setState('idle'); setElapsed(0); return; }
          const record2: VideoRecord = { id: `rec_${Date.now()}`, title: saveInfo2.title, blob: blob2, duration: elapsedRef.current, size: blob2.size, createdAt: Date.now(), thumbnail: thumbnail2, tags: saveInfo2.tags, folder: saveInfo2.folder, transcript, chapters: chaptersRef.current };
          await saveVideo(record2);
          stopAllStreams(); setState('idle'); setElapsed(0); onSaved?.(record2.id);
        };
        recorder2.start(250); setState('recording'); startTimer(0);
        if (autoStopMinutes > 0) { autoStopTimerRef.current = setTimeout(() => { if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop(); }, autoStopMinutes * 60_000); }
        return;
      }

      // ── Screen recording ──────────────────────────────────────────
      const preset = QUALITY_PRESETS[quality];
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: preset.width, height: preset.height, frameRate: preset.fps, cursor: 'always' } as MediaTrackConstraints,
        audio: withSystemAudio,
      });
      screenStreamRef.current = screenStream;

      let camStream: MediaStream | null = null;
      if (withCam || withMic) {
        try {
          const audioConstraints = withMic ? { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        } : false;
          camStream = await navigator.mediaDevices.getUserMedia({ 
            video: withCam ? { width: 320, height: 320, frameRate: 30 } : false, 
            audio: audioConstraints 
          });
          camStreamRef.current = camStream;
        } catch { console.warn('Camera/mic denied.'); }
      }

      if (withTranscript) { transcriptRef.current = new TranscriptRecorder(transcriptLang); transcriptRef.current.start(transcriptLang); }

      // Canvas setup with aspect ratio
      let outW = preset.width;
      let outH = preset.height;
      if (aspectRatio === '1:1') { outW = outH = Math.min(preset.width, preset.height); }
      else if (aspectRatio === '9:16') { [outW, outH] = [preset.height * 9 / 16, preset.height]; }
      else if (aspectRatio === '4:3') { outH = Math.round(preset.width * 3 / 4); }

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(outW); canvas.height = Math.round(outH);
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      const screenVid = document.createElement('video');
      screenVid.srcObject = screenStream; screenVid.muted = true; screenVid.playsInline = true;
      await screenVid.play();

      let camVid: HTMLVideoElement | null = null;
      if (camStream && withCam) {
        camVid = document.createElement('video');
        camVid.srcObject = camStream; camVid.muted = true; camVid.playsInline = true;
        await camVid.play();
      }

      // Init background blur if enabled
      if (withBgBlur && withCam) {
        bgBlurRef.current = new BackgroundBlur(320, 320);
        bgBlurRef.current.load().catch(err => {
          console.warn('Background blur failed to load:', err);
          bgBlurRef.current = null;
        });
      }

      const camDiam = Math.round(outH * (webcamSizePct / 100));
      liveCamDiamRef.current = camDiam;
      const margin = 24;
      // Initialize live position from webcamPosition setting
      liveCamXPctRef.current = -1;
      liveCamYPctRef.current = -1;

      const getCamXY = () => {
        const d = liveCamDiamRef.current;
        if (liveCamXPctRef.current >= 0 && liveCamYPctRef.current >= 0) {
          return {
            camX: Math.round(liveCamXPctRef.current * (outW - d)),
            camY: Math.round(liveCamYPctRef.current * (outH - d)),
          };
        }
        return {
          camX: webcamPosition.includes('r') ? outW - d - margin : margin,
          camY: webcamPosition.includes('b') ? outH - d - margin : margin,
        };
      };

      introStartRef.current = Date.now();
      resetTickerOffset();

      const draw = () => {
        try {
          const nowMs = Date.now();
          const scene = broadcastSceneRef.current;
          const brandColor = localStorage.getItem('screensnap_brand_color') || '#7c3aed';

        if (scene === 'intro') {
          // ── Branded intro card (no screen, no cam)
          drawIntroCard(ctx, outW, outH, logoImgRef.current, introTitleRef.current, introSubtitleRef.current, brandColor, nowMs);
        } else if (scene === 'cam-only' && camVid) {
          // ── Camera only — webtv bg + large cam
          if (webtvBgImgRef.current) {
            const bw = webtvBgImgRef.current.naturalWidth || 1920, bh = webtvBgImgRef.current.naturalHeight || 1080;
            const bA = bw/bh, cA = outW/outH;
            let bsx=0,bsy=0,bsw=bw,bsh=bh;
            if(bA>cA){bsw=bsh*cA;bsx=(bw-bsw)/2;}else{bsh=bsw/cA;bsy=(bh-bsh)/2;}
            ctx.drawImage(webtvBgImgRef.current,bsx,bsy,bsw,bsh,0,0,outW,outH);
          } else {
            const bg2 = ctx.createLinearGradient(0,0,0,outH);
            bg2.addColorStop(0,'#0d0b1e'); bg2.addColorStop(1,'#1a1530');
            ctx.fillStyle=bg2; ctx.fillRect(0,0,outW,outH);
          }
          const camSize = Math.round(outH * 0.78);
          const camX = Math.round((outW - camSize) / 2);
          const camY = Math.round((outH - camSize) / 2);
          if (withBgBlur && bgBlurRef.current?.loaded) {
            bgBlurRef.current.processFrame(camVid);
            drawCam(ctx, bgBlurRef.current.resultCanvas as unknown as HTMLVideoElement, camSize, camX, camY, webcamShape, webcamRingColor);
          } else {
            drawCam(ctx, camVid, camSize, camX, camY, webcamShape, webcamRingColor);
          }
        } else if (scene === 'cam-big' && camVid) {
          const vsReady = withVirtualStudioRef.current && bgBlurRef.current?.loaded;
          const activeCam = vsReady ? (bgBlurRef.current!.processFrame(camVid), bgBlurRef.current!.resultCanvas as unknown as HTMLVideoElement) : camVid;
          drawCamBigScene(ctx, outW, outH, screenVid, activeCam, brandColor, drawCam, webcamShape, webcamRingColor, webtvBgImgRef.current);
        } else {
          // ── Default 'screen' scene: screen fills canvas, cam PiP corner
          const srcAspect = screenVid.videoWidth / (screenVid.videoHeight || 1);
          const dstAspect = outW / outH;
          let sx = 0, sy = 0, sw = screenVid.videoWidth, sh = screenVid.videoHeight;
          if (Math.abs(srcAspect - dstAspect) > 0.01) {
            if (srcAspect > dstAspect) { sw = sh * dstAspect; sx = (screenVid.videoWidth - sw) / 2; }
            else { sh = sw / dstAspect; sy = (screenVid.videoHeight - sh) / 2; }
          }
          ctx.drawImage(screenVid, sx, sy, sw, sh, 0, 0, outW, outH);

          // Annotation (draw tool)
          if (annotationCanvasRef.current) ctx.drawImage(annotationCanvasRef.current, 0, 0, outW, outH);
          // Mouse/key interaction overlay
          if (interactionCanvasRef.current) ctx.drawImage(interactionCanvasRef.current, 0, 0, outW, outH);

          // Webcam PiP
          if (camVid && withCam) {
            const { camX, camY } = getCamXY();
            const camDiam = liveCamDiamRef.current;
            if (withBgBlur && bgBlurRef.current?.loaded) {
              bgBlurRef.current.processFrame(camVid);
              drawCam(ctx, bgBlurRef.current.resultCanvas as unknown as HTMLVideoElement, camDiam, camX, camY, webcamShape, webcamRingColor);
            } else {
              drawCam(ctx, camVid, camDiam, camX, camY, webcamShape, webcamRingColor);
            }
          }
        }

        // Intro fade (only in screen scene)
        if (withIntroFade && scene === 'screen') {
          const t = (nowMs - introStartRef.current) / 2000;
          if (t < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - t})`; ctx.fillRect(0, 0, outW, outH); }
        }

        // Video frame overlay
        if (frameStyleRef.current !== 'none') {
          const brandColor = localStorage.getItem('screensnap_brand_color') || '#7c3aed';
          drawFrame(ctx, outW, outH, frameStyleRef.current, brandColor, Date.now() / 1000);
        }

        // Logo watermark
        if (logoWatermarkRef.current && logoImgRef.current) {
          const img = logoImgRef.current;
          const pad = 18;
          const maxH = Math.round(outH * (logoSizeRef.current / 100));
          const scale = maxH / img.naturalHeight;
          const lw = Math.round(img.naturalWidth * scale);
          const lh = maxH;
          const pos = logoPositionRef.current;
          const lx = (pos === 'br' || pos === 'tr') ? outW - lw - pad : pad;
          const ly = (pos === 'br' || pos === 'bl') ? outH - lh - pad : pad;
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.55)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 2;
          ctx.globalAlpha = 0.92;
          ctx.drawImage(img, lx, ly, lw, lh);
          ctx.restore();
        }

        // KJ (Lower Third) overlay
        if (kjEnabledRef.current && (kjLine1Ref.current || kjLine2Ref.current)) {
          // Compute elapsed directly from wall clock so it's always accurate in the draw loop
          const elapsedSec = (Date.now() - introStartRef.current) / 1000;
          const dur = kjDurationRef.current;
          const show = dur === 0 || elapsedSec <= dur;
          if (show) {
            const line1 = kjLine1Ref.current;
            const line2 = kjLine2Ref.current;
            const style = kjStyleRef.current;
            const kjPos = kjPositionRef.current;
            const brandColor = localStorage.getItem('screensnap_brand_color') || '#7c3aed';
            drawKJ(ctx, outW, outH, line1, line2, style, kjPos, brandColor, elapsedSec);
          }
        }


        // ── Broadcast overlays (top layer) ──────────────────────
        // News ticker
        if (tickerEnabledRef.current && tickerTextRef.current) {
          drawTicker(ctx, outW, outH, tickerTextRef.current, nowMs, tickerSpeedRef.current, brandColor);
        }
        // Clock
        if (clockEnabledRef.current) {
          drawClock(ctx, outW, outH, clockPositionRef.current, true);
        }
        // Live badge
        if (liveBadgeRef.current) {
          drawLiveBadge(ctx, outW, outH, nowMs, liveBadgePosRef.current);
        }
        // KJ Queue (timed)
        if (kjQueueRef.current.length > 0) {
          const elapsedSec = (nowMs - introStartRef.current) / 1000;
          for (const item of kjQueueRef.current) {
            const itemDur = item.duration > 0 ? item.duration : 5;
            if (elapsedSec >= item.showAt && elapsedSec < item.showAt + itemDur) {
              drawKJ(ctx, outW, outH, item.line1, item.line2, 'bar', 'bl', brandColor, elapsedSec - item.showAt);
              break;
            }
          }
        }

        // ── Guest video grid ──────────────────────────────────────
        if (onDrawGuestsRef.current) {
          onDrawGuestsRef.current(ctx, outW, outH);
        }

        } catch (e) { console.warn('[ScreenSnap] draw error:', e); }
        // NOTE: no self-scheduling — setInterval handles this
      };
      // Start interval-based draw loop (30fps, background-tab safe)
      rafRef.current = setInterval(draw, 33) as unknown as number;
      draw(); // draw first frame immediately

      // Audio
      const audioTracks: MediaStreamTrack[] = [];
      try {
        const actx = new AudioContext(); audioCtxRef.current = actx;
        const dest = actx.createMediaStreamDestination();
        const analyser = actx.createAnalyser(); analyser.fftSize = 256;
        const arr = new Uint8Array(analyser.frequencyBinCount);
        let connected = false;
        const tickAudio = () => { analyser.getByteFrequencyData(arr); setAudioLevel(Math.min(100, (arr.reduce((a,b)=>a+b,0)/arr.length/128)*200)); audioRafRef.current = requestAnimationFrame(tickAudio); };
        tickAudio();

        // System audio from screen share — ALWAYS use if the user shared audio in Chrome picker
        // (We still request audio in getDisplayMedia when withSystemAudio=true, but if Chrome gives
        // audio tracks regardless, we should always use them — this fixes Kamera+PIP audio.)
        const screenAudioTracks = screenStream.getAudioTracks();
        if (screenAudioTracks.length > 0) {
          const sysGain = actx.createGain();
          sysGain.gain.value = systemVolume / 100;
          systemGainRef.current = sysGain;
          const src = actx.createMediaStreamSource(new MediaStream(screenAudioTracks));
          src.connect(sysGain);
          sysGain.connect(dest);
          if (!connected) { sysGain.connect(analyser); connected = true; }
        }

        // Microphone audio — with GainNode for mixer
        if (withMic && camStream?.getAudioTracks().length) {
          const micGain = actx.createGain();
          micGain.gain.value = micVolume / 100;
          micGainRef.current = micGain;
          const src = actx.createMediaStreamSource(new MediaStream(camStream.getAudioTracks()));
          src.connect(micGain);
          micGain.connect(dest);
          if (!connected) { micGain.connect(analyser); connected = true; }
        }

        dest.stream.getAudioTracks().forEach(t => audioTracks.push(t));
      } catch { /* non-fatal */ }

      const canvasStream = canvas.captureStream(preset.fps);
      const finalStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
      liveStreamRef.current = finalStream; // expose for live sharing

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm';
      const bps = quality === '1080p' ? 8_000_000 : quality === '720p' ? 5_000_000 : 2_500_000;
      const recorder = new MediaRecorder(finalStream, { mimeType, videoBitsPerSecond: bps });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        if (rafRef.current) { clearInterval(rafRef.current); rafRef.current = null; }
        stopTimer();
        const transcript = transcriptRef.current?.stop() ?? []; transcriptRef.current = null;
        if (isCancellingRef.current) { isCancellingRef.current = false; stopAllStreams(); setState('idle'); setElapsed(0); return; }
        setState('saving');
        const blob = new Blob(chunksRef.current, { type: mimeType });
        let thumbnail: string | undefined;
        try { thumbnail = await generateThumbnail(blob); } catch { /* non-fatal */ }
        let saveInfo: SaveInfo | null = { title: `Recording ${new Date().toLocaleString()}`, tags: [] };
        if (onRequestTitle) saveInfo = await onRequestTitle();
        if (!saveInfo) { stopAllStreams(); setState('idle'); setElapsed(0); return; }
        const record: VideoRecord = { id: `rec_${Date.now()}`, title: saveInfo.title, blob, duration: elapsedRef.current, size: blob.size, createdAt: Date.now(), thumbnail, tags: saveInfo.tags, folder: saveInfo.folder, transcript, chapters: chaptersRef.current };
        await saveVideo(record);
        stopAllStreams(); setState('idle'); setElapsed(0); onSaved?.(record.id);
      };

      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
      });

      recorder.start(250); setState('recording'); startTimer(0);

      if (autoStopMinutes > 0) {
        autoStopTimerRef.current = setTimeout(() => { if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop(); }, autoStopMinutes * 60_000);
      }

    } catch (err) {
      console.error('Recording failed:', err);
      stopAllStreams(); setState('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioOnly, webcamOnly, quality, withCam, withMic, withSystemAudio, studioAudio, webcamShape, webcamPosition, webcamSizePct, webcamRingColor, withTranscript, transcriptLang, withIntroFade, withCountdownSound, autoStopMinutes, aspectRatio, withBgBlur, drawCam]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') { mediaRecorderRef.current.pause(); stopTimer(); setState('paused'); }
  }, []);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') { mediaRecorderRef.current.resume(); startTimer(elapsedRef.current); setState('recording'); }
  }, []);

  const stop = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      try { mr.requestData(); } catch { /* not all browsers support this before stop */ }
      mr.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    isCancellingRef.current = true;
    stopTimer();
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    else { stopAllStreams(); setState('idle'); setElapsed(0); }
  }, [stopAllStreams]);

  return {
    state, countdown, elapsed, audioLevel,
    withCam, setWithCam, withMic, setWithMic,
    withSystemAudio, setWithSystemAudio,
    audioOnly, setAudioOnly,
    webcamOnly, setWebcamOnly,
    webtvBg, setWebtvBg,
    camPreviewStream,
    // Audio Mixer
    micVolume, setMicVolume,
    systemVolume, setSystemVolume,
    // Color Grading
    videoBrightness, setVideoBrightness,
    videoContrast, setVideoContrast,
    videoSaturation, setVideoSaturation,
    // Scoreboard
    scoreboardEnabled, setScoreboardEnabled,
    scoreLeft, setScoreLeft,
    scoreRight, setScoreRight,
    // Scene transition
    triggerSceneTransition,
    quality, setQuality,
    webcamShape, setWebcamShape,
    webcamPosition, setWebcamPosition,
    webcamSizePct, setWebcamSizePct,
    studioAudio, setStudioAudio,
    webcamRingColor, setWebcamRingColor,
    withTranscript, setWithTranscript,
    transcriptLang, setTranscriptLang,
    withIntroFade, setWithIntroFade,
    withCountdownSound, setWithCountdownSound,
    showMouseHighlight, setShowMouseHighlight,
    showKeyDisplay, setShowKeyDisplay,
    autoStopMinutes, setAutoStopMinutes,
    aspectRatio, setAspectRatio,
    withBgBlur, setWithBgBlur,
    vsModelReady, vsModelError,
    withVirtualStudio, setWithVirtualStudio,
    frameStyle, setFrameStyle,
    logoWatermark, setLogoWatermark,
    logoPosition, setLogoPosition,
    logoSize, setLogoSize,
    logoUrl, setLogoUrl,
    kjEnabled, setKjEnabled,
    kjLine1, setKjLine1,
    kjLine2, setKjLine2,
    kjStyle, setKjStyle,
    kjPosition, setKjPosition,
    kjDuration, setKjDuration,
    kjQueue, setKjQueue,
    broadcastScene,
    setBroadcastScene: (scene: BroadcastScene) => { triggerSceneTransition(); setBroadcastScene(scene); },
    tickerEnabled, setTickerEnabled,
    tickerText, setTickerText,
    tickerSpeed, setTickerSpeed,
    clockEnabled, setClockEnabled,
    clockPosition, setClockPosition,
    liveBadge, setLiveBadge,
    liveBadgePosition, setLiveBadgePosition,
    introTitle, setIntroTitle,
    introSubtitle, setIntroSubtitle,
    annotationCanvasRef, interactionCanvasRef,
    liveStreamRef,
    camStreamRef,
    addChapter,
    setCamLivePosition,
    liveCamDiamRef,
    start, pause, resume, stop,
    cancel: useCallback(() => {
      isCancellingRef.current = true;
      stopTimer();
      setCamPreviewStream(null);
      if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
      else { stopAllStreams(); setState('idle'); setElapsed(0); }
    }, [stopAllStreams]),
  };
}

async function generateThumbnail(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.src = url; video.muted = true; video.playsInline = true; video.currentTime = 0.5;
    video.addEventListener('seeked', () => {
      const c = document.createElement('canvas'); c.width = 320; c.height = 180;
      c.getContext('2d')?.drawImage(video, 0, 0, 320, 180);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.7));
    });
    video.addEventListener('error', reject); video.load();
  });
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '--:--';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
