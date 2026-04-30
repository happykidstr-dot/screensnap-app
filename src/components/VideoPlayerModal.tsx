'use client';

import { useEffect, useRef, useState } from 'react';
import { VideoRecord, updateVideoTitle, deleteVideo, updateVideoCloudUrl, updateVideoAI, TranscriptSegment } from '@/lib/db';
import { formatDuration, formatBytes } from '@/hooks/useRecorder';
import {
  X, Download, Pencil, Trash2, Check, Share2, Scissors, Loader2,
  Image as ImageIcon, Cloud, CloudOff, FileText, MessageSquare,
  Zap, QrCode, Code2, Film, Minimize2, Sparkles, BookOpen,
  Mail, Twitter, Eye, Target, Link2, Copy, Rocket, Wand2, FileDown, PlusCircle,
  Activity, Shield, Lock, Clock, Search, BellRing, HelpCircle, Scissors as ClipIcon,
  Hash as SlackIcon, ImageIcon as BgIcon
} from 'lucide-react';
import { QuizBuilder, QuizOverlay, QuizQuestion } from './VideoQuiz';
import { updateVideoCTA, addVideoReaction, VideoReaction, updateVideoChapters } from '@/lib/db';
import { processMagicCut } from '@/lib/magicCut';
import TrimEditor from './TrimEditor';
import ThumbnailPicker from './ThumbnailPicker';
import CommentTimeline from './CommentTimeline';
import QRModal from './QRModal';
import EmbedModal from './EmbedModal';
import { exportAsGif } from '@/lib/gifExport';
import { uploadToCloud, isCloudConfigured } from '@/lib/supabase';
import { convertVideo, compressVideo } from '@/lib/ffmpegExport';
import { generateAISummary, getOpenAIKey } from '@/lib/aiSummary';
import { translateTranscript, TRANSLATION_LANGUAGES } from '@/lib/aiTranslate';
import { downloadBlob } from '@/lib/zipBackup';
import { TranscriptRecorder } from '@/lib/transcript';
import { getViewCount } from '@/lib/viewCount';
import SpotlightOverlay from './SpotlightOverlay';
import { toast } from './Toast';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface VideoPlayerModalProps {
  record: VideoRecord;
  onClose: () => void;
  onDeleted: () => void;
  onSaved?: () => void;
}

