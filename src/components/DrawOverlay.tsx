'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Pen, Eraser, Trash2, Undo2, Minus, Plus, ArrowUpRight, Square, Type, Highlighter, Zap } from 'lucide-react';

type Tool = 'pen' | 'eraser' | 'laser' | 'arrow' | 'rect' | 'circle' | 'text' | 'highlight' | 'stamp';

interface DrawOverlayProps {
  annotationCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  onClose: () => void;
}

interface PathPoint { x: number; y: number }
interface DrawnPath {
  tool: Tool;
  color: string;
  size: number;
  points: PathPoint[];
  opacity: number;
  timestamp?: number;
  text?: string;
}

const COLORS = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#7c3aed'];
const STAMPS = ['⭐', '✅', '❌', '💡', '🔥', '👆', '❗', '🎯'];

export default function DrawOverlay({ annotationCanvasRef, onClose }: DrawOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<DrawnPath | null>(null);
  const pathsRef = useRef<DrawnPath[]>([]);
  const laserTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [size, setSize] = useState(4);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<PathPoint | null>(null);
  const [selectedStamp, setSelectedStamp] = useState('⭐');
  const [, forceRender] = useState(0);

  // Wire canvas to annotationCanvasRef so compositor picks it up
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      ctxRef.current = canvas.getContext('2d');
      annotationCanvasRef.current = canvas;
    }
    return () => { annotationCanvasRef.current = null; };
  }, [annotationCanvasRef]);

  // Resize canvas to match viewport
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawAll();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderShape = useCallback((ctx: CanvasRenderingContext2D, path: DrawnPath) => {
    if (path.points.length < 1) return;
    ctx.save();
    ctx.globalAlpha = path.opacity;
    ctx.strokeStyle = path.color;
    ctx.fillStyle = path.color;
    ctx.lineWidth = path.tool === 'laser' ? path.size * 2 : path.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (path.tool === 'pen' || path.tool === 'laser') {
      if (path.points.length < 2) { ctx.restore(); return; }
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y);
      ctx.stroke();
    } else if (path.tool === 'eraser') {
      if (path.points.length < 2) { ctx.restore(); return; }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = path.size * 5;
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y);
      ctx.stroke();
    } else if (path.tool === 'highlight') {
      if (path.points.length < 2) { ctx.restore(); return; }
      ctx.globalAlpha = path.opacity * 0.35;
      ctx.lineWidth = path.size * 8;
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y);
      ctx.stroke();
    } else if (path.tool === 'rect') {
      if (path.points.length < 2) { ctx.restore(); return; }
      const [a, b] = [path.points[0], path.points[path.points.length - 1]];
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    } else if (path.tool === 'circle') {
      if (path.points.length < 2) { ctx.restore(); return; }
      const [a, b] = [path.points[0], path.points[path.points.length - 1]];
      const rx = Math.abs(b.x - a.x) / 2; const ry = Math.abs(b.y - a.y) / 2;
      const cx = (a.x + b.x) / 2; const cy = (a.y + b.y) / 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (path.tool === 'arrow') {
      if (path.points.length < 2) { ctx.restore(); return; }
      const [a, b] = [path.points[0], path.points[path.points.length - 1]];
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const headLen = Math.min(path.size * 5, 28);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - headLen * Math.cos(angle - Math.PI / 6), b.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(b.x - headLen * Math.cos(angle + Math.PI / 6), b.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath(); ctx.fill();
    } else if (path.tool === 'text' && path.text) {
      ctx.font = `bold ${path.size * 5 + 12}px Inter, sans-serif`;
      ctx.fillText(path.text, path.points[0].x, path.points[0].y);
    } else if (path.tool === 'stamp' && path.text) {
      const fontSize = path.size * 8 + 16;
      ctx.font = `${fontSize}px serif`;
      ctx.globalAlpha = 1;
      ctx.fillText(path.text, path.points[0].x - fontSize / 2, path.points[0].y + fontSize / 2);
    }
    ctx.restore();
  }, []);

  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const path of pathsRef.current) renderShape(ctx, path);
  }, [renderShape]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): PathPoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'text') {
      const pos = getPos(e);
      setTextPos(pos);
      setTextInput('');
      return;
    }
    if (tool === 'stamp') {
      const pos = getPos(e);
      const path: DrawnPath = { tool: 'stamp', color, size, points: [pos], opacity: 1, text: selectedStamp };
      pathsRef.current.push(path);
      redrawAll();
      forceRender(n => n + 1);
      return;
    }
    isDrawingRef.current = true;
    const pos = getPos(e);
    currentPathRef.current = { tool, color, size, points: [pos], opacity: tool === 'laser' ? 0.9 : 1, timestamp: tool === 'laser' ? Date.now() : undefined };
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || !currentPathRef.current) return;
    const pos = getPos(e);

    if (tool === 'pen' || tool === 'eraser' || tool === 'laser' || tool === 'highlight') {
      currentPathRef.current.points.push(pos);
      // incremental draw
      const ctx = ctxRef.current!;
      const path = currentPathRef.current;
      const pts = path.points;
      if (pts.length < 2) return;
      ctx.save();
      ctx.globalAlpha = path.opacity * (tool === 'highlight' ? 0.35 : 1);
      ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : path.color;
      ctx.lineWidth = tool === 'eraser' ? path.size * 5 : tool === 'laser' ? path.size * 2 : tool === 'highlight' ? path.size * 8 : path.size;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
      ctx.restore();
    } else {
      // shape tools: update endpoint and redraw
      currentPathRef.current.points = [currentPathRef.current.points[0], pos];
      redrawAll();
      const ctx = ctxRef.current!;
      renderShape(ctx, currentPathRef.current);
    }
  };

  const onPointerUp = () => {
    if (!currentPathRef.current) return;
    const path = currentPathRef.current;
    const idx = pathsRef.current.push(path) - 1;

    if (path.tool === 'laser') {
      const timer = setTimeout(() => {
        pathsRef.current.splice(pathsRef.current.indexOf(path), 1);
        redrawAll();
        laserTimersRef.current.delete(idx);
      }, 1500);
      laserTimersRef.current.set(idx, timer);
    }

    currentPathRef.current = null;
    isDrawingRef.current = false;
    forceRender(n => n + 1);
  };

  const commitText = () => {
    if (!textPos || !textInput.trim()) { setTextPos(null); return; }
    const path: DrawnPath = { tool: 'text', color, size, points: [textPos], opacity: 1, text: textInput };
    pathsRef.current.push(path);
    redrawAll();
    setTextPos(null);
    setTextInput('');
    forceRender(n => n + 1);
  };

  const undo = () => { pathsRef.current.pop(); redrawAll(); forceRender(n => n + 1); };
  const clear = () => {
    pathsRef.current = [];
    const ctx = ctxRef.current; const canvas = canvasRef.current;
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    forceRender(n => n + 1);
  };

  const effectiveCursor = tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'crosshair';

  const TOOLS: [Tool, React.ReactNode, string][] = [
    ['pen',       <Pen className="w-4 h-4" />,          'Kalem'],
    ['arrow',     <ArrowUpRight className="w-4 h-4" />, 'Ok'],
    ['rect',      <Square className="w-4 h-4" />,       'Kutu'],
    ['circle',    <span className="text-sm">⬭</span>,   'Daire'],
    ['highlight', <Highlighter className="w-4 h-4" />,  'İşaretleyici'],
    ['text',      <Type className="w-4 h-4" />,         'Metin'],
    ['stamp',     <span className="text-sm">{selectedStamp}</span>, 'Emoji Damga'],
    ['laser',     <Zap className="w-4 h-4" />,          'Lazer'],
    ['eraser',    <Eraser className="w-4 h-4" />,       'Silgi'],
  ];

  return (
    <>
      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-40"
        style={{ cursor: effectiveCursor, touchAction: 'none' }}
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      />

      {/* Text input overlay */}
      {textPos && (
        <div
          className="fixed z-50"
          style={{ left: textPos.x, top: textPos.y }}
        >
          <input
            autoFocus
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') setTextPos(null); }}
            onBlur={commitText}
            placeholder="Yaz, Enter ile bitir…"
            className="bg-black/70 border border-purple-500 rounded px-2 py-1 text-sm outline-none min-w-[160px]"
            style={{ color, fontSize: `${size * 4 + 12}px` }}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 glass rounded-2xl px-4 py-3 shadow-2xl border border-white/10">
        {/* Tools */}
        <div className="flex items-center gap-1 pr-3 border-r border-white/10">
          {TOOLS.map(([t, icon, label]) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              title={label}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${
                tool === t ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40' : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Color swatches + custom color (not for eraser/laser) */}
        {tool !== 'eraser' && tool !== 'laser' && tool !== 'stamp' && (
          <div className="flex items-center gap-1.5 px-3 border-r border-white/10">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{ background: c, outline: color === c ? '2px solid white' : '2px solid transparent', outlineOffset: '1px' }}
              />
            ))}
            {/* Custom color */}
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              title="Özel renk"
              className="w-5 h-5 rounded-full cursor-pointer border-0 bg-transparent p-0" />
          </div>
        )}

        {/* Emoji stamp selector */}
        {tool === 'stamp' && (
          <div className="flex items-center gap-1 px-3 border-r border-white/10">
            {STAMPS.map(s => (
              <button key={s} onClick={() => setSelectedStamp(s)}
                className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                  selectedStamp === s ? 'bg-purple-600 scale-110' : 'hover:bg-white/10'
                }`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Size */}
        <div className="flex items-center gap-2 px-3 border-r border-white/10">
          <button onClick={() => setSize(s => Math.max(1, s - 1))} className="text-slate-400 hover:text-white transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="rounded-full" style={{ width: Math.min(size * 2, 20), height: Math.min(size * 2, 20), background: tool === 'eraser' ? '#64748b' : tool === 'laser' ? '#ef4444' : color }} />
          <button onClick={() => setSize(s => Math.min(20, s + 1))} className="text-slate-400 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={pathsRef.current.length === 0} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={clear} disabled={pathsRef.current.length === 0} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Close */}
        <div className="pl-2 border-l border-white/10">
          <button onClick={onClose} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all">
            Bitti
          </button>
        </div>
      </div>
    </>
  );
}
