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

export function useGuestRoom(): UseGuestRoomReturn {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [guests, setGuests] = useState<GuestSlot[]>([]);
  const [isRoomOpen, setIsRoomOpen] = useState(false);

  const peerRef = useRef<import('peerjs').Peer | null>(null);
  const guestCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  // Initialize offscreen guest composite canvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    guestCanvasRef.current = canvas;
  }, []);

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

      // Answer with empty stream so guest knows we're connected
      call.answer(new MediaStream());

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
          id: guestId, name: guestName, stream: remoteStream, videoEl: vid, source: 'webrtc',
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
    const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
    const rows = Math.ceil(count / cols);
    const cellW = w / cols;
    const cellH = h / rows;

    guestList.forEach((guest, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = x + col * cellW;
      const cy = y + row * cellH;
      const vid = guest.videoEl;

      const platformColor = guest.platform
        ? (PLATFORM_META[guest.platform]?.color ?? '#a855f7')
        : null;

      // ── Draw video frame ──
      if (vid.readyState >= 2 && vid.videoWidth > 0) {
        const vAspect = vid.videoWidth / vid.videoHeight;
        const cAspect = cellW / cellH;
        let sx = 0, sy = 0, sw = vid.videoWidth, sh = vid.videoHeight;
        if (vAspect > cAspect) { sw = sh * cAspect; sx = (vid.videoWidth - sw) / 2; }
        else { sh = sw / cAspect; sy = (vid.videoHeight - sh) / 2; }
        ctx.drawImage(vid, sx, sy, sw, sh, cx, cy, cellW, cellH);
      } else {
        // Placeholder while loading
        ctx.fillStyle = '#0f0d1e';
        ctx.fillRect(cx, cy, cellW, cellH);
        ctx.fillStyle = '#ffffff40';
        ctx.font = `${cellH * 0.22}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(guest.source === 'external' ? '📡' : '📹', cx + cellW / 2, cy + cellH * 0.5);
      }

      // ── Platform colored top bar (external only) ──
      if (guest.source === 'external' && platformColor) {
        const barH = Math.max(4, cellH * 0.03);
        ctx.fillStyle = platformColor;
        ctx.fillRect(cx, cy, cellW, barH);
      }

      // ── Cell border ──
      ctx.strokeStyle = platformColor ? platformColor + '55' : '#ffffff15';
      ctx.lineWidth = guest.source === 'external' ? 2 : 1;
      ctx.strokeRect(cx, cy, cellW, cellH);

      // ── Name badge ──
      const badgeH = Math.max(18, cellH * 0.09);
      ctx.fillStyle = guest.source === 'external' && platformColor
        ? platformColor + 'dd'
        : 'rgba(0,0,0,0.65)';
      const badgeY = cy + cellH - badgeH - 6;
      ctx.beginPath();
      ctx.roundRect?.(cx + 6, badgeY, cellW - 12, badgeH, 4);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, badgeH * 0.58)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(guest.name, cx + 12, cy + cellH - 10);
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