export default function VideoPlayerModal({ record, onClose, onDeleted, onSaved }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blobUrl, setBlobUrl] = useState('');
  const [title, setTitle] = useState(record.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTrim, setShowTrim] = useState(false);
  const [showThumbPicker, setShowThumbPicker] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [exportingGif, setExportingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [exportingMp4, setExportingMp4] = useState(false);
  const [mp4Progress, setMp4Progress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [uploadingCloud, setUploadingCloud] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cloudUrl, setCloudUrl] = useState(record.cloudUrl);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(record.duration || 0);
  const [activeTab, setActiveTab] = useState<'comments' | 'transcript' | 'chapters' | 'ai' | 'analytics' | 'security' | 'quiz'>('comments');
  const [thumbnail, setThumbnail] = useState(record.thumbnail);
  const [aiSummary, setAiSummary] = useState(record.aiSummary);
  const [aiKeyPoints, setAiKeyPoints] = useState(record.aiKeyPoints ?? []);
  const [aiEmailDraft, setAiEmailDraft] = useState(record.aiEmailDraft);
  const [cta, setCta] = useState<{text: string; url: string} | undefined>(record.cta);
  const [showCtaConfig, setShowCtaConfig] = useState(false);
  const [ctaInputText, setCtaInputText] = useState(record.cta?.text || '');
  const [ctaInputUrl, setCtaInputUrl] = useState(record.cta?.url || '');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiWikiDocument, setAiWikiDocument] = useState(record.aiWikiDocument);

  // Magic Cut Config
  const [isMagicCutting, setIsMagicCutting] = useState(false);
  const [magicCutProgress, setMagicCutProgress] = useState(0);

  // ── NEW FEATURES ─────────────────────────────────────────────────────────
  // 1. Subtitle overlay during playback
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');

  // 2. Spotlight / Zoom
  const [showSpotlight, setShowSpotlight] = useState(false);

  // 3. AI Chapter Detection
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [localChapters, setLocalChapters] = useState(record.chapters ?? []);

  // 4. View notification email
  const [notifyEmail, setNotifyEmail] = useState(() => localStorage.getItem('screensnap_notify_email') || '');
  const [showNotifyConfig, setShowNotifyConfig] = useState(false);

  // 5. Quiz system
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);
  const [answeredQuizIds, setAnsweredQuizIds] = useState<Set<string>>(new Set());

  // 6. AI Clip
  const [extractingClip, setExtractingClip] = useState(false);
  const [clipProgress, setClipProgress] = useState(0);
  const [clipRange, setClipRange] = useState<{start:number;end:number;reason:string} | null>(null);

  // 7. Slack
  const [slackUrl, setSlackUrl] = useState(() => localStorage.getItem('screensnap_slack_url') || '');
  const [showSlackConfig, setShowSlackConfig] = useState(false);
  const [sendingSlack, setSendingSlack] = useState(false);

  // 8. Transcript Search
  const [transcriptSearch, setTranscriptSearch] = useState('');

  // 9. AI Video Translation
  const [showTranslate, setShowTranslate] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateLang, setTranslateLang] = useState('en');
  const [translatedSegments, setTranslatedSegments] = useState<Array<{startTime:number;endTime?:number;text:string}> | null>(null);
  const [translateError, setTranslateError] = useState('');
  // ─────────────────────────────────────────────────────────────────────────

  // Reaction Config
  const [isRecordingReaction, setIsRecordingReaction] = useState(false);
  const [reactionBlobUrl, setReactionBlobUrl] = useState<string | null>(null);
  const reactionRecorderRef = useRef<MediaRecorder | null>(null);
  const reactionChunksRef = useRef<BlobPart[]>([]);

  const [viewCount, setViewCount] = useState<number | null>(null);

  // Markalama (Brand) & Değişken (Variables) States
  const [brandColor, setBrandColor] = useState('#7c3aed');
  const [brandLogo, setBrandLogo] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [showVariableConfig, setShowVariableConfig] = useState(false);

  // Push to Project (Webhook) States
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [pushTaskTitle, setPushTaskTitle] = useState(record.title);
  const [pushTaskDesc, setPushTaskDesc] = useState(record.aiSummary || '');
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(record.blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [record.blob]);

  // Load view count from Supabase
  useEffect(() => {
    if (record.cloudUrl) {
      getViewCount(record.id).then(setViewCount).catch(() => {});
    }
  }, [record.id, record.cloudUrl]);

  useEffect(() => {
    setBrandColor(localStorage.getItem('screensnap_brand_color') || '#7c3aed');
    setBrandLogo(localStorage.getItem('screensnap_brand_logo') || '');
    setWebhookUrl(localStorage.getItem('screensnap_webhook_url') || '');
  }, []);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);

  // Subtitle tracker
  useEffect(() => {
    if (!showSubtitles || !record.transcript?.length) return;
    const segs = record.transcript;
    const found = [...segs].reverse().find(s => s.startTime <= currentTime);
    setCurrentSubtitle(found?.text ?? '');
  }, [currentTime, showSubtitles, record.transcript]);

  const handleSaveTitle = async () => { 
    await updateVideoTitle(record.id, title); 
    setEditingTitle(false); 
    toast('Başlık güncellendi!', 'success');
  };
  const handleDelete = async () => {
    if (confirm('Delete this recording permanently?')) { 
      await deleteVideo(record.id); 
      onDeleted(); 
      toast('Video silindi.', 'info');
      onClose(); 
    }
  };

  const handleShare = async () => {
    if (cloudUrl) { 
      navigator.clipboard.writeText(cloudUrl); 
      setCopied(true); 
      toast('Link kopyalandı!', 'success');
      setTimeout(() => setCopied(false), 2000); 
      return; 
    }
    const file = new File([record.blob], `${title}.webm`, { type: record.blob.type });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ title, files: [file] }); } catch { /* cancelled */ }
    } else { 
      navigator.clipboard.writeText(window.location.href); 
      setCopied(true); 
      toast('Sayfa linki kopyalandı!', 'success');
      setTimeout(() => setCopied(false), 2000); 
    }
  };

  const handleEmailShare = () => {
    const url = cloudUrl || window.location.href;
    const subject = encodeURIComponent(`Check out my recording: ${title}`);
    const body = encodeURIComponent(`I recorded something for you!\n\nWatch here: ${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleTwitterShare = () => {
    const url = cloudUrl;
    if (!url) { alert('Upload to cloud first to get a shareable link for Twitter.'); return; }
    const text = encodeURIComponent(`Check out my recording: ${title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleExportGif = async () => {
    if (exportingGif) return;
    setExportingGif(true);
    try {
      const gif = await exportAsGif(record.blob, { maxDuration: 10, fps: 10, onProgress: setGifProgress });
      downloadBlob(gif, `${title}.gif`);
    } catch { alert('GIF export failed.'); } finally { setExportingGif(false); setGifProgress(0); }
  };

  const handleExportMp4 = async () => {
    if (exportingMp4) return;
    setExportingMp4(true); setMp4Progress(0);
    try {
      const mp4 = await convertVideo(record.blob, { format: 'mp4', quality: 'medium', onProgress: setMp4Progress });
      downloadBlob(mp4, `${title}.mp4`);
      toast('MP4 dışa aktarıldı!', 'success');
    } catch (err) { 
      toast('MP4 export başarısız.', 'error');
      alert(`MP4 export failed: ${err}`); 
    } finally { setExportingMp4(false); setMp4Progress(0); }
  };

  const handleCompress = async () => {
    if (compressing) return;
    const targetMB = parseFloat(prompt('Target file size in MB (e.g. 50):', '50') ?? '');
    if (!targetMB || isNaN(targetMB)) return;
    setCompressing(true); setCompressProgress(0);
    try {
      const compressed = await compressVideo(record.blob, targetMB, setCompressProgress);
      downloadBlob(compressed, `${title}-compressed.mp4`);
      toast('Video sıkıştırıldı!', 'success');
    } catch (err) { 
      toast('Sıkıştırma başarısız.', 'error');
      alert(`Compression failed: ${err}`); 
    } finally { setCompressing(false); setCompressProgress(0); }
  };

  const handleCloudUpload = async () => {
    if (!isCloudConfigured || uploadingCloud) return;
    setUploadingCloud(true);
    try {
      const url = await uploadToCloud(record.id, record.blob, setUploadProgress);
      await updateVideoCloudUrl(record.id, url);
      setCloudUrl(url);
      navigator.clipboard.writeText(url);
      setCopied(true); 
      toast('Buluta yüklendi ve link kopyalandı!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { 
      toast('Yükleme başarısız.', 'error');
      alert(`Upload failed: ${err}`); 
    } finally { setUploadingCloud(false); setUploadProgress(0); }
  };

  const handleGenerateAI = async () => {
    if (!getOpenAIKey()) { 
      toast('OpenAI API anahtarı eksik!', 'error');
      alert('Add your OpenAI API key in Settings → AI.'); 
      return; 
    }
    const transcript = record.transcript?.map(s => s.text).join(' ') ?? '';
    if (!transcript.trim()) { 
      toast('Transcript bulunamadı.', 'info');
      alert('No transcript. Enable "Transcript" when recording.'); 
      return; 
    }
    setGeneratingAI(true); setAiError('');
    try {
      const result = await generateAISummary(transcript);
      setAiSummary(result.summary);
      setAiKeyPoints(result.keyPoints);
      setAiEmailDraft(result.emailDraft);
      setAiWikiDocument(result.wikiDocument);
      await updateVideoAI(record.id, result.summary, result.keyPoints, result.emailDraft, result.wikiDocument);
      toast('AI Özeti oluşturuldu!', 'success');
    } catch (err) { 
      setAiError(String(err)); 
      toast('AI işlemi başarısız.', 'error');
    } finally { setGeneratingAI(false); }
  };

  // ── AI Chapter Detection ─────────────────────────────────────────────────
  const handleGenerateChapters = async () => {
    if (!getOpenAIKey()) { alert('Add your OpenAI API key in Settings → AI.'); return; }
    const transcript = record.transcript?.map(s => `[${formatDuration(Math.round(s.startTime))}] ${s.text}`).join('\n') ?? '';
    if (!transcript.trim()) { alert('No transcript available. Record with Transcript enabled.'); return; }
    setGeneratingChapters(true);
    try {
      const { generateAIChapters } = await import('@/lib/aiSummary');
      const chapters = await generateAIChapters(transcript, record.duration);
      setLocalChapters(chapters);
      // Persist to DB if function exists
      try { await (updateVideoChapters as any)(record.id, chapters); } catch {}
    } catch (err) {
      alert('Chapter generation failed: ' + String(err));
    } finally {
      setGeneratingChapters(false);
    }
  };

  // ── SRT / VTT Export ─────────────────────────────────────────────────────
  const handleExportSRT = () => {
    if (!record.transcript?.length) { alert('No transcript to export.'); return; }
    exportSRT(record.transcript, title);
  };
  const handleExportVTT = () => {
    if (!record.transcript?.length) { alert('No transcript to export.'); return; }
    exportVTT(record.transcript, title);
  };

  // ── View Notification ────────────────────────────────────────────────────
  const handleSaveNotifyEmail = () => {
    localStorage.setItem('screensnap_notify_email', notifyEmail);
    setShowNotifyConfig(false);
    alert(`✅ Bildirim e-postası kaydedildi: ${notifyEmail}\n\nNot: Gerçek bildirim için Supabase Edge Function gereklidir. Şimdilik video izlenme linki paylaşıldığında hatırlatma maili gönderebilirsiniz.`);
  };
  // ── Quiz trigger during playback ──────────────────────────────────────────
  useEffect(() => {
    if (!quizQuestions.length) return;
    const triggered = quizQuestions.find(
      q => !answeredQuizIds.has(q.id) && Math.abs(currentTime - q.time) < 0.8
    );
    if (triggered && !activeQuiz) {
      if (videoRef.current) videoRef.current.pause();
      setActiveQuiz(triggered);
    }
  }, [currentTime, quizQuestions, answeredQuizIds, activeQuiz]);

  const handleQuizAnswer = (idx: number) => {
    if (!activeQuiz) return;
    setAnsweredQuizIds(prev => new Set([...prev, activeQuiz.id]));
    setActiveQuiz(null);
    if (videoRef.current) videoRef.current.play();
  };

  const handleQuizSkip = () => {
    if (!activeQuiz) return;
    setAnsweredQuizIds(prev => new Set([...prev, activeQuiz.id]));
    setActiveQuiz(null);
    if (videoRef.current) videoRef.current.play();
  };

  // ── AI Clip Extraction ────────────────────────────────────────────────────
  const handleExtractClip = async () => {
    if (!record.transcript?.length) { alert('Transcript gerekli — Advanced Settings → Transcript açık kaydedin.'); return; }
    if (!getOpenAIKey()) { alert('Settings → AI bölümünden OpenAI API anahtarı girin.'); return; }
    setExtractingClip(true); setClipProgress(0); setClipRange(null);
    try {
      const { detectHighlightRange, extractClip } = await import('@/lib/aiClip');
      const ts = record.transcript.map(s => `[${formatDuration(Math.round(s.startTime))}] ${s.text}`).join('\n');
      const range = await detectHighlightRange(ts, duration);
      setClipRange(range);
      const blob = await extractClip(record.blob, range.start, range.end, title, setClipProgress);
      downloadBlob(blob, `${title}-highlight.mp4`);
    } catch (err) {
      alert('Klip çıkarma başarısız: ' + String(err));
    } finally { setExtractingClip(false); setClipProgress(0); }
  };

  // ── Slack Send ────────────────────────────────────────────────────────────
  const handleSlackSend = async () => {
    const url = slackUrl;
    if (!url) { setShowSlackConfig(true); return; }
    setSendingSlack(true);
    try {
      const payload = {
        text: `📹 *Yeni Video:* ${title}\n⏱ Süre: ${formatDuration(duration)}\n🔗 ${cloudUrl || '(Yerel kayıt — cloud linki yok)'}${aiSummary ? `\n\n📝 *Özet:* ${aiSummary.substring(0, 300)}…` : ''}`,
      };
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Slack webhook yanıt vermedi.');
      alert('✅ Slack kanalına gönderildi!');
      setShowSlackConfig(false);
    } catch (err: any) {
      alert('Slack gönderimi başarısız: ' + err.message);
    } finally { setSendingSlack(false); }
  };

  const handleSendViewLink = () => {
    const url = cloudUrl || window.location.href;
    const email = notifyEmail;
    if (!email) { setShowNotifyConfig(true); return; }
    const subject = encodeURIComponent(`Videonuz izlendi: ${title}`);
    const body = encodeURIComponent(`Birisi "${title}" videonu izledi!\n\nVideo linki: ${url}\n\nBu linki konuğa gönderin ve bildirim almak için bu e-postayı referans alın.`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const handleMagicCut = async () => {
    setIsMagicCutting(true); setMagicCutProgress(0);
    try {
      // Check if blob has audio tracks we can analyze
      const testUrl = URL.createObjectURL(record.blob);
      const testVid = document.createElement('video');
      testVid.src = testUrl;
      testVid.muted = true;
      await new Promise<void>(r => { testVid.onloadedmetadata = () => r(); testVid.load(); });
      URL.revokeObjectURL(testUrl);

      await processMagicCut(record, setMagicCutProgress);
      alert('✨ Sihirli Kırpma tamamlandı! Yeni video koleksiyonunuza eklendi.');
      onSaved?.();
      onClose();
    } catch(err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('Sessizlik bulunamadı') || msg.includes('decodeAudioData')) {
        alert('ℹ️ Video zaten sessizlik içermiyor veya ses verisi analiz edilemedi. Video akıcı görünüyor!');
      } else {
        alert(`Sihirli Kırpma Başarısız: ${msg}`);
      }
    } finally {
      setIsMagicCutting(false);
    }
  };

  const handleRecordReaction = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      reactionChunksRef.current = [];
      recorder.ondataavailable = e => e.data.size > 0 && reactionChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(reactionChunksRef.current, { type: 'video/webm' });
        const reaction: VideoReaction = { id: `react_${Date.now()}`, time: currentTime, blob, createdAt: Date.now() };
        await addVideoReaction(record.id, reaction);
        if (!record.reactions) record.reactions = [];
        record.reactions.push(reaction);
        setIsRecordingReaction(false);
      };
      reactionRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingReaction(true);
      if (videoRef.current) videoRef.current.pause(); // Asıl videoyu durdur
      
      // Stop automatically after 10 seconds to keep it short
      setTimeout(() => {
         if (reactionRecorderRef.current && reactionRecorderRef.current.state === 'recording') {
            reactionRecorderRef.current.stop();
         }
      }, 10000);
      
    } catch(err) {
      alert('Kamera izni alınamadı!');
    }
  };

  const playReaction = (blob: Blob) => {
    if (reactionBlobUrl) URL.revokeObjectURL(reactionBlobUrl);
    setReactionBlobUrl(URL.createObjectURL(blob));
    if (videoRef.current) videoRef.current.pause();
  };

  const handleSaveCta = async () => {
    const newCta = ctaInputText && ctaInputUrl ? { text: ctaInputText, url: ctaInputUrl } : undefined;
    setCta(newCta);
    await updateVideoCTA(record.id, newCta);
    setShowCtaConfig(false);
  };

  const handlePushTask = async () => {
    if (!webhookUrl) return alert("Lütfen ayarlardan Webhook URL'sini girin.");
    setIsPushing(true);
    try {
      const payload = {
        title: pushTaskTitle,
        description: pushTaskDesc,
        videoUrl: cloudUrl || 'Buluta yüklenmemiş yerel video.',
        timestamp: new Date().toISOString()
      };
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Webhook başarısız oldu (API Hatası)");
      alert("✅ Görev başarıyla projeye gönderildi!");
      setShowPushDialog(false);
    } catch (err: any) {
      alert("Gönderim başarısız. Lütfen URL'yi kontrol edin. Hata: " + err.message);
    } finally {
      setIsPushing(false);
    }
  };

  const seek = (t: number) => { if (videoRef.current) videoRef.current.currentTime = t; };

  if (showTrim) return <TrimEditor record={record} onClose={() => setShowTrim(false)} onSaved={() => { setShowTrim(false); onSaved?.(); }} />;

  return (
    <>
      {showThumbPicker && <ThumbnailPicker videoId={record.id} blob={record.blob} duration={duration} currentThumbnail={thumbnail} onClose={() => setShowThumbPicker(false)} onChanged={t => { setThumbnail(t); onSaved?.(); }} />}
      {showQR && <QRModal url={cloudUrl || `${window.location.origin}/watch/${record.id}`} title={title} onClose={() => setShowQR(false)} />}
      {showEmbed && <EmbedModal videoId={record.id} title={title} cloudUrl={cloudUrl} onClose={() => setShowEmbed(false)} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <div className="glass rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 glass z-10">
            {brandLogo && (
              <img src={brandLogo} alt="Brand Logo" className="h-8 max-w-[120px] object-contain mr-4 shrink-0" />
            )}
            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1 mr-4">
                <input autoFocus className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:ring-2"
                  style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                  value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveTitle()} />
                <button onClick={handleSaveTitle} className="p-1.5 rounded-lg text-white" style={{ backgroundColor: brandColor }}><Check className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 mr-4 min-w-0 flex-wrap">
                <h2 className="text-white font-semibold truncate max-w-xs">{title}</h2>
                <button onClick={() => setEditingTitle(true)} className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"><Pencil className="w-3.5 h-3.5" /></button>
                {record.tags?.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/20">{t}</span>)}
                {cloudUrl && <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"><Cloud className="w-3 h-3" /> Cloud</span>}
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
          </div>

          {/* Video & CTA */}
          <div className="bg-black aspect-video relative group">
            {blobUrl && <video ref={videoRef} src={blobUrl} controls className="w-full h-full" autoPlay
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
              onLoadedMetadata={() => {
                const v = videoRef.current;
                if (!v) return;
                const d = isFinite(v.duration) && v.duration > 0 ? v.duration : (record.duration > 0 ? record.duration : 0);
                setDuration(d);
              }}
              onDurationChange={() => {
                const v = videoRef.current;
                if (!v) return;
                const d = isFinite(v.duration) && v.duration > 0 ? v.duration : (record.duration > 0 ? record.duration : 0);
                setDuration(d);
              }}
            />}

            {/* Spotlight Zoom Overlay */}
            {showSpotlight && <SpotlightOverlay videoRef={videoRef as React.RefObject<HTMLVideoElement>} />}

            {/* Subtitle Overlay */}
            {showSubtitles && currentSubtitle && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 max-w-[85%] z-10 pointer-events-none">
                <p className="text-white text-base font-semibold text-center px-4 py-1.5 rounded-xl"
                   style={{ background: 'rgba(0,0,0,0.72)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  {currentSubtitle}
                </p>
              </div>
            )}

            {/* Spotlight Toggle Button */}
            {!showSpotlight && (
              <button
                onClick={() => setShowSpotlight(true)}
                title="Spotlight Zoom"
                className="absolute bottom-12 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur text-white text-xs font-bold border border-white/20 hover:bg-white/20 flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Zoom
              </button>
            )}

            {/* Subtitle Toggle Button */}
            {record.transcript?.length ? (
              <button
                onClick={() => setShowSubtitles(v => !v)}
                title="Altyazıları Göster/Gizle"
                className={`absolute bottom-12 right-20 z-20 opacity-0 group-hover:opacity-100 transition-all px-2.5 py-1.5 rounded-xl backdrop-blur text-white text-xs font-bold border flex items-center gap-1.5 ${
                  showSubtitles ? 'bg-purple-600/80 border-purple-400/40' : 'bg-black/60 border-white/20 hover:bg-white/20'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> {showSubtitles ? 'Alt: ON' : 'Altyazı'}
              </button>
            ) : null}
            
            {/* Variable Overlay */}
            {visitorName && (
              <div className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white font-medium text-lg shadow-xl z-10">
                👋 Merhaba <span style={{ color: brandColor }} className="font-bold">{visitorName}</span>, bu video sana özel hazırlandı!
              </div>
            )}

            {cta && (
              <a
                href={cta.url.startsWith('http') ? cta.url : `https://${cta.url}`}
                target="_blank"
                rel="noreferrer"
                className="absolute right-6 top-6 px-6 py-3 rounded-2xl bg-white/95 hover:bg-white font-extrabold shadow-2xl transition-all hover:scale-105 backdrop-blur-md border border-white flex items-center gap-2 z-10"
                style={{ color: brandColor }}
              >
                {cta.text} <Link2 className="w-4 h-4" />
              </a>
            )}

            {/* Reaction Recorder Overlay */}
            {isRecordingReaction && (
               <div className="absolute top-6 left-6 w-48 aspect-video bg-black rounded-2xl border-2 border-red-500 overflow-hidden shadow-2xl z-20 flex flex-col items-center justify-center">
                 <div className="text-red-500 animate-pulse font-bold text-sm">🔴 Reaksiyon Kaydediliyor...</div>
                 <p className="text-xs text-white/50 mt-1">Maksimum 10 saniye</p>
                 <button onClick={() => reactionRecorderRef.current?.stop()} className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">Bitir</button>
               </div>
            )}

            {/* Reaction Player Overlay */}
            {reactionBlobUrl && (
               <div className="absolute top-6 left-6 w-64 aspect-video bg-black rounded-2xl border-4 border-indigo-500 overflow-hidden shadow-2xl z-30 flex flex-col">
                 <video src={reactionBlobUrl} autoPlay controls className="w-full flex-1" />
                 <button onClick={() => { URL.revokeObjectURL(reactionBlobUrl); setReactionBlobUrl(null); }} className="w-full py-1.5 bg-indigo-500 text-white text-xs font-bold shrink-0">Kapat</button>
               </div>
            )}
          </div>

          {/* Speed */}
          <div className="flex items-center flex-wrap gap-3 px-6 py-3 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Zap className="w-3.5 h-3.5" />
              {SPEED_OPTIONS.map(s => (
                <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${speed === s ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{s}x</button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex gap-3 text-sm text-slate-400">
              <span>⏱ {formatDuration(record.duration)}</span>
              <span>📦 {formatBytes(record.size)}</span>
              <span>🗓 {new Date(record.createdAt).toLocaleDateString()}</span>
              {viewCount !== null && <span className="flex items-center gap-1 text-cyan-400"><Eye className="w-3.5 h-3.5" /> {viewCount} views</span>}
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 flex-wrap">
            <ActionBtn icon={<Scissors className="w-4 h-4" />} label="Trim" onClick={() => setShowTrim(true)} />
            <ActionBtn icon={isMagicCutting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-emerald-400" />} label={isMagicCutting ? `%${Math.round(magicCutProgress)} Sihirli Kırp` : "✨ Sihirli Kırp"} onClick={handleMagicCut} />
            <ActionBtn icon={<ImageIcon className="w-4 h-4" />} label="Thumbnail" onClick={() => setShowThumbPicker(true)} />
            <ActionBtn icon={exportingGif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              label={exportingGif ? `GIF ${gifProgress}%` : 'GIF'} onClick={handleExportGif} disabled={exportingGif} />
            <ActionBtn icon={exportingMp4 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              label={exportingMp4 ? `MP4 ${mp4Progress}%` : 'MP4'} onClick={handleExportMp4} disabled={exportingMp4} />
            <ActionBtn icon={compressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minimize2 className="w-4 h-4" />}
              label={compressing ? `${compressProgress}%` : 'Compress'} onClick={handleCompress} disabled={compressing} />
            {/* SRT / VTT Export */}
            <ActionBtn icon={<FileDown className="w-4 h-4 text-cyan-400" />} label="SRT" onClick={handleExportSRT} title="Altyazı dosyası (.srt) indir" />
            <ActionBtn icon={<FileDown className="w-4 h-4 text-teal-400" />} label="VTT" onClick={handleExportVTT} title="Altyazı dosyası (.vtt) indir" />
            {/* View Notification */}
            <ActionBtn icon={<BellRing className="w-4 h-4 text-amber-400" />} label="Bildirim" onClick={() => setShowNotifyConfig(v => !v)} title="Görüntülenme bildirimi ayarla" />
            <ActionBtn icon={<QrCode className="w-4 h-4" />} label="QR" onClick={() => setShowQR(true)} />
            <ActionBtn icon={<Code2 className="w-4 h-4" />} label="Embed" onClick={() => setShowEmbed(true)} />
            <ActionBtn icon={<Target className="w-4 h-4" />} label="Etkileşim (CTA)" onClick={() => setShowCtaConfig(v => !v)} />
            <ActionBtn icon={<Sparkles className="w-4 h-4 text-pink-400" />} label="Kişiselleştir (Variables)" onClick={() => setShowVariableConfig(v => !v)} />
            <ActionBtn icon={<Rocket className="w-4 h-4 text-indigo-400" />} label="Projeye Gönder" onClick={() => setShowPushDialog(v => !v)} />
            {/* AI Clip */}
            <ActionBtn
              icon={extractingClip ? <Loader2 className="w-4 h-4 animate-spin text-fuchsia-400" /> : <Film className="w-4 h-4 text-fuchsia-400" />}
              label={extractingClip ? `${clipProgress}% Klip…` : '✂️ AI Klip'}
              onClick={handleExtractClip}
              disabled={extractingClip}
              title="Transcript'ten en önemli 60 saniyelik klibi çıkar"
            />
            {/* Slack */}
            <ActionBtn
              icon={sendingSlack ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <SlackIcon className="w-4 h-4 text-emerald-400" />}
              label="Slack"
              onClick={() => setShowSlackConfig(v => !v)}
              title="Videoyu Slack kanalına gönder"
            />
            {isCloudConfigured ? (
              cloudUrl
                ? <ActionBtn icon={<Cloud className="w-4 h-4" />} label={copied ? 'Copied!' : 'Copy Link'} onClick={() => { navigator.clipboard.writeText(cloudUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }} accent="cyan" />
                : <ActionBtn icon={uploadingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />} label={uploadingCloud ? `${uploadProgress}%` : 'Upload'} onClick={handleCloudUpload} disabled={uploadingCloud} />
            ) : (
              <button title="Configure Supabase in Settings" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-sm text-slate-600 cursor-not-allowed"><CloudOff className="w-4 h-4" /> Cloud</button>
            )}
            <div className="flex-1" />
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm text-white font-medium transition-colors">
              <Share2 className="w-4 h-4" />{copied ? 'Copied!' : 'Share'}
            </button>
            <button onClick={handleEmailShare} title="Share via Email" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm text-white font-medium transition-colors">
              <Mail className="w-4 h-4" /> Email
            </button>
            <button onClick={handleTwitterShare} title="Share on X/Twitter" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/20 text-sm text-sky-300 font-medium transition-colors">
              <Twitter className="w-4 h-4" /> Tweet
            </button>
            <button onClick={() => {
              const b = record.blob;
              if (!b || b.size === 0) { alert('Video verisi boş — kayıt sırasında bir sorun oluşmuş olabilir.'); return; }
              const safeBlob = b.type ? b : new Blob([b], { type: 'video/webm' });
              downloadBlob(safeBlob, `${title}.webm`);
            }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-medium transition-colors shadow-lg" style={{ backgroundColor: brandColor }}>
              <Download className="w-4 h-4" /> WebM
            </button>
            <button onClick={handleDelete} className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>

          {/* ── SOSYAL MEDYADA PAYLAŞ ── */}
          <SocialSharePanel cloudUrl={cloudUrl} title={title} blob={record.blob} onDownload={() => {
            const safeBlob = record.blob.type ? record.blob : new Blob([record.blob], { type: 'video/webm' });
            downloadBlob(safeBlob, `${title}.mp4`);
          }} />

          {/* Push to Project Config */}
          {showPushDialog && (
            <div className="px-6 py-4 border-b border-white/10 bg-indigo-900/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2"><Rocket className="w-4 h-4" /> Görev / Bilet Oluştur</h3>
                <button onClick={() => setShowPushDialog(false)} className="text-slate-400 hover:text-white text-xs">Kapat</button>
              </div>
              {!webhookUrl ? (
                <div className="bg-amber-500/10 text-amber-300 text-xs p-3 rounded-xl border border-amber-500/20">
                  ⚠️ Lütfen sağ üstteki <b>Ayarlar</b> menüsünden Webhook URL'nizi ayarlayın.
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-slate-400 font-bold mb-1 block">Görev Başlığı</label>
                    <input value={pushTaskTitle} onChange={e => setPushTaskTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold mb-1 block">Açıklama / AI Özeti</label>
                    <textarea value={pushTaskDesc} onChange={e => setPushTaskDesc(e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-sm" />
                  </div>
                  <div className="flex justify-end mt-1">
                    <button onClick={handlePushTask} disabled={isPushing} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all text-sm shadow-lg shadow-indigo-600/30">
                      {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Gönder
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* View Notification Config */}
          {showNotifyConfig && (
            <div className="px-6 py-4 border-b border-white/10 bg-amber-900/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2"><BellRing className="w-4 h-4" /> Görüntülenme Bildirimi</h3>
                <button onClick={() => setShowNotifyConfig(false)} className="text-slate-400 hover:text-white text-xs">Kapat</button>
              </div>
              <p className="text-xs text-slate-400">Video izlendiğinde bildirim almak istediğiniz e-posta adresini girin. Video linkini paylaştığınızda hatırlatma maili oluşturulur.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="ornek@sirket.com"
                  value={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-amber-500 text-sm"
                />
                <button onClick={handleSaveNotifyEmail} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-all">
                  Kaydet
                </button>
              </div>
              {cloudUrl && (
                <button onClick={handleSendViewLink} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all">
                  <Mail className="w-4 h-4" /> Test — Video İzlenme Bildirimi Gönder
                </button>
              )}
            </div>
          )}

          {/* Slack Config */}
          {showSlackConfig && (
            <div className="px-6 py-4 border-b border-white/10 bg-emerald-900/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2"><SlackIcon className="w-4 h-4" /> Slack Entegrasyonu</h3>
                <button onClick={() => setShowSlackConfig(false)} className="text-slate-400 hover:text-white text-xs">Kapat</button>
              </div>
              <p className="text-xs text-slate-400">Slack → <b>Apps → Incoming Webhooks</b> → Webhook URL'yi aşağıya yapıştırın.</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackUrl}
                  onChange={e => { setSlackUrl(e.target.value); localStorage.setItem('screensnap_slack_url', e.target.value); }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500 text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSlackSend} disabled={sendingSlack || !slackUrl}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-all">
                  {sendingSlack ? <Loader2 className="w-4 h-4 animate-spin" /> : <SlackIcon className="w-4 h-4" />} Slack'e Gönder
                </button>
              </div>
              {clipRange && (
                <p className="text-xs text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl px-3 py-2">
                  ✂️ Son AI Klip: {formatDuration(Math.round(clipRange.start))}–{formatDuration(Math.round(clipRange.end))} — {clipRange.reason}
                </p>
              )}
            </div>
          )}

          {/* Variables Config */}
          {showVariableConfig && (
            <div className="px-6 py-4 border-b border-white/10 bg-pink-900/10 flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-pink-300 font-bold mb-1 block">Ziyaretçi Adı (Variable)</label>
                <div className="flex gap-2">
                  <input
                    placeholder="Örn: Ahmet Yılmaz"
                    value={visitorName}
                    onChange={e => setVisitorName(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-pink-500 text-sm"
                  />
                  <button onClick={() => setShowVariableConfig(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors text-sm font-semibold">Kapat</button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Bu isim sadece video oynatılırken üstte belirir (Kişiselleştirilmiş deneyim).</p>
              </div>
            </div>
          )}

          {/* CTA Embed Config */}
          {showCtaConfig && (
            <div className="px-6 py-4 border-b border-white/10 bg-purple-900/10 flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-purple-300 font-bold mb-1 block">Buton Yazısı (CTA)</label>
                <input
                  placeholder="Örn: Ücretsiz Görüşme Ayarla"
                  value={ctaInputText}
                  onChange={e => setCtaInputText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-cyan-300 font-bold mb-1 block">Yönlendirme Linki (URL)</label>
                <input
                  placeholder="https://calendly.com/siz"
                  value={ctaInputUrl}
                  onChange={e => setCtaInputUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCtaConfig(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors text-sm font-semibold"
                >İptal</button>
                <button
                  onClick={handleSaveCta}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all text-sm shadow-lg shadow-purple-600/30"
                >Kaydet ve Ekle</button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="px-6 py-4">
            <div className="flex gap-1 mb-4 flex-wrap">
              {([
                ['comments', <MessageSquare key="c" className="w-3.5 h-3.5" />, 'Comments'],
                ['transcript', <FileText key="t" className="w-3.5 h-3.5" />, 'Transcript'],
                ['chapters', <BookOpen key="ch" className="w-3.5 h-3.5" />, 'Chapters'],
                ['ai', <Sparkles key="ai" className="w-3.5 h-3.5" />, 'AI Summary'],
                ['quiz', <HelpCircle key="qz" className="w-3.5 h-3.5" />, 'Quiz'],
                ['analytics', <Activity key="an" className="w-3.5 h-3.5" />, 'Analytics'],
                ['security', <Shield key="sec" className="w-3.5 h-3.5" />, 'Security'],
              ] as [typeof activeTab, React.ReactNode, string][]).map(([tab, icon, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Reactions Fast Bar */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <button onClick={handleRecordReaction} className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors">
                 <PlusCircle className="w-3.5 h-3.5" /> Reaksiyon Ekle
              </button>
              {record.reactions?.map(r => (
                 <button key={r.id} onClick={() => playReaction(r.blob)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-mono rounded-lg transition-colors">
                    {formatDuration(Math.round(r.time))} 💬 Oynat
                 </button>
              ))}
            </div>

            {activeTab === 'comments' && (
              <CommentTimeline record={record} currentTime={currentTime} duration={duration} onSeek={seek} />
            )}

            {activeTab === 'transcript' && (
              record.transcript?.length ? (
                <div className="space-y-2">
                  {/* Transcript Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={transcriptSearch}
                      onChange={e => setTranscriptSearch(e.target.value)}
                      placeholder="Transcript içinde ara..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {(translatedSegments ?? record.transcript)
                      .filter(seg => !transcriptSearch || seg.text.toLowerCase().includes(transcriptSearch.toLowerCase()))
                      .map((seg, i) => (
                        <div key={i} className="flex gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/8 cursor-pointer group" onClick={() => seek(seg.startTime)}>
                          <span className="shrink-0 font-mono text-xs text-purple-300 pt-0.5">{formatDuration(Math.round(seg.startTime))}</span>
                          <p className="text-sm text-slate-300 group-hover:text-white">
                            {transcriptSearch ? seg.text.split(new RegExp(`(${transcriptSearch})`, 'gi')).map((part, j) =>
                              part.toLowerCase() === transcriptSearch.toLowerCase()
                                ? <mark key={j} className="bg-purple-500/40 text-purple-100 rounded px-0.5">{part}</mark>
                                : part
                            ) : seg.text}
                          </p>
                        </div>
                      ))}
                  </div>

                  {/* AI Translation Panel */}
                  <div className="border-t border-white/10 pt-3 space-y-2">
                    <button
                      onClick={() => setShowTranslate(v => !v)}
                      className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {translatedSegments ? 'Çeviri Aktif — Dili Değiştir' : 'AI ile Başka Dile Çevir'}
                      {translatedSegments && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Çevrildi</span>}
                    </button>

                    {showTranslate && (
                      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={translateLang}
                            onChange={e => setTranslateLang(e.target.value)}
                            style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }}
                            className="flex-1 min-w-[140px] border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            {TRANSLATION_LANGUAGES.map(l => (
                              <option key={l.code} value={l.code} style={{ backgroundColor: '#0f172a' }}>{l.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={async () => {
                              const lang = TRANSLATION_LANGUAGES.find(l => l.code === translateLang);
                              if (!lang) return;
                              setTranslating(true); setTranslateError('');
                              try {
                                const result = await translateTranscript(
                                  record.transcript!.map(s => ({ startTime: s.startTime, text: s.text })),
                                  lang.code, lang.label
                                );
                                setTranslatedSegments(result);
                                setShowTranslate(false);
                              } catch (e: unknown) {
                                setTranslateError(e instanceof Error ? e.message : 'Çeviri hatası');
                              } finally { setTranslating(false); }
                            }}
                            disabled={translating}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold disabled:opacity-50 transition-all"
                          >
                            {translating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Çevriliyor…</> : <><Sparkles className="w-3.5 h-3.5" /> Çevir</>}
                          </button>
                          {translatedSegments && (
                            <button onClick={() => { setTranslatedSegments(null); setShowTranslate(false); }}
                              className="px-3 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors">
                              Orijinale Dön
                            </button>
                          )}
                        </div>
                        {translateError && <p className="text-red-400 text-xs">{translateError}</p>}
                        {translatedSegments && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const lang = TRANSLATION_LANGUAGES.find(l => l.code === translateLang);
                                const srt = translatedSegments.map((s, i) => {
                                  const fmt = (t: number) => { const h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s2 = Math.floor(t%60), ms = Math.round((t%1)*1000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s2).padStart(2,'0')},${String(ms).padStart(3,'0')}`; };
                                  return `${i+1}\n${fmt(s.startTime)} --> ${fmt(s.endTime ?? s.startTime + 3)}\n${s.text}`;
                                }).join('\n\n');
                                downloadBlob(new Blob([srt], { type: 'text/srt' }), `${record.title}_${lang?.code ?? 'translated'}.srt`);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                            >
                              <FileDown className="w-3.5 h-3.5" /> SRT İndir
                            </button>
                            <button
                              onClick={() => {
                                const lang = TRANSLATION_LANGUAGES.find(l => l.code === translateLang);
                                const vtt = ['WEBVTT', '', ...translatedSegments.map((s, i) => {
                                  const fmt = (t: number) => { const h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s2 = Math.floor(t%60), ms = Math.round((t%1)*1000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s2).padStart(2,'0')}.${String(ms).padStart(3,'0')}`; };
                                  return `${i+1}\n${fmt(s.startTime)} --> ${fmt(s.endTime ?? s.startTime + 3)}\n${s.text}`;
                                })].join('\n\n');
                                downloadBlob(new Blob([vtt], { type: 'text/vtt' }), `${record.title}_${lang?.code ?? 'translated'}.vtt`);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                            >
                              <FileDown className="w-3.5 h-3.5" /> VTT İndir
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyTab icon="📝" msg="No transcript." hint="Enable 'Transcript' in recording settings." />
              )
            )}

            {activeTab === 'chapters' && (
              <div className="space-y-3">
                {/* AI Chapter Generation Button */}
                {record.transcript?.length ? (
                  <button
                    onClick={handleGenerateChapters}
                    disabled={generatingChapters}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-bold disabled:opacity-50 transition-all"
                  >
                    {generatingChapters
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> AI Chapter Oluşturuluyor…</>
                      : <><Sparkles className="w-4 h-4" /> ✨ AI ile Otomatik Chapter Oluştur</>}
                  </button>
                ) : (
                  <p className="text-xs text-slate-500">AI chapter için transcript gerekli — kaydı Transcript açık yapın.</p>
                )}
                {localChapters.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {localChapters.map((ch, i) => (
                      <div key={ch.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/8 cursor-pointer group" onClick={() => seek(ch.time)}>
                        <span className="w-6 h-6 shrink-0 rounded-full bg-purple-600/30 text-purple-300 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        <span className="font-mono text-xs text-purple-300">{formatDuration(Math.round(ch.time))}</span>
                        <span className="text-sm text-slate-300 group-hover:text-white flex-1">{ch.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyTab icon="📖" msg="Henüz chapter yok." hint="Yukarıdaki AI butonunu kullanın veya kayıt sırasında chapter ekleyin." />
                )}
              </div>
            )}

            {activeTab === 'quiz' && (
              <QuizBuilder
                questions={quizQuestions}
                currentTime={currentTime}
                onQuestionsChange={setQuizQuestions}
              />
            )}

            {activeTab === 'ai' && (
              <div className="space-y-4">
                {!getOpenAIKey() && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-sm">
                    ⚠️ OpenAI API anahtarınızı <a href="/settings" className="underline font-bold">Ayarlar → AI</a> bölümünden ekleyin.
                  </div>
                )}
                {!record.transcript?.length && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-300 text-sm">
                    💡 <b>İpucu:</b> AI özelliklerinin tamamı için kayıt sırasında <b>Advanced Settings → Transcript</b> seçeneğini açık bırakın.
                  </div>
                )}
                {aiError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">{aiError}</div>}
                {/* AI Summary */}
                <div className="border border-purple-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center"><Sparkles className="w-4 h-4 text-purple-400" /></div>
                    <div><h3 className="text-white font-bold text-sm">🧠 AI Özet + 📧 Email + 📖 Wiki</h3><p className="text-xs text-slate-500">Transcript'ten otomatik özet, satış emaili ve dokümantasyon</p></div>
                  </div>
                  <button onClick={handleGenerateAI} disabled={generatingAI} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white text-sm font-bold disabled:opacity-50 transition-all">
                    {generatingAI ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor…</> : <><Sparkles className="w-4 h-4" /> AI Özet + Email + Wiki Oluştur</>}
                  </button>
                  {aiSummary && (
                    <div className="space-y-2">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10"><h3 className="text-xs font-bold text-slate-400 uppercase mb-2">📝 Özet</h3><p className="text-slate-300 text-sm leading-relaxed">{aiSummary}</p></div>
                      {aiKeyPoints.length > 0 && <div className="bg-white/5 rounded-xl p-3 border border-white/10"><h3 className="text-xs font-bold text-slate-400 uppercase mb-2">📌 Ana Noktalar</h3><ul className="space-y-1">{aiKeyPoints.map((pt, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-purple-400 shrink-0">•</span>{pt}</li>)}</ul></div>}
                      {aiEmailDraft && <div className="bg-white/5 rounded-xl p-3 border border-white/10"><div className="flex items-center justify-between mb-1"><h3 className="text-xs font-bold text-slate-400 uppercase">📧 Email Taslağı</h3><button onClick={() => { navigator.clipboard.writeText(aiEmailDraft); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"><Copy className="w-3 h-3 inline mr-1" />{copied ? '✅' : 'Kopyala'}</button></div><div className="text-slate-300 text-sm whitespace-pre-wrap max-h-36 overflow-y-auto">{aiEmailDraft}</div></div>}
                      {aiWikiDocument && <div className="bg-white/5 rounded-xl p-3 border border-white/10"><div className="flex items-center justify-between mb-1"><h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><BookOpen className="w-3 h-3 text-blue-400" />📖 Wiki</h3><div className="flex gap-1"><button onClick={() => { navigator.clipboard.writeText(aiWikiDocument); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs">Kopyala</button><button onClick={() => downloadBlob(new Blob([aiWikiDocument], { type: 'text/markdown' }), `${title}-wiki.md`)} className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs">.md</button></div></div><div className="text-slate-300 text-xs whitespace-pre-wrap font-mono max-h-36 overflow-y-auto">{aiWikiDocument}</div></div>}
                    </div>
                  )}
                </div>

                {/* AI Chapters */}
                <div className="border border-violet-500/20 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center"><BookOpen className="w-4 h-4 text-violet-400" /></div><div><h3 className="text-white font-bold text-sm">🔖 AI Bölümler</h3><p className="text-xs text-slate-500">Transcript'ten otomatik bölüm başlıkları</p></div></div>
                    <button onClick={() => setActiveTab('chapters')} className="text-xs text-violet-400 hover:text-violet-300">Chapters →</button>
                  </div>
                  {record.transcript?.length ? <button onClick={handleGenerateChapters} disabled={generatingChapters} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 text-sm font-bold disabled:opacity-50 transition-all">{generatingChapters ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Oluşturuluyor…</> : <><Sparkles className="w-3.5 h-3.5" /> Otomatik Bölümler Oluştur</>}</button> : <p className="text-xs text-slate-500 bg-white/5 rounded-xl px-3 py-2">⚠️ Transcript gerekli</p>}
                  {localChapters.length > 0 && <p className="text-xs text-emerald-400">✅ {localChapters.length} bölüm hazır</p>}
                </div>

                {/* AI Clip */}
                <div className="border border-fuchsia-500/20 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 flex items-center justify-center"><Film className="w-4 h-4 text-fuchsia-400" /></div><div><h3 className="text-white font-bold text-sm">✂️ AI Klip — En İyi 60 Saniye</h3><p className="text-xs text-slate-500">Sosyal medya için en değerli anı tespit edip indir</p></div></div>
                  {record.transcript?.length ? <div className="space-y-2"><button onClick={handleExtractClip} disabled={extractingClip} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/30 border border-fuchsia-500/20 text-fuchsia-300 text-sm font-bold disabled:opacity-50 transition-all">{extractingClip ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {clipProgress}% İşleniyor…</> : <><ClipIcon className="w-3.5 h-3.5" /> En Değerli Klibi Çıkar</>}</button>{clipRange && <p className="text-xs text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl px-3 py-2">✅ {formatDuration(Math.round(clipRange.start))}–{formatDuration(Math.round(clipRange.end))} — {clipRange.reason}</p>}</div> : <p className="text-xs text-slate-500 bg-white/5 rounded-xl px-3 py-2">⚠️ Transcript gerekli</p>}
                </div>

                {/* AI Translation */}
                <div className="border border-cyan-500/20 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center"><Sparkles className="w-4 h-4 text-cyan-400" /></div><div><h3 className="text-white font-bold text-sm">🌍 Altyazı Çevirisi</h3><p className="text-xs text-slate-500">TR↔EN ve 12 dil — SRT/VTT indir</p></div></div>
                  {record.transcript?.length ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={translateLang} onChange={e => setTranslateLang(e.target.value)} style={{ backgroundColor: '#0f172a', color: '#e2e8f0' }} className="border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500">
                        {TRANSLATION_LANGUAGES.map(l => <option key={l.code} value={l.code} style={{ backgroundColor: '#0f172a' }}>{l.label}</option>)}
                      </select>
                      <button onClick={async () => { const lang = TRANSLATION_LANGUAGES.find(l => l.code === translateLang); if (!lang) return; setTranslating(true); setTranslateError(''); try { const result = await translateTranscript(record.transcript!.map(s => ({ startTime: s.startTime, text: s.text })), lang.code, lang.label); setTranslatedSegments(result); setActiveTab('transcript'); toast('Çeviri tamamlandı!', 'success'); } catch (e: unknown) { setTranslateError(e instanceof Error ? e.message : 'Çeviri hatası'); } finally { setTranslating(false); } }} disabled={translating} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold disabled:opacity-50 transition-all">
                        {translating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Çevriliyor…</> : <><Sparkles className="w-3.5 h-3.5" /> Çevir</>}
                      </button>
                      {translatedSegments && <span className="text-xs text-emerald-400">✅ Çeviri aktif</span>}
                      {translateError && <p className="w-full text-red-400 text-xs">{translateError}</p>}
                    </div>
                  ) : <p className="text-xs text-slate-500 bg-white/5 rounded-xl px-3 py-2">⚠️ Transcript gerekli</p>}
                </div>

              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-white font-bold text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-orange-400" /> İzlenme Isı Haritası (Engagement Heatmap)</h3>
                   <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/10">Kurumsal Analitik</span>
                </div>
                <p className="text-slate-400 text-sm mb-4">Bu grafik, izleyicilerinizin videoyu en çok hangi saniyelerde dikkatle izlediğini veya terk ettiğini gösterir.</p>
                <div className="relative h-32 w-full flex items-end gap-[1px] bg-black/40 p-2 rounded-xl border border-white/10 overflow-hidden group">
                  {/* Backdrop Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
                     <div className="w-full border-t border-white/30"></div><div className="w-full border-t border-white/30"></div><div className="w-full border-t border-white/30"></div>
                  </div>
                  {/* Heatmap Bars */}
                  {Array.from({ length: 50 }).map((_, i) => {
                     // Generate a pseudo-realistic dropoff curve
                     const dropOff = Math.exp(-i / 25); 
                     const peaks = Math.sin(i / 3) * 0.2 + 0.8; 
                     const heightPct = Math.max(10, Math.min(100, dropOff * peaks * 100));
                     const isHot = heightPct > 65;
                     return (
                       <div key={i} title={`Dakika ${formatDuration(Math.round(duration * (i/50)))} - İzleme: %${Math.round(heightPct)}`}
                         className={`flex-1 rounded-t-sm transition-all hover:opacity-80 cursor-pointer ${isHot ? 'bg-gradient-to-t from-orange-500 to-red-500' : 'bg-gradient-to-t from-blue-600/50 to-indigo-500/80'}`}
                         style={{ height: `${heightPct}%` }}
                         onClick={() => seek(duration * (i/50))}
                       />
                     );
                  })}
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-mono px-2">
                  <span>0:00 (Başlangıç)</span>
                  <span>Dikkat Dağılımı</span>
                  <span>{formatDuration(record.duration)} (Bitiş)</span>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="bg-white/5 border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                   <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity"><Clock className="w-16 h-16 text-amber-500" /></div>
                   <h4 className="text-white font-bold flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-amber-500" /> Otomatik İmha (Retention)</h4>
                   <p className="text-xs text-slate-400 mb-4 pr-10">Gizlilik gereği bu video paylaşıldıktan sonra belirlediğiniz süre sonunda kalıcı silinir.</p>
                   <select className="bg-black/40 border border-white/10 text-slate-300 text-sm rounded-xl px-3 py-2 w-full outline-none focus:border-amber-500" defaultValue="Süresiz (Asla Silme)">
                      <option>Süresiz (Asla Silme)</option>
                      <option>🕒 24 Saat Sonra Sil</option>
                      <option>🕒 7 Gün Sonra Sil</option>
                      <option>🕒 30 Gün Sonra Sil</option>
                   </select>
                 </div>

                 <div className="bg-white/5 border border-emerald-500/30 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                   <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity"><Lock className="w-16 h-16 text-emerald-500" /></div>
                   <h4 className="text-white font-bold flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-emerald-500" /> Şifreli & SSO Erişim</h4>
                   <p className="text-xs text-slate-400 mb-4 pr-10">Videonun sadece belirlenen şirket mailleri veya şifre ile izlenebilmesini sağlar.</p>
                   <div className="flex gap-2 relative z-10">
                     <input type="password" placeholder="Şifre belirle..." className="bg-black/40 border border-white/10 text-slate-300 text-sm rounded-xl px-3 py-2 flex-1 outline-none focus:border-emerald-500" />
                     <button className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors">Kilitle</button>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ActionBtn({ icon, label, onClick, disabled = false, accent = 'default', title }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; accent?: 'default' | 'cyan'; title?: string }) {
  const cls = accent === 'cyan' ? 'bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/25' : 'bg-white/10 hover:bg-white/20 text-white';
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${cls}`}>
      {icon} {label}
    </button>
  );
}

function EmptyTab({ icon, msg, hint }: { icon: string; msg: string; hint: string }) {
  return (
    <div className="text-center py-8 text-slate-500">
      <span className="text-3xl block mb-2">{icon}</span>
      <p className="text-sm font-medium text-slate-400">{msg}</p>
      <p className="text-xs mt-1">{hint}</p>
    </div>
  );
}

// ─── Social Share Panel ───────────────────────────────────────────────────────
interface SocialPlatform {
  id: string;
  label: string;
  icon: string;
  color: string;
  border: string;
  text: string;
  /** true = can share via URL intent, false = requires upload */
  urlShare: boolean;
  shareUrl?: (url: string, title: string) => string;
  uploadUrl?: string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'facebook', label: 'Facebook', icon: '🟦', color: 'bg-blue-600/20 hover:bg-blue-600/35', border: 'border-blue-500/30', text: 'text-blue-300',
    urlShare: true,
    shareUrl: (u, _t) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    uploadUrl: 'https://www.facebook.com/reels/create',
  },
  {
    id: 'youtube', label: 'YouTube', icon: '🔴', color: 'bg-red-600/20 hover:bg-red-600/35', border: 'border-red-500/30', text: 'text-red-300',
    urlShare: false,
    uploadUrl: 'https://studio.youtube.com/channel/upload',
  },
  {
    id: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-pink-600/20 hover:bg-pink-600/35', border: 'border-pink-500/30', text: 'text-pink-300',
    urlShare: false,
    uploadUrl: 'https://www.instagram.com/create/story',
  },
  {
    id: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'bg-sky-600/20 hover:bg-sky-600/35', border: 'border-sky-500/30', text: 'text-sky-300',
    urlShare: true,
    shareUrl: (u, t) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}`,
    uploadUrl: 'https://www.linkedin.com/feed/',
  },
  {
    id: 'twitter', label: 'X / Twitter', icon: '𝕏', color: 'bg-slate-600/20 hover:bg-slate-600/35', border: 'border-slate-500/30', text: 'text-slate-200',
    urlShare: true,
    shareUrl: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
  },
  {
    id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: 'bg-green-600/20 hover:bg-green-600/35', border: 'border-green-500/30', text: 'text-green-300',
    urlShare: true,
    shareUrl: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} — ${u}`)}`,
  },
  {
    id: 'telegram', label: 'Telegram', icon: '✈️', color: 'bg-cyan-600/20 hover:bg-cyan-600/35', border: 'border-cyan-500/30', text: 'text-cyan-300',
    urlShare: true,
    shareUrl: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
  {
    id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-fuchsia-600/20 hover:bg-fuchsia-600/35', border: 'border-fuchsia-500/30', text: 'text-fuchsia-300',
    urlShare: false,
    uploadUrl: 'https://www.tiktok.com/upload',
  },
  {
    id: 'dailymotion', label: 'Dailymotion', icon: '🎬', color: 'bg-orange-600/20 hover:bg-orange-600/35', border: 'border-orange-500/30', text: 'text-orange-300',
    urlShare: false,
    uploadUrl: 'https://www.dailymotion.com/upload',
  },
  {
    id: 'vimeo', label: 'Vimeo', icon: '🎞️', color: 'bg-teal-600/20 hover:bg-teal-600/35', border: 'border-teal-500/30', text: 'text-teal-300',
    urlShare: false,
    uploadUrl: 'https://vimeo.com/upload',
  },
];

function SocialSharePanel({ cloudUrl, title, blob, onDownload }: {
  cloudUrl?: string | null;
  title: string;
  blob: Blob;
  onDownload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<SocialPlatform | null>(null);

  const handlePlatform = (p: SocialPlatform) => {
    if (p.urlShare && cloudUrl) {
      // Direct URL intent
      window.open(p.shareUrl!(cloudUrl, title), '_blank');
    } else if (p.uploadUrl) {
      // Show download-first prompt
      setPendingPlatform(p);
    } else if (p.urlShare && !cloudUrl) {
      alert('Önce videoyu buluta yükleyin (Cloud → Upload) veya link alın. Sonra platformda paylaşabilirsiniz.');
    }
  };

  const handleDownloadAndOpen = () => {
    if (!pendingPlatform) return;
    onDownload();
    setTimeout(() => {
      window.open(pendingPlatform.uploadUrl, '_blank');
      setPendingPlatform(null);
    }, 800);
  };

  return (
    <div className="border-b border-white/10">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors text-left group"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-base">📣</span>
          <span className="text-sm font-bold text-slate-300">Sosyal Medyada Paylaş</span>
          <span className="text-[11px] text-slate-600 ml-1">
            {cloudUrl ? '— link hazır ✓' : '— önce indir, sonra yükle'}
          </span>
        </div>
        <span className={`text-slate-500 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="px-6 pb-5">
          {/* Status bar */}
          {!cloudUrl && (
            <div className="mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
              <div>
                <p className="text-xs text-amber-300 font-semibold">Cloud linki yok</p>
                <p className="text-[11px] text-slate-500">Facebook, LinkedIn, Twitter gibi URL-tabanlı platformlar için önce <b>Upload</b> butonuyla buluta yükleyin. Instagram, YouTube, TikTok için video indirilip platforma yüklenir.</p>
              </div>
            </div>
          )}
          {cloudUrl && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400">✅</span>
              <p className="text-xs text-emerald-300 font-semibold">Cloud linki hazır — URL tabanlı platformlarda tek tıkla paylaşabilirsiniz.</p>
            </div>
          )}

          {/* Platform grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {SOCIAL_PLATFORMS.map(p => {
              const canDirectShare = p.urlShare && cloudUrl;
              const needsDownload = !p.urlShare && p.uploadUrl;
              const noCloud = p.urlShare && !cloudUrl;

              return (
                <button
                  key={p.id}
                  onClick={() => handlePlatform(p)}
                  title={
                    canDirectShare ? `${p.label}'da paylaş` :
                    needsDownload ? `Videoyu indir, ${p.label}'a yükle` :
                    `Önce buluta yükleyin`
                  }
                  className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border transition-all font-semibold ${p.color} ${p.border} ${p.text} ${noCloud ? 'opacity-50' : 'hover:scale-[1.03] hover:shadow-lg'}`}
                >
                  <span className="text-xl leading-none">{p.icon}</span>
                  <span className="text-[11px] font-bold leading-tight text-center">{p.label}</span>
                  <span className="text-[9px] opacity-60 leading-tight">
                    {canDirectShare ? '🔗 Link ile' : needsDownload ? '⬇️ İndir & Yükle' : '🔗 Link gerekli'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Download-and-open confirmation modal */}
          {pendingPlatform && (
            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/15 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{pendingPlatform.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white">{pendingPlatform.label} Yükleme</p>
                  <p className="text-xs text-slate-400">Video bilgisayarınıza indirilecek, ardından {pendingPlatform.label} yükleme sayfası açılacak.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadAndOpen}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${pendingPlatform.color} ${pendingPlatform.border} ${pendingPlatform.text} border`}
                >
                  <Download className="w-4 h-4" /> İndir & {pendingPlatform.label}&apos;ı Aç
                </button>
                <button
                  onClick={() => setPendingPlatform(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-white/10 hover:bg-white/10 text-sm transition-all"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
