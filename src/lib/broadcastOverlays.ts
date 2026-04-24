/**
 * Web TV / Broadcast Overlays
 * Canvas utilities for professional broadcast-style overlays.
 */

export type WebcamShape = 'circle' | 'square' | 'rounded';

// ─── News Ticker (scrolling band) ────────────────────────────────────────────

let tickerOffset = 0;
let lastTickerT = 0;

export function drawTicker(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  text: string,
  nowMs: number,
  speed = 80, // px per second
  brandColor = '#7c3aed'
): void {
  if (!text.trim()) return;

  const dt = lastTickerT ? (nowMs - lastTickerT) / 1000 : 0;
  lastTickerT = nowMs;

  const bandH = Math.round(h * 0.052);
  const y = h - bandH;
  const fontSize = Math.round(bandH * 0.52);

  // Band background — brand color left label, dark right content
  ctx.save();

  // Dark scrolling area
  ctx.fillStyle = 'rgba(8,6,20,0.92)';
  ctx.fillRect(0, y, w, bandH);

  // Brand color label block
  const labelPad = 10;
  ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
  const labelText = '📰 BREAKING';
  const labelW = ctx.measureText(labelText).width + labelPad * 2 + 10;
  ctx.fillStyle = brandColor;
  ctx.fillRect(0, y, labelW, bandH);

  // Label text
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText(labelText, labelPad, y + bandH / 2);
  ctx.shadowBlur = 0;

  // Separator
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(labelW, y + 6, 2, bandH - 12);

  // Scrolling text — clip to scrolling area
  ctx.save();
  ctx.beginPath();
  ctx.rect(labelW + 6, y, w - labelW - 6, bandH);
  ctx.clip();

  const scrollText = text + '   ❖   ' + text + '   ❖   ';
  const textW = ctx.measureText(scrollText).width;
  tickerOffset = (tickerOffset + speed * dt) % textW;

  ctx.fillStyle = '#e2e0f0';
  ctx.font = `${fontSize}px 'Segoe UI', Arial, sans-serif`;
  ctx.fillText(scrollText, labelW + 10 - tickerOffset, y + bandH / 2);
  // Draw a second copy for seamless loop
  ctx.fillText(scrollText, labelW + 10 - tickerOffset + textW, y + bandH / 2);

  ctx.restore(); // unclip
  ctx.restore();
}

export function resetTickerOffset() {
  tickerOffset = 0;
  lastTickerT = 0;
}

// ─── Clock & Date Overlay ─────────────────────────────────────────────────────

export function drawClock(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  position: 'tl' | 'tr' = 'tr',
  showDate = true,
  showLiveDot = true
): void {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  const fontSize = Math.round(h * 0.034);
  const smallFontSize = Math.round(fontSize * 0.72);
  const padH = 10; const padV = 8;
  const margin = 16;

  ctx.save();
  ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
  const timeW = ctx.measureText(timeStr).width;
  ctx.font = `${smallFontSize}px 'Segoe UI', Arial`;
  const dateW = ctx.measureText(dateStr).width;
  const boxW = Math.max(timeW, dateW) + padH * 2 + (showLiveDot ? 18 : 0);
  const linesH = showDate ? fontSize + smallFontSize + padV * 3 : fontSize + padV * 2;

  const bx = position === 'tr' ? w - boxW - margin : margin;
  const by = margin;

  // Box
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(bx, by, boxW, linesH);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, linesH - 1);

  // Time
  ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  ctx.fillText(timeStr, bx + padH, by + padV);

  // Date
  if (showDate) {
    ctx.font = `${smallFontSize}px 'Segoe UI', Arial`;
    ctx.fillStyle = 'rgba(200,195,240,0.75)';
    ctx.fillText(dateStr, bx + padH, by + padV + fontSize + 4);
  }

  ctx.restore();
}

// ─── Live Badge ───────────────────────────────────────────────────────────────

