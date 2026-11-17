import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import { createViewport } from './engine/canvas';
import { createGlView } from './engine/gl';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { MouseLook } from './engine/mouselook';
import { Pointer } from './engine/pointer';
import { TextField } from './engine/textfield';
import { Game } from './game/Game';

/** Tape covers are drawn into textures, so the pixel fonts must be ready first. */
async function loadFonts(): Promise<void> {
  await Promise.all([
    document.fonts.load('32px VT323', 'Aa0'),
    document.fonts.load('16px "Press Start 2P"', 'Aa0'),
  ]);
}

async function main(): Promise<void> {
  const overlay = document.querySelector<HTMLCanvasElement>('#game');
  const world = document.querySelector<HTMLCanvasElement>('#world');
  if (!overlay || !world) throw new Error('Missing <canvas id="game"> or <canvas id="world">');

  let gl;
  try {
    gl = createGlView(world);
  } catch {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<p class="fatal">Low Botanica needs WebGL, which this browser has turned off or does not support.</p>',
    );
    return;
  }
  await loadFonts();

  const game = new Game(
    createViewport(overlay),
    new Input(),
    new Pointer(overlay),
    new TextField(overlay),
    new MouseLook(overlay),
    gl,
  );

  // For testing and screenshots in `npm run dev` only; compiled out of the production build.
  if (import.meta.env.DEV) (window as unknown as { __low: Game }).__low = game;

  startLoop({
    update: (dt) => game.update(dt),
    render: (alpha) => game.render(alpha),
  });
}

void main();
