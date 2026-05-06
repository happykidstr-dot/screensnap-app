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

/**
 * 🔐 SUPABASE RLS & DATABASE SETUP FOR SECURE VIDEOS
 * 
 * Yukarıdaki "Storage" yüklemesi herkese açık URL üretir. 
 * Zamanlı silme ve şifreli (Password) RLS koruması için Supabase'de bir tablo açmalısınız.
 * 
 * 1. SQL Editörde şu tabloyu oluşturun:
 * ----------------------------------------------------
 * CREATE TABLE public.videos (
 *   id TEXT PRIMARY KEY,
 *   title TEXT NOT NULL,
 *   public_url TEXT NOT NULL,
 *   password TEXT,
 *   expires_at TIMESTAMP WITH TIME ZONE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
 * ----------------------------------------------------
 * 
 * 2. RLS Politikası Ekleme (Sadece şifreyi bilenler veya şifresiz videolar):
 * ----------------------------------------------------
 * CREATE POLICY "Secure Video Access" ON public.videos
 * FOR SELECT USING (
 *   password IS NULL OR 
 *   password = current_setting('request.headers', true)::json->>'x-video-password'
 * );
 * ----------------------------------------------------
 */

export async function saveVideoMetadataToCloud(record: any, publicUrl: string) {
  if (!isCloudConfigured) return;
  const supabase = await getClient();
  
  // Burada yerel IndexedDB'deki şifre ve bilgileri Supabase tablomuza yazıyoruz (RLS için)
  const { error } = await supabase.from('videos').upsert({
    id: record.id,
    title: record.title,
    public_url: publicUrl,
    password: record.password || null, // Eğer şifre varsa RLS politikası devreye girer
    // expires_at: retention (24h vb.) hesaplanıp eklenebilir
  });

  if (error) console.error("Cloud DB kayıt hatası:", error.message);
}
