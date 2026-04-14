'use client';

import { use, useEffect, useRef, useState } from 'react';

export default function LivePage({ params }: { params: Promise<{ peerId: string }> }) {
  const { peerId } = use(params);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'connecting' | 'watching' | 'ended' | 'error'>('connecting');
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let peer: import('peerjs').Peer;
    let call: import('peerjs').MediaConnection;
    let interval: ReturnType<typeof setInterval>;

    const connect = async () => {
      const { Peer } = await import('peerjs');
      peer = new Peer({
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
      });

      peer.on('open', () => {
        call = peer.call(peerId, new MediaStream()); // empty stream → triggers answer
        call.on('stream', (remoteStream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            videoRef.current.play().catch(() => {});
          }
          setStatus('watching');
          interval = setInterval(() => setDuration(d => d + 1), 1000);
        });
        call.on('close', () => setStatus('ended'));
        call.on('error', () => { setStatus('error'); setError('Connection lost.'); });
      });

      peer.on('error', err => {
        setStatus('error');
        setError(err.message.includes('Could not connect') ? 'Broadcaster not found or stream ended.' : err.message);
      });
    };

    connect().catch(err => { setStatus('error'); setError(String(err)); });

    return () => {
      clearInterval(interval);
      try { call?.close(); peer?.destroy(); } catch { /* ignore */ }
    };
  }, [peerId]);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const elapsed = `${pad(Math.floor(duration / 60))}:${pad(duration % 60)}`;

  return (
    <div className="min-h-screen bg-[#0d0b1a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center">
              <span className="text-white text-sm">📹</span>
            </div>
            <span className="text-white font-bold text-lg">ScreenSnap Live</span>
          </div>
          {status === 'watching' && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-300 text-sm font-semibold font-mono">LIVE · {elapsed}</span>
            </div>
          )}
        </div>

        {/* Video player */}
        <div className="relative rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl border border-white/10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full"
          />
          {status !== 'watching' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {status === 'connecting' && (
                <>
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400">Connecting to live stream…</p>
                </>
              )}
              {status === 'ended' && (
                <>
                  <span className="text-5xl">📺</span>
                  <p className="text-white font-bold text-xl">Stream ended</p>
                  <p className="text-slate-400">The recorder has stopped.</p>
                  <a href="/" className="mt-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all">← Back to ScreenSnap</a>
                </>
              )}
              {status === 'error' && (
                <>
                  <span className="text-5xl">⚠️</span>
                  <p className="text-white font-bold text-xl">Cannot connect</p>
                  <p className="text-slate-400 text-sm text-center max-w-xs">{error}</p>
                  <a href="/" className="mt-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all">← Back to ScreenSnap</a>
                </>
              )}
            </div>
          )}
        </div>

        {status === 'watching' && (
          <p className="text-center text-slate-500 text-sm mt-4">
            You&apos;re watching a live ScreenSnap recording. Share this page URL to invite others.
          </p>
        )}
      </div>
    </div>
  );
}
