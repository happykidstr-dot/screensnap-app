/**
 * Video Frame Styles — drawn onto the recording canvas after all content.
 * Each frame is an overlay drawn on top of the final composite.
 */

export type FrameStyle =
  | 'none'
  | 'gradient-purple'
  | 'gradient-sunset'
  | 'gradient-ocean'
  | 'neon-cyan'
  | 'neon-green'
  | 'branded'
  | 'dashed-white'
  | 'rounded-shadow'
  | 'film-strip'
  | 'dots-pattern'
  | 'retro-vhs';

export const FRAME_OPTIONS: { value: FrameStyle; label: string; emoji: string; colors: string[] }[] = [
  { value: 'none',            label: 'Çerçevesiz',       emoji: '⬜', colors: [] },
  { value: 'gradient-purple', label: 'Gradient Mor',      emoji: '💜', colors: ['#7c3aed', '#ec4899'] },
  { value: 'gradient-sunset', label: 'Gradient Gün Batımı', emoji: '🌅', colors: ['#f97316', '#ec4899'] },
  { value: 'gradient-ocean',  label: 'Gradient Okyanus',  emoji: '🌊', colors: ['#06b6d4', '#3b82f6'] },
  { value: 'neon-cyan',       label: 'Neon Cyan',         emoji: '🔵', colors: ['#22d3ee', '#06b6d4'] },
  { value: 'neon-green',      label: 'Neon Yeşil',        emoji: '🟢', colors: ['#4ade80', '#22c55e'] },
  { value: 'branded',         label: 'Marka Rengi',       emoji: '🏷️', colors: [] },
  { value: 'dashed-white',    label: 'Kesik Çizgi',       emoji: '⚡', colors: ['#ffffff'] },
  { value: 'rounded-shadow',  label: 'Köşeli Gölge',      emoji: '🌑', colors: ['#1e1b2e'] },
  { value: 'film-strip',      label: 'Film Şeridi',       emoji: '🎞️', colors: ['#000000'] },
  { value: 'dots-pattern',    label: 'Nokta Deseni',      emoji: '✨', colors: ['#7c3aed'] },
  { value: 'retro-vhs',       label: 'Retro VHS',         emoji: '📼', colors: ['#dc2626', '#f59e0b'] },
];

