// ─── Recording Presets System ────────────────────────────────────────────────
// Save and load recording configurations

export interface RecordingPreset {
  id: string;
  name: string;
  icon: string;
  createdAt: number;
  isBuiltIn?: boolean;
  config: {
    audioOnly: boolean;
    webcamOnly: boolean;
    withCam: boolean;
    withMic: boolean;
    withSystemAudio: boolean;
    quality: '480p' | '720p' | '1080p';
    aspectRatio: '16:9' | '4:3' | '1:1' | '9:16';
    webcamShape: 'circle' | 'rounded' | 'square';
    webcamPosition: 'br' | 'bl' | 'tr' | 'tl';
    webcamSizePct: number;
    withTranscript: boolean;
    withCountdownSound: boolean;
    withIntroFade: boolean;
    showMouseHighlight: boolean;
    showKeyDisplay: boolean;
    withBgBlur: boolean;
    frameStyle: string;
    logoWatermark: boolean;
    kjEnabled: boolean;
    kjLine1: string;
    kjLine2: string;
    broadcastScene: 'screen' | 'cam-big' | 'cam-only' | 'intro';
    liveBadge: boolean;
    clockEnabled: boolean;
    tickerEnabled: boolean;
    tickerText: string;
    scoreboardEnabled: boolean;
    studioAudio: boolean;
  };
}

const STORAGE_KEY = 'screensnap_presets';

