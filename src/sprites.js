import { Assets, Container, Rectangle, Sprite, Text, Texture } from "pixi.js";

// World pixels per art pixel (16px art tile -> 48 world px).
export const SCALE = 3;

// Frame rects (x, y, w, h) in enviroment.png, verified via the ?sprites contact sheet.
const ENV_FRAMES = {
  fillDirtDark: [0, 352, 32, 32],
  fillPurple: [32, 352, 32, 32],
  fillStone: [64, 352, 32, 32],
  fillDirtLight: [0, 384, 64, 32],
  lantern: [180, 337, 7, 13],
  beamPlank: [80, 233, 47, 7],
  pillarWood: [405, 346, 10, 59],
  pillarWoodPair: [423, 346, 20, 59],
  pillarMetal: [452, 346, 10, 59],
  pillarMetalPair: [470, 346, 20, 59],
  minecart: [560, 386, 48, 18],
};

let envSheet;
const bgSheets = {};
const cache = new Map();

export async function loadSprites() {
  [envSheet, bgSheets.a, bgSheets.b, bgSheets.c] = await Promise.all([
    Assets.load("./assets/enviroment.png"),
    Assets.load("./assets/bg-a.png"),
    Assets.load("./assets/bg-b.png"),
    Assets.load("./assets/bg-c.png"),
  ]);
  for (const t of [envSheet, bgSheets.a, bgSheets.b, bgSheets.c]) {
    t.source.scaleMode = "nearest";
  }
}

export function bgTexture(layer) {
  return bgSheets[layer];
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

export function envFrameNames() {
  return Object.keys(ENV_FRAMES);
}

// Renders every named frame with labels; open /?sprites to check
// frame rects against the sheet.
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
}