/**
 * Draw the selected frame style onto the canvas context.
 * Call this AFTER drawing screen content + webcam.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: FrameStyle,
  brandColor = '#7c3aed',
  t = 0  // animation time in seconds (Date.now() / 1000)
): void {
  if (style === 'none') return;

  ctx.save();

  switch (style) {
    case 'gradient-purple':   drawGradientBorder(ctx, w, h, '#7c3aed', '#ec4899', 10); break;
    case 'gradient-sunset':   drawGradientBorder(ctx, w, h, '#f97316', '#ec4899', 10); break;
    case 'gradient-ocean':    drawGradientBorder(ctx, w, h, '#06b6d4', '#3b82f6', 10); break;
    case 'neon-cyan':         drawNeonBorder(ctx, w, h, '#22d3ee', 8, t); break;
    case 'neon-green':        drawNeonBorder(ctx, w, h, '#4ade80', 8, t); break;
    case 'branded':           drawGradientBorder(ctx, w, h, brandColor, brandColor, 10); break;
    case 'dashed-white':      drawDashedBorder(ctx, w, h, '#ffffff', 4, [16, 10]); break;
    case 'rounded-shadow':    drawRoundedShadow(ctx, w, h); break;
    case 'film-strip':        drawFilmStrip(ctx, w, h); break;
    case 'dots-pattern':      drawDotsPattern(ctx, w, h, brandColor, t); break;
    case 'retro-vhs':         drawRetroVHS(ctx, w, h, t); break;
  }

  ctx.restore();
}

// ─── Individual frame implementations ───────────────────────────────────────

function drawGradientBorder(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  color1: string, color2: string, thickness: number
) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.5, color2);
  grad.addColorStop(1, color1);

  ctx.strokeStyle = grad;
  ctx.lineWidth = thickness;
  ctx.shadowColor = color1;
  ctx.shadowBlur = 16;
  ctx.strokeRect(thickness / 2, thickness / 2, w - thickness, h - thickness);

  // Corner accents
  const cs = 36; // corner size
  const off = thickness / 2;
  ctx.lineWidth = thickness * 1.8;
  ctx.lineCap = 'round';
  const corners: [number, number, number, number][] = [
    [off, off, off + cs, off],
    [off, off, off, off + cs],
    [w - off - cs, off, w - off, off],
    [w - off, off, w - off, off + cs],
    [off, h - off, off + cs, h - off],
    [off, h - off - cs, off, h - off],
    [w - off - cs, h - off, w - off, h - off],
    [w - off, h - off - cs, w - off, h - off],
  ];
  corners.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  });
}

function drawNeonBorder(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  color: string, thickness: number, t: number
) {
  const pulse = 0.7 + 0.3 * Math.sin(t * 3.14); // 0.7–1.0 pulsing
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.shadowColor = color;
  ctx.shadowBlur = 24 * pulse;
  ctx.strokeRect(thickness / 2, thickness / 2, w - thickness, h - thickness);

  // Inner glow ring
  ctx.globalAlpha = pulse * 0.35;
  ctx.lineWidth = thickness * 0.5;
  ctx.shadowBlur = 40;
  ctx.strokeRect(thickness * 2, thickness * 2, w - thickness * 4, h - thickness * 4);
}

function drawDashedBorder(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  color: string, thickness: number, dash: number[]
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.globalAlpha = 0.75;
  ctx.setLineDash(dash);
  ctx.strokeRect(thickness * 1.5, thickness * 1.5, w - thickness * 3, h - thickness * 3);
}

function drawRoundedShadow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = 32;
  const th = 14;
  const half = th / 2;

  // Dark vignette on edges
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // White rounded frame
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = th;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(half, half, w - th, h - th, r);
  else ctx.rect(half, half, w - th, h - th);
  ctx.stroke();
}

function drawFilmStrip(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const stripW = 36;
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, stripW, h);
  ctx.fillRect(w - stripW, 0, stripW, h);

  // Sprocket holes
  const holeH = 22; const holeW = 14;
  const gap = 34;
  ctx.fillStyle = '#1a1a1a';
  for (let y = 12; y < h - holeH; y += gap) {
    const rx = 4;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(stripW / 2 - holeW / 2, y, holeW, holeH, rx); ctx.fill();
      ctx.beginPath(); ctx.roundRect(w - stripW + stripW / 2 - holeW / 2, y, holeW, holeH, rx); ctx.fill();
    } else {
      ctx.fillRect(stripW / 2 - holeW / 2, y, holeW, holeH);
      ctx.fillRect(w - stripW + stripW / 2 - holeW / 2, y, holeW, holeH);
    }
  }

  // Thin separator lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(stripW, 0); ctx.lineTo(stripW, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - stripW, 0); ctx.lineTo(w - stripW, h); ctx.stroke();
}

function drawDotsPattern(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  color: string, t: number
) {
  const dotSize = 3;
  const spacing = 22;
  const borderDepth = 40;
  const baseAlpha = 0.45;
  const pulse = 0.2 * Math.sin(t * 2);

  ctx.fillStyle = color;

  // Top & bottom dot rows
  for (let x = spacing; x < w - spacing; x += spacing) {
    for (let row = 0; row < 2; row++) {
      const y = row === 0 ? borderDepth / 2 : h - borderDepth / 2;
      const alpha = baseAlpha + pulse * Math.sin(x / 30 + t);
      ctx.globalAlpha = Math.max(0.1, Math.min(0.8, alpha));
      ctx.beginPath(); ctx.arc(x, y, dotSize, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Left & right dot columns
  for (let y = spacing; y < h - spacing; y += spacing) {
    for (let col = 0; col < 2; col++) {
      const x = col === 0 ? borderDepth / 2 : w - borderDepth / 2;
      const alpha = baseAlpha + pulse * Math.sin(y / 30 + t);
      ctx.globalAlpha = Math.max(0.1, Math.min(0.8, alpha));
      ctx.beginPath(); ctx.arc(x, y, dotSize, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

function drawRetroVHS(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Scanlines effect across entire frame
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 2);
  }
  ctx.globalAlpha = 1;

  // Red/yellow top & bottom bars
  const barH = 6;
  const gTop = ctx.createLinearGradient(0, 0, w, 0);
  gTop.addColorStop(0, '#dc2626');
  gTop.addColorStop(0.5, '#f59e0b');
  gTop.addColorStop(1, '#dc2626');
  ctx.fillStyle = gTop;
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);

  // Glitch horizontal tear (animated)
  const tearY = ((Math.sin(t * 0.7) + 1) / 2) * h;
  const tearH = 2 + Math.abs(Math.sin(t * 3.7)) * 4;
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, tearY, w, tearH);
  ctx.globalAlpha = 1;

  // VHS label overlay (top-left)
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(12, barH + 8, 80, 22);
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('● REC', 18, barH + 23);
}

// ─── KJ / Lower Third ────────────────────────────────────────────────────────

export type KJStyle = 'bar' | 'glass' | 'neon' | 'branded' | 'minimal';
export type KJPosition = 'bl' | 'bc' | 'br' | 'tl';

export const KJ_STYLE_OPTIONS: { value: KJStyle; label: string; emoji: string }[] = [
  { value: 'bar',     label: 'Renkli Bar',    emoji: '🎨' },
  { value: 'glass',   label: 'Glassmorphism', emoji: '🪟' },
  { value: 'neon',    label: 'Neon',          emoji: '💡' },
  { value: 'branded', label: 'Marka Rengi',   emoji: '🏷️' },
  { value: 'minimal', label: 'Minimal',       emoji: '✍️' },
];

export const KJ_POSITION_OPTIONS: { value: KJPosition; label: string; icon: string }[] = [
  { value: 'bl', label: 'Sol Alt',    icon: '↙' },
  { value: 'bc', label: 'Orta Alt',   icon: '↓' },
  { value: 'br', label: 'Sağ Alt',    icon: '↘' },
  { value: 'tl', label: 'Sol Üst',    icon: '↖' },
];

/**
 * Draw a KJ (lower-third) overlay.
 * @param elapsed - seconds since recording started (for fade-in)
 */
