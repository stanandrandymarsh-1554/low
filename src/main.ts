import { createViewport } from './engine/canvas';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { Game } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('Missing <canvas id="game">');

const game = new Game(createViewport(canvas), new Input());

startLoop({
  update: (dt) => game.update(dt),
  render: (alpha) => game.render(alpha),
});
