import { NextResponse } from 'next/server';

// HeyGen / D-ID Lip Sync Integration
// Primary: HeyGen  → https://docs.heygen.com/reference/create-an-avatar-video-v2
// Fallback: D-ID   → https://docs.d-id.com/reference/createtalk
// API Keys in .env.local: HEYGEN_API_KEY or DID_API_KEY

// Avatar ID mapping (matches editor Avatar selector)
const HEYGEN_AVATAR_MAP: Record<string, string> = {
  stock_1:   'Angela-inblackskirt-20220820',  // Emma Professional
  stock_2:   'josh_lite3_20230714',            // Liam Casual  
  stock_3:   'anna_costume1_cameraA_v2',       // Sarah Energetic
  custom_1:  'custom',                          // User's custom avatar (placeholder)
};

// D-ID source image map (fallback when HeyGen not available)
const DID_SOURCE_MAP: Record<string, string> = {
  stock_1: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg',
  stock_2: 'https://create-images-results.d-id.com/DefaultPresenters/Logan_m/image.jpeg',
  stock_3: 'https://create-images-results.d-id.com/DefaultPresenters/Natalie_f/image.jpeg',
  custom_1: 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg',
};

export async function POST(request: Request) {
  try {
    const { audioUrl, avatarId, sceneId, duration } = await request.json();

    if (!audioUrl || !avatarId) {
      return NextResponse.json({ error: 'audioUrl and avatarId are required' }, { status: 400 });
    }

    const heygenKey = process.env.HEYGEN_API_KEY;
    const didKey    = process.env.DID_API_KEY;

    // ─── SIMULATED MODE (no API keys) ─────────────────────────────────────────
    if ((!heygenKey || heygenKey.trim() === '') && (!didKey || didKey.trim() === '')) {
      console.warn('[LIPSYNC] No HeyGen/D-ID key — returning simulated response.');

      await new Promise(resolve => setTimeout(resolve, 1200));

      return NextResponse.json({
        success: true,
        simulated: true,
        provider: 'simulation',
        sceneId: sceneId || null,
        jobId: `sim_lipsync_${Date.now()}`,
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // demo clip
        status: 'completed',
        duration: duration || 5,
        message: 'Simulated Lip Sync — add HEYGEN_API_KEY or DID_API_KEY to .env.local for real avatar video.',
      });
    }

    // ─── REAL HEYGEN MODE ─────────────────────────────────────────────────────
    if (heygenKey && heygenKey.trim() !== '') {
      console.log('[LIPSYNC] Using HeyGen provider...');
      
      const heygenAvatarId = HEYGEN_AVATAR_MAP[avatarId] || HEYGEN_AVATAR_MAP['stock_1'];

      const heygenRes = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: {
          'X-Api-Key': heygenKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: heygenAvatarId,
                avatar_style: 'normal',
              },
              voice: {
                type: 'audio',
                audio_url: audioUrl.startsWith('data:') ? undefined : audioUrl,
              },
              background: {
                type: 'color',
                value: '#1a1a2e',
              },
            },
          ],
          dimension: { width: 1280, height: 720 },
          aspect_ratio: '16:9',
        }),
      });

      if (!heygenRes.ok) {
        const errText = await heygenRes.text();
        console.error('[LIPSYNC] HeyGen error:', errText);
        // Fall through to D-ID if HeyGen fails
      } else {
        const heygenData = await heygenRes.json();
        return NextResponse.json({
          success: true,
          simulated: false,
          provider: 'heygen',
          sceneId: sceneId || null,
          jobId: heygenData?.data?.video_id,
          status: 'processing',
          videoUrl: null,
          pollUrl: `/api/lipsync/status?provider=heygen&jobId=${heygenData?.data?.video_id}`,
        });
      }
    }

    // ─── REAL D-ID FALLBACK MODE ──────────────────────────────────────────────
    if (didKey && didKey.trim() !== '') {
      console.log('[LIPSYNC] Using D-ID provider...');

      const sourceImageUrl = DID_SOURCE_MAP[avatarId] || DID_SOURCE_MAP['stock_1'];

      // D-ID uses Basic Auth: "key:<DID_API_KEY>" base64 encoded
      const didAuthHeader = 'Basic ' + Buffer.from(`key:${didKey}`).toString('base64');

      const didRes = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          'Authorization': didAuthHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_url: sourceImageUrl,
          script: {
            type: 'audio',
            audio_url: audioUrl.startsWith('data:') ? undefined : audioUrl,
          },
          config: {
            fluent: true,
            pad_audio: 0.0,
            stitch: true,
          },
        }),
      });

      if (!didRes.ok) {
        const errText = await didRes.text();
        console.error('[LIPSYNC] D-ID error:', errText);
        return NextResponse.json(
          { error: `D-ID API error: ${didRes.status}`, details: errText },
          { status: didRes.status }
        );
      }

      const didData = await didRes.json();
      return NextResponse.json({
        success: true,
        simulated: false,
        provider: 'd-id',
        sceneId: sceneId || null,
        jobId: didData?.id,
        status: 'processing',
        videoUrl: null,
        pollUrl: `/api/lipsync/status?provider=did&jobId=${didData?.id}`,
      });
    }

    return NextResponse.json({ error: 'No valid lip sync provider configured' }, { status: 500 });

  } catch (error: any) {
    console.error('[LIPSYNC] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Lip sync generation failed' },
      { status: 500 }
    );
  }
}
