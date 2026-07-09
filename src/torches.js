import { Graphics, Sprite } from "pixi.js";
import { SCALE, tex } from "./sprites.js";
import { SHAFT } from "./shaft.js";

// Wall lanterns: sprite body + procedural flicker flame on top; exposes light
// positions consumed by the darkness layer.
export function createTorches(world) {
  const torches = [];

  let index = 0;
  for (let y = 350; y < SHAFT.depth; y += 500, index++) {
    const onLeft = index % 2 === 0;
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
