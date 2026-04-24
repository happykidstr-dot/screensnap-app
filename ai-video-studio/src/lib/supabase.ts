import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Project = {
  id: string;
  user_id: string | null;
  title: string;
  status: 'draft' | 'rendering' | 'completed' | 'failed';
  created_at: string;
};

export type SceneRow = {
  id: string;
  project_id: string;
  script_text: string | null;
  avatar_id: string | null;
  voice_id: string | null;
  background_url: string | null;
  order: number;
  duration: number;
};

// ─── Browser client (SSR-compatible) ─────────────────────────────────────────
// Uses @supabase/ssr's createBrowserClient which stores sessions in COOKIES
// (not localStorage) so the Next.js middleware can read and validate the session.
// This is the CRITICAL fix for the login redirect loop in production.

let _client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Build-time fallback — no real operations possible
    return new Proxy({} as SupabaseClient, {
      get: () => () => ({ data: null, error: new Error('Supabase not configured') }),
    });
  }

  // createBrowserClient from @supabase/ssr automatically stores sessions
  // in HTTP cookies instead of localStorage, making them available to SSR middleware
  _client = createBrowserClient(url, key);
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
