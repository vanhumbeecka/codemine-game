import { Graphics } from "pixi.js";
import { SHAFT } from "./shaft.js";

// Wall torches: flame graphic in the world + a light position consumed by the darkness layer.
export function createTorches(world) {
  const torches = [];

  for (let y = 350; y < SHAFT.depth; y += 500) {
    const onLeft = (y / 500) % 2 === 0;
    const x = onLeft ? 26 : SHAFT.width - 26;

    const flame = new Graphics();
    flame.rect(-3, 0, 6, 22).fill(0x5c4326); // handle
    flame.ellipse(0, -6, 6, 9).fill(0xff8c1a);
    flame.ellipse(0, -8, 3, 5).fill(0xffd766);
    flame.position.set(x, y);
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