export function drawKJ(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  line1: string,
  line2: string,
  style: KJStyle,
  position: KJPosition,
  brandColor: string,
  elapsed: number
): void {
  if (!line1 && !line2) return;

  ctx.save();

  // Fade-in during first 0.6s
  const fadeIn = Math.min(1, elapsed / 0.6);
  ctx.globalAlpha = fadeIn;

  const hasTwo = !!line2;
  const pad = Math.round(w * 0.025);   // horizontal padding
  const lineH1 = Math.round(h * 0.055); // main line font size
  const lineH2 = Math.round(h * 0.035); // sub line font size
  const boxH = hasTwo
    ? lineH1 + lineH2 + Math.round(h * 0.025)
    : lineH1 + Math.round(h * 0.015);
  const marginBottom = Math.round(h * 0.06);
  const marginSide   = Math.round(w * 0.04);

  // Box dimensions
  const boxW = Math.round(w * (hasTwo ? 0.42 : 0.36));

  // X position
  let bx: number;
  if (position === 'bc') bx = (w - boxW) / 2;
  else if (position === 'br') bx = w - boxW - marginSide;
  else bx = marginSide; // bl & tl

  // Y position
  const by = position === 'tl'
    ? Math.round(h * 0.05)
    : h - boxH - marginBottom;

  // ── Draw style ──
  switch (style) {
    case 'bar': {
      // Solid dark bar with left accent stripe
      ctx.fillStyle = 'rgba(10,8,20,0.82)';
      ctx.fillRect(bx, by, boxW, boxH);
      // Left accent
      const accentW = Math.round(w * 0.005);
      ctx.fillStyle = brandColor;
      ctx.fillRect(bx, by, accentW, boxH);
      break;
    }
    case 'glass': {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(bx, by, boxW, boxH);
      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1);
      break;
    }
    case 'neon': {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.shadowColor = brandColor;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = brandColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, boxW, boxH);
      ctx.shadowBlur = 0;
      // Top accent line
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + boxW * 0.45, by); ctx.stroke();
      break;
    }
    case 'branded': {
      // Full brand color background
      ctx.fillStyle = brandColor;
      ctx.fillRect(bx, by, boxW, boxH);
      // Dark bottom strip for line2
      if (hasTwo) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(bx, by + lineH1 + Math.round(h * 0.012), boxW, lineH2 + Math.round(h * 0.01));
      }
      break;
    }
    case 'minimal': {
      // No box — just text with drop shadow
      break;
    }
  }

  // ── Text ──
  const isLight = style === 'branded';
  const textX = style === 'minimal' ? bx : bx + Math.round(w * 0.012);
  const baseY = by + Math.round(h * 0.01);

  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = style === 'minimal' ? 6 : 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  if (line1) {
    ctx.font = `bold ${lineH1}px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = isLight ? '#fff' : '#ffffff';
    ctx.textBaseline = 'top';
    ctx.fillText(line1, textX, baseY + Math.round(h * 0.006), boxW - pad * 1.5);
  }

  if (line2) {
    ctx.font = `${lineH2}px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(200,200,220,0.9)';
    ctx.fillText(line2, textX, baseY + lineH1 + Math.round(h * 0.014), boxW - pad * 1.5);
  }

  ctx.restore();
}

