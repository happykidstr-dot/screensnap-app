/**
 * ffmpeg.wasm — MP4 conversion + video compression.
 * Loads ffmpeg core from CDN to avoid COOP/COEP issues.
 */

let ffmpegInstance: import('@ffmpeg/ffmpeg').FFmpeg | null = null;
let isLoaded = false;

async function getFFmpeg() {
  if (ffmpegInstance && isLoaded) return ffmpegInstance;

  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { toBlobURL } = await import('@ffmpeg/util');

  const ff = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ff.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ff;
  isLoaded = true;
  return ff;
}

export interface ConvertOptions {
  format: 'mp4' | 'webm';
  quality?: 'high' | 'medium' | 'low';   // crf: high=20, medium=28, low=36
  onProgress?: (pct: number) => void;
}

export async function convertVideo(blob: Blob, options: ConvertOptions): Promise<Blob> {
  const { fetchFile } = await import('@ffmpeg/util');
  const ff = await getFFmpeg();
  options.onProgress?.(5);

  const onProgress = ({ progress }: { progress: number }) => {
    options.onProgress?.(Math.max(0, Math.min(95, 5 + Math.round(progress * 90))));
  };
  ff.on('progress', onProgress);

  const inputName = 'input.webm';
  const outputName = `output.${options.format}`;

  await ff.writeFile(inputName, await fetchFile(blob));
  options.onProgress?.(15);

  const crf = options.quality === 'high' ? '20' : options.quality === 'low' ? '36' : '28';

  if (options.format === 'mp4') {
    await ff.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-crf', crf,
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputName,
    ]);
  } else {
    await ff.exec([
      '-i', inputName,
      '-c:v', 'libvpx-vp9',
      '-crf', crf,
      '-b:v', '0',
      '-c:a', 'libopus',
      outputName,
    ]);
  }

  ff.off('progress', onProgress);
  const data = await ff.readFile(outputName) as Uint8Array;
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);
  options.onProgress?.(100);

  const mimeType = options.format === 'mp4' ? 'video/mp4' : 'video/webm';
  return new Blob([data as unknown as Uint8Array<ArrayBuffer>], { type: mimeType });
}

export async function compressVideo(
  blob: Blob,
  targetMB: number,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  // Estimate required bitrate
  const { fetchFile } = await import('@ffmpeg/util');
  const ff = await getFFmpeg();

  onProgress?.(5);

  const video = document.createElement('video');
  video.src = URL.createObjectURL(blob);
  await new Promise<void>(r => { video.onloadedmetadata = () => r(); video.load(); });
  const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : (blob.size / 150000); // rough estimate
  URL.revokeObjectURL(video.src);
  // Target bitrate in kbps
  const targetKbps = Math.round((targetMB * 8 * 1024) / duration);
  const videoBitrate = Math.max(200, targetKbps - 128); // reserve 128k for audio

  const inputName = 'compress_in.webm';
  const outputName = 'compress_out.mp4';

  await ff.writeFile(inputName, await fetchFile(blob));
  onProgress?.(20);

  const onProg = ({ progress }: { progress: number }) => onProgress?.(Math.max(20, Math.min(95, 20 + Math.round(progress * 75))));
  ff.on('progress', onProg);

  await ff.exec([
    '-i', inputName,
    '-c:v', 'libx264',
    '-b:v', `${videoBitrate}k`,
    '-maxrate', `${videoBitrate * 1.5}k`,
    '-bufsize', `${videoBitrate * 2}k`,
    '-c:a', 'aac',
    '-b:a', '96k',
    '-movflags', '+faststart',
    outputName,
  ]);

  ff.off('progress', onProg);
  const data = await ff.readFile(outputName) as Uint8Array;
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);
  onProgress?.(100);

  return new Blob([data as unknown as Uint8Array<ArrayBuffer>], { type: 'video/mp4' });
}
