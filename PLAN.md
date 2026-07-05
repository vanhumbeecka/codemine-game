# codemine.be landing page — plan

## Vision

Browser "game" landing page: a mine shaft where dwarves mine code (C#, TS, PY…).
Scrolling the page moves the mine elevator down the shaft. Spelunky 2 art style,
heavy dark/light contrast from torches. Blog CTA links to https://blog.codemine.be.

## Decisions made

- **Web-native (Vite + PixiJS v8)**, not Godot/Love2D: instant load, native scroll,
  SEO/accessibility, small bundle. A real playable game could later live at /game.
- HTML sections scroll over a fixed canvas; canvas camera follows scroll progress.
- Placeholder procedural Graphics now; sprite atlas art later.
- Deterministic PRNG for the shaft layout (same scene every visit).
- Darkness layer: black cover + erase-blend radial-gradient lights, isolated via AlphaFilter.

## Status: scaffold complete ✅

- [x] Vite project, `npm run dev` / `vite build` working (es2022 target for top-level await)
- [x] Scrollable HTML sections (surface / blog / about / bottom)
- [x] Shaft: walls, wooden beams, rails, ore veins labeled C#/TS/PY/RS/GO
- [x] Elevator cage + placeholder dwarf, eased scroll-follow + sway
- [x] Torches with flicker
- [x] Darkness + torch/elevator light holes
- [x] PixiJS v8 skills installed (`.agents/skills/`) — consult before Pixi work

## Next steps

1. [x] **Visual pass in browser** — verified in Chrome: scroll drives elevator, torches flicker,
   blog CTA present, no console errors. Fixed hard-edged lights: `FillGradient` radial coords are
   normalized (0–1) in the default `"local"` textureSpace, and `erase` blends on source alpha, so
   the falloff must be in the alpha stops (see comment in `src/darkness.js`). Enlarged light radii
   (torch 160, elevator 260).
2. **Real art**: sprite atlas (Kenney/itch.io cave tileset as placeholder), replace procedural
   Graphics per module (shaft → elevator → dwarf → torches). AnimatedSprite for dwarf/flames.
3. **More life**: background dwarves mining at ore veins (pickaxe animation, particles on hit).
4. **Content**: real copy per depth section; maybe ore veins clickable → blog tags.
5. **Polish**: dust particles in light shafts, rope creak/ambient audio (opt-in), mobile check,
   `prefers-reduced-motion` fallback.
6. **Deploy**: static build → host at codemine.be (replace redirect to blog).

## Verification

`npx vite build` must pass; visual check via `npm run dev` (scroll drives elevator,
lights follow torches/elevator, blog CTA clickable).
