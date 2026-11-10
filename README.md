# Low

A web-based game built with TypeScript, [Vite](https://vite.dev) and the HTML5 Canvas API.

## Getting started

You need Node.js 22 or newer (see `.nvmrc`).

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173). Edits reload instantly.

## Scripts

| Command           | What it does                                           |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Start the dev server with hot reload                   |
| `npm run build`   | Type-check and build a static bundle into `dist/`      |
| `npm run preview` | Serve the built `dist/` locally                        |
| `npm test`        | Run unit tests once (`npm run test:watch` to watch)    |
| `npm run lint`    | Lint with ESLint                                       |
| `npm run format`  | Format everything with Prettier                        |
| `npm run check`   | Typecheck + lint + format check + tests (what CI runs) |

## Project layout

```
index.html          Page shell with the <canvas id="game">
public/             Static assets (images, sounds, fonts), served as-is from /
src/
  main.ts           Entry point: wires the canvas, input and loop to the game
  style.css         Full-screen canvas styling
  engine/           Reusable, game-agnostic pieces
    loop.ts         Fixed-timestep update loop + render with interpolation
    input.ts        Keyboard state (isDown / wasPressed)
    canvas.ts       High-DPI canvas that tracks its size
    math.ts         Small math helpers
  game/
    Game.ts         The game itself — currently a placeholder square to move around
```

Tests live next to the code they cover as `*.test.ts`.

## How the game loop works

`update(dt)` is called at a fixed 60 Hz, independent of the monitor's refresh rate, so
movement and physics behave the same on every machine. `render(alpha)` runs once per
animation frame; `alpha` is how far we are between two updates and can be used to
interpolate positions for smooth motion (see `Game.render`).

## Deploying

`npm run build` produces a fully static site in `dist/` with relative asset paths, so
it can be hosted on GitHub Pages, Netlify, itch.io, or any static file host.
