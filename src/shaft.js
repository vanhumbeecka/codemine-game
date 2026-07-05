import { Graphics, Text, TextStyle } from "pixi.js";

// World-space dimensions of the mine shaft (pixels).
export const SHAFT = {
  width: 420,
  depth: 6000,
  wallThickness: 90,
};

const ORES = [
  { label: "C#", color: 0x9b4f96 },
  { label: "TS", color: 0x3178c6 },
  { label: "PY", color: 0xffd43b },
  { label: "RS", color: 0xdea584 },
  { label: "GO", color: 0x00add8 },
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
  const g = new Graphics();

  // Rock walls on both sides of the shaft.
  g.rect(-SHAFT.wallThickness, -200, SHAFT.wallThickness, SHAFT.depth + 400).fill(0x2b2018);
  g.rect(SHAFT.width, -200, SHAFT.wallThickness, SHAFT.depth + 400).fill(0x2b2018);
  // Shaft interior — slightly lighter than the page background.
  g.rect(0, -200, SHAFT.width, SHAFT.depth + 400).fill(0x171009);

  // Rocky texture: jagged chunks along the walls.
  for (let y = 0; y < SHAFT.depth; y += 40 + rand() * 60) {
    const leftW = 8 + rand() * 24;
    const rightW = 8 + rand() * 24;
    g.rect(0, y, leftW, 20 + rand() * 30).fill(0x241a10);
    g.rect(SHAFT.width - rightW, y, rightW, 20 + rand() * 30).fill(0x241a10);
  }

  // Wooden support beams every ~500px of depth.
  for (let y = 250; y < SHAFT.depth; y += 500) {
    g.rect(-10, y, SHAFT.width + 20, 16).fill(0x5c4326);
    g.rect(4, y - 60, 14, 76).fill(0x4a361e);
    g.rect(SHAFT.width - 18, y - 60, 14, 76).fill(0x4a361e);
  }

  // Elevator guide rails.
  g.rect(SHAFT.width * 0.5 - 60, -200, 4, SHAFT.depth + 400).fill(0x3a3a3a);
  g.rect(SHAFT.width * 0.5 + 56, -200, 4, SHAFT.depth + 400).fill(0x3a3a3a);

  world.addChild(g);

  // Ore veins embedded in the walls, labeled with languages.
  const oreStyle = new TextStyle({
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "bold",
    fill: 0x0a0805,
  });

  for (let y = 400; y < SHAFT.depth - 200; y += 300 + rand() * 400) {
    const ore = ORES[Math.floor(rand() * ORES.length)];
    const onLeft = rand() < 0.5;
    const x = onLeft ? 10 + rand() * 30 : SHAFT.width - 40 - rand() * 30;

    const vein = new Graphics();
    for (let i = 0; i < 4; i++) {
      vein
        .circle(x + (rand() - 0.5) * 26, y + (rand() - 0.5) * 26, 6 + rand() * 8)
        .fill(ore.color);
    }
    world.addChild(vein);

    const label = new Text({ text: ore.label, style: oreStyle });
    label.anchor.set(0.5);
    label.position.set(x, y);
    world.addChild(label);
  }
}
