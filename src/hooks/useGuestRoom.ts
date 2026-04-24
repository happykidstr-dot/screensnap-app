'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface GuestSlot {
  id: string;
  name: string;
  stream: MediaStream;
  videoEl: HTMLVideoElement;
  /** 'webrtc' = remote peer via PeerJS, 'external' = local window capture */
  source?: 'webrtc' | 'external';
  platform?: 'zoom' | 'meet' | 'teams' | 'webex' | 'other';
  call?: import('peerjs').MediaConnection;
}

export interface UseGuestRoomReturn {
  roomId: string | null;
  guests: GuestSlot[];
  isRoomOpen: boolean;
  openRoom: () => void;
  closeRoom: () => void;
  removeGuest: (id: string) => void;
  guestJoinUrl: string;
  /** Offscreen canvas that composites all guest videos as a grid — ready to drawImage */
  guestCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Call this on every frame tick to refresh the guest composite canvas */
  drawGuestGrid: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
  /** Capture a window (Zoom, Meet, Teams…) and add it as an external broadcast source */
  addExternalChannel: (platform: 'zoom' | 'meet' | 'teams' | 'webex' | 'other') => Promise<void>;
}

const MAX_GUESTS = 4;

/** Visual identity per platform */
const PLATFORM_META: Record<string, { label: string; color: string }> = {
  zoom:  { label: 'Zoom',         color: '#2d8cff' },
  meet:  { label: 'Google Meet',  color: '#34a853' },
  teams: { label: 'MS Teams',     color: '#6264a7' },
  webex: { label: 'Webex',        color: '#00ab84' },
  other: { label: 'Harici Kanal', color: '#a855f7' },
};

