# Low Botanica

A 90s video rental store where every tape on the shelf is an entry in an index of
psychoactive plants and synthetics. Browse the aisles, or use the store computer to search by
name, compound, effect or duration. Pick up a tape to read the back of the box: compounds and
their percentages, effects, onset and duration, reported doses, traditional routes, toxicity rating, risks, interactions, origin and an A-D evidence tier. Reputations that don't hold up get a BUSTED stamp and their own aisle.

Built with TypeScript, [Vite](https://vite.dev) and the HTML5 Canvas API. To add entries, see
[DATA.md](DATA.md).

## Controls

| Where           | Keys                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| Shop floor      | Arrows/WASD browse, Q/E or [ ] change aisle, Enter pick up, / search   |
| Search computer | Type to search, Tab change search type, arrows select, Enter view, Esc |
| Tape            | Arrows / wheel scroll, Esc put it back                                 |

Everything also works with the mouse.

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
index.html          Page shell with the <canvas id="game">
DATA.md             How to add plants and compounds
public/             Static assets (images, sounds), served as-is from /
src/
  main.ts           Entry point: wires the canvas, input and loop to the game
  style.css         Full-screen canvas styling
  engine/           Reusable, game-agnostic pieces
    loop.ts         Fixed-timestep update loop + render with interpolation
    input.ts        Keyboard state (isDown / wasPressed)
    pointer.ts      Mouse/touch state (position, clicks, wheel)
    textfield.ts    Text entry via a hidden <input> (works with phone keyboards)
    text.ts         Word wrapping and truncation
    canvas.ts       High-DPI canvas that tracks its size
    math.ts         Small math helpers
  game/
    Game.ts         Scene stack; scales the 960x540 stage to the window
    data/           The catalogue: types, botanicals, synthetics, validation
    search.ts       Search by name / compound / effect / duration
    timing.ts       Duration formatting and duration-query parsing
    aisles.ts       Groups entries into aisles
    backcover.ts    What goes on the back of a tape box
    theme.ts        Stage size, palette, fonts, toxicity colours
    draw/           Tape box art and UI drawing helpers
    scenes/         FloorScene (shelves), TerminalScene (search), TapeScene (details)
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
