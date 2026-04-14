import type { Metadata } from 'next';
import { getVideo } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Watch Recording — ScreenSnap',
};

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  // This page works for cloud-hosted recordings.
  // For local-only recordings, the user should share via the Download/Share buttons in the player.
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg)' }}>
      <div className="glass rounded-3xl p-12 max-w-xl w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-600/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📹</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Shared Recording</h1>
        <p className="text-slate-400 mb-6">
          This recording is stored locally in the sender&apos;s browser. To share recordings online, enable Cloud Upload in{' '}
          <a href="/settings" className="text-purple-400 hover:text-purple-300 underline">Settings</a>{' '}
          by adding your Supabase credentials.
        </p>
        <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all">
          ← Back to ScreenSnap
        </a>
      </div>
    </div>
  );
}
