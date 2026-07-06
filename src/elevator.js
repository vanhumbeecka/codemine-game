import { Container, Graphics } from "pixi.js";
import { SHAFT } from "./shaft.js";

export function createElevator(world) {
  const cage = new Container();
  cage.x = SHAFT.width * 0.5;

  const g = new Graphics();
  // Cable up to the surface.
  g.rect(-1.5, -10000, 3, 10000).fill(0x777777);
  // Cage frame.
  g.rect(-45, -70, 90, 78).stroke({ width: 5, color: 0x8a6a3a });
  g.rect(-45, 4, 90, 10).fill(0x6b4f2a);
  // Roof.
  g.moveTo(-50, -70).lineTo(0, -92).lineTo(50, -70).closePath().fill(0x5c4326);
  cage.addChild(g);

  // The dwarf: placeholder blocky miner until real sprites arrive.
  const dwarf = new Graphics();
  dwarf.rect(-10, -26, 20, 22).fill(0x4a68a8); // tunic
  dwarf.circle(0, -32, 8).fill(0xd8a878); // head
  dwarf.moveTo(-9, -34).lineTo(0, -46).lineTo(9, -34).closePath().fill(0xc23b22); // helmet
  dwarf.rect(-9, -30, 18, 8).fill(0xd8d8d8); // beard
  dwarf.rect(-10, -4, 8, 8).fill(0x333333); // boots
  dwarf.rect(2, -4, 8, 8).fill(0x333333);
  // Pickaxe over the shoulder.
  dwarf.rect(10, -40, 3, 26).fill(0x7a5c34);
  dwarf.moveTo(4, -42).quadraticCurveTo(12, -50, 22, -42).lineTo(20, -38).quadraticCurveTo(12, -44, 6, -38).closePath().fill(0x999999);
  dwarf.y = 4;
  cage.addChild(dwarf);

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
