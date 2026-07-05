# Sprite Art + Mining Dwarves Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder procedural Graphics with Kauzz cave-pack + 16Bit Miner pixel-art sprites, and add animated background miners at ore veins.

**Architecture:** A new `src/sprites.js` singleton loads the two committed sprite sheets and exposes named textures/animation frame arrays via code-defined `Rectangle` frames. Each scene module (`shaft`, `elevator`, `torches`, new `background` and `miners`) swaps its Graphics for sprites independently, keeping module boundaries. Darkness/lighting and the scroll camera are untouched.

**Tech Stack:** Vite + vanilla JS (ES2022), PixiJS v8 only (`Assets`, `Texture` + `Rectangle` frames, `Sprite`, `AnimatedSprite`, `TilingSprite`). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-05-sprite-art-design.md`

## Global Constraints

- PixiJS **v8 API only**: `await app.init()`, shape-then-fill Graphics, `blendMode` strings. Never `beginFill`/`app.view`/`lineStyle`.
- **No top-level await** — everything async stays inside the existing IIFE in `src/main.js`.
- **Deterministic scene**: all placement randomness through the existing `mulberry32` seeded PRNG.
- Pixel art: `scaleMode: "nearest"` on every texture source; world scale is `SCALE = 3` (16px art tile ≈ 48 world px).
- No test framework: each task verifies with `npx vite build` (must pass) + visual check in Chrome via `npm run dev`.
- `data/` (raw asset packs) must never be committed — only the processed sheets under `public/assets/`.
- Consult `.agents/skills/pixijs/SKILL.md` sub-skills before writing unfamiliar Pixi code.
- Commit after every task.

## Asset facts (measured, this repo)

- `data/kauzz/Enviroment.png` — 720×416 master sheet, 16px grid. Key frame rects `(x, y, w, h)` measured by alpha-segmentation; **verify each on the `?sprites` contact sheet (Task 2) and correct there — coordinates below are near-exact but some edges may be off by a few px**:
  - fills (tileable): dirtDark `(0,352,32,32)`, purple `(32,352,32,32)`, stone `(64,352,32,32)`, dirtLight `(0,384,64,32)`
  - crystals big: pink `(340,15,47,49)`, blue `(469,15,47,49)`, gold `(596,15,47,49)`
  - crystals medium: pink `(373,68,37,36)`, blue `(502,68,37,36)`, gold `(629,68,37,36)`
  - crystals small: pink `(338,74,28,28)`, blue `(467,74,28,28)`, gold `(594,74,28,28)`
  - gem triples: red `(674,130,30,13)`, silver `(674,146,30,13)`, green `(674,162,30,13)`
  - lantern `(180,337,7,13)`; horizontal plank beams `(16,234,63,6)` and `(80,233,47,7)`
  - pillars (59px tall): wood `(405,346,10,59)`, woodPair `(423,346,20,59)`, metal `(452,346,10,59)`, metalPair `(470,346,20,59)`
  - minecart `(560,386,48,18)`; elevator hanger (rope pulley bracket) `(656,311,64,41)`; elevator cage (with inner lantern) `(656,361,64,43)`
- `data/kauzz/Background/` — `Background A.png` (400×300, farthest), `Background B.png`, `Background C.png` (nearest), `Background A2.png`/`Complete` unused.
- `data/miner/Miner_AllAnimations_SpriteSheet.png` — 192×112, strict 16×16 grid, one animation per row. Row→animation mapping (verify on contact sheet; swap names if wrong): row 0 = miningRight (6 frames), row 1 = idle (4), row 2 = miningDown (6), row 3 = climb (6), row 4 = walk (12), row 5 = hurt (4), row 6 = death (5).

---

### Task 1: Licensing hygiene + accreditation

**Files:**
- Modify: `.gitignore`
- Modify: `README.md`
- Modify: `index.html` (bottom section)

**Interfaces:** none (no code).

- [ ] **Step 1: gitignore the raw packs**

Append to `.gitignore`:

```
data/
```

Run: `git status --short` — `data/` must not appear as untracked content (the two zips + extracted folders are ignored).

- [ ] **Step 2: README art credits**

In `README.md`, replace the paragraph starting `All world graphics are procedural placeholder` with:

```markdown
The shaft layout uses a seeded PRNG, so the scene is identical on every visit.

