/**
 * GIF Export Utility
 * Uses modern-gif for frame encoding with color quantization.
 * Extracts frames by seeking a hidden video element.
 */

export interface GifExportOptions {
  maxDuration?: number;  // seconds (default 10)
  fps?: number;          // default 10
  width?: number;        // default 480
  height?: number;       // default 270
  onProgress?: (pct: number) => void;
}

export async function exportAsGif(
  blob: Blob,
  options: GifExportOptions = {}
): Promise<Blob> {
  const {
    maxDuration = 10,
    fps = 10,
    width = 480,
    height = 270,
    onProgress,
  } = options;

  // Load video and get actual duration
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.preload = 'metadata';

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = reject;
    video.load();
  });

  const videoDur = isFinite(video.duration) && video.duration > 0 ? video.duration : maxDuration;
  const duration = Math.min(videoDur, maxDuration);
  const frameCount = Math.ceil(duration * fps);
  const delay = Math.round(1000 / fps); // ms per frame

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const { encode } = await import('modern-gif');

  const frames: { data: ImageData; delay: number }[] = [];

  for (let i = 0; i < frameCount; i++) {
    const time = (i / fps);
    video.currentTime = time;
    await new Promise<void>(resolve => {
      video.onseeked = () => resolve();
    });
    ctx.drawImage(video, 0, 0, width, height);
    frames.push({
      data: ctx.getImageData(0, 0, width, height),
      delay,
    });
    onProgress?.(Math.round((i / frameCount) * 100));
  }

  URL.revokeObjectURL(url);
  onProgress?.(100);

  const encodedFrames = frames.map(f => ({ data: f.data.data, delay: f.delay }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await encode({ width, height, frames: encodedFrames } as any);
  return new Blob([output], { type: 'image/gif' });
}
