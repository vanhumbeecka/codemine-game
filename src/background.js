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
