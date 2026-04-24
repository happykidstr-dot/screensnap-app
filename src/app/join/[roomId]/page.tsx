'use client';

import { use, useEffect, useRef, useState } from 'react';

export default function JoinPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'setup' | 'connecting' | 'connected' | 'error'>('setup');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const peerRef = useRef<import('peerjs').Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [hostStream, setHostStream] = useState<MediaStream | null>(null);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const startGuest = async () => {
    if (!guestName.trim()) return;
    setStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;

      const { Peer } = await import('peerjs');
      const peer = new Peer({
        config: { iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]},
      });
      peerRef.current = peer;

      peer.on('open', (myId) => {
        const call = peer.call(roomId, stream, {
          metadata: { guestName: guestName.trim(), guestId: myId },
        });
        call.on('stream', (remoteStream) => {
          setStatus('connected');
          setHostStream(remoteStream);
          let secs = 0;
          const iv = setInterval(() => setDuration(++secs), 1000);
          call.on('close', () => { setStatus('error'); setError('Host bağlantıyı kapattı.'); clearInterval(iv); });
        });
        call.on('error', () => { setStatus('error'); setError('Bağlantı hatası.'); });
      });

      peer.on('error', (err) => {
        setStatus('error');
        setError(err.message.includes('Could not connect')
          ? 'Host bulunamadı. Oda linki doğru mu?'
          : err.message);
      });
    } catch (e) {
      setStatus('error');
      setError('Kamera/mikrofon erişimi reddedildi: ' + String(e));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      peerRef.current?.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0b1a] flex flex-col items-center justify-center p-6"
         style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <span className="text-xl">📹</span>
          </div>
          <div>
            <p className="text-white font-black text-xl">ScreenSnap</p>
            <p className="text-purple-300/60 text-xs">Canlı Konuk Bağlantısı</p>
          </div>
        </div>

        {/* Setup card */}
        {status === 'setup' && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
            <h1 className="text-xl font-black text-white mb-1">Yayına Konuk Olun</h1>
            <p className="text-slate-400 text-sm mb-6">
              Kameranız ve mikrofonunuz host'a canlı olarak aktarılacak.
            </p>

            {/* Local camera preview */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-6 border border-white/10">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <button
                  onClick={async () => {
                    try {
                      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                      localStreamRef.current = s;
                      if (localVideoRef.current) { localVideoRef.current.srcObject = s; localVideoRef.current.play().catch(() => {}); }
                    } catch { /* ignore */ }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/10"
                >
                  📷 Kameramı Göster
                </button>
              </div>
            </div>

            {/* Guest name */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 font-semibold mb-2 block">Görünecek İsminiz</label>
              <input
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startGuest()}
                placeholder="Adınız / Soyadınız"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            <button
              onClick={startGuest}
              disabled={!guestName.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              🎬 Yayına Bağlan
            </button>
          </div>
        )}

        {/* Connecting */}
        {status === 'connecting' && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-bold text-lg">Bağlanıyor…</p>
            <p className="text-slate-400 text-sm text-center">Host'a bağlantı kuruluyor.<br/>Lütfen bekleyin.</p>
          </div>
        )}

        {/* Connected */}
        {status === 'connected' && (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex flex-col items-center gap-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-emerald-300 font-black text-lg">Yayındasınız</p>
            </div>
            
            {/* Host Broadcast Stream */}
            <div className="relative rounded-2xl overflow-hidden bg-black w-full aspect-video border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20">
              <video 
                ref={el => { if (el && hostStream) el.srcObject = hostStream; }} 
                autoPlay muted playsInline 
                className="w-full h-full object-contain bg-black" 
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Stüdyo Canlı Yayın
              </div>
              
              {/* Local PiP */}
              <div className="absolute bottom-3 right-3 w-1/4 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                 <video 
                   ref={el => { if (el && localStreamRef.current) el.srcObject = localStreamRef.current; }}
                   autoPlay muted playsInline 
                   className="w-full h-full object-cover" 
                   style={{ transform: 'scaleX(-1)' }} 
                 />
                 <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white">Siz</div>
              </div>
            </div>
            <p className="text-slate-500 text-xs text-center mt-2">
              {pad(Math.floor(duration / 60))}:{pad(duration % 60)} süredir bağlısınız.<br/>
              Kameranız ve sesiniz host'a aktarılıyor.
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 flex flex-col items-center gap-4">
            <span className="text-4xl">⚠️</span>
            <p className="text-white font-bold text-lg">Bağlantı Hatası</p>
            <p className="text-red-300/80 text-sm text-center">{error}</p>
            <button onClick={() => setStatus('setup')}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all text-sm">
              ↩ Tekrar Dene
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
