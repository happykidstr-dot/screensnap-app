/**
 * Supabase view count table.
 * Requires a `video_views` table in your Supabase project.
 *
 * SQL to create:
 *   CREATE TABLE IF NOT EXISTS video_views (
 *     video_id TEXT PRIMARY KEY,
 *     count    BIGINT DEFAULT 0,
 *     updated_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *   ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "public_read"   ON video_views FOR SELECT USING (true);
 *   CREATE POLICY "public_upsert" ON video_views FOR INSERT WITH CHECK (true);
 *   CREATE POLICY "public_update" ON video_views FOR UPDATE USING (true);
 */

import { isCloudConfigured, SUPABASE_URL, SUPABASE_KEY } from './supabase';

async function getClient() {
  if (!isCloudConfigured) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function getViewCount(videoId: string): Promise<number> {
  const sb = await getClient();
  if (!sb) return 0;
  try {
    const { data } = await sb
      .from('video_views')
      .select('count')
      .eq('video_id', videoId)
      .maybeSingle();
    return data?.count ?? 0;
  } catch { return 0; }
}

export async function incrementViewCount(videoId: string): Promise<number> {
  const sb = await getClient();
  if (!sb) return 0;
  try {
    // Upsert: insert or increment
    const { data } = await sb.rpc('increment_view_count', { vid: videoId });
    // If RPC doesn't exist, fall back to manual upsert
    if (data == null) {
      const current = await getViewCount(videoId);
      await sb.from('video_views').upsert(
        { video_id: videoId, count: current + 1, updated_at: new Date().toISOString() },
        { onConflict: 'video_id' }
      );
      return current + 1;
    }
    return data as number;
  } catch { return 0; }
}

// SQL for Supabase RPC function (add in SQL editor)
export const VIEW_COUNT_SQL = `
-- Table
CREATE TABLE IF NOT EXISTS video_views (
  video_id   TEXT PRIMARY KEY,
  count      BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read"   ON video_views FOR SELECT USING (true);
CREATE POLICY "public_upsert" ON video_views FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update" ON video_views FOR UPDATE USING (true);

-- Atomic increment function
CREATE OR REPLACE FUNCTION increment_view_count(vid TEXT)
RETURNS BIGINT AS $$
  INSERT INTO video_views (video_id, count, updated_at)
  VALUES (vid, 1, NOW())
  ON CONFLICT (video_id) DO UPDATE
    SET count = video_views.count + 1, updated_at = NOW()
  RETURNING count;
$$ LANGUAGE sql;
`.trim();
