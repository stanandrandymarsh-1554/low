# Low: notes for Claude

Web game in TypeScript + Vite. The store is 3D (three.js, on `<canvas id="world">`); the HUD and menu screens are drawn on a 2D canvas layered on top (`<canvas id="game">`). No game engine/framework.

- Run `npm run check` before committing (typecheck, lint, prettier, vitest); `npm run build` must pass.
- Engine code (`src/engine/`) stays game-agnostic; gameplay goes in `src/game/`.
- Game logic goes in `update(dt)` (fixed step); drawing goes in `render(alpha)`. Don't read the clock in game logic.
- 2D drawing is in CSS pixels; `createViewport` handles devicePixelRatio scaling.
- Put tests next to the code as `*.test.ts`. Keep logic testable without a DOM where possible.
- Static assets go in `public/`.
- The game is Low Botanica, a 90s video store that indexes psychoactive plants and synthetics. Catalogue data lives in `src/game/data/` (format in `DATA.md`); keep entries factual and cite sources.
- Scenes draw on a fixed 960x540 stage (`theme.ts` W/H); `Game` scales it to the window.
- The store is built in metres at real-world sizes (`src/game/store/scale.ts`: 1.65 m eyes, 19 cm tapes, 2 m aisles). Don't scale things to look good; fix the numbers in `scale.ts`.
- `store/layout.ts` is pure (no DOM, no three.js) and decides where everything goes; it must scale from a handful of entries to hundreds. `world/` only turns a layout into meshes.
- Tape covers are drawn into textures lazily when you are near them (`StoreWorld.updateCovers`), so keep per-tape work cheap.
- In `npm run dev`, `window.__low.teleport(x, z, yaw, pitch)` moves the camera, for screenshots and tests. The `window.__low` hook is compiled out of production builds.
