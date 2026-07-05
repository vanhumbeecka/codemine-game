# codemine-game

Fun landing page for https://codemine.be — a scroll-driven "code mining" scene. Dwarves mine languages (C#, TS, PY, …) in a dark shaft lit by torches; the page scroll drives the mine elevator. Art direction: Spelunky 2-ish, but darker, with strong torch light/shadow contrast. The existing blog stays at https://blog.codemine.be (linked from the page).

## Stack

- Vite + vanilla JS (ES2022 build target — see `vite.config.js`). No top-level await: Vite production builds silently never resolve it (dev works, prod hangs) — use an async IIFE, as in `src/main.js`.
- PixiJS **v8** for the canvas scene. v8 API only: `await app.init(...)`, shape-then-fill Graphics (`g.rect().fill()`), `blendMode` strings. No v7 patterns (`beginFill`, `app.view`, `lineStyle`).
- No test framework; verify visually via `npm run dev` and with `npx vite build`.

## PixiJS skills

PixiJS v8 skill files are installed under `.agents/skills/` (symlinked into `.claude/skills/`). Consult `.agents/skills/pixijs/SKILL.md` (the router) before writing Pixi code; load the specific sub-skill for the API area you're touching.

## Architecture

- `index.html` — real HTML sections (`.depth`) scroll over a `position: fixed` canvas; each section is one viewport tall and anchors a depth in the shaft. HTML has `pointer-events: none` except `.cta` links.
- `src/main.js` — Pixi `Application` bootstrap, camera: maps `window.scrollY` progress to shaft depth with easing; moves the `world` container.
- `src/shaft.js` — `SHAFT` world dimensions + procedural shaft (walls, beams, rails, ore veins labeled with languages). Uses a seeded PRNG (`mulberry32`) so the scene is identical every visit — keep all randomness deterministic.
- `src/elevator.js` — elevator cage + placeholder dwarf, sways with movement speed.
- `src/torches.js` — wall torch flames with flicker; exposes light positions.
- `src/darkness.js` — screen-space black cover; lights are radial-`FillGradient` circles with `blendMode: "erase"`. The container has an `AlphaFilter` so it renders in its own pass and the erase only cuts the darkness, not the scene.

## Status

Scaffold complete and visually verified in Chrome: scroll drives the elevator, torches flicker, darkness/light holes work, blog CTA clickable, `vite build` passes. Everything on screen is still placeholder procedural `Graphics`. Roadmap and next steps (real sprite art, mining dwarves, copy, polish, deploy) live in `PLAN.md` — keep it in sync when completing milestones.

## Conventions

- All world graphics are placeholder procedural `Graphics` for now; the plan is to replace them with sprite atlases later — keep drawing code isolated per module so swaps are cheap.
- Landing-page constraints rule: fast first paint, native scroll, no scroll hijacking.

## Commands

- `npm run dev` — dev server
- `npx vite build` — must pass before claiming work done
