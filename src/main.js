import { Application, Container } from "pixi.js";
import { buildShaft, SHAFT } from "./shaft.js";
import { createElevator } from "./elevator.js";
import { createTorches } from "./torches.js";
import { createDarkness } from "./darkness.js";
import { loadSprites, debugContactSheet } from "./sprites.js";

// Async IIFE, not top-level await: Vite production builds silently never
// resolve a top-level `await app.init()` (works in dev only).
(async () => {
  const app = new Application();
  await app.init({
    canvas: document.getElementById("mine"),
    resizeTo: window,
    background: "#0a0805",
    antialias: true,
  });

  // Pixi's EventSystem sets touch-action: none on the canvas, which blocks
  // touch scrolling on mobile. The scroll IS the interaction here, so allow
  // vertical panning again (must be after init — Pixi sets it inline).
  app.canvas.style.touchAction = "pan-y";

  try {
    await loadSprites();
  } catch (err) {
    // Bad deploy / network hiccup: fall back to the HTML on the page
    // background instead of leaving a black canvas covering it.
    console.error("Sprite load failed, disabling canvas scene:", err);
    app.canvas.remove();
    return;
  }

  if (new URLSearchParams(location.search).has("sprites")) {
    debugContactSheet(app);
    return;
  }

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
})();
