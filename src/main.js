import { Application, Container } from "pixi.js";
import { buildShaft, SHAFT } from "./shaft.js";
import { createElevator } from "./elevator.js";
import { createTorches } from "./torches.js";
import { createDarkness } from "./darkness.js";

const app = new Application();
await app.init({
  canvas: document.getElementById("mine"),
  resizeTo: window,
  background: "#0a0805",
  antialias: true,
});

// World scrolls; camera follows the elevator down the shaft.
const world = new Container();
app.stage.addChild(world);

buildShaft(world, app);
const torches = createTorches(world, app);
const elevator = createElevator(world, app);
const darkness = createDarkness(app, torches, elevator);
app.stage.addChild(darkness.container);
// Map page scroll (0..1) to shaft depth.
function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

let currentDepth = 0;

app.ticker.add((ticker) => {
  const targetDepth = scrollProgress() * SHAFT.depth;
  // Ease toward target so the elevator feels like it has weight.
  currentDepth += (targetDepth - currentDepth) * Math.min(1, ticker.deltaTime * 0.08);

  const centerY = app.screen.height * 0.5;
  world.y = centerY - currentDepth;
  world.x = app.screen.width * 0.5 - SHAFT.width * 0.5;

  elevator.update(currentDepth, targetDepth, ticker);
  torches.update(ticker);
  darkness.update(ticker);
});
