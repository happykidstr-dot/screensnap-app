/**
 * Supabase client + cloud upload for shareable links.
 * Only instantiated on the CLIENT side to avoid SSR issues.
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const isCloudConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const BUCKET = 'recordings';

async function getClient() {
  if (!isCloudConfigured) throw new Error('Cloud not configured. Add Supabase credentials to .env.local');
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Upload a video blob to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToCloud(
  id: string,
  blob: Blob,
  onProgress?: (pct: number) => void
): Promise<string> {
  const supabase = await getClient();
  const filename = `${id}/video.webm`;
  onProgress?.(10);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, blob, { contentType: 'video/webm', upsert: true });

  if (error) throw error;
  onProgress?.(90);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  onProgress?.(100);
  return data.publicUrl;
}

/**
 * Delete a recording from cloud storage.
 */
export async function deleteFromCloud(id: string): Promise<void> {
  if (!isCloudConfigured) return;
  const supabase = await getClient();
  await supabase.storage.from(BUCKET).remove([`${id}/video.webm`]);
}
