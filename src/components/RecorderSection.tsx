"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, Camera, Mic, MicOff, CameraOff, MonitorOff,
  Square, Pause, Play, Circle, Headphones, AudioLines,
  ChevronDown, Zap, Timer, Mouse, Keyboard, X,
  LayoutGrid
} from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import VirtualBgPicker from './VirtualBgPicker';
import { t, Lang } from '../lib/translations';
import { FrameStyle, FRAME_OPTIONS } from '../lib/videoFrame';
import { Quality, WebcamShape, WebcamPosition, AspectRatio } from '../hooks/useRecorder';

// ─── Sub-components needed by RecorderSection ───
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

function AdvSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}
          className="appearance-none px-3 py-2 pr-7 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-semibold cursor-pointer outline-none">
          {options.map(([v, l]) => <option key={v} value={v} style={{ backgroundColor: '#1e1b2e', color: '#e2e0f0' }}>{l}</option>)}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}

// We'll import external pickers or keep them internal for now to avoid massive file sprawl
// In a real refactor, these would be separate files.
import { LogoWatermarkPicker } from './LogoWatermarkPicker';
import { KJPicker } from './KJPicker';
import { FramePickerWithPreview } from './FramePickerWithPreview';

interface RecorderSectionProps {
  recorder: any; // Using any for brevity of the large recorder object, or define full type
  guestRoom: any;
  lang: Lang;
  isSaving: boolean;
  setShowPresets: (v: boolean) => void;
  setShowUrlDialog: (v: boolean) => void;
  setLiveChapters: (v: any) => void;
  webtvBg: string | null;
  setWebtvBg: (bg: string | null) => void;
}

