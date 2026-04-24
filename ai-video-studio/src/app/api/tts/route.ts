import { NextResponse } from 'next/server';

// ─── TTS Pipeline: ElevenLabs → OpenAI → Simulated ──────────────────────────
// Priority:
//   1. ElevenLabs (eleven_multilingual_v2) — best quality, Turkish support
//   2. OpenAI TTS (tts-1) — fallback, also supports Turkish
//   3. Simulated — no API keys available

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const OPENAI_BASE_URL     = 'https://api.openai.com/v1';

// ElevenLabs voice ID mapping
const EL_VOICE_MAP: Record<string, string> = {
  en_adam:      'pNInz6obpgDQGcFmaJgB',  // Adam - Deep English
  en_charlotte: 'XB0fDUnXU5powFXDhCwa',  // Charlotte - Smooth English
  tr_ahmet:     'VR6AewLTigWG4xSOukaG',  // Arnold (Turkish deep)
  tr_ayse:      'EXAVITQu4vr4xnSDxMaL',  // Bella (Turkish warm)
};
const EL_DEFAULT = 'pNInz6obpgDQGcFmaJgB';

// OpenAI voice mapping (best matches for each slot)
const OAI_VOICE_MAP: Record<string, string> = {
  en_adam:      'onyx',    // Deep male
  en_charlotte: 'nova',    // Smooth female
  tr_ahmet:     'onyx',    // Deep male (Turkish)
  tr_ayse:      'nova',    // Warm female (Turkish)
};
const OAI_DEFAULT = 'alloy';

// ─── Helper: try ElevenLabs ───────────────────────────────────────────────────
async function tryElevenLabs(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<ArrayBuffer | null> {
  const elVoiceId = EL_VOICE_MAP[voiceId] || EL_DEFAULT;
  try {
    const res = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${elVoiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key':   apiKey,
        'Content-Type': 'application/json',
        'Accept':       'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
      }),
    });
    if (!res.ok) {
      console.warn(`[TTS] ElevenLabs ${res.status} — falling back to OpenAI`);
      return null;
    }
    return await res.arrayBuffer();
  } catch (e) {
    console.warn('[TTS] ElevenLabs fetch error:', e);
    return null;
  }
}

// ─── Helper: try OpenAI TTS ───────────────────────────────────────────────────
async function tryOpenAI(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<ArrayBuffer | null> {
  const oaiVoice = OAI_VOICE_MAP[voiceId] || OAI_DEFAULT;
  try {
    const res = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:  'tts-1',          // tts-1-hd for higher quality (slower)
        input:  text,
        voice:  oaiVoice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn(`[TTS] OpenAI ${res.status}:`, err);
      return null;
    }
    return await res.arrayBuffer();
  } catch (e) {
    console.warn('[TTS] OpenAI fetch error:', e);
    return null;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { text, voiceId, sceneId } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const elKey  = process.env.ELEVENLABS_API_KEY?.trim();
    const oaiKey = process.env.OPENAI_API_KEY?.trim();

    const wordCount = text.trim().split(/\s+/).length;
    const estimatedDuration = parseFloat((wordCount / 2.5).toFixed(1));

    // ── 1. TRY ELEVENLABS ────────────────────────────────────────────────────
    if (elKey) {
      const buf = await tryElevenLabs(text, voiceId, elKey);
      if (buf) {
        const base64 = Buffer.from(buf).toString('base64');
        console.log('[TTS] ✅ ElevenLabs success');
        return NextResponse.json({
          success: true, simulated: false, provider: 'elevenlabs',
          sceneId: sceneId || null,
          audioUrl: `data:audio/mpeg;base64,${base64}`,
          audioBase64: base64,
          duration: estimatedDuration,
        });
      }
    }

    // ── 2. FALLBACK: OPENAI TTS ───────────────────────────────────────────────
    if (oaiKey) {
      console.log('[TTS] 🔄 Trying OpenAI TTS fallback…');
      const buf = await tryOpenAI(text, voiceId, oaiKey);
      if (buf) {
        const base64 = Buffer.from(buf).toString('base64');
        console.log('[TTS] ✅ OpenAI TTS success');
        return NextResponse.json({
          success: true, simulated: false, provider: 'openai',
          sceneId: sceneId || null,
          audioUrl: `data:audio/mpeg;base64,${base64}`,
          audioBase64: base64,
          duration: estimatedDuration,
        });
      }
    }

    // ── 3. SIMULATED (no keys or all failed) ──────────────────────────────────
    console.warn('[TTS] ⚠ All providers failed — returning simulated audio');
    await new Promise(r => setTimeout(r, 600));
    return NextResponse.json({
      success: true, simulated: true, provider: 'simulated',
      sceneId: sceneId || null,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: estimatedDuration,
      message: 'Simulated TTS — configure ELEVENLABS_API_KEY or OPENAI_API_KEY.',
    });

  } catch (error: any) {
    console.error('[TTS] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'TTS failed' }, { status: 500 });
  }
}
