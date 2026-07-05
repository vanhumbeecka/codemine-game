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
      height: 7 * SCALE,
    });
    plank.tileScale.set(SCALE);
    plank.position.set(-10, y);
    world.addChild(plank);

    for (const px of [2, SHAFT.width - 2 - 20 * SCALE]) {
      const pillar = new Sprite(tex("pillarWoodPair"));
      pillar.scale.set(SCALE);
      pillar.position.set(px, y - 59 * SCALE + 7 * SCALE);
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
