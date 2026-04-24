import { NextResponse } from 'next/server';

// Polls the status of a HeyGen or D-ID lip sync job
// GET /api/lipsync/status?provider=heygen|did&jobId=xxx

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const jobId    = searchParams.get('jobId');

    if (!provider || !jobId) {
      return NextResponse.json({ error: 'provider and jobId are required' }, { status: 400 });
    }

    // ─── HeyGen Status ─────────────────────────────────────────────────────────
    if (provider === 'heygen') {
      const apiKey = process.env.HEYGEN_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'HEYGEN_API_KEY not configured' }, { status: 500 });
      }

      const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${jobId}`, {
        headers: { 'X-Api-Key': apiKey },
      });

      if (!res.ok) {
        return NextResponse.json({ error: 'HeyGen status poll failed', status: res.status }, { status: res.status });
      }

      const data = await res.json();
      const videoData = data?.data;

      return NextResponse.json({
        provider: 'heygen',
        jobId,
        status: videoData?.status === 'completed' ? 'completed' 
               : videoData?.status === 'failed'    ? 'failed' 
               : 'processing',
        videoUrl: videoData?.video_url || null,
        progress: videoData?.status === 'completed' ? 100 : 50,
      });
    }

    // ─── D-ID Status ───────────────────────────────────────────────────────────
    if (provider === 'did') {
      const apiKey = process.env.DID_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'DID_API_KEY not configured' }, { status: 500 });
      }

      const didAuthHeader = 'Basic ' + Buffer.from(`key:${apiKey}`).toString('base64');

      const res = await fetch(`https://api.d-id.com/talks/${jobId}`, {
        headers: { 'Authorization': didAuthHeader },
      });

      if (!res.ok) {
        return NextResponse.json({ error: 'D-ID status poll failed', status: res.status }, { status: res.status });
      }

      const data = await res.json();

      return NextResponse.json({
        provider: 'd-id',
        jobId,
        status:   data?.status === 'done'  ? 'completed' 
                : data?.status === 'error' ? 'failed' 
                : 'processing',
        videoUrl: data?.result_url || null,
        progress: data?.status === 'done' ? 100 : 50,
      });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });

  } catch (error: any) {
    console.error('[LIPSYNC STATUS] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
