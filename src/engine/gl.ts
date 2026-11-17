import { WebGLRenderer } from 'three';

/** A WebGL renderer that tracks its canvas size at the device pixel ratio. */
export interface GlView {
  renderer: WebGLRenderer;
  /** Width in CSS pixels. */
  width: number;
  /** Height in CSS pixels. */
  height: number;
}

export function createGlView(canvas: HTMLCanvasElement): GlView {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  const view: GlView = { renderer, width: 0, height: 0 };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    view.width = rect.width;
    view.height = rect.height;
    // Phones have very dense screens; cap the ratio so the 3D view stays smooth.
    const cap = window.matchMedia?.('(pointer: coarse)').matches ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    renderer.setSize(rect.width, rect.height, false);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  return view;
}
