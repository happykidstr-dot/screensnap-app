'use client';

interface AudioVisualizerProps {
  level: number;  // 0-100
  isActive: boolean;
}

const BAR_COUNT = 24;

export default function AudioVisualizer({ level, isActive }: AudioVisualizerProps) {
  if (!isActive) return null;

  return (
    <div className="flex items-end justify-center gap-[3px] h-10 px-2">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        // Create a wave effect: center bars are taller
        const center = BAR_COUNT / 2;
        const distance = Math.abs(i - center) / center; // 0 = center, 1 = edge
        const baseHeight = (1 - distance * 0.6); // edges are shorter

        // Apply audio level with some randomness per bar
        const seed = Math.sin(i * 31.7 + Date.now() * 0.003 + i) * 0.5 + 0.5;
        const barLevel = (level / 100) * baseHeight * (0.4 + seed * 0.6);
        const heightPct = Math.max(0.08, barLevel);

        const isLoud = level > 60;
        const color = isLoud
          ? `rgba(239, 68, 68, ${0.7 + heightPct * 0.3})`
          : `rgba(124, 58, 237, ${0.5 + heightPct * 0.5})`;

        return (
          <div
            key={i}
            style={{
              height: `${heightPct * 100}%`,
              width: '3px',
              borderRadius: '3px',
              background: color,
              transition: 'height 60ms ease, background 200ms ease',
            }}
          />
        );
      })}
    </div>
  );
}