export function drawLiveBadge(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  nowMs: number,
  position: 'tl' | 'tr' = 'tl'
): void {
  const t = nowMs / 1000;
  const pulse = 0.65 + 0.35 * Math.sin(t * Math.PI * 2); // 1Hz

  ctx.save();
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  const text = '● CANLI';
  const tw = ctx.measureText(text).width;
  const bw = tw + 18; const bh = 22;
  const bx = position === 'tl' ? 14 : _w - bw - 14;
  const by = 14;

  ctx.fillStyle = `rgba(220,38,38,${0.88 * pulse})`;
  ctx.fillRect(bx, by, bw, bh);

  // White border
  ctx.strokeStyle = `rgba(255,255,255,${0.3 * pulse})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 3;
  ctx.fillText(text, bx + 9, by + bh / 2);

  ctx.restore();
}

// ─── Scene: Branded Intro Card ────────────────────────────────────────────────

export function drawIntroCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  logoImg: HTMLImageElement | null,
  titleText: string,
  subtitleText: string,
  brandColor: string,
  nowMs: number
): void {
  const t = nowMs / 1000;

  // Gradient background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  const hex = brandColor || '#7c3aed';
  // Convert hex to rgba for canvas gradient (canvas doesn't support 8-digit hex on all browsers)
  const hexToRgba = (h: string, alpha: number) => {
    const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  };
  bg.addColorStop(0, hexToRgba(hex, 0.87));
  bg.addColorStop(0.5, '#0d0b1e');
  bg.addColorStop(1, hexToRgba(hex, 0.33));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Animated diagonal lines
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  const lineSpacing = 40;
  const shift = (t * 20) % lineSpacing;
  for (let x = -h + shift; x < w + h; x += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
  ctx.restore();

  // Logo
  const centerX = w / 2;
  const centerY = h * 0.4;
  if (logoImg) {
    const logoH = Math.round(h * 0.14);
    const logoW = Math.round((logoImg.naturalWidth / logoImg.naturalHeight) * logoH);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.drawImage(logoImg, centerX - logoW / 2, centerY - logoH - 10, logoW, logoH);
    ctx.restore();
  }

  // Title
  const titleFontSize = Math.round(h * 0.065);
  ctx.font = `bold ${titleFontSize}px 'Segoe UI', Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(titleText || 'Başlıyor...', centerX, centerY + (logoImg ? 30 : 0));

  // Subtitle
  if (subtitleText) {
    const subFontSize = Math.round(h * 0.036);
    ctx.font = `${subFontSize}px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.shadowBlur = 4;
    ctx.fillText(subtitleText, centerX, centerY + titleFontSize + (logoImg ? 30 : 0) + 10);
  }

  // Animated bottom bar
  const barW = w * 0.45;
  const barH = 3;
  const progress = ((t * 0.3) % 1);
  const grad = ctx.createLinearGradient(centerX - barW / 2, 0, centerX + barW / 2, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(Math.max(0, progress - 0.01), 'rgba(0,0,0,0)');
  grad.addColorStop(progress, hex);
  grad.addColorStop(Math.min(1, progress + 0.3), 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.shadowBlur = 0;
  ctx.fillRect(centerX - barW / 2, h * 0.72, barW, barH);

  // "Yakında Başlıyor" pulsing text
  const pulseAlpha = 0.5 + 0.5 * Math.sin(t * 2);
  ctx.font = `${Math.round(h * 0.028)}px 'Segoe UI', Arial`;
  ctx.fillStyle = `rgba(255,255,255,${pulseAlpha * 0.7})`;
  ctx.fillText('Yayın yakında başlıyor...', centerX, h * 0.80);

  ctx.textAlign = 'left';
}

// ─── Scene: Cam-Big (cam center, screen PIP) ─────────────────────────────────

export function drawCamBigScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  screenVid: HTMLVideoElement,
  camVid: HTMLVideoElement,
  brandColor: string,
  drawCamFn: (
    ctx: CanvasRenderingContext2D,
    src: HTMLVideoElement,
    diam: number,
    x: number,
    y: number,
    shape: WebcamShape,
    ringColor: string,
    bgImg: HTMLImageElement | null,
    brandColor: string
  ) => void,
  webcamShape: WebcamShape,
  webcamRingColor: string,
  bgImage: HTMLImageElement | null = null,
  withNewsDesk: boolean = false
): void {
  // Background: webtv bg image or gradient - ALWAYS SHOW THIS
  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    const bw = bgImage.naturalWidth || w, bh = bgImage.naturalHeight || h;
    const bA = bw/bh, cA = w/h;
    let bsx=0,bsy=0,bsw=bw,bsh=bh;
    if(bA>cA){bsw=bsh*cA;bsx=(bw-bsw)/2;}else{bsh=bsw/cA;bsy=(bh-bsh)/2;}
    ctx.drawImage(bgImage, bsx, bsy, bsw, bsh, 0, 0, w, h);
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0d0b1e');
    bg.addColorStop(1, '#1b1433');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  // Cam fills center
  // If we have a desk, we need to position the anchor behind it nicely
  const camSize = withNewsDesk ? Math.round(h * 0.78) : Math.round(h * 0.65);
  const camX = Math.round((w - camSize) / 2);
  const camY = withNewsDesk ? Math.round(h * 0.18) : Math.round((h - camSize) / 2);

  // Even if no camVid, at least keep UI state coherent
  if (camVid) {
    ctx.save();
    // Masking: ensure cam is cut exactly where the desk starts
    if (withNewsDesk) {
      const deskTopY = h - Math.round(h * 0.22); // Match new desk height
      ctx.beginPath();
      ctx.rect(0, 0, w, deskTopY + 5); 
      ctx.clip();
    }
    
    // Exact Centering Logic for News Desk
    const finalCamX = Math.round((w - camSize) / 2);
    const finalCamY = withNewsDesk ? Math.round(h * 0.16) : Math.round((h - camSize) / 2);

    drawCamFn(ctx, camVid, camSize, finalCamX, finalCamY, webcamShape, webcamRingColor, null, brandColor);
    ctx.restore();
  }

  // Screen PIP — bottom right, 28% of width
  const pipW = Math.round(w * 0.28);
  const pipH = Math.round(pipW * (screenVid.videoHeight / (screenVid.videoWidth || 1)));
  const pipX = w - pipW - 18;
  const pipY = h - pipH - 18;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = brandColor;
  ctx.lineWidth = 2;
  ctx.drawImage(screenVid, pipX, pipY, pipW, pipH);
  ctx.strokeRect(pipX, pipY, pipW, pipH);
  ctx.restore();

  // "EKRAN" label on PIP
  ctx.font = 'bold 10px Segoe UI, Arial';
  ctx.fillStyle = brandColor;
  ctx.fillRect(pipX, pipY - 16, 62, 16);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText('📺 EKRAN', pipX + 4, pipY - 8);

  // ── News Desk Foreground (Layered look) ──
  if (withNewsDesk) {
     drawNewsDesk(ctx, w, h, brandColor);
  }
}

/**
 * Draws a modern news desk overlay to make user look like they are behind it
 */
export function drawNewsDesk(ctx: CanvasRenderingContext2D, w: number, h: number, brandColor: string) {
  const deskH = Math.round(h * 0.22); // Slightly taller for better coverage
  const deskW = Math.round(w * 0.72);
  const dx = (w - deskW) / 2;
  const dy = h - deskH; // Anchored to bottom, no gap

  ctx.save();
  
  // 1. Shadows (Grounding the desk)
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = -5; // Shadow goes UP against the background

  // 2. Main Desk Body (Rich 3D Surface - FULLY OPAQUE)
  const mainGrad = ctx.createLinearGradient(dx, dy, dx, dy + deskH);
  mainGrad.addColorStop(0, 'rgba(30, 35, 55, 1)'); // Top edge - Solid
  mainGrad.addColorStop(0.1, 'rgba(20, 25, 40, 1)'); // Solid
  mainGrad.addColorStop(0.5, 'rgba(10, 15, 30, 1)');     // Dark middle
  mainGrad.addColorStop(1, 'rgba(25, 30, 45, 1)'); // Bottom
  
  ctx.fillStyle = mainGrad;
  ctx.beginPath();
  ctx.moveTo(dx, dy + 15);
  ctx.quadraticCurveTo(dx, dy, dx + 40, dy); // Top-left rounded
  ctx.lineTo(dx + deskW - 40, dy);
  ctx.quadraticCurveTo(dx + deskW, dy, dx + deskW, dy + 15); // Top-right rounded
  ctx.lineTo(dx + deskW - 20, dy + deskH);
  ctx.lineTo(dx + 20, dy + deskH);
  ctx.closePath();
  ctx.fill();

  // 3. Brand Accent Strip (Refined)
  ctx.shadowColor = brandColor;
  ctx.shadowBlur = 8;
  ctx.fillStyle = brandColor;
  ctx.fillRect(dx + 45, dy + 10, deskW - 90, 3);
  ctx.shadowColor = 'transparent'; // Reset for next layers

  // 4. Glass Reflection Overlay (The "StreamYard" shine)
  const shine = ctx.createLinearGradient(dx, dy, dx + deskW, dy + deskH);
  shine.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  shine.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
  shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = shine;
  ctx.fill();

  // 5. Bezel / Highlight Edge
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 6. Bottom Metallic Rim
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(dx + 20, dy + deskH - 8);
  ctx.lineTo(dx + deskW - 20, dy + deskH - 8);
  ctx.lineTo(dx + deskW - 22, dy + deskH);
  ctx.lineTo(dx + 22, dy + deskH);
  ctx.fill();

  ctx.restore();
}

// ─── KJ Queue draw helper ─────────────────────────────────────────────────────
// (called from useRecorder draw loop with the queue array)

export interface KJQueueItem {
  id: string;
  line1: string;
  line2: string;
  showAt: number;  // seconds from recording start
  duration: number; // seconds to show (0 = 5s default)
}

// ─── Scoreboard ───────────────────────────────────────────────────────────────

export function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  left:  { name: string; score: number; color: string },
  right: { name: string; score: number; color: string },
): void {
  const barH = Math.round(h * 0.072);
  const barW = Math.round(w * 0.46);
  const cx   = w / 2;
  const y    = Math.round(h * 0.04);
  const r    = 12;

  const drawHalf = (x: number, team: { name: string; score: number; color: string }, flip: boolean) => {
    ctx.save();
    ctx.beginPath();
    if (!flip) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, y + barH - r);
      ctx.quadraticCurveTo(x + barW, y + barH, x + barW - r, y + barH);
      ctx.lineTo(x, y + barH);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW, y);
      ctx.lineTo(x + barW, y + barH);
      ctx.lineTo(x + r, y + barH);
      ctx.quadraticCurveTo(x, y + barH, x, y + barH - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    }
    ctx.closePath();

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;

    // Background
    ctx.fillStyle = 'rgba(10,10,20,0.82)';
    ctx.fill();

    // Color accent strip
    const stripW = Math.round(barW * 0.28);
    const stripX = flip ? x : x + barW - stripW;
    ctx.fillStyle = team.color + 'cc';
    ctx.fillRect(stripX, y, stripW, barH);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Team name
    const nameFs = Math.round(barH * 0.36);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${nameFs}px Inter, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = flip ? 'left' : 'right';
    const nameX = flip ? x + stripW + 10 : x + barW - stripW - 10;
    ctx.fillText(team.name.toUpperCase(), nameX, y + barH / 2);

    // Score
    const scoreFs = Math.round(barH * 0.56);
    ctx.font = `900 ${scoreFs}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = flip ? 'right' : 'left';
    const scoreX = flip ? x + stripW - 6 : x + barW - stripW + 6;
    ctx.fillText(String(team.score), scoreX, y + barH / 2);
    ctx.restore();
  };

  // Left team (right-aligned pill)
  drawHalf(cx - barW, left, false);
  // Right team (left-aligned pill)
  drawHalf(cx, right, true);

  // Center divider
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `900 ${Math.round(barH * 0.45)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', cx, y + barH / 2);
  ctx.restore();
}

/**
 * AI Loading Badge - Shows when background removal is initialized
 */
export function drawAILoadingBadge(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number
): void {
  ctx.save();
  ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
  const text = '⏳ AI Yükleniyor...';
  const tw = ctx.measureText(text).width;
  const bw = tw + 20; const bh = 22;
  const bx = _w - bw - 14;
  const by = 14;

  ctx.fillStyle = 'rgba(234,179,8,0.85)'; // Yellow-500
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx+0.5, by+0.5, bw-1, bh-1);

  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + 10, by + bh / 2);
  ctx.restore();
}

