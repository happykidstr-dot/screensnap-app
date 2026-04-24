'use client';

import { useState } from 'react';
import { RecordingPreset, getAllPresets, saveCustomPreset, deleteCustomPreset } from '@/lib/presets';
import { X, Save, Trash2, ChevronDown, Zap } from 'lucide-react';
import { Lang, t } from '@/lib/i18n';

interface PresetManagerProps {
  lang: Lang;
  onLoadPreset: (preset: RecordingPreset) => void;
  onSaveCurrentAsPreset: () => RecordingPreset['config'];
  onClose: () => void;
}

export default function PresetManager({ lang, onLoadPreset, onSaveCurrentAsPreset, onClose }: PresetManagerProps) {
  const [presets, setPresets] = useState(getAllPresets());
  const [showSave, setShowSave] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🎬');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleSave = () => {
    if (!newName.trim()) return;
    const config = onSaveCurrentAsPreset();
    const preset: RecordingPreset = {
      id: `preset_custom_${Date.now()}`,
      name: newName.trim(),
      icon: newIcon,
      createdAt: Date.now(),
      isBuiltIn: false,
      config,
    };
    saveCustomPreset(preset);
    setPresets(getAllPresets());
    setNewName('');
    setShowSave(false);
    showToast(t('presetSaved', lang));
  };

  const handleDelete = (id: string) => {
    deleteCustomPreset(id);
    setPresets(getAllPresets());
  };

  const handleLoad = (preset: RecordingPreset) => {
    onLoadPreset(preset);
    showToast(`${preset.icon} ${preset.name} — ${t('presetLoaded', lang)}`);
  };

  const builtIn = presets.filter(p => p.isBuiltIn);
  const custom = presets.filter(p => !p.isBuiltIn);

  const ICONS = ['🎬', '🎥', '📹', '🎙️', '💼', '📱', '🖥️', '⚡', '🎓', '🎮', '🏆', '📺', '🎯', '🚀', '💡', '🔥'];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass rounded-3xl p-6 w-full max-w-lg border border-purple-500/20 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        {/* Toast */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-bold animate-pulse">
            {toast}
          </div>
        )}

        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-cyan-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{t('presets', lang)}</h2>
            <p className="text-slate-500 text-xs">{lang === 'tr' ? 'Tek tıkla kayıt ayarlarınızı yükleyin' : 'Load recording settings with one click'}</p>
          </div>
        </div>

        {/* Built-in Presets */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">{t('builtInPresets', lang)}</p>
          <div className="grid grid-cols-2 gap-2">
            {builtIn.map(p => (
              <button
                key={p.id}
                onClick={() => handleLoad(p)}
                className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-left group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.config.quality} · {p.config.aspectRatio}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Presets */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('customPresets', lang)}</p>
            <button
              onClick={() => setShowSave(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-600/30 transition-all"
            >
              <Save className="w-3 h-3" /> {t('savePreset', lang)}
            </button>
          </div>

          {/* Save new preset form */}
          {showSave && (
            <div className="mb-4 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 space-y-3">
              <div className="flex gap-2">
                {/* Icon picker */}
                <div className="relative">
                  <button className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 text-2xl flex items-center justify-center hover:bg-white/20 transition-all group">
                    {newIcon}
                  </button>
                  <div className="absolute top-full mt-1 left-0 w-48 p-2 glass rounded-xl border border-white/10 shadow-xl z-10 grid grid-cols-8 gap-1 opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto hover:opacity-100 hover:pointer-events-auto transition-opacity">
                    {ICONS.map(icon => (
                      <button key={icon} onClick={() => setNewIcon(icon)} className="w-5 h-5 text-sm hover:scale-125 transition-transform">{icon}</button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder={lang === 'tr' ? 'Şablon adı…' : 'Preset name…'}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-600"
                  autoFocus
                />
                <button onClick={handleSave} disabled={!newName.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all disabled:opacity-40">
                  {t('save', lang)}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {ICONS.map(icon => (
                  <button key={icon} onClick={() => setNewIcon(icon)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${newIcon === icon ? 'bg-purple-500/30 border border-purple-500/50 scale-110' : 'bg-white/5 hover:bg-white/10'}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}

          {custom.length === 0 ? (
            <div className="text-center py-6 text-slate-600 text-sm">
              {t('noPresets', lang)}
            </div>
          ) : (
            <div className="space-y-2">
              {custom.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5 group">
                  <button onClick={() => handleLoad(p)} className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.config.quality} · {p.config.aspectRatio} · {new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
