import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Settings2 } from 'lucide-react';

export default function Teleprompter({ isRecording, onClose }: { isRecording: boolean, onClose: () => void }) {
  const [text, setText] = useState('Kameraya bakarak akıcı konuşmak için metninizi buraya yapıştırın...\n\nSiz ekranda kayıt yaparken, bu metin yazdığınız hıza göre otomatik olarak yukarı doğru kayacaktır.\n\nSatış sunumları ve şirket içi bilgilendirme videoları için mükemmel bir yöntemdir!');
  const [speed, setSpeed] = useState(1.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isRecording && !isEditing) setIsPlaying(true);
    else if (!isRecording) setIsPlaying(false);
  }, [isRecording, isEditing]);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      if (isPlaying && scrollRef.current) {
        const delta = time - lastTime;
        // Move scroll based on speed
        scrollRef.current.scrollTop += delta * 0.05 * speed;
      }
      lastTime = time;
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, speed]);

  return (
    <div className="fixed bottom-10 left-10 w-96 glass rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(124,58,237,0.2)] z-[60] flex flex-col overflow-hidden backdrop-blur-xl bg-slate-900/40">
      <div className="flex justify-between items-center px-4 py-2 bg-white/10 border-b border-white/10 shrink-0 cursor-move">
         <div className="flex items-center gap-2">
            <span className="text-xl drop-shadow-md">📜</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Teleprompter</span>
         </div>
         <div className="flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)} title="Metni Düzenle" className="p-1.5 rounded-lg bg-black/20 text-purple-300 hover:bg-purple-600/30 transition-all"><Settings2 className="w-4 h-4"/></button>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-black/20 text-slate-300 hover:text-white hover:bg-red-500/50 transition-all"><X className="w-4 h-4"/></button>
         </div>
      </div>
      
      {isEditing ? (
        <div className="p-5 flex flex-col gap-4">
          <textarea 
            value={text} 
            onChange={e => setText(e.target.value)}
            className="w-full h-48 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
            placeholder="Buraya metninizi yapıştırın..."
          />
          <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
             <label className="text-xs text-slate-300 font-bold whitespace-nowrap">Okuma Hızı:</label>
             <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={e => setSpeed(Number(e.target.value))} className="flex-1 accent-purple-500 cursor-pointer" />
             <span className="text-xs font-mono text-purple-300 font-bold w-6">{speed}x</span>
          </div>
          <button onClick={() => setIsEditing(false)} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg border border-purple-400/20 transition-all">
            Hazır! Okumaya Başla
          </button>
        </div>
      ) : (
        <div className="relative h-64 group">
          <div ref={scrollRef} className="absolute inset-0 px-6 py-4 overflow-y-auto hide-scrollbar select-none">
            <div className="h-20" /> {/* Top padding */}
            <p className="text-2xl text-white font-semibold leading-normal drop-shadow-2xl text-center whitespace-pre-wrap tracking-wide" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
              {text}
            </p>
            <div className="h-40" /> {/* Bottom padding */}
          </div>
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none" />
          
          {/* Play/Pause overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-14 h-14 rounded-full bg-purple-600/90 hover:bg-purple-500 flex items-center justify-center text-white backdrop-blur-md shadow-2xl border border-white/20 transition-transform hover:scale-110">
               {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
