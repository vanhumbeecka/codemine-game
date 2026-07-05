# Sprite art + mining dwarves — design

Replace the placeholder procedural Graphics with real pixel-art sprites and add
background miners at ore veins. PLAN.md steps 2 + 3.

## Assets (already in `data/`)

- **Kauzz — Pixel Valley | Cave** (16×16, `data/kauzz/`): `Enviroment.png` (720×416
  master sheet: rock terrain, crystals/ores, wooden beams/platforms/pillars, ladders,
  lanterns, crates, minecarts, hanging elevator cage with pulley), 3-layer parallax
  backgrounds, golem strips (unused for now). License: name-your-price; commercial use
  requires donation/purchase (user handles receipt).
- **Daniel Kole Productions — 16Bit Miner** (`data/miner/`):
  `Miner_AllAnimations_SpriteSheet.png` (192×112, 16×16 frames; idle, walk, mining
  right, mining down, ladder, death). No license file in zip — credit + link to
  https://dkproductions.itch.io/16bit-miner-animated-character; verify terms if ever
  in doubt.
- Torch flames: **not** in either pack (Kauzz lamps are static). Keep the existing
  procedural flicker flame, drawn over a Kauzz lantern sprite. If that reads badly,
  fall back to the CC0 "Animated Pixel Torch" (OpenGameArt, 32×32×6) as a follow-up.

### Repo hygiene / licensing

- `data/` is gitignored (raw packs must not be redistributed via the public repo).
- Only cropped/processed sprite sheets needed by the page are committed under
  `public/assets/`. Serving them on the site is inherent to using the assets;
  committing the full raw packs is not.

## Accreditation

- `README.md`: an "Art credits" section linking Kauzz and Daniel Kole Productions.
- `index.html`: a small credits line in the bottom section linking both authors.

## Architecture

### New: `src/sprites.js`

- `await loadSprites()` called from `main.js` bootstrap (inside the existing async
  IIFE) before scene construction.
- `Assets.load` the committed PNGs; `scaleMode: 'nearest'` on all texture sources.
- Exports named `Texture`s and animation frame arrays built as code-defined
  `Rectangle` frames on the source textures (no spritesheet JSON, no TexturePacker).
- One place holds all frame coordinates; scene modules never hardcode sheet offsets.

### Scale

16px art at ~3× in world units (one 16px tile ≈ 48 world px). `SHAFT` dimensions
stay; per-module layout constants adjust to the tile grid where needed.

### Module swaps (in order, each visually verified before the next)

1. **`shaft.js`** — rock walls from Kauzz terrain tiles (TilingSprite for the rock
   fill, edge tiles along the shaft opening), wooden beams/pillars from the sheet,
   ore veins become crystal sprites (language labels stay text over them). Rails:
   Kauzz has minecarts; if no usable straight-rail tile, keep procedural rails.
   Seeded PRNG keeps placement deterministic.
2. **Parallax background** — Kauzz Background layers behind the shaft, moving at
   fractional camera speed (part of the shaft/world setup in `main.js`).
3. **`elevator.js`** — Kauzz hanging cage + pulley sprites; sway behavior kept.
   Placeholder dwarf inside replaced with a miner idle `AnimatedSprite`.
4. **`torches.js`** — Kauzz lantern sprite + existing procedural flicker flame on
   top; still exposes light positions to `darkness.js` (unchanged).
5. **New `miners.js`** — background dwarves at a deterministic subset of ore veins:
   miner `AnimatedSprite` playing the mining loop, plus small rock-chip particles
   emitted on the pickaxe-impact frame (a handful of short-lived Graphics/Sprites,
   no particle library). Registered in `main.js` ticker like torches.

### Unchanged

`darkness.js`, camera/scroll mapping, HTML sections, deterministic PRNG approach.

## Out of scope

Dust particles in light shafts, audio, `prefers-reduced-motion`, copy rewrite,
clickable ore veins, golem.

## Verification

Per module: `npx vite build` passes + visual check in Chrome (screenshot via browser
tools) — scroll drives elevator, lights still cut darkness, miners animate, no
console errors. Final pass on mobile viewport width.
