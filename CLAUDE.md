# Low: notes for Claude

Web game in TypeScript + Vite, drawing to a 2D canvas. No game engine/framework yet.

- Run `npm run check` before committing (typecheck, lint, prettier, vitest); `npm run build` must pass.
- Engine code (`src/engine/`) stays game-agnostic; gameplay goes in `src/game/`.
- Game logic goes in `update(dt)` (fixed step); drawing goes in `render(alpha)`. Don't read the clock in game logic.
- Draw in CSS pixels; `createViewport` handles devicePixelRatio scaling.
- Put tests next to the code as `*.test.ts`. Keep logic testable without a DOM where possible.
- Static assets go in `public/`.
