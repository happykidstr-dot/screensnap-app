import { NextResponse } from 'next/server';

// ─── TTS pipeline: ElevenLabs → OpenAI → Simulated ───────────────────────────

const EL_VOICE_MAP: Record<string, string> = {
  en_adam:      'pNInz6obpgDQGcFmaJgB',
  en_charlotte: 'XB0fDUnXU5powFXDhCwa',
  tr_ahmet:     'VR6AewLTigWG4xSOukaG',
  tr_ayse:      'EXAVITQu4vr4xnSDxMaL',
};

const OAI_VOICE_MAP: Record<string, string> = {
  en_adam:      'onyx',
  en_charlotte: 'nova',
  tr_ahmet:     'onyx',
  tr_ayse:      'nova',
};

async function ttsWithFallback(
  text: string,
  voiceId: string,
): Promise<{ base64: string; simulated: boolean; provider: string }> {
  const elKey  = process.env.ELEVENLABS_API_KEY?.trim();
  const oaiKey = process.env.OPENAI_API_KEY?.trim();

  // ── 1. ElevenLabs ──────────────────────────────────────────────────────────
  if (elKey) {
    const elVoice = EL_VOICE_MAP[voiceId] || EL_VOICE_MAP['en_adam'];
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elVoice}`,
        {
          method: 'POST',
          headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );
      if (res.ok) {
        const base64 = Buffer.from(await res.arrayBuffer()).toString('base64');
        console.log('[Compose/TTS] ✅ ElevenLabs OK');
        return { base64, simulated: false, provider: 'elevenlabs' };
      }
      console.warn(`[Compose/TTS] ElevenLabs ${res.status} → trying OpenAI`);
    } catch (e) {
      console.warn('[Compose/TTS] ElevenLabs error:', e);
    }
  }

  // ── 2. OpenAI TTS fallback ─────────────────────────────────────────────────
  if (oaiKey) {
    const oaiVoice = OAI_VOICE_MAP[voiceId] || 'alloy';
    try {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${oaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: oaiVoice,
          response_format: 'mp3',
          speed: 1.0,
        }),
      });
      if (res.ok) {
        const base64 = Buffer.from(await res.arrayBuffer()).toString('base64');
        console.log('[Compose/TTS] ✅ OpenAI TTS OK');
        return { base64, simulated: false, provider: 'openai' };
      }
      const err = await res.text();
      console.warn(`[Compose/TTS] OpenAI ${res.status}:`, err);
    } catch (e) {
      console.warn('[Compose/TTS] OpenAI error:', e);
    }
  }

  // ── 3. Simulated ───────────────────────────────────────────────────────────
  console.warn('[Compose/TTS] ⚠ All providers failed — simulated');
  return { base64: '', simulated: true, provider: 'simulated' };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { scenes } = await request.json();
    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json({ error: 'scenes required' }, { status: 400 });
    }

    const results = [];

    for (const scene of scenes) {
      if (!scene.script?.trim()) {
        results.push({ sceneId: scene.id, audioBase64: null, simulated: true, provider: 'none' });
        continue;
      }

      const { base64, simulated, provider } = await ttsWithFallback(scene.script, scene.voiceId);
      results.push({
        sceneId:     scene.id,
        audioBase64: simulated ? null : base64,
        simulated,
        provider,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
