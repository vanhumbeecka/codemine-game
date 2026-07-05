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
