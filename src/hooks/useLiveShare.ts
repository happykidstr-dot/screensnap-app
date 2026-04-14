'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface LiveShareState {
  isLive: boolean;
  peerId: string | null;
  viewerCount: number;
  error: string | null;
}

/**
 * PeerJS-based live sharing hook.
 * Broadcaster shares the recording MediaStream over WebRTC P2P.
 * No backend needed — uses PeerJS free cloud signaling.
 */
export function useLiveShare() {
  const [state, setState] = useState<LiveShareState>({
    isLive: false,
    peerId: null,
    viewerCount: 0,
    error: null,
  });

  const peerRef = useRef<import('peerjs').Peer | null>(null);
  const connectionsRef = useRef<import('peerjs').MediaConnection[]>([]);

  const start = useCallback(async (stream: MediaStream) => {
    try {
      // Dynamic import keeps PeerJS out of the server bundle
      const { Peer } = await import('peerjs');

      const peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      peerRef.current = peer;

      await new Promise<void>((resolve, reject) => {
        peer.on('open', () => {
          setState(s => ({ ...s, isLive: true, peerId: peer.id, error: null }));
          resolve();
        });
        peer.on('error', err => {
          setState(s => ({ ...s, error: err.message }));
          reject(err);
        });
      });

      // Answer incoming viewer calls
      peer.on('call', call => {
        call.answer(stream);
        connectionsRef.current.push(call);
        setState(s => ({ ...s, viewerCount: connectionsRef.current.length }));

        const cleanup = () => {
          connectionsRef.current = connectionsRef.current.filter(c => c !== call);
          setState(s => ({ ...s, viewerCount: connectionsRef.current.length }));
        };
        call.on('close', cleanup);
        call.on('error', cleanup);
      });

    } catch (err) {
      setState(s => ({ ...s, error: String(err) }));
    }
  }, []);

  const stop = useCallback(() => {
    connectionsRef.current.forEach(c => { try { c.close(); } catch { /* ignore */ } });
    connectionsRef.current = [];
    try { peerRef.current?.destroy(); } catch { /* ignore */ }
    peerRef.current = null;
    setState({ isLive: false, peerId: null, viewerCount: 0, error: null });
  }, []);

  useEffect(() => { return () => stop(); }, [stop]);

  const getLiveUrl = (peerId: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/live/${peerId}` : '';

  return { ...state, start, stop, getLiveUrl };
}
