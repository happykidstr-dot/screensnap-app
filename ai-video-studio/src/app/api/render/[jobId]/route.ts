import { NextResponse } from 'next/server';
import { activeJobs } from '../route';

const STATUS_LABELS: Record<string, string> = {
  queued:       'Queued — waiting to start...',
  tts:          'Generating voice audio (ElevenLabs)...',
  lipsync:      'Syncing avatar lips (HeyGen / D-ID)...',
  compositing:  'Compositing final video...',
  completed:    'Render complete!',
  failed:       'Render failed.',
};

const STATUS_PROGRESS_FALLBACK: Record<string, number> = {
  queued:      5,
  tts:        30,
  lipsync:    65,
  compositing: 90,
  completed:  100,
  failed:       0,
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> } | any
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const job = activeJobs.get(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const label = STATUS_LABELS[job.status] || 'Processing...';

  return NextResponse.json({
    jobId,
    status:     job.status,
    progress:   job.progress,
    statusLabel: label,
    ttsCount:   job.ttsResults?.length   || 0,
    lipsyncCount: job.lipsyncResults?.length || 0,
    totalScenes: job.scenes?.length || 0,
    videoUrl: job.status === 'completed'
      ? (job.lipsyncResults?.[0]?.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4')
      : null,
    error: job.error || null,
  });
}