## Art credits

- Cave tileset & backgrounds: [Pixel Valley | Cave](https://kauzz.itch.io/kpc) by **Kauzz**
- Miner character: [16Bit Miner Animated Character](https://dkproductions.itch.io/16bit-miner-animated-character) by **Daniel Kole Productions**

The raw packs are not part of this repository (`data/` is gitignored); only the
sprite sheets used by the page are committed under `public/assets/`. Support the
artists via the links above.
```

- [ ] **Step 3: on-page credits**

In `index.html`, inside `<section class="depth" id="bottom">`, after the existing `.cta.source` link, add:

```html
        <p class="credits">
          Art: <a href="https://kauzz.itch.io/kpc">Kauzz</a> ·
          <a href="https://dkproductions.itch.io/16bit-miner-animated-character">Daniel Kole Productions</a>
        </p>
```

In `src/style.css`, next to the existing `.cta` rules, add (links must be clickable through the `pointer-events: none` sections, same mechanism as `.cta`):

```css
.credits {
  font-size: 0.8rem;
  opacity: 0.6;
}
.credits a {
  color: inherit;
  pointer-events: auto;
}
```

- [ ] **Step 4: verify + commit**

Run: `npx vite build` — expect success.

```bash
git add .gitignore README.md index.html src/style.css
git commit -m "Gitignore raw asset packs, credit Kauzz and Daniel Kole Productions"
```

---

### Task 2: Asset files + `src/sprites.js` + contact-sheet verification

**Files:**
- Create: `public/assets/enviroment.png`, `public/assets/bg-a.png`, `public/assets/bg-b.png`, `public/assets/bg-c.png`, `public/assets/miner.png` (copied from `data/`)
- Create: `src/sprites.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces (used by every later task):
  - `SCALE` — number, world pixels per art pixel (3)
  - `async loadSprites()` — loads all sheets, sets nearest scaleMode; must resolve before any `tex`/`minerAnim`/`bgTexture` call
  - `tex(name: string): Texture` — cached sub-texture of Enviroment.png by frame name (names listed in Asset facts, camelCase: `fillDirtDark`, `crystalPinkMed`, `gemsRed`, `lantern`, `beamPlank`, `pillarWoodPair`, `minecart`, `elevatorHanger`, `elevatorCage`, …)
  - `minerAnim(name: "miningRight"|"idle"|"miningDown"|"climb"|"walk"|"hurt"|"death"): Texture[]`
  - `bgTexture(layer: "a"|"b"|"c"): Texture` — full background layer texture
  - `debugContactSheet(app): void` — renders every named frame + animation with labels

- [ ] **Step 1: copy assets**

```bash
cd /Users/andries/projects/codemine-game
mkdir -p public/assets
cp "data/kauzz/Enviroment.png" public/assets/enviroment.png
cp "data/kauzz/Background/Background A.png" public/assets/bg-a.png
cp "data/kauzz/Background/Background B.png" public/assets/bg-b.png
cp "data/kauzz/Background/Background C.png" public/assets/bg-c.png
cp "data/miner/Miner_AllAnimations_SpriteSheet.png" public/assets/miner.png
```

- [ ] **Step 2: write `src/sprites.js`**

```js
import { Assets, Rectangle, Texture } from "pixi.js";

// World pixels per art pixel (16px art tile -> 48 world px).
export const SCALE = 3;

// Frame rects (x, y, w, h) in enviroment.png, verified via the ?sprites contact sheet.
const ENV_FRAMES = {
  fillDirtDark: [0, 352, 32, 32],
  fillPurple: [32, 352, 32, 32],
  fillStone: [64, 352, 32, 32],
  fillDirtLight: [0, 384, 64, 32],
  crystalPinkBig: [340, 15, 47, 49],
  crystalBlueBig: [469, 15, 47, 49],
  crystalGoldBig: [596, 15, 47, 49],
  crystalPinkMed: [373, 68, 37, 36],
  crystalBlueMed: [502, 68, 37, 36],
  crystalGoldMed: [629, 68, 37, 36],
  crystalPinkSmall: [338, 74, 28, 28],
  crystalBlueSmall: [467, 74, 28, 28],
  crystalGoldSmall: [594, 74, 28, 28],
  gemsRed: [674, 130, 30, 13],
  gemsSilver: [674, 146, 30, 13],
  gemsGreen: [674, 162, 30, 13],
  lantern: [180, 337, 7, 13],
  beamPlank: [16, 234, 63, 6],
  pillarWood: [405, 346, 10, 59],
  pillarWoodPair: [423, 346, 20, 59],
  pillarMetal: [452, 346, 10, 59],
  pillarMetalPair: [470, 346, 20, 59],
  minecart: [560, 386, 48, 18],
  elevatorHanger: [656, 311, 64, 41],
  elevatorCage: [656, 361, 64, 43],
};

// miner.png is a strict 16x16 grid: one animation per row.
const MINER_ROWS = {
  miningRight: [0, 6],
  idle: [1, 4],
  miningDown: [2, 6],
  climb: [3, 6],
  walk: [4, 12],
  hurt: [5, 4],
  death: [6, 5],
};

let envSheet, minerSheet;
const bgSheets = {};
const cache = new Map();

export async function loadSprites() {
  [envSheet, minerSheet, bgSheets.a, bgSheets.b, bgSheets.c] = await Promise.all([
    Assets.load("./assets/enviroment.png"),
    Assets.load("./assets/miner.png"),
    Assets.load("./assets/bg-a.png"),
    Assets.load("./assets/bg-b.png"),
    Assets.load("./assets/bg-c.png"),
  ]);
  for (const t of [envSheet, minerSheet, bgSheets.a, bgSheets.b, bgSheets.c]) {
    t.source.scaleMode = "nearest";
  }
}

export function tex(name) {
  if (!cache.has(name)) {
    const [x, y, w, h] = ENV_FRAMES[name];
    cache.set(
      name,
      new Texture({ source: envSheet.source, frame: new Rectangle(x, y, w, h) }),
    );
  }
  return cache.get(name);
}

export function minerAnim(name) {
  const key = `miner:${name}`;
  if (!cache.has(key)) {
    const [row, count] = MINER_ROWS[name];
    cache.set(
      key,
      Array.from(
        { length: count },
        (_, i) =>
          new Texture({
            source: minerSheet.source,
            frame: new Rectangle(i * 16, row * 16, 16, 16),
          }),
      ),
    );
  }
  return cache.get(key);
}

export function bgTexture(layer) {
  return bgSheets[layer];
}

export function envFrameNames() {
  return Object.keys(ENV_FRAMES);
}

export function minerAnimNames() {
  return Object.keys(MINER_ROWS);
}
```

- [ ] **Step 3: contact-sheet debug mode + load hook in `src/main.js`**

In `src/main.js`, add imports and the loader call. After `await app.init({...})` and the touch-action line, insert:

```js
  await loadSprites();

  if (new URLSearchParams(location.search).has("sprites")) {
    debugContactSheet(app);
    return;
  }
```

with imports at the top:

```js
import { loadSprites, debugContactSheet } from "./sprites.js";
```

Append to `src/sprites.js` (uses `AnimatedSprite`, `Container`, `Sprite`, `Text` — extend the pixi.js import):

```js
// Renders every named frame + animation with labels; open /?sprites to check
// frame rects against the sheets.
export function debugContactSheet(app) {
  const root = new Container();
  app.stage.addChild(root);
  const style = { fontFamily: "monospace", fontSize: 11, fill: 0xffffff };
  let x = 20;
  let y = 20;
  let rowH = 0;
  const place = (node, label) => {
    const w = Math.max(node.width, label.length * 7);
    if (x + w > app.screen.width - 20) {
      x = 20;
      y += rowH + 34;
      rowH = 0;
    }
    node.position.set(x, y);
    const t = new Text({ text: label, style });
    t.position.set(x, y + node.height + 2);
    root.addChild(node, t);
    x += w + 16;
    rowH = Math.max(rowH, node.height);
  };
  for (const name of envFrameNames()) {
    const s = new Sprite(tex(name));
    s.scale.set(SCALE);
    place(s, name);
  }
  for (const name of minerAnimNames()) {
    const a = new AnimatedSprite(minerAnim(name));
    a.scale.set(SCALE);
    a.animationSpeed = 0.15;
    a.play();
    place(a, name);
  }
}
```

- [ ] **Step 4: verify frames visually and correct rects**

Run: `npm run dev`, open `http://localhost:5173/?sprites` in Chrome.
Expected: every env frame shows exactly one clean sprite (no neighbor bleed, no cropped edges); each miner animation plays and matches its label (miningRight swings sideways, miningDown swings overhead, idle stands, walk cycles, climb shows back view, death collapses).
**Correct any wrong rect / row name in `ENV_FRAMES` / `MINER_ROWS` now** — later tasks trust these names blindly. Normal scene (`/` without query) must still render as before.

- [ ] **Step 5: build + commit**

Run: `npx vite build` — expect success.

```bash
git add public/assets src/sprites.js src/main.js
git commit -m "Add sprite sheets, sprites module with named frames, ?sprites contact sheet"
```

---

### Task 3: Shaft walls, beams and ore veins from the tileset

**Files:**
- Modify: `src/shaft.js` (full rewrite of `buildShaft` internals; `SHAFT` and `mulberry32` stay)

**Interfaces:**
- Consumes: `SCALE`, `tex(name)` from `src/sprites.js`.
- Produces: `buildShaft(world, app)` now **returns** `{ veins }` where `veins` is `Array<{ x, y, onLeft, ore: { label, color } }>` (world coords of each ore vein). `SHAFT` export unchanged. `main.js` will be updated to capture this in Task 7 — returning it now is harmless.

- [ ] **Step 1: rewrite `src/shaft.js`**

```js
import { Graphics, Sprite, Text, TextStyle, TilingSprite } from "pixi.js";
import { SCALE, tex } from "./sprites.js";

// World-space dimensions of the mine shaft (pixels).
export const SHAFT = {
  width: 420,
  depth: 6000,
  wallThickness: 90,
};

const ORES = [
  { label: "C#", color: 0x9b4f96, crystal: "crystalPinkMed", tint: 0xffffff },
  { label: "TS", color: 0x3178c6, crystal: "crystalBlueMed", tint: 0xffffff },
  { label: "PY", color: 0xffd43b, crystal: "crystalGoldMed", tint: 0xffffff },
  { label: "RS", color: 0xdea584, crystal: "crystalGoldMed", tint: 0xffa066 },
  { label: "GO", color: 0x00add8, crystal: "crystalBlueMed", tint: 0x66ffe0 },
];

// Deterministic pseudo-random so the shaft looks the same every visit.
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildShaft(world, app) {
  const rand = mulberry32(1337);
  const spanY = -200;
  const spanH = SHAFT.depth + 400;

  // Shaft interior backdrop — parallax layers (background.js) show through the
  // canvas behind this, so keep it translucent-dark rather than opaque.
  const interior = new Graphics();
  interior.rect(0, spanY, SHAFT.width, spanH).fill({ color: 0x0d0a06, alpha: 0.55 });
  world.addChild(interior);

  // Rock walls: tiling dirt texture on both sides.
  for (const side of [-1, 1]) {
    const wall = new TilingSprite({
      texture: tex("fillDirtDark"),
      width: SHAFT.wallThickness,
      height: spanH,
    });
    wall.tileScale.set(SCALE);
    wall.position.set(side < 0 ? -SHAFT.wallThickness : SHAFT.width, spanY);
    world.addChild(wall);

    // Stone patches breaking up the dirt.
    for (let y = 0; y < SHAFT.depth; y += 300 + rand() * 500) {
      const patch = new Sprite(tex(rand() < 0.5 ? "fillStone" : "fillPurple"));
      patch.scale.set(SCALE);
      patch.position.set(side < 0 ? -SHAFT.wallThickness + rand() * 8 : SHAFT.width - rand() * 8, y);
      patch.alpha = 0.9;
      world.addChild(patch);
    }
  }

  // Wooden support frames every ~500px of depth: two side pillars + plank across.
  for (let y = 250; y < SHAFT.depth; y += 500) {
    const plank = new TilingSprite({
      texture: tex("beamPlank"),
      width: SHAFT.width + 20,
      height: 6 * SCALE,
    });
    plank.tileScale.set(SCALE);
    plank.position.set(-10, y);
    world.addChild(plank);

    for (const px of [2, SHAFT.width - 2 - 20 * SCALE]) {
      const pillar = new Sprite(tex("pillarWoodPair"));
      pillar.scale.set(SCALE);
      pillar.position.set(px, y - 59 * SCALE + 6 * SCALE);
      world.addChild(pillar);
    }
  }

  // Elevator guide rails.
  const rails = new Graphics();
  rails.rect(SHAFT.width * 0.5 - 60, spanY, 4, spanH).fill(0x3a3a3a);
  rails.rect(SHAFT.width * 0.5 + 56, spanY, 4, spanH).fill(0x3a3a3a);
  world.addChild(rails);

  // Ore veins: crystals embedded near the walls, labeled with languages.
  const oreStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "bold",
    fill: 0xf0e6d2,
    stroke: { color: 0x0a0805, width: 3 },
  });

  const veins = [];
  for (let y = 400; y < SHAFT.depth - 200; y += 300 + rand() * 400) {
    const ore = ORES[Math.floor(rand() * ORES.length)];
    const onLeft = rand() < 0.5;
    const x = onLeft ? 10 + rand() * 30 : SHAFT.width - 40 - rand() * 30;

    const crystal = new Sprite(tex(ore.crystal));
    crystal.scale.set(onLeft ? SCALE : -SCALE, SCALE);
    crystal.anchor.set(0.5);
    crystal.tint = ore.tint;
    crystal.position.set(x, y);
    world.addChild(crystal);

    const label = new Text({ text: ore.label, style: oreStyle });
    label.anchor.set(0.5);
    label.position.set(x, y + 8);
    world.addChild(label);

    veins.push({ x, y, onLeft, ore });
  }

  return { veins };
}
```

Notes for the implementer:
- Crystal sprites are ~37px art → ~111 world px at SCALE 3. If that dwarfs the 420px shaft on screen, drop to `crystalPinkSmall`/`...Small` variants (28px) — judge visually.
- The label moved to light text with dark stroke because it now sits on a bright crystal sprite.

- [ ] **Step 2: visual check**

Run: `npm run dev`, open `http://localhost:5173/`.
Expected: dirt-textured walls with stone/purple patches, plank+pillar frames every 500px, crystals with readable language labels alternating sides, elevator/torches/darkness still working, no console errors. Pixel edges crisp (nearest), not blurry.

- [ ] **Step 3: build + commit**

Run: `npx vite build` — expect success.

```bash
git add src/shaft.js
git commit -m "Shaft walls, beams and ore crystals from Kauzz tileset"
```

---

### Task 4: Parallax cave background

**Files:**
- Create: `src/background.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `SCALE`, `bgTexture(layer)` from `src/sprites.js`.
- Produces: `createBackground(app)` → `{ container, update(depth), resize() }`. `container` is added to the stage **below** `world`; `update(depth)` scrolls layers at fractional speed; `resize()` refits to the screen.

- [ ] **Step 1: write `src/background.js`**

```js
import { Container, TilingSprite } from "pixi.js";
import { SCALE, bgTexture } from "./sprites.js";

// Screen-space parallax cave layers behind the world; deeper layers scroll slower.
const LAYERS = [
  { key: "a", speed: 0.15, alpha: 0.5 },
  { key: "b", speed: 0.3, alpha: 0.65 },
  { key: "c", speed: 0.5, alpha: 0.8 },
];

export function createBackground(app) {
  const container = new Container();
  const sprites = LAYERS.map((layer) => {
    const s = new TilingSprite({
      texture: bgTexture(layer.key),
      width: app.screen.width,
      height: app.screen.height,
    });
    s.tileScale.set(SCALE);
    s.alpha = layer.alpha;
    container.addChild(s);
    return s;
  });

  return {
    container,
    update(depth) {
      for (let i = 0; i < sprites.length; i++) {
        sprites[i].tilePosition.y = -depth * LAYERS[i].speed;
      }
    },
    resize() {
      for (const s of sprites) {
        s.width = app.screen.width;
        s.height = app.screen.height;
      }
    },
  };
}
```

- [ ] **Step 2: wire into `src/main.js`**

Add import:

```js
import { createBackground } from "./background.js";
```

Right after `const world = new Container();` (and before `app.stage.addChild(world);`) insert:

```js
  const background = createBackground(app);
  app.stage.addChild(background.container);
```

(`world` is added after, so it renders above the background.)

In the ticker, after `currentDepth += ...`, add:

```js
    background.update(currentDepth);
    background.resize();
```

- [ ] **Step 3: visual check**

Run: `npm run dev`. Expected: dim cave scenery visible through the shaft interior, scrolling slower than the walls (depth cue), still dark overall — darkness layer must still dominate away from lights. Resize the window: layers refit.

- [ ] **Step 4: build + commit**

Run: `npx vite build` — expect success.

```bash
git add src/background.js src/main.js
git commit -m "Add parallax cave background layers"
```

---

### Task 5: Elevator cage sprites + idle miner

**Files:**
- Modify: `src/elevator.js`

**Interfaces:**
- Consumes: `SCALE`, `tex("elevatorHanger")`, `tex("elevatorCage")`, `minerAnim("idle")` from `src/sprites.js`.
- Produces: `createElevator(world)` signature and returned `{ cage, update(depth, targetDepth, ticker) }` unchanged (darkness.js reads `elevator.cage` position for its light).

- [ ] **Step 1: rewrite `src/elevator.js`**

```js
import { AnimatedSprite, Container, Graphics, Sprite } from "pixi.js";
import { SCALE, minerAnim, tex } from "./sprites.js";
import { SHAFT } from "./shaft.js";

export function createElevator(world) {
  const cage = new Container();
  cage.x = SHAFT.width * 0.5;

  // Cable up to the surface.
  const cable = new Graphics();
  cable.rect(-1.5, -10000, 3, 10000).fill(0x777777);
  cage.addChild(cable);

  // Rope-pulley bracket the cage hangs from.
  const hanger = new Sprite(tex("elevatorHanger"));
  hanger.scale.set(SCALE);
  hanger.anchor.set(0.5, 1);
  hanger.y = -43 * SCALE * 0.5;
  cage.addChild(hanger);

  // The cage itself (Kauzz sprite has a lantern + light cone inside).
  const box = new Sprite(tex("elevatorCage"));
  box.scale.set(SCALE);
  box.anchor.set(0.5);
  cage.addChild(box);

  // Idle miner riding the elevator.
  const miner = new AnimatedSprite(minerAnim("idle"));
  miner.scale.set(SCALE);
  miner.anchor.set(0.5, 1);
  miner.position.set(-10, 43 * SCALE * 0.5 - 4 * SCALE);
  miner.animationSpeed = 0.05;
  miner.play();
  cage.addChild(miner);

  world.addChild(cage);

  let sway = 0;
  return {
    cage,
    update(depth, targetDepth, ticker) {
      cage.y = depth;
      // Cage sways more when moving fast.
      const speed = Math.abs(targetDepth - depth);
      sway += ticker.deltaTime * 0.05;
      cage.rotation = Math.sin(sway) * Math.min(0.04, 0.002 + speed * 0.0002);
    },
  };
}
```

Notes: cage art is 64×43 → 192×129 world px; wider than the old 90px cage but fits the 420px shaft. If the miner's feet don't sit on the cage floor, nudge the `- 4 * SCALE` offset by eye.

- [ ] **Step 2: visual check**

Run: `npm run dev`. Expected: sprite cage hanging from pulley bracket on the cable, idle miner inside, sway on fast scroll intact, elevator light still cuts the darkness.

- [ ] **Step 3: build + commit**

Run: `npx vite build` — expect success.

```bash
git add src/elevator.js
git commit -m "Elevator cage and pulley sprites with idle miner"
```

---

### Task 6: Lantern sprites under the flames

**Files:**
- Modify: `src/torches.js`

**Interfaces:**
- Consumes: `SCALE`, `tex("lantern")` from `src/sprites.js`.
- Produces: `createTorches(world)` return shape unchanged: `{ torches: [{ flame, x, y, phase, flicker }], update(ticker) }` (darkness.js reads `x`, `y`, `flicker`).

- [ ] **Step 1: rewrite the torch visual**

Replace the loop body building each torch in `src/torches.js` (keep positions, phase, return shape):

```js
import { Graphics, Sprite } from "pixi.js";
import { SCALE, tex } from "./sprites.js";
import { SHAFT } from "./shaft.js";

// Wall lanterns: sprite body + procedural flicker flame on top; exposes light
// positions consumed by the darkness layer.
export function createTorches(world) {
  const torches = [];

  for (let y = 350; y < SHAFT.depth; y += 500) {
    const onLeft = (y / 500) % 2 === 0;
    const x = onLeft ? 26 : SHAFT.width - 26;

    const lantern = new Sprite(tex("lantern"));
    lantern.scale.set(SCALE);
    lantern.anchor.set(0.5, 0);
    lantern.position.set(x, y - 6);
    world.addChild(lantern);

    // Flame glow over the lantern's window (the pack lantern is unlit).
    const flame = new Graphics();
    flame.ellipse(0, 0, 5, 7).fill({ color: 0xff8c1a, alpha: 0.9 });
    flame.ellipse(0, -1, 2.5, 4).fill(0xffd766);
    flame.position.set(x, y + 4 * SCALE);
    world.addChild(flame);

    torches.push({ flame, x, y, phase: y * 0.13 });
  }

  return {
    torches,
    update(ticker) {
      const t = performance.now() * 0.008;
      for (const torch of torches) {
        const flicker = Math.sin(t + torch.phase) * 0.5 + Math.sin(t * 2.3 + torch.phase) * 0.5;
        torch.flame.scale.set(1 + flicker * 0.08, 1 + flicker * 0.12);
        torch.flicker = flicker;
      }
    },
  };
}
```

Position the flame over the lantern's glass by eye (`y + 4 * SCALE` is the starting guess; lantern art is 7×13 → 21×39 world px).

- [ ] **Step 2: visual check**

Run: `npm run dev`. Expected: lantern sprites on alternating walls, flame flicker inside them, light holes in the darkness still follow and flicker.

- [ ] **Step 3: build + commit**

Run: `npx vite build` — expect success.

```bash
git add src/torches.js
git commit -m "Wall lantern sprites with procedural flame flicker"
```

---

### Task 7: Background miners at ore veins

**Files:**
- Create: `src/miners.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `SCALE`, `minerAnim("miningRight")` from `src/sprites.js`; `veins` from `buildShaft` (`{ x, y, onLeft, ore: { color } }`).
- Produces: `createMiners(world, veins, rand)` → `{ update(ticker) }` where `rand` is a seeded PRNG function `() => number`. Registered in the main ticker.

- [ ] **Step 1: write `src/miners.js`**

```js
import { AnimatedSprite, Graphics } from "pixi.js";
import { SCALE, minerAnim } from "./sprites.js";

// Impact frame of the miningRight animation (pick hits the wall) — verify on
// the ?sprites contact sheet and adjust if the hit lands on another frame.
const IMPACT_FRAME = 3;

// Background dwarves mining a deterministic subset of ore veins, with rock-chip
// particles on each pickaxe impact.
export function createMiners(world, veins, rand) {
  const chips = [];

  const miners = veins
    .filter(() => rand() < 0.5)
    .map((vein) => {
      const s = new AnimatedSprite(minerAnim("miningRight"));
      s.anchor.set(0.5, 1);
      // Face the wall being mined; art faces right by default.
      s.scale.set(vein.onLeft ? -SCALE : SCALE, SCALE);
      const dir = vein.onLeft ? -1 : 1;
      s.position.set(vein.x - dir * 14 * SCALE, vein.y + 8 * SCALE);
      s.animationSpeed = 0.12 + rand() * 0.06;
      s.currentFrame = Math.floor(rand() * s.totalFrames);
      s.play();
      s.onFrameChange = (frame) => {
        if (frame === IMPACT_FRAME) spawnChips(vein, dir);
      };
      world.addChild(s);
      return s;
    });

  function spawnChips(vein, dir) {
    for (let i = 0; i < 3; i++) {
      const g = new Graphics();
      g.rect(0, 0, 3, 3).fill(vein.ore.color);
      g.position.set(vein.x, vein.y + (Math.random() - 0.5) * 10);
      world.addChild(g);
      chips.push({
        g,
        vx: -dir * (0.5 + Math.random() * 1.5),
        vy: -1 - Math.random() * 1.5,
        life: 30 + Math.random() * 15,
      });
    }
  }

  return {
    update(ticker) {
      const dt = ticker.deltaTime;
      for (let i = chips.length - 1; i >= 0; i--) {
        const c = chips[i];
        c.vy += 0.12 * dt;
        c.g.x += c.vx * dt;
        c.g.y += c.vy * dt;
        c.life -= dt;
        c.g.alpha = Math.min(1, c.life / 15);
        if (c.life <= 0) {
          c.g.destroy();
          chips.splice(i, 1);
        }
      }
    },
  };
}
```

Note: chip motion uses `Math.random()` deliberately — particle scatter is ephemeral, not part of the deterministic layout. Miner *placement* comes from the seeded `rand`.

- [ ] **Step 2: wire into `src/main.js`**

Change the shaft/torches setup lines to:

```js
  const shaft = buildShaft(world, app);
  const miners = createMiners(world, shaft.veins, mulberry32(4242));
  const torches = createTorches(world, app);
```

Import `createMiners` from `./miners.js`. Export `mulberry32` from `src/shaft.js` (add `export` keyword to the existing function) and import it in `main.js`:

```js
import { buildShaft, mulberry32, SHAFT } from "./shaft.js";
import { createMiners } from "./miners.js";
```

Add to the ticker, next to `torches.update(ticker);`:

```js
    miners.update(ticker);
```

- [ ] **Step 3: visual check**

Run: `npm run dev`. Expected: roughly half the ore veins have a miner swinging a pick at the crystal, facing the correct wall, feet on solid ground visually; colored chips fly from the vein on impact frames and fall with gravity; frame-desynced miners (not all swinging in unison). No console errors.

- [ ] **Step 4: build + commit**

Run: `npx vite build` — expect success.

```bash
git add src/miners.js src/main.js src/shaft.js
git commit -m "Background miners with pickaxe swings and ore-chip particles"
```

---

### Task 8: Final verification pass + docs sync

**Files:**
- Modify: `PLAN.md`
- Modify: `CLAUDE.md` (Status + Conventions paragraphs)

**Interfaces:** none.

- [ ] **Step 1: full visual pass**

Run: `npm run dev`, check in Chrome:
- Scroll top→bottom: elevator follows with easing/sway, parallax lags the walls, darkness + lights correct throughout.
- Blog / CV / source CTAs and the new credits links clickable.
- Narrow the window to ~390px (mobile width): scene still composed sensibly, touch scroll unaffected (canvas `touch-action: pan-y` untouched).
- Console free of errors/warnings.

Run: `npx vite build` — expect success. Then `npx vite preview` and spot-check the production build renders sprites (asset paths are relative).

- [ ] **Step 2: update PLAN.md and CLAUDE.md**

In `PLAN.md`: mark next-steps items 2 and 3 done (`[x]`), noting sprites come from Kauzz + DK Productions packs (credits in README). In `CLAUDE.md`: update the Status section ("Everything on screen is still placeholder procedural Graphics" is no longer true) and the Conventions bullet about placeholder Graphics — sprite frames are defined in `src/sprites.js`; `?sprites` renders a contact sheet.

- [ ] **Step 3: commit**

```bash
git add PLAN.md CLAUDE.md
git commit -m "Mark sprite art and miners milestones done"
```
