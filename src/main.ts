import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import { createViewport } from './engine/canvas';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { Pointer } from './engine/pointer';
import { TextField } from './engine/textfield';
import { Game } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('Missing <canvas id="game">');

const game = new Game(
  createViewport(canvas),
  new Input(),
  new Pointer(canvas),
  new TextField(canvas),
);

startLoop({
  update: (dt) => game.update(dt),
  render: () => game.render(),
});
