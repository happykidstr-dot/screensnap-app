"use client";

import { useEditorStore } from "@/store/useEditorStore";
import {
  ArrowLeft, Play, Settings, Plus, Type, Image as ImageIcon,
  Volume2, Video, Trash2, Download, Loader2, Mic, CheckCircle2,
  AlertCircle, Wand2, Headphones, Save, Pencil, Film
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// ─── Avatar color maps ────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<string, string[]> = {
  stock_1: ['#6D28D9', '#4C1D95'],   // Emma – purple
  stock_2: ['#1D4ED8', '#1E3A8A'],   // Liam – blue
  stock_3: ['#BE185D', '#831843'],   // Sarah – pink
  custom_1:['#065F46', '#022C22'],   // Custom – green
};

const BG_GRADIENTS: Record<string, string[]> = {
  solid_gray:  ['#1a1a2e', '#16213e'],
  default:     ['#1a1a2e', '#16213e'],
};

// ─── Client-side Canvas Video Renderer ───────────────────────────────────────
async function renderVideoInBrowser(
  scenes: any[],
  audioResults: { sceneId: string; audioBase64: string | null; simulated: boolean }[],
  onProgress: (pct: number, label: string) => void
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width  = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  // Collect all chunks
  const allChunks: Blob[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const audioData = audioResults.find(r => r.sceneId === scene.id);
    onProgress(
      Math.floor(((i) / scenes.length) * 85) + 5,
      `Compositing scene ${i + 1} / ${scenes.length}…`
    );

    // Determine duration from audio or scene default
    let durationMs = (scene.duration || 5) * 1000;

    // Detect best supported format — MP4 works in Windows Media Player
    const getMimeType = () => {
      const types = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      return types.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
    };
    const mimeType = getMimeType();

    // ── Setup audio: decode ElevenLabs audio and pipe into the MediaRecorder ──
    let audioCtx: AudioContext | null = null;
    let audioSource: AudioBufferSourceNode | null = null;
    let audioDest: MediaStreamAudioDestinationNode | null = null;

    if (audioData?.audioBase64 && !audioData.simulated) {
      try {
        audioCtx  = new AudioContext();
        const arrayBuf = Uint8Array.from(atob(audioData.audioBase64), c => c.charCodeAt(0)).buffer;
        const decoded  = await audioCtx.decodeAudioData(arrayBuf);
        durationMs = Math.ceil(decoded.duration * 1000) + 300;

        // Route decoded audio → MediaStreamDestination so it gets recorded
        audioDest  = audioCtx.createMediaStreamDestination();
        audioSource = audioCtx.createBufferSource();
        audioSource.buffer = decoded;
        audioSource.connect(audioDest);
        audioSource.connect(audioCtx.destination); // also play it live
      } catch (e) {
        console.warn('[Renderer] Audio decode failed:', e);
        audioCtx = null;
      }
    }

    // Draw scene frames + capture video stream (with audio if available)
    const videoStream = canvas.captureStream(25); // 25fps
    if (audioDest) {
      // Add audio track to the canvas stream so it gets recorded together
      audioDest.stream.getAudioTracks().forEach(t => videoStream.addTrack(t));
    }
    const recorder = new MediaRecorder(videoStream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.start(100);

    // Start audio playback in sync with recording
    if (audioSource) {
      audioSource.start(0);
    }

    // Draw animated frames for the scene duration
    const startTime = performance.now();
    const fps = 25;
    const frameDuration = 1000 / fps;

    await new Promise<void>(resolve => {
      let lastFrame = startTime;
      let frame = 0;

      const drawFrame = (now: number) => {
        const elapsed   = now - startTime;
        const progress  = Math.min(elapsed / durationMs, 1);
        frame++;

        // ── Background ──
        const [bg1, bg2] = BG_GRADIENTS[scene.backgroundUrl] || BG_GRADIENTS['default'];
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, bg1);
        grad.addColorStop(1, bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ── Scene number badge ──
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.roundRect(32, 32, 80, 36, 18);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`SCENE ${i + 1}`, 72, 55);

        // ── Avatar silhouette (animated) ──
        const [av1, av2] = AVATAR_COLORS[scene.avatarId] || AVATAR_COLORS['stock_1'];
        const avX = 960;
        const avY = 720;
        const avR = 240;

        // glow
        const glow = ctx.createRadialGradient(avX, avY - avR * 0.5, 30, avX, avY - avR * 0.5, avR);
        glow.addColorStop(0, av1 + '60');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // avatar body
        const bodyGrad = ctx.createLinearGradient(avX - 120, avY - avR, avX + 120, avY);
        bodyGrad.addColorStop(0, av1);
        bodyGrad.addColorStop(1, av2);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(avX, avY - avR + 40, 100, Math.PI, 0);
        ctx.lineTo(avX + 120, avY + 40);
        ctx.lineTo(avX - 120, avY + 40);
        ctx.closePath();
        ctx.fill();

        // face / head
        ctx.fillStyle = av1;
        ctx.beginPath();
        ctx.arc(avX, avY - avR + 40, 70, 0, Math.PI * 2);
        ctx.fill();

        // animated mouth (speaking simulation)
        const mouthOpen = Math.abs(Math.sin((elapsed / 150) * Math.PI)) * 12;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(avX, avY - avR + 60, 18, 4 + mouthOpen, 0, 0, Math.PI * 2);
        ctx.fill();

        // eyes (blink every ~3s)
        const blink = (frame % (fps * 3)) < 3;
        ctx.fillStyle = '#fff';
        if (!blink) {
          ctx.beginPath();
          ctx.arc(avX - 22, avY - avR + 20, 10, 0, Math.PI * 2);
          ctx.arc(avX + 22, avY - avR + 20, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1a1a2e';
          ctx.beginPath();
          ctx.arc(avX - 22, avY - avR + 22, 5, 0, Math.PI * 2);
          ctx.arc(avX + 22, avY - avR + 22, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = av2;
          ctx.fillRect(avX - 32, avY - avR + 18, 20, 4);
          ctx.fillRect(avX + 12, avY - avR + 18, 20, 4);
        }

        // avatar name label
        const avatarName = scene.avatarId === 'stock_1' ? 'Emma' : scene.avatarId === 'stock_2' ? 'Liam' : scene.avatarId === 'stock_3' ? 'Sarah' : 'Custom';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(avX - 45, avY - avR + 140, 90, 26, 13);
        ctx.fill();
        ctx.fillStyle = '#ffffff90';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(avatarName, avX, avY - avR + 158);

        // ── Subtitle text ──
        if (scene.script) {
          const lines = wrapText(ctx, scene.script, 780);
          const boxH  = lines.length * 34 + 24;
          const boxY  = canvas.height - boxH - 40;

          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.beginPath();
          ctx.roundRect(240, boxY, 780, boxH, 12);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold 22px Arial`;
          ctx.textAlign = 'center';
          lines.forEach((line, li) => {
            ctx.fillText(line, 630, boxY + 28 + li * 34);
          });
        }

        // ── Progress bar (bottom) ──
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, canvas.height - 4, canvas.width, 4);
        ctx.fillStyle = av1;
        ctx.fillRect(0, canvas.height - 4, canvas.width * progress, 4);

        // ── Watermark ──
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('AI Video Studio · Project Factory', canvas.width - 20, 50);

        if (elapsed < durationMs) {
          const nextFrame = lastFrame + frameDuration;
          lastFrame = nextFrame;
          setTimeout(() => drawFrame(performance.now()), Math.max(0, nextFrame - performance.now()));
        } else {
          resolve();
        }
      };

      drawFrame(startTime);
    });

    recorder.stop();
    await new Promise<void>(r => { recorder.onstop = () => r(); });
    // Clean up audio context
    if (audioCtx) { audioCtx.close().catch(() => {}); }
    allChunks.push(...chunks);
  }

  onProgress(95, 'Finalizing video…');
  await new Promise(r => setTimeout(r, 300));

  // Detect final type from chunks
  const finalType = allChunks[0]?.type || 'video/webm';
  return new Blob(allChunks, { type: finalType });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  ctx.font = 'bold 22px Arial';
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4); // max 4 lines
}

// ─── Render Status Types ──────────────────────────────────────────────────────
type RenderPhase = 'idle' | 'tts' | 'compositing' | 'encoding' | 'done' | 'failed';

interface VoicePreview {
  sceneId: string;
  audioUrl: string | null;
  loading: boolean;
  simulated: boolean;
}

export default function EditorPage() {
  const params = useParams();
  const projectId = params?.id as string | undefined;

  const {
    scenes, selectedSceneId, projectTitle, isSaving, lastSaved,
    addScene, updateScene, removeScene, selectScene,
    setProject, setProjectTitle, setScenes, setIsSaving, setLastSaved,
  } = useEditorStore();

  const selectedScene = scenes.find(s => s.id === selectedSceneId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft]         = useState(projectTitle);

  // ── Load project ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then(data => {
        if (data.project) {
          setProject(data.project.id, data.project.title);
          setTitleDraft(data.project.title);
          if (data.project.scenes?.length) {
            setScenes(data.project.scenes.map((s: any) => ({
              id: s.id,
              script: s.script_text || '',
              avatarId: s.avatar_id || 'stock_1',
              voiceId: s.voice_id || 'en_adam',
              backgroundUrl: s.background_url || 'solid_gray',
              duration: s.duration || 5,
            })));
          }
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const saveProject = useCallback(async (silent = true) => {
    if (!projectId) return;
    if (!silent) setIsSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: projectTitle, scenes }),
      });
      setLastSaved(new Date());
    } catch { /* ignore */ }
    finally { if (!silent) setIsSaving(false); }
  }, [projectId, projectTitle, scenes, setIsSaving, setLastSaved]);

  useEffect(() => {
    const t = setInterval(() => saveProject(true), 30000);
    return () => clearInterval(t);
  }, [saveProject]);

  // ── Voice Preview ─────────────────────────────────────────────────────────
  const [voicePreviews, setVoicePreviews] = useState<Record<string, VoicePreview>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleVoicePreview = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene?.script?.trim()) return;
    setVoicePreviews(prev => ({ ...prev, [sceneId]: { sceneId, audioUrl: null, loading: true, simulated: false } }));
    try {
      const res  = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scene.script, voiceId: scene.voiceId, sceneId }),
      });
      const data = await res.json();
      if (data.success && data.audioUrl) {
        setVoicePreviews(prev => ({ ...prev, [sceneId]: { sceneId, audioUrl: data.audioUrl, loading: false, simulated: data.simulated } }));
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;
        audio.play().catch(console.error);
      } else {
        setVoicePreviews(prev => ({ ...prev, [sceneId]: { sceneId, audioUrl: null, loading: false, simulated: false } }));
      }
    } catch {
      setVoicePreviews(prev => ({ ...prev, [sceneId]: { sceneId, audioUrl: null, loading: false, simulated: false } }));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const [renderPhase, setRenderPhase]     = useState<RenderPhase>('idle');
  const [renderPct, setRenderPct]         = useState(0);
  const [renderLabel, setRenderLabel]     = useState('');
  const [videoBlob, setVideoBlob]         = useState<Blob | null>(null);
  const [videoBlobUrl, setVideoBlobUrl]   = useState<string | null>(null);
  const [audioSimulated, setAudioSimulated] = useState(false);

  const handleRender = async () => {
    setRenderPhase('tts');
    setRenderPct(5);
    setRenderLabel('Requesting ElevenLabs voice audio…');
    setVideoBlob(null);
    if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    setVideoBlobUrl(null);

    await saveProject(false);

    try {
      // Step 1: Batch TTS
      const composeRes = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes }),
      });
      const composeData = await composeRes.json();

      if (!composeData.success) throw new Error(composeData.error || 'TTS batch failed');

      const audioResults = composeData.results;
      const allSimulated = audioResults.every((r: any) => r.simulated);
      setAudioSimulated(allSimulated);

      setRenderPhase('compositing');
      setRenderPct(15);
      setRenderLabel('Drawing scenes on canvas…');

      // Step 2: Render in browser
      const canvasBlob = await renderVideoInBrowser(
        scenes,
        audioResults,
        (pct, label) => { setRenderPct(pct); setRenderLabel(label); }
      );

      setRenderPhase('encoding');
      setRenderPct(0);
      setRenderLabel('Converting format to MP4…');

      let finalBlob = canvasBlob;

      try {
        const ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress }) => {
          const p = Math.min(99, Math.floor(progress * 100));
          setRenderPct(p);
          setRenderLabel(`Converting MP4 format: ${p}%`);
        });

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        await ffmpeg.writeFile('input.webm', await fetchFile(canvasBlob));
        await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-c:a', 'aac', '-movflags', '+faststart', 'output.mp4']);
        const fileData = await ffmpeg.readFile('output.mp4');
        finalBlob = new Blob([fileData as any], { type: 'video/mp4' });
      } catch (encodeErr) {
        console.error('FFmpeg encoding failed, falling back to original', encodeErr);
      }

      const url = URL.createObjectURL(finalBlob);
      setVideoBlob(finalBlob);
      setVideoBlobUrl(url);
      setRenderPct(100);
      setRenderPhase('done');
      setRenderLabel('Your video is ready!');

    } catch (err: any) {
      console.error('Render error:', err);
      setRenderPhase('failed');
      setRenderLabel(err.message || 'Render failed. Please try again.');
    }
  };

  const handleDownload = () => {
    if (!videoBlob || !videoBlobUrl) return;
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = videoBlobUrl;
    a.download = `${projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_AI_video.${ext}`;
    a.click();
  };

  // ── Title ─────────────────────────────────────────────────────────────────
  const submitTitleEdit = () => {
    setIsEditingTitle(false);
    if (titleDraft.trim()) setProjectTitle(titleDraft.trim());
  };

  const saveLabel = isSaving ? 'Saving…' : lastSaved
    ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not saved yet';

  const PIPELINE_STEPS: { key: RenderPhase; label: string }[] = [
    { key: 'tts',         label: 'ElevenLabs Voice' },
    { key: 'compositing', label: 'Canvas Render' },
    { key: 'encoding',    label: 'Packaging' },
    { key: 'done',        label: 'Done!' },
  ];
  const currentStep = PIPELINE_STEPS.findIndex(s => s.key === renderPhase);

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 font-sans relative">

      {/* ── Render Overlay ─────────────────────────────────────────────────── */}
      {renderPhase !== 'idle' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col items-center">

            {renderPhase === 'done'
              ? <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-400" /></div>
              : renderPhase === 'failed'
              ? <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-4"><AlertCircle className="w-8 h-8 text-red-400" /></div>
              : <div className="relative mb-4">
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                  <Film className="w-5 h-5 text-purple-300 absolute inset-0 m-auto" />
                </div>
            }

            <h3 className="text-xl font-bold mb-1">
              {renderPhase === 'done' ? 'Video Ready!' : renderPhase === 'failed' ? 'Render Failed' : 'Rendering Your Video'}
            </h3>
            <p className="text-zinc-400 text-sm mb-6 text-center min-h-[1.5rem]">{renderLabel}</p>

            {/* Progress bar */}
            {renderPhase !== 'done' && renderPhase !== 'failed' && (
              <div className="w-full mb-6">
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-violet-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${renderPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-500 font-mono">
                  <span>0%</span>
                  <span className="text-purple-400 font-semibold">{renderPct}%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Stage chips */}
            <div className="w-full grid grid-cols-4 gap-2 mb-6">
              {PIPELINE_STEPS.map((step, i) => {
                const isDone   = currentStep > i || renderPhase === 'done';
                const isActive = renderPhase === step.key;
                return (
                  <div key={step.key} className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium text-center transition-all ${
                    isDone   ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                  : isActive ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                  :            'border-zinc-800 bg-zinc-900/50 text-zinc-600'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border border-zinc-700" />}
                    {step.label}
                  </div>
                );
              })}
            </div>

            {/* Video preview + download */}
            {renderPhase === 'done' && videoBlobUrl && (
              <div className="w-full mb-6">
                <video
                  src={videoBlobUrl}
                  controls
                  autoPlay
                  className="w-full rounded-xl border border-zinc-700 aspect-video bg-black mb-3"
                />
                {audioSimulated && (
                  <p className="text-xs text-amber-400/70 text-center mb-2">
                    ⚠ Audio simulated — add ELEVENLABS_API_KEY for real voice
                  </p>
                )}

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => { setRenderPhase('idle'); if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl); }}
                    className="flex-1 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition font-medium text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition font-medium flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download {videoBlob?.type.includes('mp4') ? 'MP4' : 'WebM'}
                  </button>
                </div>
              </div>
            )}

            {renderPhase === 'failed' && (
              <div className="flex gap-3 w-full">
                <button onClick={() => setRenderPhase('idle')} className="flex-1 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition font-medium text-sm">Close</button>
                <button onClick={handleRender} className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-300 transition font-medium text-sm">Retry</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top Navbar ────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-zinc-800/50 bg-zinc-950 flex items-center justify-between px-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium shrink-0">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-zinc-800 shrink-0" />
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={submitTitleEdit}
              onKeyDown={e => e.key === 'Enter' && submitTitleEdit()}
              className="bg-transparent border-b border-purple-500 text-sm font-semibold outline-none text-white max-w-xs"
            />
          ) : (
            <button onClick={() => { setIsEditingTitle(true); setTitleDraft(projectTitle); }} className="flex items-center gap-1.5 text-sm font-semibold hover:text-purple-300 transition-colors group">
              <span className="truncate max-w-xs">{projectTitle}</span>
              <Pencil className="w-3 h-3 text-zinc-600 group-hover:text-purple-400 shrink-0" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-xs text-zinc-500">{saveLabel}</span>
          {projectId && (
            <button
              onClick={() => saveProject(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-md border border-zinc-800 hover:border-zinc-600 transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          )}
          <button
            id="btn-render"
            onClick={handleRender}
            disabled={renderPhase !== 'idle' && renderPhase !== 'failed'}
            className="flex items-center gap-2 bg-[#8A2BE2] hover:bg-[#7924c5] text-white px-4 py-1.5 rounded-md font-medium text-sm transition-colors shadow-[0_0_10px_rgba(138,43,226,0.2)] disabled:opacity-50"
          >
            <Film className="w-4 h-4" /> Render Video (5 Credits)
          </button>
        </div>
      </header>

      {/* ── 3-column Editor ─────────────────────────────────────────────────── */}
      <main className="flex flex-1 overflow-hidden">

        {/* Left: Storyboard */}
        <aside className="w-64 border-r border-zinc-800/50 flex flex-col bg-zinc-900/40">
          <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase text-zinc-400">Storyboard ({scenes.length})</h2>
            <button onClick={addScene} className="p-1 rounded hover:bg-zinc-800 text-purple-400 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {scenes.map((scene, index) => {
              const preview = voicePreviews[scene.id];
              return (
                <div
                  key={scene.id}
                  onClick={() => selectScene(scene.id)}
                  className={`relative group cursor-pointer border rounded-lg overflow-hidden flex flex-col transition-all ${
                    selectedSceneId === scene.id ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-black hover:border-zinc-700'
                  }`}
                >
                  <div className="h-20 bg-zinc-900 w-full relative flex items-center justify-center">
                    <div className="absolute top-1 left-1 bg-black/60 px-1.5 rounded text-[10px] font-medium text-zinc-300">{index + 1}</div>
                    <Video className="w-5 h-5 text-zinc-700" />
                    {preview?.audioUrl && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-500/80 flex items-center justify-center">
                        <Headphones className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {preview?.loading && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />
                      </div>
                    )}
                    {scenes.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); removeScene(scene.id); }}
                        className="absolute bottom-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="p-2 text-xs text-zinc-400 line-clamp-2">
                    {scene.script || 'Empty scene script…'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 pt-2 mt-auto border-t border-zinc-800/50 bg-zinc-950">
            <button onClick={addScene} className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-dashed border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-all font-medium">
              <Plus className="w-4 h-4" /> Add Scene
            </button>
          </div>
        </aside>

        {/* Center: Canvas Preview */}
        <section className="flex-1 flex flex-col bg-black">
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="w-full max-w-3xl aspect-video rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden relative shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-black to-purple-900/20" />

              {/* Avatar preview */}
              <div className="absolute bottom-0 right-10 w-48 h-64 bg-zinc-800/80 rounded-t-full border border-b-0 border-zinc-700 flex flex-col items-center justify-start pt-10 backdrop-blur-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 mb-4 flex items-center justify-center">
                  <span className="text-zinc-400 text-xs font-medium">
                    {selectedScene?.avatarId === 'stock_1' ? 'Emma' : selectedScene?.avatarId === 'stock_2' ? 'Liam' : selectedScene?.avatarId === 'stock_3' ? 'Sarah' : 'Custom'}
                  </span>
                </div>
                <div className="text-[10px] text-purple-400 font-mono">{selectedScene?.voiceId}</div>
              </div>

              {selectedScene && voicePreviews[selectedScene.id]?.audioUrl && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  <Headphones className="w-3 h-3" />
                  Voice ready {voicePreviews[selectedScene.id]?.simulated ? '(simulated)' : '(ElevenLabs ✓)'}
                </div>
              )}

              {selectedScene?.script && (
                <div className="absolute bottom-10 left-0 right-0 flex justify-center px-24">
                  <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-center max-w-lg">
                    <p className="text-white text-lg font-medium tracking-wide">{selectedScene.script}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-16 flex items-center justify-center gap-6 border-t border-zinc-800/50 bg-zinc-950/80 px-4">
            <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors">
              <Play className="w-4 h-4 ml-0.5" />
            </button>
            <div className="text-sm font-medium text-zinc-400 text-center">
              Preview Timeline
              <br />
              <span className="text-xs text-zinc-500">00:00 / {scenes.reduce((a, s) => a + s.duration, 0).toFixed(1)}s</span>
            </div>
          </div>
        </section>

        {/* Right: Properties */}
        <aside className="w-80 border-l border-zinc-800/50 bg-zinc-950 flex flex-col overflow-y-auto">
          {selectedScene ? (
            <>
              <div className="px-5 py-4 border-b border-zinc-800/50 sticky top-0 bg-zinc-950 z-10 flex items-center gap-2 text-zinc-200 font-semibold">
                <Settings className="w-4 h-4 text-zinc-400" /> Scene Settings
              </div>

              <div className="p-5 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                    <Type className="w-4 h-4 text-purple-400" /> Spoken Script
                  </label>
                  <textarea
                    className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed"
                    placeholder="Type what the avatar will say…"
                    value={selectedScene.script}
                    onChange={e => updateScene(selectedScene.id, { script: e.target.value })}
                  />
                  <button
                    id="btn-voice-preview"
                    onClick={() => handleVoicePreview(selectedScene.id)}
                    disabled={!selectedScene.script?.trim() || voicePreviews[selectedScene.id]?.loading}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-blue-500/30 bg-blue-500/5 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {voicePreviews[selectedScene.id]?.loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                      : voicePreviews[selectedScene.id]?.audioUrl
                      ? <><Headphones className="w-4 h-4" /> Play Voice Preview</>
                      : <><Mic className="w-4 h-4" /> Generate Voice Preview</>
                    }
                  </button>
                  {voicePreviews[selectedScene.id]?.audioUrl && voicePreviews[selectedScene.id]?.simulated && (
                    <p className="text-[11px] text-amber-500/70 text-center">
                      ⚠ Simulated — add <code className="font-mono">ELEVENLABS_API_KEY</code> for real voice
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                    <Video className="w-4 h-4 text-blue-400" /> Avatar
                  </label>
                  <select
                    value={selectedScene.avatarId}
                    onChange={e => updateScene(selectedScene.id, { avatarId: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm appearance-none outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="stock_1">Emma (Professional)</option>
                    <option value="stock_2">Liam (Casual)</option>
                    <option value="stock_3">Sarah (Energetic)</option>
                    <option value="custom_1">Your Cloned Avatar</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                    <Volume2 className="w-4 h-4 text-green-400" /> Voice & Accent
                  </label>
                  <select
                    value={selectedScene.voiceId}
                    onChange={e => updateScene(selectedScene.id, { voiceId: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm appearance-none outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="en_adam">Adam (English – Deep)</option>
                    <option value="en_charlotte">Charlotte (English – Smooth)</option>
                    <option value="tr_ahmet">Ahmet (Turkish – Professional)</option>
                    <option value="tr_ayse">Ayşe (Turkish – Warm)</option>
                  </select>
                  <p className="text-[11px] text-zinc-500">ElevenLabs · eleven_multilingual_v2</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                    <ImageIcon className="w-4 h-4 text-orange-400" /> Background
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="h-16 rounded border border-purple-500 bg-gradient-to-br from-indigo-900 to-purple-900" />
                    <button className="h-16 rounded border border-zinc-700 hover:border-zinc-500 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                    <button className="h-16 rounded border border-zinc-700 hover:border-zinc-500 bg-gradient-to-br from-blue-950 to-black" />
                    <button className="col-span-2 py-2 rounded border-none bg-zinc-900 text-xs text-zinc-400 hover:text-white transition-colors">+ Upload Image</button>
                  </div>
                </div>

                {/* Pipeline status card */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">AI Pipeline</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-400"><Mic className="w-3 h-3 text-blue-400" /> ElevenLabs TTS</span>
                    <span className={`font-medium ${voicePreviews[selectedScene.id]?.audioUrl
                      ? (voicePreviews[selectedScene.id]?.simulated ? 'text-amber-400' : 'text-emerald-400')
                      : 'text-zinc-600'}`}>
                      {voicePreviews[selectedScene.id]?.audioUrl
                        ? (voicePreviews[selectedScene.id]?.simulated ? 'Simulated ✓' : 'Connected ✓')
                        : 'Ready'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-400"><Wand2 className="w-3 h-3 text-purple-400" /> Canvas Renderer</span>
                    <span className="font-medium text-emerald-400">Built-in ✓</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-zinc-500">
              <p className="text-sm">Select a scene from the left to edit its properties.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
