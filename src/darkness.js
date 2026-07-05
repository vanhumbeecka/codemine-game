import { AlphaFilter, Container, FillGradient, Graphics } from "pixi.js";
import { SHAFT } from "./shaft.js";

// Screen-space darkness with light holes erased where torches and the elevator are.
// The AlphaFilter forces this container into its own render pass so the "erase"
// blend only cuts the darkness, not the scene behind it.
export function createDarkness(app, torches, elevator) {
  const container = new Container();
  container.filters = [new AlphaFilter({ alpha: 1 })];

  const cover = new Graphics();
  container.addChild(cover);

  // Radial gradient coordinates are normalized to the shape's bounds in the
  // default "local" texture space, so one gradient serves every light size.
  // "erase" cuts darkness by source ALPHA, so the falloff must live in the
  // alpha channel — a color-only fade erases the full disc uniformly.
  const lightGradient = new FillGradient({
    type: "radial",
    center: { x: 0.5, y: 0.5 },
    innerRadius: 0,
    outerCenter: { x: 0.5, y: 0.5 },
    outerRadius: 0.5,
    colorStops: [
      { offset: 0, color: "rgba(255,255,255,1)" },
      { offset: 0.3, color: "rgba(255,255,255,0.95)" },
      { offset: 0.65, color: "rgba(255,255,255,0.45)" },
      { offset: 1, color: "rgba(255,255,255,0)" },
    ],
  });

  function makeLight(radius) {
    const g = new Graphics();
    g.circle(radius, radius, radius).fill(lightGradient);
    g.blendMode = "erase";
    g.pivot.set(radius, radius);
    container.addChild(g);
    return g;
  }

  const torchLights = torches.torches.map(() => makeLight(160));
  const elevatorLight = makeLight(260);

  return {
    container,
    update() {
      cover
        .clear()
        .rect(0, 0, app.screen.width, app.screen.height)
        .fill({ color: 0x000000, alpha: 0.94 });

      const world = elevator.cage.parent;
      torches.torches.forEach((torch, i) => {
        const light = torchLights[i];
        light.position.set(torch.x + world.x, torch.y - 8 + world.y);
        light.scale.set(1 + (torch.flicker ?? 0) * 0.06);
      });

      elevatorLight.position.set(
        elevator.cage.x + world.x,
        elevator.cage.y - 40 + world.y,
      );
    },
  };
}
