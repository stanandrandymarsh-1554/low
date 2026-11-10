/**
 * Keeps a canvas sized to its CSS box at the device pixel ratio, so drawing is
 * crisp on high-DPI screens. Draw in CSS pixels; the context is pre-scaled.
 */
export interface Viewport {
  ctx: CanvasRenderingContext2D;
  /** Width in CSS pixels. */
  width: number;
  /** Height in CSS pixels. */
  height: number;
}

export function createViewport(canvas: HTMLCanvasElement): Viewport {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not supported');

  const viewport: Viewport = { ctx, width: 0, height: 0 };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    viewport.width = rect.width;
    viewport.height = rect.height;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  new ResizeObserver(resize).observe(canvas);
  resize();
  return viewport;
}
