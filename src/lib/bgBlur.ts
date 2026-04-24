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

  constructor(displayW = 1920, displayH = 1080) {
    this.displayW = displayW;
    this.displayH = displayH;
    
    // Internal processing resolution
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
    try {
      const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
      const wasmBase = `${window.location.origin}/mediapipe/wasm`;
      const vision = await FilesetResolver.forVisionTasks(wasmBase);
      this.segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${window.location.origin}/mediapipe/models/selfie_segmenter.tflite`,
          delegate: 'GPU',
        },
        outputConfidenceMasks: true,
        runningMode: 'VIDEO',
      });
      this.isLoaded = true;
    } catch (e) {
      try {
        const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
        const wasmBase = `${window.location.origin}/mediapipe/wasm`;
        const vision = await FilesetResolver.forVisionTasks(wasmBase);
        this.segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `${window.location.origin}/mediapipe/models/selfie_segmenter.tflite`,
            delegate: 'CPU',
          },
          outputConfidenceMasks: true,
          runningMode: 'VIDEO',
        });
        this.isLoaded = true;
      } catch (e2) {
        this.loadError = String(e2);
        throw e2;
      }
    }
  }

  processFrame(video: HTMLVideoElement, blurAmount = 16) {
    if (!this.segmenter || this.isProcessing || video.readyState < 2) return;
    this.isProcessing = true;
    try {
      const result = this.segmenter.segmentForVideo(video, performance.now());
      if (result.confidenceMasks && result.confidenceMasks[0]) {
        const mask = result.confidenceMasks[0];
        const personCtx = this.personCanvas.getContext('2d')!;
        personCtx.clearRect(0, 0, this.w, this.h);
        personCtx.drawImage(video, 0, 0, this.w, this.h);
        this._applyMask(mask, personCtx);

        const blurCtx = this.blurCanvas.getContext('2d')!;
        blurCtx.filter = `blur(${blurAmount}px)`;
        blurCtx.drawImage(video, 0, 0, this.w, this.h);
        blurCtx.filter = 'none';

        const resultCtx = this.resultCanvas.getContext('2d', { alpha: true })!;
        resultCtx.clearRect(0, 0, this.displayW, this.displayH);
        resultCtx.drawImage(this.blurCanvas, 0, 0, this.w, this.h, 0, 0, this.displayW, this.displayH);
        resultCtx.drawImage(this.personCanvas, 0, 0, this.w, this.h, 0, 0, this.displayW, this.displayH);

        mask.close();
      }
    } catch { /* skip */ }
    this.isProcessing = false;
  }

  processFrameTransparent(video: HTMLVideoElement) {
    if (!this.segmenter || this.isProcessing || video.readyState < 2) return;
    this.isProcessing = true;
    try {
      const result = this.segmenter.segmentForVideo(video, performance.now());
      if (result.confidenceMasks && result.confidenceMasks[0]) {
        const mask = result.confidenceMasks[0];
        const personCtx = this.personCanvas.getContext('2d')!;
        personCtx.clearRect(0, 0, this.w, this.h);
        personCtx.drawImage(video, 0, 0, this.w, this.h);
        this._applyMask(mask, personCtx);

        const resultCtx = this.resultCanvas.getContext('2d', { alpha: true })!;
        resultCtx.clearRect(0, 0, this.displayW, this.displayH);
        resultCtx.drawImage(this.personCanvas, 0, 0, this.w, this.h, 0, 0, this.displayW, this.displayH);

        mask.close();
      }
    } catch { /* skip */ }
    this.isProcessing = false;
  }

  processFrameWithBg(video: HTMLVideoElement, bgImage: HTMLImageElement) {
    if (!this.segmenter || this.isProcessing || video.readyState < 2) return;
    this.isProcessing = true;
    try {
      const result = this.segmenter.segmentForVideo(video, performance.now());
      if (result.confidenceMasks && result.confidenceMasks[0]) {
        const mask = result.confidenceMasks[0];
        const personCtx = this.personCanvas.getContext('2d')!;
        personCtx.clearRect(0, 0, this.w, this.h);
        personCtx.drawImage(video, 0, 0, this.w, this.h);
        this._applyMask(mask, personCtx);

        const bgCtx = this.bgCanvas.getContext('2d')!;
        bgCtx.drawImage(bgImage, 0, 0, this.w, this.h);

        const resultCtx = this.resultCanvas.getContext('2d', { alpha: true })!;
        resultCtx.clearRect(0, 0, this.displayW, this.displayH);
        resultCtx.drawImage(this.bgCanvas, 0, 0, this.w, this.h, 0, 0, this.displayW, this.displayH);
        resultCtx.drawImage(this.personCanvas, 0, 0, this.w, this.h, 0, 0, this.displayW, this.displayH);

        mask.close();
      }
    } catch { /* skip */ }
    this.isProcessing = false;
  }

  private _applyMask(mask: any, personCtx: CanvasRenderingContext2D) {
    const mw = mask.width;
    const mh = mask.height;
    const data = mask.getAsFloat32Array();
    
    const tempMask = document.createElement('canvas');
    tempMask.width = mw; tempMask.height = mh;
    const tctx = tempMask.getContext('2d')!;
    const picData = tctx.createImageData(mw, mh);
    
    for (let i = 0; i < data.length; i++) {
        // Soften the threshold slightly for anti-aliasing
        const confidence = data[i];
        if (confidence > 0.45) {
            picData.data[i * 4 + 3] = 255;
        } else if (confidence > 0.25) {
            // Gradient edge
            picData.data[i * 4 + 3] = Math.round((confidence - 0.25) * 5 * 255);
        } else {
            picData.data[i * 4 + 3] = 0;
        }
    }
    tctx.putImageData(picData, 0, 0);

    // Apply soft blur to mask for "feathering"
    const smoothMask = document.createElement('canvas');
    smoothMask.width = this.w; smoothMask.height = this.h;
    const sctx = smoothMask.getContext('2d')!;
    sctx.filter = 'blur(1px)';
    sctx.drawImage(tempMask, 0, 0, mw, mh, 0, 0, this.w, this.h);

    // Apply mask scaled to our person canvas
    personCtx.globalCompositeOperation = 'destination-in';
    personCtx.imageSmoothingEnabled = true;
    personCtx.drawImage(smoothMask, 0, 0);
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
