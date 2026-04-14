'use client';

/**
 * VideoQuiz — Video İçi Soru/Anket Sistemi
 *
 * - Host kullanıcı zaman damgalı sorular ekler
 * - Oynatma sırasında o zaman damgasına gelince video durur ve soru gösterilir
 * - İzleyici cevabı seçer, devam eder
 * - Sonuçlar localStorage'da saklanır
 */

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Plus, Trash2, HelpCircle } from 'lucide-react';

export interface QuizQuestion {
  id: string;
  time: number;          // seconds — video bu saniyeye gelince soru gösterilir
  question: string;
  options: string[];     // 2–4 seçenek
  correctIndex?: number; // optional — doğru cevap işaretlenebilir
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  correct: boolean | null;
  answeredAt: number;
}

interface QuizBuilderProps {
  questions: QuizQuestion[];
  currentTime: number;
  onQuestionsChange: (qs: QuizQuestion[]) => void;
}

/** Host tarafı: soru oluşturma paneli */
export function QuizBuilder({ questions, currentTime, onQuestionsChange }: QuizBuilderProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<QuizQuestion>>({});

  const addNew = () => {
    const id = `q_${Date.now()}`;
    setDraft({ id, time: Math.floor(currentTime), question: '', options: ['', ''], correctIndex: undefined });
    setEditId(id);
  };

  const save = () => {
    if (!draft.id || !draft.question?.trim() || !draft.options?.every(o => o.trim())) return;
    const q: QuizQuestion = {
      id: draft.id,
      time: draft.time ?? 0,
      question: draft.question,
      options: draft.options.filter(o => o.trim()),
      correctIndex: draft.correctIndex,
    };
    const exists = questions.find(x => x.id === q.id);
    onQuestionsChange(exists
      ? questions.map(x => x.id === q.id ? q : x)
      : [...questions, q].sort((a, b) => a.time - b.time)
    );
    setEditId(null);
    setDraft({});
  };

  const remove = (id: string) => onQuestionsChange(questions.filter(q => q.id !== id));

  function formatT(s: number) {
    const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Sorular videoyu o anında durdurur ve izleyiciye gösterilir.</p>
        <button onClick={addNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all">
          <Plus className="w-3.5 h-3.5" /> Soru Ekle ({formatT(currentTime)})
        </button>
      </div>

      {/* Edit Form */}
      {editId && (
        <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-bold mb-1 block">Soru Metni</label>
            <input
              value={draft.question ?? ''}
              onChange={e => setDraft(d => ({ ...d, question: e.target.value }))}
              placeholder="Örn: Bu bölümde hangi konuyu işledik?"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold mb-1 block">Zaman (saniye)</label>
            <input type="number" min={0}
              value={draft.time ?? 0}
              onChange={e => setDraft(d => ({ ...d, time: +e.target.value }))}
              className="w-32 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-purple-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold block">Seçenekler (min 2, max 4)</label>
            {(draft.options ?? ['', '']).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => setDraft(d => ({ ...d, correctIndex: i }))}
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${draft.correctIndex === i ? 'border-green-500 bg-green-500/20' : 'border-white/20'}`}
                  title="Doğru cevap olarak işaretle"
                >
                  {draft.correctIndex === i && <span className="w-2 h-2 rounded-full bg-green-400 block" />}
                </button>
                <input
                  value={opt}
                  onChange={e => {
                    const opts = [...(draft.options ?? [])];
                    opts[i] = e.target.value;
                    setDraft(d => ({ ...d, options: opts }));
                  }}
                  placeholder={`Seçenek ${i + 1}`}
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm outline-none focus:border-purple-500"
                />
                {(draft.options?.length ?? 0) > 2 && (
                  <button onClick={() => setDraft(d => ({ ...d, options: d.options?.filter((_, j) => j !== i) }))}
                    className="text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
            {(draft.options?.length ?? 0) < 4 && (
              <button onClick={() => setDraft(d => ({ ...d, options: [...(d.options ?? []), ''] }))}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                <Plus className="w-3 h-3" /> Seçenek Ekle
              </button>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setEditId(null); setDraft({}); }}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-sm">İptal</button>
            <button onClick={save}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all">Kaydet</button>
          </div>
        </div>
      )}

      {/* Question List */}
      {questions.length > 0 ? (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/8 group">
              <span className="w-5 h-5 shrink-0 rounded-full bg-purple-600/30 text-purple-300 text-xs flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{q.question}</p>
                <p className="text-xs text-slate-500 font-mono">{formatT(q.time)} · {q.options.length} seçenek</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditId(q.id); setDraft({ ...q }); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">✏️</button>
                <button onClick={() => remove(q.id)}
                  className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Henüz soru yok.</p>
          <p className="text-xs">Videoyu istediğiniz ana getirin ve "Soru Ekle" tıklayın.</p>
        </div>
      )}
    </div>
  );
}

interface QuizOverlayProps {
  question: QuizQuestion;
  onAnswer: (index: number) => void;
  onSkip: () => void;
}

/** İzleyici tarafı: soruyu gösteren overlay */
export function QuizOverlay({ question, onAnswer, onSkip }: QuizOverlayProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setTimeout(() => onAnswer(selected), 1200);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-slate-900/95 border border-white/10 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl bg-purple-600/30 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-purple-300" />
          </div>
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Anlık Kontrol</span>
        </div>
        <p className="text-white font-semibold text-base mb-4 leading-snug">{question.question}</p>
        <div className="space-y-2 mb-5">
          {question.options.map((opt, i) => {
            let cls = 'border-white/10 bg-white/5 text-slate-200 hover:border-purple-500/50 hover:bg-purple-600/10';
            if (submitted && question.correctIndex !== undefined) {
              if (i === question.correctIndex) cls = 'border-green-500/60 bg-green-500/15 text-green-300';
              else if (i === selected) cls = 'border-red-500/60 bg-red-500/15 text-red-300';
              else cls = 'border-white/5 bg-white/3 text-slate-500 opacity-60';
            } else if (selected === i) {
              cls = 'border-purple-500/60 bg-purple-600/20 text-white';
            }
            return (
              <button key={i} disabled={submitted} onClick={() => setSelected(i)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${cls}`}>
                <span className="w-5 h-5 shrink-0 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={onSkip} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-semibold transition-colors">
            Atla
          </button>
          <button onClick={submit} disabled={selected === null || submitted}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-bold transition-all">
            {submitted ? (question.correctIndex !== undefined
              ? selected === question.correctIndex ? '✅ Doğru!' : '❌ Yanlış'
              : '✓ Kaydedildi'
            ) : 'Cevapla'}
          </button>
        </div>
      </div>
    </div>
  );
}
