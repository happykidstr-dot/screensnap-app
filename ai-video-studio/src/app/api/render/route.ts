import { NextResponse } from 'next/server';

// ─── In-memory job store (MVP/Demo) ───────────────────────────────────────────
// In production, replace with Redis or a database
export type RenderJob = {
  status: 'queued' | 'tts' | 'lipsync' | 'compositing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  scenes: any[];
  ttsResults: { sceneId: string; audioUrl: string; duration: number }[];
  lipsyncResults: { sceneId: string; videoUrl: string }[];
  error?: string;
};

export const activeJobs = new Map<string, RenderJob>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, scenes } = body;

    if (!projectId || !scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: 'Missing projectId or scenes' }, { status: 400 });
    }

    const jobId = `job_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    // Create job entry
    activeJobs.set(jobId, {
      status: 'queued',
      progress: 0,
      startTime: Date.now(),
      scenes,
      ttsResults: [],
      lipsyncResults: [],
    });

    // Run the full pipeline asynchronously (don't await — return immediately)
    runRenderPipeline(jobId, scenes).catch(err => {
      const job = activeJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = err.message;
      }
      console.error(`[RENDER] Pipeline failed for job ${jobId}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: 'Render job queued — pipeline starting.',
      jobId,
      totalScenes: scenes.length,
      estimatedTime: `${scenes.length * 15}s`,
    });

  } catch (error: any) {
    console.error('[RENDER] Queue error:', error);
    return NextResponse.json({ error: 'Failed to queue render job' }, { status: 500 });
  }
}

// ─── Full Render Pipeline ─────────────────────────────────────────────────────
async function runRenderPipeline(jobId: string, scenes: any[]) {
  const job = activeJobs.get(jobId)!;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const totalSteps = scenes.length * 2 + 1; // TTS + LipSync per scene + final compositing
  let completedSteps = 0;

  const updateProgress = (status: RenderJob['status']) => {
    job.status = status;
    job.progress = Math.min(Math.floor((completedSteps / totalSteps) * 100), 99);
  };

  // ── STEP 1: Text-to-Speech for each scene ────────────────────────────────────
  updateProgress('tts');

  for (const scene of scenes) {
    if (!scene.script?.trim()) {
      completedSteps++;
      continue;
    }

    try {
      const ttsRes = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scene.script,
          voiceId: scene.voiceId || 'en_adam',
          sceneId: scene.id,
        }),
      });

      if (ttsRes.ok) {
        const ttsData = await ttsRes.json();
        if (ttsData.success) {
          job.ttsResults.push({
            sceneId: scene.id,
            audioUrl: ttsData.audioUrl,
            duration: ttsData.duration,
          });
        }
      }
    } catch (e) {
      console.warn(`[RENDER] TTS failed for scene ${scene.id}`, e);
    }

    completedSteps++;
    updateProgress('tts');
    await delay(300); // slight delay for simulated realism
  }

  // ── STEP 2: Lip Sync for each scene ──────────────────────────────────────────
  updateProgress('lipsync');

  for (const scene of scenes) {
    const ttsResult = job.ttsResults.find(r => r.sceneId === scene.id);
    const audioUrl = ttsResult?.audioUrl || null;

    try {
      const lipsyncRes = await fetch(`${baseUrl}/api/lipsync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          avatarId: scene.avatarId || 'stock_1',
          sceneId: scene.id,
          duration: ttsResult?.duration || scene.duration || 5,
        }),
      });

      if (lipsyncRes.ok) {
        const lipsyncData = await lipsyncRes.json();
        if (lipsyncData.success && lipsyncData.videoUrl) {
          job.lipsyncResults.push({
            sceneId: scene.id,
            videoUrl: lipsyncData.videoUrl,
          });
        }
      }
    } catch (e) {
      console.warn(`[RENDER] LipSync failed for scene ${scene.id}`, e);
    }

    completedSteps++;
    updateProgress('lipsync');
    await delay(400);
  }

  // ── STEP 3: Final Compositing (simulated) ─────────────────────────────────────
  updateProgress('compositing');
  await delay(1500); // simulate stitching scenes together

  completedSteps++;
  job.status = 'completed';
  job.progress = 100;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
