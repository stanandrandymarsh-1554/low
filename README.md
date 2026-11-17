# Low Botanica

A 90s video rental store you walk around in first person, with a lounge, a snack corner, a
clerk at the counter and a few shoppers who browse the shelves and sit on the sofas. Every little retro figure on the shelves
is an entry in an index of psychoactive plants and synthetics. Plants are shown as the plant
(a mushroom, a cactus, a poppy pod, a root) and lab-made things as the isolated compound
(crystals, powder, tablets, a vial, or a molecule). Aim at one for its name and a quick summary,
press E to open its full sheet, or use the computer on the counter to search by name, compound,
effect or duration. The sheet has compounds and
their percentages, effects, onset and duration, reported doses, traditional routes, toxicity rating, risks, interactions, origin and an A-D evidence tier. Reputations that don't hold up get a BUSTED stamp and their own aisle.

Built with TypeScript, [Vite](https://vite.dev), [three.js](https://threejs.org) for the 3D store
and the HTML5 Canvas API for the HUD and menu screens. To add entries, see
[DATA.md](DATA.md).

## Controls

| Where           | Keys                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| In the store    | WASD walk, Shift run, mouse look (click to capture), arrows also turn  |
| At a figure     | Aim at it for the summary; E or click opens the box; `/` opens search  |
| At the computer | Aim at the counter computer and press E, or press `/` from anywhere    |
| Search computer | Type to search, Tab change search type, arrows select, Enter view, Esc |
| Full sheet      | Arrows / wheel scroll, Esc put it back                                 |

Esc releases the mouse. Without capturing the mouse you can still aim with the cursor, and
click a figure to open it.

Duration search understands `short` (<2h), `medium` (2-6h), `long` (6-16h), `very long`, `4h`,
`2-3 hours`, `under 90m`, `over 8h` and `onset under 30m`.

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
index.html          Page shell: <canvas id="world"> (3D) under <canvas id="game"> (HUD + menus)
DATA.md             How to add plants and compounds
public/             Static assets (images, sounds), served as-is from /
src/
  main.ts           Entry point: loads fonts, wires the canvases, input and loop to the game
  style.css         Full-screen canvas styling
  engine/           Reusable, game-agnostic pieces
    loop.ts         Fixed-timestep update loop + render with interpolation
    input.ts        Keyboard state (isDown / wasPressed)
    pointer.ts      Mouse/touch state (position, clicks, wheel)
    mouselook.ts    Pointer-lock mouse look
    firstperson.ts  Walking viewpoint: movement, turning, collision, interpolation
    collision.ts    Circle-vs-box movement that slides along walls
    gl.ts           WebGL renderer that tracks its canvas size
    textfield.ts    Text entry via a hidden <input> (works with phone keyboards)
    text.ts         Word wrapping and truncation
    canvas.ts       High-DPI 2D canvas that tracks its size
    math.ts         Small math helpers
  game/
    Game.ts         Scene stack; scales the 960x540 stage used by the 2D screens
    data/           The catalogue: types, botanicals, synthetics, validation
    store/          scale.ts (real-world sizes, in metres), layout.ts (shelving), props.ts
                    (lounge, snack corner, displays), nav.ts + npc.ts (walkable grid, the clerk
                    and shoppers)
    world/          The 3D store: StoreWorld (three.js scene), props.ts and people.ts (furniture and
                    blocky shoppers), and procedural textures
    scenes/         StoreScene (walking + HUD), TerminalScene (search), TapeScene (full sheet)
    voxel/          The shelf figures: a voxel grid, one drawing function per form, looks.ts
    draw/           Display-case art, isometric voxel sprites, HUD and UI helpers (2D canvas)
    search.ts       Search by name / compound / effect / duration
    timing.ts       Duration formatting and duration-query parsing
    aisles.ts       Groups entries into aisles
    backcover.ts    What goes on an entry's full sheet
    theme.ts        Palette, fonts, toxicity and evidence colours
```

Tests live next to the code they cover as `*.test.ts`.

## How the game loop works

`update(dt)` is called at a fixed 60 Hz, independent of the monitor's refresh rate, so
movement and physics behave the same on every machine. `render(alpha)` runs once per
animation frame; `alpha` is how far we are between two updates and can be used to
interpolate positions for smooth motion (see `Game.render`).

## Deploying

Pushes to `main` are published automatically to GitHub Pages by `.github/workflows/deploy.yml`
(one-time setup: repo Settings → Pages → Source: GitHub Actions).

`npm run build` produces a fully static site in `dist/` with relative asset paths, so
it can be hosted on GitHub Pages, Netlify, itch.io, or any static file host.
