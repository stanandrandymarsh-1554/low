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
- The store is built in metres at real-world sizes (`src/game/store/scale.ts`: 1.65 m eyes, 15 x 20 cm figures, 2 m aisles). Don't scale things to look good; fix the numbers in `scale.ts`.
- `store/layout.ts` is pure (no DOM, no three.js) and decides where everything goes; it must scale from a handful of entries to hundreds. `world/` only turns a layout into meshes.
- Shelf items are voxel figures (`src/game/voxel/`, a 12x16x12 grid; pure and tested). The 3D store sculpts each one lazily when you are near it (`StoreWorld.updateModels`), and the same grid is drawn isometrically for posters and the full sheet (`draw/voxel.ts`, `draw/specimen.ts`). Every entry needs a look in `voxel/looks.ts`; a test enforces it. Keep per-figure work cheap.
- Furniture and accessories come from `store/props.ts` (pure: a spec list plus footprints, which also become colliders); `world/props.ts` only builds meshes for each kind. Shoppers and the clerk are a pure simulation (`store/nav.ts` grid pathfinding, `store/npc.ts`); `world/people.ts` draws them. Tests check props never overlap shelving and the crowd never walks into anything, on small and large catalogues.
- Phones are supported: `engine/touch.ts` (`TouchControls`: floating thumb-stick on the left, drag to look, taps, and named button zones the scene sets each frame) feeds `StoreScene`; `draw/touchhud.ts` draws the stick and buttons in real CSS pixels. Touch taps count as clicks only on release (`engine/pointer.ts`), and finger drags scroll lists. Keep every screen usable without a keyboard, and test at about 844x390 landscape.
- `data/sources/pharmacology-index.json` is a supplied dataset, kept as-is; `data/ctl.ts` maps its rows to entries (tier, toxicity and dose rules are documented in DATA.md and tested). Entries without a hand-drawn look get one from `voxel/guess.ts`.
- In `npm run dev`, `window.__low.teleport(x, z, yaw, pitch)` moves the camera, for screenshots and tests. The `window.__low` hook is compiled out of production builds.
