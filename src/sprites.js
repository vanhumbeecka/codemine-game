import { AnimatedSprite, Assets, Container, Rectangle, Sprite, Text, Texture } from "pixi.js";

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
  beamPlank: [80, 233, 47, 7],
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