// ─── Built-in Presets ─────────────────────────────────────────────────────────
export const BUILT_IN_PRESETS: RecordingPreset[] = [
  {
    id: 'preset_tutorial',
    name: 'Tutorial / Eğitim',
    icon: '🎓',
    createdAt: 0,
    isBuiltIn: true,
    config: {
      audioOnly: false,
      webcamOnly: false,
      withCam: true,
      withMic: true,
      withSystemAudio: false,
      quality: '1080p',
      aspectRatio: '16:9',
      webcamShape: 'circle',
      webcamPosition: 'br',
      webcamSizePct: 18,
      withTranscript: true,
      withCountdownSound: true,
      withIntroFade: true,
      showMouseHighlight: true,
      showKeyDisplay: true,
      withBgBlur: false,
      frameStyle: 'none',
      logoWatermark: false,
      kjEnabled: false,
      kjLine1: '',
      kjLine2: '',
      broadcastScene: 'screen',
      liveBadge: false,
      clockEnabled: false,
      tickerEnabled: false,
      tickerText: '',
      scoreboardEnabled: false,
      studioAudio: false,
    },
  },
  {
    id: 'preset_podcast',
    name: 'Podcast / Söyleşi',
    icon: '🎙️',
    createdAt: 0,
    isBuiltIn: true,
    config: {
      audioOnly: false,
      webcamOnly: true,
      withCam: true,
      withMic: true,
      withSystemAudio: false,
      quality: '1080p',
      aspectRatio: '16:9',
      webcamShape: 'rounded',
      webcamPosition: 'br',
      webcamSizePct: 30,
      withTranscript: true,
      withCountdownSound: true,
      withIntroFade: true,
      showMouseHighlight: false,
      showKeyDisplay: false,
      withBgBlur: true,
      frameStyle: 'none',
      logoWatermark: true,
      kjEnabled: true,
      kjLine1: '',
      kjLine2: '',
      broadcastScene: 'cam-only',
      liveBadge: false,
      clockEnabled: false,
      tickerEnabled: false,
      tickerText: '',
      scoreboardEnabled: false,
      studioAudio: true,
    },
  },
  {
    id: 'preset_meeting',
    name: 'Toplantı Kaydı',
    icon: '💼',
    createdAt: 0,
    isBuiltIn: true,
    config: {
      audioOnly: false,
      webcamOnly: false,
      withCam: false,
      withMic: true,
      withSystemAudio: true,
      quality: '720p',
      aspectRatio: '16:9',
      webcamShape: 'circle',
      webcamPosition: 'br',
      webcamSizePct: 18,
      withTranscript: true,
      withCountdownSound: false,
      withIntroFade: false,
      showMouseHighlight: false,
      showKeyDisplay: false,
      withBgBlur: false,
      frameStyle: 'none',
      logoWatermark: false,
      kjEnabled: false,
      kjLine1: '',
      kjLine2: '',
      broadcastScene: 'screen',
      liveBadge: false,
      clockEnabled: false,
      tickerEnabled: false,
      tickerText: '',
      scoreboardEnabled: false,
      studioAudio: false,
    },
  },
  {
    id: 'preset_broadcast',
    name: 'Canlı Yayın / TV',
    icon: '📺',
    createdAt: 0,
    isBuiltIn: true,
    config: {
      audioOnly: false,
      webcamOnly: false,
      withCam: true,
      withMic: true,
      withSystemAudio: false,
      quality: '1080p',
      aspectRatio: '16:9',
      webcamShape: 'rounded',
      webcamPosition: 'br',
      webcamSizePct: 22,
      withTranscript: false,
      withCountdownSound: true,
      withIntroFade: true,
      showMouseHighlight: false,
      showKeyDisplay: false,
      withBgBlur: false,
      frameStyle: 'none',
      logoWatermark: true,
      kjEnabled: true,
      kjLine1: '',
      kjLine2: '',
      broadcastScene: 'cam-big',
      liveBadge: true,
      clockEnabled: true,
      tickerEnabled: true,
      tickerText: '',
      scoreboardEnabled: false,
      studioAudio: true,
    },
  },
  {
    id: 'preset_quick',
    name: 'Hızlı Kayıt',
    icon: '⚡',
    createdAt: 0,
    isBuiltIn: true,
    config: {
      audioOnly: false,
      webcamOnly: false,
      withCam: false,
      withMic: true,
      withSystemAudio: false,
      quality: '720p',
      aspectRatio: '16:9',
      webcamShape: 'circle',
      webcamPosition: 'br',
      webcamSizePct: 18,
      withTranscript: false,
      withCountdownSound: false,
      withIntroFade: false,
      showMouseHighlight: false,
      showKeyDisplay: false,
      withBgBlur: false,
      frameStyle: 'none',
      logoWatermark: false,
      kjEnabled: false,
      kjLine1: '',
      kjLine2: '',
      broadcastScene: 'screen',
      liveBadge: false,
      clockEnabled: false,
      tickerEnabled: false,
      tickerText: '',
      scoreboardEnabled: false,
      studioAudio: false,
    },
  },
  {
    id: 'preset_social',
    name: 'Sosyal Medya (Dikey)',
    icon: '📱',
    createdAt: 0,
    isBuiltIn: true,
    config: {
      audioOnly: false,
      webcamOnly: true,
      withCam: true,
      withMic: true,
      withSystemAudio: false,
      quality: '1080p',
      aspectRatio: '9:16',
      webcamShape: 'rounded',
      webcamPosition: 'br',
      webcamSizePct: 30,
      withTranscript: false,
      withCountdownSound: true,
      withIntroFade: true,
      showMouseHighlight: false,
      showKeyDisplay: false,
      withBgBlur: true,
      frameStyle: 'none',
      logoWatermark: false,
      kjEnabled: false,
      kjLine1: '',
      kjLine2: '',
      broadcastScene: 'cam-only',
      liveBadge: false,
      clockEnabled: false,
      tickerEnabled: false,
      tickerText: '',
      scoreboardEnabled: false,
      studioAudio: false,
    },
  },
];

// ─── Custom Preset CRUD ─────────────────────────────────────────────────────
export function getCustomPresets(): RecordingPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCustomPreset(preset: RecordingPreset): void {
  const presets = getCustomPresets();
  const idx = presets.findIndex(p => p.id === preset.id);
  if (idx >= 0) presets[idx] = preset;
  else presets.push(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function deleteCustomPreset(id: string): void {
  const presets = getCustomPresets().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function getAllPresets(): RecordingPreset[] {
  return [...BUILT_IN_PRESETS, ...getCustomPresets()];
}
