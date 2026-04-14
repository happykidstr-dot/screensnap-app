'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Save } from 'lucide-react';
import { VideoRecord, saveVideo } from '@/lib/db';
import { formatDuration } from '@/hooks/useRecorder';

interface TrimEditorProps {
  record: VideoRecord;
  onClose: () => void;
  onSaved: () => void;
}

export default function TrimEditor({ record, onClose, onSaved }: TrimEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [blobUrl, setBlobUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const draggingRef = useRef<'start' | 'end' | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(record.blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [record.blob]);

  const onLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    // video.duration can be Infinity for streams; fall back to record.duration
    const d = isFinite(vid.duration) && vid.duration > 0
      ? vid.duration
      : (record.duration > 0 ? record.duration : 0);
    setDuration(d);
    setEndTime(d);
    setMetaLoaded(true);
  };

  const onTimeUpdate = () => {
    const t = videoRef.current?.currentTime || 0;
    setCurrentTime(t);
    // Auto-stop at end trim point
    if (t >= endTime) {
      videoRef.current?.pause();
      videoRef.current && (videoRef.current.currentTime = startTime);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      if (v.currentTime < startTime || v.currentTime >= endTime) {
        v.currentTime = startTime;
      }
      v.play();
      setIsPlaying(true);
    }
  };

  const reset = () => {
    setStartTime(0);
    setEndTime(duration);
  };

  // Drag handlers for trim handles
  const getTimeFromX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * duration;
  }, [duration]);

  const onTrackMouseDown = (e: React.MouseEvent, handle: 'start' | 'end') => {
    e.stopPropagation();
    draggingRef.current = handle;
    const onMove = (ev: MouseEvent) => {
      const t = getTimeFromX(ev.clientX);
      if (handle === 'start') setStartTime(Math.min(t, endTime - 0.5));
      else setEndTime(Math.max(t, startTime + 0.5));
    };
    const onUp = () => {
      draggingRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleSave = async () => {
    const v = videoRef.current;
    if (!v || isSaving) return;
    setIsSaving(true);
    setProgress(0);

    try {
      v.currentTime = startTime;
      await new Promise<void>(r => { v.onseeked = () => r(); });

      // Capture stream from video playback
      type VideoWithCapture = HTMLVideoElement & { captureStream: (fps?: number) => MediaStream };
      const stream = (v as VideoWithCapture).captureStream(30);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.onstop = async () => {
        const trimBlob = new Blob(chunks, { type: mimeType });
        const newRecord: VideoRecord = {
          id: `rec_${Date.now()}`,
          title: `${record.title} (trimmed)`,
          blob: trimBlob,
          duration: endTime - startTime,
          size: trimBlob.size,
          createdAt: Date.now(),
          tags: record.tags,
        };
        // Generate thumbnail
        try {
          const url = URL.createObjectURL(trimBlob);
          const vid2 = document.createElement('video');
          vid2.src = url;
          vid2.muted = true;
          vid2.currentTime = 0.2;
          await new Promise<void>(r => { vid2.onseeked = () => r(); vid2.load(); });
          const c = document.createElement('canvas');
          c.width = 320; c.height = 180;
          c.getContext('2d')?.drawImage(vid2, 0, 0, 320, 180);
          newRecord.thumbnail = c.toDataURL('image/jpeg', 0.7);
          URL.revokeObjectURL(url);
        } catch { /* non-fatal */ }

        await saveVideo(newRecord);
        setIsSaving(false);
        onSaved();
        onClose();
      };

      recorder.start(500);
      v.muted = true;
      await v.play();

      // Poll until endTime
      while (true) {
        await new Promise(r => setTimeout(r, 100));
        const t = v.currentTime;
        setProgress(Math.min(100, Math.round(((t - startTime) / (endTime - startTime)) * 100)));
        if (t >= endTime || v.ended) break;
      }

      recorder.stop();
      v.pause();
    } catch (err) {
      console.error('Trim failed:', err);
      setIsSaving(false);
    }
  };

  const startPct = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPct = duration > 0 ? (endTime / duration) * 100 : 100;
  const curPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">✂️ Trim Recording</h2>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video */}
        <div className="bg-black aspect-video relative">
          {blobUrl && (
            <video
              ref={videoRef}
              src={blobUrl}
              className="w-full h-full"
              onLoadedMetadata={onLoadedMetadata}
              onDurationChange={onLoadedMetadata}
              onTimeUpdate={onTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
          )}
          {!metaLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-slate-400 text-sm animate-pulse">Video yükleniyor…</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="px-6 pt-5 pb-2">
          <div
            ref={trackRef}
            className={`relative h-10 bg-white/5 rounded-xl overflow-visible cursor-pointer transition-opacity ${!metaLoaded ? 'opacity-30 pointer-events-none' : ''}`}
          >
            {/* Available range (dimmed outside trim) */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-black/40" style={{ width: `${startPct}%` }} />
              <div className="absolute inset-y-0 right-0 bg-black/40" style={{ width: `${100 - endPct}%` }} />
              <div
                className="absolute inset-y-0 bg-purple-600/20 border-y-2 border-purple-500"
                style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
              />
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
              style={{ left: `${curPct}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-white -translate-x-1 -translate-y-1 absolute" />
            </div>

            {/* Start handle */}
            <div
              className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize z-20 flex items-center justify-center group"
              style={{ left: `${startPct}%` }}
              onMouseDown={e => onTrackMouseDown(e, 'start')}
            >
              <div className="w-1.5 h-8 bg-purple-400 rounded-full group-hover:bg-purple-300 transition-colors" />
            </div>

            {/* End handle */}
            <div
              className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize z-20 flex items-center justify-center group"
              style={{ left: `${endPct}%` }}
              onMouseDown={e => onTrackMouseDown(e, 'end')}
            >
              <div className="w-1.5 h-8 bg-purple-400 rounded-full group-hover:bg-purple-300 transition-colors" />
            </div>
          </div>

          <div className="flex justify-between text-xs text-slate-500 font-mono mt-2">
            <span className="text-purple-300">{formatDuration(Math.round(startTime))}</span>
            <span>{formatDuration(Math.round(currentTime))}</span>
            <span className="text-purple-300">{formatDuration(Math.round(endTime))}</span>
          </div>
        </div>

        {/* Selection info */}
        <div className="px-6 pb-4 text-center text-slate-400 text-sm">
          Selection: <span className="text-white font-semibold">{formatDuration(Math.round(endTime - startTime))}</span>
          {' '} of {' '}
          <span className="text-slate-300">{formatDuration(Math.round(duration))}</span>
        </div>

        {/* Progress bar (during save) */}
        {isSaving && (
          <div className="px-6 pb-4">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs text-slate-400 mt-1.5">Trimming… {progress}%</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={reset}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white font-semibold text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !metaLoaded || endTime - startTime < 0.5}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/30"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save Trimmed Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
