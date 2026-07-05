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
