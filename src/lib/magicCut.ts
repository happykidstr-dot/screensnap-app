import { VideoRecord, saveVideo } from './db';

// Analyze the audio and return times to keep (non-silent segments)
async function detectSilences(blob: Blob, silenceThreshold = 0.03, silenceDuration = 1.5): Promise<{start: number, end: number}[]> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  const segments: {start: number, end: number}[] = [];
  let isSilent = true;
  let currentStart = 0;
  
  const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
  
  for (let i = 0; i < channelData.length; i += windowSize) {
    let sum = 0;
    for (let j = 0; j < windowSize && i + j < channelData.length; j++) {
      sum += Math.abs(channelData[i + j]);
    }
    const avg = sum / windowSize;
    const time = i / sampleRate;
    
    if (avg > silenceThreshold) {
      if (isSilent) {
        isSilent = false;
        currentStart = Math.max(0, time - 0.2); // keep 200ms before
      }
    } else {
      if (!isSilent) {
        // If it has been silent for a while
        const silentFramesStart = time;
        // check ahead
        let silentCount = 0;
        let k = i;
        while(k < channelData.length) {
          let sSum = 0;
          for (let j = 0; j < windowSize && k + j < channelData.length; j++) {
             sSum += Math.abs(channelData[k + j]);
          }
          if (sSum / windowSize <= silenceThreshold) silentCount++;
          else break;
          k += windowSize;
        }
        
        const silentTime = (silentCount * windowSize) / sampleRate;
        if (silentTime >= silenceDuration) {
          isSilent = true;
          segments.push({ start: currentStart, end: time + 0.2 }); // keep 200ms after
        }
      }
    }
  }
  
  if (!isSilent) {
    segments.push({ start: currentStart, end: audioBuffer.duration });
  }
  
  return segments;
}

export async function processMagicCut(record: VideoRecord, setProgress: (p: number) => void): Promise<string> {
  setProgress(10);
  const segments = await detectSilences(record.blob);
  setProgress(40);
  
  if (segments.length === 0 || (segments.length === 1 && segments[0].start === 0)) {
     throw new Error('Sessizlik bulunamadı! Video zaten akıcı.');
  }

  // Create a hidden video element to play the segments
  const video = document.createElement('video');
  const url = URL.createObjectURL(record.blob);
  video.src = url;
  video.muted = true;
  await new Promise<void>(r => { video.onloadedmetadata = () => r(); });
  
  const stream = (video as any).captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  
  return new Promise((resolve, reject) => {
    recorder.onstop = async () => {
      URL.revokeObjectURL(url);
      const newBlob = new Blob(chunks, { type: mimeType });
      // save to db
      const newId = `rec_${Date.now()}`;
      await saveVideo({
        id: newId,
        title: `✨ ${record.title} (Magic Cut)`,
        blob: newBlob,
        duration: segments.reduce((acc, s) => acc + (s.end - s.start), 0),
        size: newBlob.size,
        createdAt: Date.now(),
        tags: [...(record.tags || []), 'magic-cut']
      });
      resolve(newId);
    };

    recorder.start();
    
    // Play through the segments
    const playSegments = async () => {
      try {
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          video.currentTime = seg.start;
          await video.play();
          
          while (video.currentTime < seg.end && !video.ended) {
            await new Promise(r => setTimeout(r, 50));
            // Update progress from 40 to 90
            const totalDuration = record.duration || video.duration;
            const overallPct = (video.currentTime / totalDuration) * 50;
            setProgress(40 + overallPct);
          }
          video.pause();
        }
        recorder.stop();
        setProgress(100);
      } catch(err) {
        reject(err);
      }
    };
    
    playSegments();
  });
}
