'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  X, Download, Copy, Pen, Eraser, Square, ArrowUpRight,
  Type, Highlighter, Undo2, Trash2, Minus, Plus, Check, Camera
} from 'lucide-react';

type Tool = 'pen' | 'arrow' | 'rect' | 'text' | 'highlight' | 'eraser';

interface Point { x: number; y: number }
interface Shape {
  tool: Tool;
  color: string;
  size: number;
  points: Point[];
  text?: string;
}

const COLORS = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#7c3aed', '#ec4899', '#000000'];

interface ScreenshotModalProps {
  imageData: ImageData | null;
  canvasWidth: number;
  canvasHeight: number;
  onClose: () => void;
}

export default function ScreenshotModal({ imageData, canvasWidth, canvasHeight, onClose }: ScreenshotModalProps) {
  const bgCanvasRef  = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  const [tool, setTool]   = useState<Tool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [size, setSize]   = useState(3);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<Point | null>(null);

  const isDrawingRef   = useRef(false);
  const currentShapeRef = useRef<Shape | null>(null);
  const shapesRef      = useRef<Shape[]>([]);

  // Draw background image
  useEffect(() => {
    if (!bgCanvasRef.current || !imageData) return;
    const ctx = bgCanvasRef.current.getContext('2d')!;
    bgCanvasRef.current.width  = canvasWidth;
    bgCanvasRef.current.height = canvasHeight;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData, canvasWidth, canvasHeight]);

  // Set draw canvas size
  useEffect(() => {
    if (!drawCanvasRef.current) return;
    drawCanvasRef.current.width  = canvasWidth;
    drawCanvasRef.current.height = canvasHeight;
  }, [canvasWidth, canvasHeight]);

  const getPos = useCallback((e: React.MouseEvent): Point => {
    const canvas = drawCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }, []);

  const redrawShapes = useCallback((extra?: Shape) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const all = extra ? [...shapesRef.current, extra] : shapesRef.current;
    for (const s of all) renderShape(ctx, s);
  }, []);

  const renderShape = (ctx: CanvasRenderingContext2D, s: Shape) => {
    if (s.points.length < 1) return;
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.fillStyle   = s.color;
    ctx.lineWidth   = s.size;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    if (s.tool === 'pen') {
      if (s.points.length < 2) { ctx.restore(); return; }
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
    } else if (s.tool === 'eraser') {
      if (s.points.length < 2) { ctx.restore(); return; }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = s.size * 4;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
    } else if (s.tool === 'highlight') {
      if (s.points.length < 2) { ctx.restore(); return; }
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = s.size * 6;
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
      ctx.stroke();
    } else if (s.tool === 'rect') {
      if (s.points.length < 2) { ctx.restore(); return; }
      const [a, b] = [s.points[0], s.points[s.points.length - 1]];
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    } else if (s.tool === 'arrow') {
      if (s.points.length < 2) { ctx.restore(); return; }
      const [a, b] = [s.points[0], s.points[s.points.length - 1]];
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const headLen = Math.min(s.size * 6, 30);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - headLen * Math.cos(angle - Math.PI / 6), b.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(b.x - headLen * Math.cos(angle + Math.PI / 6), b.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (s.tool === 'text' && s.text) {
      ctx.font = `bold ${s.size * 6 + 12}px Inter, sans-serif`;
      ctx.fillText(s.text, s.points[0].x, s.points[0].y);
    }
    ctx.restore();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (tool === 'text') {
      setTextPos(getPos(e));
      setTextInput('');
      return;
    }
    isDrawingRef.current = true;
    const pos = getPos(e);
    currentShapeRef.current = { tool, color, size, points: [pos] };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !currentShapeRef.current) return;
    const pos = getPos(e);
    if (tool === 'pen' || tool === 'eraser' || tool === 'highlight') {
      currentShapeRef.current.points.push(pos);
    } else {
      currentShapeRef.current.points = [currentShapeRef.current.points[0], pos];
    }
    redrawShapes(currentShapeRef.current);
  };

  const onMouseUp = () => {
    if (!currentShapeRef.current) return;
    shapesRef.current = [...shapesRef.current, currentShapeRef.current];
    setShapes([...shapesRef.current]);
    currentShapeRef.current = null;
    isDrawingRef.current = false;
    redrawShapes();
  };

  const commitText = () => {
    if (!textPos || !textInput.trim()) { setTextPos(null); return; }
    const s: Shape = { tool: 'text', color, size, points: [textPos], text: textInput };
    shapesRef.current = [...shapesRef.current, s];
    setShapes([...shapesRef.current]);
    redrawShapes();
    setTextPos(null);
    setTextInput('');
  };

  const undo = () => {
    shapesRef.current = shapesRef.current.slice(0, -1);
    setShapes([...shapesRef.current]);
    redrawShapes();
  };

  const clearAll = () => {
    shapesRef.current = [];
    setShapes([]);
    redrawShapes();
  };

  // Merge bg + annotations into one canvas and return it
  const getMergedCanvas = useCallback((): HTMLCanvasElement => {
    const merged = document.createElement('canvas');
    merged.width  = canvasWidth;
    merged.height = canvasHeight;
    const ctx = merged.getContext('2d')!;
    if (bgCanvasRef.current)   ctx.drawImage(bgCanvasRef.current,   0, 0);
    if (drawCanvasRef.current) ctx.drawImage(drawCanvasRef.current, 0, 0);
    return merged;
  }, [canvasWidth, canvasHeight]);

  const handleDownload = useCallback(() => {
    const merged = getMergedCanvas();
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
    merged.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `screenshot_${ts}.png`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [getMergedCanvas]);

  const handleCopy = useCallback(async () => {
    const merged = getMergedCanvas();
    merged.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* fallback: just download */ handleDownload(); }
    }, 'image/png');
  }, [getMergedCanvas, handleDownload]);

  const cursor = tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'crosshair';

  const TOOLS: [Tool, React.ReactNode, string][] = [
    ['pen',       <Pen className="w-4 h-4" />,           'Kalem'],
    ['arrow',     <ArrowUpRight className="w-4 h-4" />,  'Ok'],
    ['rect',      <Square className="w-4 h-4" />,        'Dikdörtgen'],
    ['highlight', <Highlighter className="w-4 h-4" />,   'İşaretleyici'],
    ['text',      <Type className="w-4 h-4" />,          'Metin'],
    ['eraser',    <Eraser className="w-4 h-4" />,        'Silgi'],
  ];

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-black/95 backdrop-blur-sm">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-slate-950/80 shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-purple-400" />
          <span className="text-white font-bold text-sm">Screenshot Düzenleyici</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${copied ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Kopyalandı!' : 'Kopyala'}
          </button>
          <button
            onClick={handleDownload}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {saved ? 'Kaydedildi!' : 'PNG İndir'}
          </button>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-6"
      >
        <div className="relative shadow-2xl" style={{ maxWidth: '100%', maxHeight: '100%' }}>
          {/* Background screenshot */}
          <canvas
            ref={bgCanvasRef}
            style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 180px)', objectFit: 'contain' }}
          />
          {/* Draw layer */}
          <canvas
            ref={drawCanvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{
              position: 'absolute', inset: 0, cursor,
              maxWidth: '100%', maxHeight: 'calc(100vh - 180px)',
            }}
          />
          {/* Text input overlay */}
          {textPos && (
            <div
              style={{
                position: 'absolute',
                left: `${(textPos.x / canvasWidth) * 100}%`,
                top:  `${(textPos.y / canvasHeight) * 100}%`,
                zIndex: 50,
              }}
            >
              <input
                autoFocus
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextPos(null); }}
                onBlur={commitText}
                placeholder="Metin yaz…"
                className="bg-black/70 text-white border border-purple-500 rounded px-2 py-1 text-sm outline-none min-w-[120px]"
                style={{ color, fontSize: `${size * 6 + 12}px` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="shrink-0 border-t border-white/10 bg-slate-950/80 px-5 py-3 flex items-center justify-center gap-2 flex-wrap">

        {/* Tools */}
        <div className="flex items-center gap-1 pr-3 border-r border-white/10">
          {TOOLS.map(([t, icon, label]) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              title={label}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                tool === t
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Color swatches */}
        {tool !== 'eraser' && (
          <div className="flex items-center gap-1.5 px-3 border-r border-white/10">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110 border border-white/20"
                style={{
                  background: c,
                  outline: color === c ? '2px solid white' : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        )}

        {/* Size */}
        <div className="flex items-center gap-2 px-3 border-r border-white/10">
          <button onClick={() => setSize(s => Math.max(1, s - 1))} className="text-slate-400 hover:text-white">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div
            className="rounded-full transition-all"
            style={{ width: Math.min(size * 3 + 4, 24), height: Math.min(size * 3 + 4, 24), background: tool === 'eraser' ? '#64748b' : color }}
          />
          <button onClick={() => setSize(s => Math.min(12, s + 1))} className="text-slate-400 hover:text-white">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo / Clear */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={shapes.length === 0}
            title="Geri Al"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={clearAll}
            disabled={shapes.length === 0}
            title="Tümünü Sil"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
