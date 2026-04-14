'use client';

/**
 * Background Blur / Background Replace via MediaPipe Selfie Segmentation.
 * WASM and model files are served from /mediapipe/ (local — no CDN needed).
 * Falls back gracefully if model fails to load.
 */

export class BackgroundBlur {
  private segmenter: import('@mediapipe/tasks-vision').ImageSegmenter | null = null;
  private isLoaded = false;
  private isProcessing = false;
  private loadError: string | null = null;
  private w: number;
  private h: number;

  // Offscreen buffers
  private blurCanvas: HTMLCanvasElement;
  private bgCanvas: HTMLCanvasElement;
  private maskCanvas: HTMLCanvasElement;
  private personCanvas: HTMLCanvasElement;
  public resultCanvas: HTMLCanvasElement;

  private displayW: number;
  private displayH: number;

  constructor(displayW = 1280, displayH = 720) {
    this.displayW = displayW;
    this.displayH = displayH;
    
    // Internal processing resolution (independent of output resolution)
    // 512 is a good balance for quality and performance
    const procSize = 512;
    this.w = procSize;
    this.h = procSize;

    this.blurCanvas   = this.makeCanvas(this.w, this.h);
    this.bgCanvas     = this.makeCanvas(this.w, this.h);
    this.maskCanvas   = this.makeCanvas(this.w, this.h);
    this.personCanvas = this.makeCanvas(this.w, this.h);
    this.resultCanvas = this.makeCanvas(this.displayW, this.displayH);
  }

  private makeCanvas(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  async load() {
    if (this.isLoaded) return;
    if (this.loadError) throw new Error(this.loadError);

    try {
      const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');

      // Use locally-served WASM to avoid CDN dependency/blocks
      const wasmBase = `${window.location.origin}/mediapipe/wasm`;
      const modelPath = `${window.location.origin}/mediapipe/models/selfie_segmenter.tflite`;

      const vision = await FilesetResolver.forVisionTasks(wasmBase);

      this.segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: modelPath,
          delegate: 'GPU',
        },
        outputConfidenceMasks: true,
        runningMode: 'VIDEO',
      });

      this.isLoaded = true;
    } catch (e) {
      // GPU delegate failed? Try CPU fallback
      try {
        const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
        const wasmBase = `${window.location.origin}/mediapipe/wasm`;
        const modelPath = `${window.location.origin}/mediapipe/models/selfie_segmenter.tflite`;
        const vision = await FilesetResolver.forVisionTasks(wasmBase);
        this.segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: modelPath, delegate: 'CPU' },
          outputConfidenceMasks: true,
          runningMode: 'VIDEO',
        });
        this.isLoaded = true;
      } catch (e2) {
        this.loadError = String(e2);
        console.error('[ScreenSnap] BgBlur model load failed:', e2);
        throw e2;
      }
    }
  }

  /**
   * Process one webcam frame with background BLUR.
   */
  processFrame(video: HTMLVideoElement, blurAmount = 16) {
    if (!this.segmenter || this.isProcessing || video.readyState < 2) return;
    this.isProcessing = true;

    try {
      const result = this.segmenter.segmentForVideo(video, performance.now());
      const mask = result.confidenceMasks?.[0]?.getAsFloat32Array();
      if (!mask) { this.isProcessing = false; return; }

      const blurCtx = this.blurCanvas.getContext('2d')!;
      blurCtx.filter = `blur(${blurAmount}px)`;
      blurCtx.drawImage(video, 0, 0, this.w, this.h);
      blurCtx.filter = 'none';

      const personCtx = this.personCanvas.getContext('2d')!;
      personCtx.clearRect(0, 0, this.w, this.h);
      personCtx.drawImage(video, 0, 0, this.w, this.h);
      this._applyMask(mask, personCtx);

      const resultCtx = this.resultCanvas.getContext('2d', { alpha: true })!;
      resultCtx.drawImage(this.blurCanvas, 0, 0, this.displayW, this.displayH);
      resultCtx.drawImage(this.personCanvas, 0, 0, this.displayW, this.displayH);

      result.confidenceMasks?.[0]?.close();
    } catch { /* use previous frame */ }

    this.isProcessing = false;
  }

  /**
   * Process one webcam frame with STUDIO IMAGE background replacement.
   */
  processFrameWithBg(video: HTMLVideoElement, bgImage: HTMLImageElement) {
    if (!this.segmenter || this.isProcessing || video.readyState < 2) return;
    this.isProcessing = true;

    try {
      const result = this.segmenter.segmentForVideo(video, performance.now());
      const mask = result.confidenceMasks?.[0]?.getAsFloat32Array();
      if (!mask) { this.isProcessing = false; return; }

      // Studio background (cover-fill)
      const bgCtx = this.bgCanvas.getContext('2d')!;
      const bw = bgImage.naturalWidth || this.w;
      const bh = bgImage.naturalHeight || this.h;
      const bAspect = bw / bh;
      const cAspect = this.w / this.h;
      let bsx = 0, bsy = 0, bsw = bw, bsh = bh;
      if (bAspect > cAspect) { bsw = bsh * cAspect; bsx = (bw - bsw) / 2; }
      else { bsh = bsw / cAspect; bsy = (bh - bsh) / 2; }
      bgCtx.drawImage(bgImage, bsx, bsy, bsw, bsh, 0, 0, this.w, this.h);

      // Extract person
      const personCtx = this.personCanvas.getContext('2d')!;
      personCtx.clearRect(0, 0, this.w, this.h);
      personCtx.drawImage(video, 0, 0, this.w, this.h);
      this._applyMask(mask, personCtx);

      // Composite at full display resolution
      const resultCtx = this.resultCanvas.getContext('2d', { alpha: true })!;
      resultCtx.drawImage(this.bgCanvas, 0, 0, this.displayW, this.displayH);
      resultCtx.drawImage(this.personCanvas, 0, 0, this.displayW, this.displayH);

      result.confidenceMasks?.[0]?.close();
    } catch { /* use previous frame */ }

    this.isProcessing = false;
  }

  private _applyMask(mask: Float32Array, personCtx: CanvasRenderingContext2D) {
    const maskCtx = this.maskCanvas.getContext('2d')!;
    const maskData = maskCtx.createImageData(this.w, this.h);
    for (let i = 0; i < mask.length; i++) {
      maskData.data[i * 4 + 3] = Math.min(255, Math.round(mask[i] * 300));
    }
    maskCtx.putImageData(maskData, 0, 0);
    personCtx.globalCompositeOperation = 'destination-in';
    personCtx.drawImage(this.maskCanvas, 0, 0);
    personCtx.globalCompositeOperation = 'source-over';
  }

  get loaded() { return this.isLoaded; }
  get error() { return this.loadError; }

  destroy() {
    try { this.segmenter?.close(); } catch { /* ignore */ }
    this.segmenter = null;
    this.isLoaded = false;
  }
}
