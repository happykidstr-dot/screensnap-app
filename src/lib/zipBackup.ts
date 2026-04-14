/**
 * ZIP Backup — Export all recordings to a ZIP, Import from ZIP.
 * Uses JSZip for compression.
 */
import JSZip from 'jszip';
import { getAllVideos, saveVideo, VideoRecord } from './db';

export async function exportAllAsZip(onProgress?: (pct: number) => void): Promise<Blob> {
  const videos = await getAllVideos();
  const zip = new JSZip();

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const folder = zip.folder(v.id)!;

    // Video blob
    const ext = v.blob.type.includes('audio') ? 'webm' : 'webm';
    folder.file(`video.${ext}`, v.blob);

    // Metadata (everything except blob)
    const { blob: _blob, ...meta } = v;
    folder.file('metadata.json', JSON.stringify(meta, null, 2));

    onProgress?.(Math.round(((i + 1) / videos.length) * 60));
  }

  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 1 } },
    (meta) => onProgress?.(60 + Math.round(meta.percent * 0.4))
  );
  onProgress?.(100);
  return blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importFromZip(
  file: File,
  onProgress?: (pct: number, title: string) => void
): Promise<number> {
  const zip = await JSZip.loadAsync(file);

  // Find all top-level folders (each is a recording ID)
  const recordIds = Object.keys(zip.files)
    .map(k => k.split('/')[0])
    .filter((v, i, a) => a.indexOf(v) === i && v.startsWith('rec_'));

  let imported = 0;
  for (let i = 0; i < recordIds.length; i++) {
    const id = recordIds[i];
    try {
      const metaFile = zip.file(`${id}/metadata.json`);
      const videoFile = zip.file(`${id}/video.webm`) || zip.file(`${id}/video.webm`);

      if (!metaFile || !videoFile) continue;

      const meta = JSON.parse(await metaFile.async('string')) as Omit<VideoRecord, 'blob'>;
      const blobData = await videoFile.async('blob');
      const blob = new Blob([blobData], { type: 'video/webm' });

      onProgress?.(Math.round(((i + 1) / recordIds.length) * 100), meta.title);
      await saveVideo({ ...meta, blob });
      imported++;
    } catch (err) {
      console.warn(`Failed to import ${id}:`, err);
    }
  }
  return imported;
}
