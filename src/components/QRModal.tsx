'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check } from 'lucide-react';

interface QRModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function QRModal({ url, title, onClose }: QRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 256,
      margin: 2,
      color: { dark: '#ffffff', light: '#1e1b2e' },
    });
  }, [url]);

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${title}-qr.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold">🔗 QR Code</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden inline-block mb-4 border border-white/10">
          <canvas ref={canvasRef} />
        </div>

        <p className="text-slate-400 text-sm mb-1 truncate px-2" title={url}>{url}</p>
        <p className="text-slate-600 text-xs mb-6">Scan to open the recording</p>

        <div className="flex gap-3">
          <button onClick={copyUrl}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          <button onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all">
            <Download className="w-4 h-4" /> Save PNG
          </button>
        </div>
      </div>
    </div>
  );
}