export function RecorderSection({
  recorder,
  guestRoom,
  lang,
  isSaving,
  setShowPresets,
  setShowUrlDialog,
  setLiveChapters,
  webtvBg,
  setWebtvBg,
}: RecorderSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isActive = recorder.state === 'recording' || recorder.state === 'paused';

  return (
    <section className="mb-10 sm:mb-14 animate-in fade-in zoom-in-95 duration-500">
      <div className="glass recorder-hero rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 text-center relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          {/* Header Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600/20 to-cyan-500/10 border border-white/10 mb-8 shadow-2xl backdrop-blur-xl group">
            {isActive ? (
              <div className="w-6 h-6 rounded-md bg-red-500 recording-dot shadow-lg shadow-red-500/50" />
            ) : recorder.audioOnly ? (
              <AudioLines className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
            ) : recorder.webcamOnly ? (
              <Camera className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Monitor className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" />
            )}
          </div>

          <h1 className="recorder-title text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 tracking-tight">
            {isActive 
              ? (recorder.state === 'paused' ? t('recordingPaused', lang) : t('recordingActive', lang)) 
              : recorder.audioOnly ? t('audioRecording', lang) : recorder.webcamOnly ? t('webcamRecording', lang) : t('recordScreen', lang)}
          </h1>
          
          <p className="text-slate-400 mb-8 max-w-lg mx-auto text-base font-medium leading-relaxed">
            {isActive
              ? (recorder.state === 'paused'
                  ? t('resumeOrStop', lang)
                  : (recorder.webcamOnly || recorder.audioOnly)
                      ? t('cameraRecording', lang)
                      : t('switchToWindow', lang))
              : t('configureAndStart', lang)}
          </p>

          {/* ─── BIG RECORDING INDICATOR ─── */}
          {isActive && recorder.state === 'recording' && (
            <div className="mb-10 scale-110 origin-center">
              <div className="inline-flex flex-col items-center gap-4 px-10 py-6 rounded-[2rem] bg-red-600/10 border-2 border-red-500/30 shadow-2xl shadow-red-500/10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 recording-dot" />
                  <span className="text-red-400 font-bold text-sm tracking-[0.2em] uppercase">RECORDING LIVE</span>
                </div>
                <div className="text-white font-mono text-4xl sm:text-6xl font-black tabular-nums tracking-tighter" style={{ textShadow: '0 0 40px rgba(239,68,68,0.4)' }}>
                  {String(Math.floor(recorder.elapsed / 60)).padStart(2,'0')}:{String(recorder.elapsed % 60).padStart(2,'0')}
                </div>
              </div>
            </div>
          )}

          {/* ─── LIVE OUTPUT MONITOR ─── */}
          {isActive && (recorder.liveStream || recorder.camPreviewStream) && (
            <div className="mb-10">
              <div className="relative rounded-[2rem] overflow-hidden mx-auto shadow-2xl border border-white/10 glow-purple"
                   style={{ maxWidth: 560, aspectRatio: '16/9', background: '#090716' }}>
                <video
                  autoPlay muted playsInline
                  ref={el => { if (el) el.srcObject = (recorder.liveStream || recorder.camPreviewStream); }}
                  className="w-full h-full object-contain"
                  style={{ transform: !recorder.liveStream ? 'scaleX(-1)' : 'none' }}
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 recording-dot" />
                  <span className="text-white text-[10px] font-black tracking-widest">LIVE FEED</span>
                </div>
              </div>
            </div>
          )}

          {/* Audio visualizer */}
          {isActive && recorder.state !== 'paused' && (
            <div className="mb-10 max-w-md mx-auto">
              <AudioVisualizer level={recorder.audioLevel} isActive />
            </div>
          )}

          {/* Settings (idle) */}
          {recorder.state === 'idle' && (
            <div className="space-y-6 mb-10 max-w-4xl mx-auto">
              {/* Main toggles — 3 modes */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                {/* Mode selector */}
                <div className="mode-switcher flex rounded-2xl border border-white/10 overflow-hidden bg-white/5 p-1 gap-1 backdrop-blur-sm">
                  <button
                    onClick={() => { recorder.setAudioOnly(false); recorder.setWebcamOnly(false); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      !recorder.audioOnly && !recorder.webcamOnly ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}>
                    <Monitor className="w-4 h-4" /> Ekran
                  </button>
                  <button
                    onClick={() => { recorder.setAudioOnly(false); recorder.setWebcamOnly(true); recorder.setWithCam(true); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      recorder.webcamOnly ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}>
                    <Camera className="w-4 h-4" /> Webcam
                  </button>
                  <button
                    onClick={() => { recorder.setAudioOnly(true); recorder.setWebcamOnly(false); recorder.setWithCam(false); }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      recorder.audioOnly ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}>
                    <Headphones className="w-4 h-4" /> Sadece Ses
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {!recorder.audioOnly && !recorder.webcamOnly && (
                    <Toggle active={recorder.withCam} onToggle={() => recorder.setWithCam(!recorder.withCam)} icon={recorder.withCam ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />} label="Webcam" />
                  )}
                  <Toggle active={recorder.withMic} onToggle={() => recorder.setWithMic(!recorder.withMic)} icon={recorder.withMic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />} label="Mic" />
                  
                  {!recorder.audioOnly && !recorder.webcamOnly && recorder.broadcastScene !== 'cam-only' && recorder.broadcastScene !== 'intro' && (
                    <Toggle active={recorder.withSystemAudio} onToggle={() => recorder.setWithSystemAudio(!recorder.withSystemAudio)} icon={recorder.withSystemAudio ? <Monitor className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />} label="System Audio" />
                  )}

                  {!recorder.audioOnly && (
                    <div className="relative">
                      <select value={recorder.quality} onChange={e => recorder.setQuality(e.target.value as Quality)}
                        className="appearance-none flex items-center gap-2 px-5 py-2.5 pr-10 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-bold cursor-pointer outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="480p" className="bg-[#1e1b2e]">480p</option>
                        <option value="720p" className="bg-[#1e1b2e]">720p HD</option>
                        <option value="1080p" className="bg-[#1e1b2e]">1080p FHD</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>

              {/* Broadcast / Studio Panel */}
              {!recorder.audioOnly && (
                <div className="p-6 rounded-3xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-md space-y-5">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-black text-purple-300 tracking-widest uppercase">BROADCAST STUDIO</span>
                    <div className="flex-1 h-px bg-purple-500/20" />
                  </div>

                  <div className="flex flex-wrap gap-4 items-start">
                    {/* Scene Switcher */}
                    <div className="flex-1 min-w-[280px] space-y-3">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-left">Sahne Seçimi</p>
                      <div className="flex gap-2 flex-wrap">
                        {([
                          { v: 'screen',   label: '🖥️ Ekran' },
                          { v: 'cam-big',  label: '🎙️ PIP' },
                          { v: 'cam-only', label: '🎥 Cam' },
                          { v: 'intro',    label: '🎬 Intro' },
                        ] as const).map(s => (
                          <button key={s.v}
                            onClick={() => recorder.setBroadcastScene(s.v)}
                            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                              recorder.broadcastScene === s.v
                                ? 'border-purple-500 bg-purple-600 text-white shadow-lg'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                            }`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats/Badges */}
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-left">Rozetler</p>
                      <div className="flex gap-2">
                        <button onClick={() => recorder.setLiveBadge(!recorder.liveBadge)}
                          className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${recorder.liveBadge ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                          🔴 LIVE
                        </button>
                        <button onClick={() => recorder.setClockEnabled(!recorder.clockEnabled)}
                          className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${recorder.clockEnabled ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                          🕐 TIME
                        </button>
                        <button onClick={() => recorder.setWithNewsDesk(!recorder.withNewsDesk)}
                          className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${recorder.withNewsDesk ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                          🏛️ DESK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Settings Toggle */}
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 mx-auto text-xs font-bold text-slate-500 hover:text-slate-300 transition-all py-2 px-4 rounded-full bg-white/5 hover:bg-white/10">
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                {showAdvanced ? 'Ayarları Gizle' : 'Tüm Ayarları Göster'}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white/3 rounded-[2rem] border border-white/5 text-left animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-4">
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest px-2">Kayıt Özellikleri</p>
                    <div className="flex flex-wrap gap-2">
                      <Toggle active={recorder.withTranscript} onToggle={() => recorder.setWithTranscript(!recorder.withTranscript)} icon={<span>📝</span>} label="Transcript" />
                      <Toggle active={recorder.withCountdownSound} onToggle={() => recorder.setWithCountdownSound(!recorder.withCountdownSound)} icon={<span>🔔</span>} label="Beep" />
                      <Toggle active={recorder.withIntroFade} onToggle={() => recorder.setWithIntroFade(!recorder.withIntroFade)} icon={<span>🌊</span>} label="Fade" />
                    </div>
                    
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest px-2 pt-2">Görsel Efektler</p>
                    <div className="flex flex-wrap gap-2">
                      <Toggle active={recorder.showMouseHighlight} onToggle={() => recorder.setShowMouseHighlight(!recorder.showMouseHighlight)} icon={<Mouse className="w-4 h-4" />} label="Mouse" />
                      <Toggle active={recorder.showKeyDisplay} onToggle={() => recorder.setShowKeyDisplay(!recorder.showKeyDisplay)} icon={<Keyboard className="w-4 h-4" />} label="Keys" />
                      {!recorder.audioOnly && recorder.withCam && (
                        <>
                          <Toggle active={recorder.withBgBlur} onToggle={() => recorder.setWithBgBlur(!recorder.withBgBlur)} icon={<span>🌫️</span>} label="Blur" />
                          <Toggle active={recorder.withVirtualStudio} onToggle={() => recorder.setWithVirtualStudio(!recorder.withVirtualStudio)} icon={<span>👤</span>} label="AI BG Removal" accent="cyan" />
                        </>
                      )}
                    </div>

                    {/* Virtual Background Picker */}
                    {!recorder.audioOnly && (
                      <div className="pt-2">
                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest px-2 mb-2">Sanal Arka Plan</p>
                        <VirtualBgPicker
                          value={webtvBg}
                          onChange={setWebtvBg}
                          virtualStudio={recorder.withVirtualStudio}
                          onVirtualStudio={recorder.setWithVirtualStudio}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest px-2">Yerleşim & Stil</p>
                    <div className="flex flex-wrap gap-4">
                      {!recorder.audioOnly && recorder.withCam && (
                        <>
                          <AdvSelect label="Cam Shape" value={recorder.webcamShape} onChange={v => recorder.setWebcamShape(v as WebcamShape)}
                            options={[['circle', '● Circle'], ['rounded', '▣ Rounded'], ['square', '■ Square']]} />
                          <AdvSelect label="Cam Position" value={recorder.webcamPosition} onChange={v => recorder.setWebcamPosition(v as WebcamPosition)}
                            options={[['br', '↘ Bottom-right'], ['bl', '↙ Bottom-left'], ['tr', '↗ Top-right'], ['tl', '↖ Top-left']]} />
                        </>
                      )}
                      {!recorder.audioOnly && (
                        <AdvSelect label="Aspect Ratio" value={recorder.aspectRatio} onChange={v => recorder.setAspectRatio(v as AspectRatio)}
                          options={[['16:9', '16:9 Wide'], ['4:3', '4:3 Classic'], ['1:1', '1:1 Square'], ['9:16', '9:16 Vertical']]} />
                      )}
                    </div>

                    <div className="pt-4 space-y-4">
                      {/* Sub-pickers */}
                      <LogoWatermarkPicker 
                        enabled={recorder.logoWatermark} onToggle={() => recorder.setLogoWatermark(!recorder.logoWatermark)}
                        logoUrl={recorder.logoUrl} onLogoUrl={url => recorder.setLogoUrl(url)}
                        position={recorder.logoPosition} onPosition={p => recorder.setLogoPosition(p)}
                      />
                      <KJPicker
                        enabled={recorder.kjEnabled} onToggle={() => recorder.setKjEnabled(!recorder.kjEnabled)}
                        line1={recorder.kjLine1} line2={recorder.kjLine2}
                        onLine1={v => recorder.setKjLine1(v)} onLine2={v => recorder.setKjLine2(v)}
                        style={recorder.kjStyle} onStyle={v => recorder.setKjStyle(v)}
                        position={recorder.kjPosition} onPosition={v => recorder.setKjPosition(v)}
                        duration={recorder.kjDuration} onDuration={v => recorder.setKjDuration(v)}
                        brandColor={typeof window !== 'undefined' ? localStorage.getItem('screensnap_brand_color') || '#7c3aed' : '#7c3aed'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {recorder.state === 'idle' && (
              <>
                <button id="btn-start-recording" onClick={() => { setLiveChapters([]); recorder.start(); }}
                  className="flex items-center gap-2 sm:gap-3 px-7 sm:px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white font-black text-lg sm:text-xl shadow-2xl shadow-purple-600/40 transition-all hover:scale-[1.03] active:scale-95 group">
                  <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 group-hover:scale-110 transition-transform" /> 
                  {recorder.audioOnly ? t('startRecordingAudio', lang) : t('startRecording', lang)}
                </button>
                <button onClick={() => setShowPresets(true)}
                  className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-5 rounded-2xl bg-white/5 hover:bg-purple-500/10 text-slate-300 hover:text-purple-300 font-bold border border-white/10 hover:border-purple-500/30 transition-all">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" /> {t('presets', lang)}
                </button>
                <button onClick={() => setShowUrlDialog(true)}
                  className="hidden sm:flex items-center gap-3 px-6 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold border border-white/10 transition-all">
                  {t('presentationMode', lang)}
                </button>
              </>
            )}
            {recorder.state === 'recording' && (
              <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
                <button onClick={recorder.stop}
                  className="w-full flex items-center justify-center gap-4 px-10 py-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-2xl shadow-2xl shadow-red-600/40 transition-all hover:scale-[1.02] active:scale-95 border-2 border-red-400/30">
                  <Square className="w-7 h-7" /> ⏹ STOP & SAVE
                </button>
                <div className="flex gap-3 w-full">
                  <button onClick={recorder.pause}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10">
                    <Pause className="w-5 h-5" /> Pause
                  </button>
                  <button onClick={recorder.cancel}
                    className="px-6 py-3 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 font-bold transition-all text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {recorder.state === 'paused' && (
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={recorder.resume} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black transition-all shadow-xl shadow-purple-600/20"><Play className="w-6 h-6" /> Resume</button>
                <button onClick={recorder.stop} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black transition-all shadow-xl shadow-red-600/20"><Square className="w-6 h-6" /> Stop & Save</button>
                <button onClick={recorder.cancel} className="px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 font-bold transition-all">Cancel</button>
              </div>
            )}
            {isSaving && (
              <div className="flex items-center gap-4 px-10 py-5 rounded-3xl bg-white/5 border border-purple-500/30 text-purple-300 font-bold text-lg animate-pulse">
                <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /> 
                Processing & Optimizing…
              </div>
            )}
          </div>

          {recorder.state === 'idle' && (
            <div className="mt-10 flex items-center justify-center gap-6 text-slate-600 text-xs font-bold uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2"><Zap className="w-3 h-3 text-purple-500" /> {recorder.audioOnly ? 'Pure Audio' : recorder.quality}</span>
              <span className="w-1 h-1 rounded-full bg-slate-800" />
              <span>{recorder.aspectRatio} Aspect</span>
              <span className="w-1 h-1 rounded-full bg-slate-800" />
              <span>Direct Local Save</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