export function useGuestRoom(liveStream?: MediaStream | null): UseGuestRoomReturn {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [guests, setGuests] = useState<GuestSlot[]>([]);
  const [isRoomOpen, setIsRoomOpen] = useState(false);

  const peerRef = useRef<import('peerjs').Peer | null>(null);
  const guestCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dummyStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  // Initialize offscreen guest composite canvas and a dummy stream for answering
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    guestCanvasRef.current = canvas;

    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 1280; dummyCanvas.height = 720;
    const ctx = dummyCanvas.getContext('2d')!;
    ctx.fillStyle = '#0f0d1e'; ctx.fillRect(0,0,1280,720);
    ctx.fillStyle = '#ffffff'; ctx.font = '30px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Yayın bekleniyor veya henüz başlamadı...', 640, 360);
    dummyStreamRef.current = dummyCanvas.captureStream(5);
  }, []);

  // Update peer connections when liveStream changes
  useEffect(() => {
    const activeStream = liveStream || dummyStreamRef.current;
    if (!activeStream) return;
    const videoTrack = activeStream.getVideoTracks()[0];
    const audioTrack = activeStream.getAudioTracks()[0];
    guests.forEach(g => {
      if (g.source === 'webrtc' && g.call?.peerConnection) {
        const senders = g.call.peerConnection.getSenders();
        if (videoTrack) {
           const vSender = senders.find(s => s.track && s.track.kind === 'video');
           if (vSender) vSender.replaceTrack(videoTrack).catch(()=>{});
        }
        if (audioTrack) {
           const aSender = senders.find(s => s.track && s.track.kind === 'audio');
           if (aSender) aSender.replaceTrack(audioTrack).catch(()=>{});
        }
      }
    });
  }, [liveStream, guests]);

  // ─── WebRTC Guest Room ────────────────────────────────────────────────────────
  const openRoom = useCallback(async () => {
    if (peerRef.current) return;
    const { Peer } = await import('peerjs');
    const peer = new Peer({
      config: { iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]},
    });
    peerRef.current = peer;

    peer.on('open', (id) => {
      setRoomId(id);
      setIsRoomOpen(true);
    });

    peer.on('call', (call) => {
      setGuests(prev => {
        if (prev.length >= MAX_GUESTS) { call.close(); return prev; }
        return prev;
      });

      // Answer with the current live stream or the dummy stream so the guest sees our broadcast
      const answerStream = liveStream || dummyStreamRef.current || new MediaStream();
      call.answer(answerStream);

      call.on('stream', (remoteStream) => {
        const meta = call.metadata as { guestName?: string; guestId?: string } | null;
        const guestId = meta?.guestId ?? call.peer;
        const guestName = meta?.guestName ?? `Konuk ${Date.now()}`;

        const vid = document.createElement('video');
        vid.srcObject = remoteStream;
        vid.muted = true;
        vid.playsInline = true;
        vid.autoplay = true;
        vid.play().catch(() => {});

        const slot: GuestSlot = {
          id: guestId, name: guestName, stream: remoteStream, videoEl: vid, source: 'webrtc', call,
        };
        setGuests(prev => {
          if (prev.length >= MAX_GUESTS) return prev;
          if (prev.find(g => g.id === guestId)) return prev; // dedup
          return [...prev, slot];
        });

        call.on('close', () => {
          setGuests(prev => prev.filter(g => g.id !== guestId));
          vid.srcObject = null;
        });
      });

      call.on('error', () => {
        const guestId = call.peer;
        setGuests(prev => prev.filter(g => g.id !== guestId));
      });
    });

    peer.on('error', () => { /* non-fatal */ });
  }, []);

  const closeRoom = useCallback(() => {
    try { peerRef.current?.destroy(); } catch { /* ignore */ }
    peerRef.current = null;
    setRoomId(null);
    // Keep external channels alive when closing the WebRTC room
    setGuests(prev => prev.filter(g => g.source === 'external'));
    setIsRoomOpen(false);
  }, []);

  const removeGuest = useCallback((id: string) => {
    setGuests(prev => {
      const g = prev.find(x => x.id === id);
      if (g) {
        g.videoEl.srcObject = null;
        if (g.source === 'external') g.stream.getTracks().forEach(t => t.stop());
      }
      return prev.filter(x => x.id !== id);
    });
  }, []);

  // ─── External Channel (Zoom / Meet / Teams window capture) ──────────────────
  const addExternalChannel = useCallback(async (
    platform: 'zoom' | 'meet' | 'teams' | 'webex' | 'other'
  ) => {
    try {
      // Ask the user to pick the window (Zoom / Meet / Teams / any app)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,  // capture system/tab audio from the meeting app
      });

      const vid = document.createElement('video');
      vid.srcObject = stream;
      vid.muted = true;         // muted on canvas element — audio goes via recorder mix
      vid.playsInline = true;
      vid.autoplay = true;
      vid.play().catch(() => {});

      const meta = PLATFORM_META[platform] ?? PLATFORM_META.other;
      const channelId = `ext_${platform}_${Date.now()}`;

      const slot: GuestSlot = {
        id: channelId,
        name: meta.label,
        stream,
        videoEl: vid,
        source: 'external',
        platform,
      };

      setGuests(prev => {
        if (prev.length >= MAX_GUESTS) {
          stream.getTracks().forEach(t => t.stop());
          return prev;
        }
        return [...prev, slot];
      });

      // Auto-remove when user clicks "Stop sharing" in the browser bar
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        setGuests(prev => prev.filter(g => g.id !== channelId));
        vid.srcObject = null;
      });
    } catch {
      // User cancelled the screen picker — silently ignore
    }
  }, []);

  // ─── Canvas compositor ────────────────────────────────────────────────────────
  const drawGuestGrid = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
  ) => {
    const guestList = guests;
    if (guestList.length === 0) return;

    const count = guestList.length;
    // Calculate an elegant floating layout inside the provided bounds
    // We'll organize them as a horizontal row aligned to the right (default for bottom-bar bounds)
    // or if the bounds are tall, as a vertical column.
    const isLandscape = w > h;
    const padding = Math.max(8, Math.round(Math.min(w, h) * 0.05));
    
    let cols = 1, rows = 1;
    if (isLandscape) {
      cols = count;
      rows = 1;
    } else {
      cols = 1;
      rows = count;
    }

    const availableW = w - (cols - 1) * padding;
    const availableH = h - (rows - 1) * padding;
    
    let cellW = availableW / cols;
    let cellH = availableH / rows;

    // Enforce 16:9 aspect ratio for each guest pip
    const pipAspect = 16 / 9;
    if (cellW / cellH > pipAspect) {
      cellW = cellH * pipAspect;
    } else {
      cellH = cellW / pipAspect;
    }

    // Determine starting points to align the whole grid (e.g. to the right/bottom)
    const totalGridW = cols * cellW + (cols - 1) * padding;
    const totalGridH = rows * cellH + (rows - 1) * padding;
    
    const startX = x + (w - totalGridW); // Align right
    const startY = y + (h - totalGridH) / 2; // Center vertically

    guestList.forEach((guest, i) => {
      const col = isLandscape ? i : 0;
      const row = isLandscape ? 0 : i;
      
      const cx = startX + col * (cellW + padding);
      const cy = startY + row * (cellH + padding);
      const vid = guest.videoEl;

      const platformColor = guest.platform
        ? (PLATFORM_META[guest.platform]?.color ?? '#a855f7')
        : null;

      ctx.save();
      
      // Shadow and rounded clip
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(cx, cy, cellW, cellH, 8);
      } else {
        ctx.rect(cx, cy, cellW, cellH);
      }
      ctx.fillStyle = '#0f0d1e';
      ctx.fill();
      ctx.clip();
      ctx.shadowBlur = 0; // Disable shadow for inner drawing

      // ── Draw video frame ──
      if (vid.readyState >= 2 && vid.videoWidth > 0) {
        const vAspect = vid.videoWidth / vid.videoHeight;
        const cAspect = cellW / cellH;
        let sx = 0, sy = 0, sw = vid.videoWidth, sh = vid.videoHeight;
        
        // crop to fill
        if (vAspect > cAspect) { sw = sh * cAspect; sx = (vid.videoWidth - sw) / 2; }
        else { sh = sw / cAspect; sy = (vid.videoHeight - sh) / 2; }
        ctx.drawImage(vid, sx, sy, sw, sh, cx, cy, cellW, cellH);
      } else {
        ctx.fillStyle = '#ffffff40';
        ctx.font = `${cellH * 0.3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(guest.source === 'external' ? '📡' : '📹', cx + cellW / 2, cy + cellH / 2);
      }

      // ── Platform colored top bar (external only) ──
      if (guest.source === 'external' && platformColor) {
        const barH = Math.max(4, cellH * 0.04);
        ctx.fillStyle = platformColor;
        ctx.fillRect(cx, cy, cellW, barH);
      }

      ctx.restore();

      // ── Cell border (over clip) ──
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx, cy, cellW, cellH, 8);
      else ctx.rect(cx, cy, cellW, cellH);
      ctx.strokeStyle = platformColor ? platformColor + 'cc' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = guest.source === 'external' ? 3 : 1;
      ctx.stroke();
      ctx.restore();

      // ── Name badge ──
      const badgeH = Math.max(20, cellH * 0.12);
      ctx.fillStyle = guest.source === 'external' && platformColor
        ? platformColor + 'ee'
        : 'rgba(0,0,0,0.7)';
      const badgeY = cy + cellH - badgeH - 6;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx + 6, badgeY, cellW - 12, badgeH, 4);
      else ctx.rect(cx + 6, badgeY, cellW - 12, badgeH);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, badgeH * 0.55)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(guest.name, cx + 12, cy + cellH - 12);
    });
  }, [guests]);

  // ─── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      try { peerRef.current?.destroy(); } catch { /* ignore */ }
      guests.forEach(g => {
        g.videoEl.srcObject = null;
        if (g.source === 'external') g.stream.getTracks().forEach(t => t.stop());
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guestJoinUrl = typeof window !== 'undefined' && roomId
    ? `${window.location.origin}/join/${roomId}`
    : '';

  return {
    roomId,
    guests,
    isRoomOpen,
    openRoom,
    closeRoom,
    removeGuest,
    guestJoinUrl,
    guestCanvasRef,
    drawGuestGrid,
    addExternalChannel,
  };
}
