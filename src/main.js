import { getJourney, MINE_ART } from "./journey.js";

const root = document.documentElement;
const sections = [...document.querySelectorAll(".depth")];
const levelLinks = [...document.querySelectorAll(".level-nav a")];
const depthValue = document.querySelector("#depth-value");
const levelLabel = document.querySelector("#level-label");
const motionButton = document.querySelector(".motion-toggle");
const canary = document.querySelector("#canary");
const cabinet = document.querySelector("#arcade-cabinet");
const status = document.querySelector('[role="status"]');
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const levelNames = [
  "At the surface",
  "The workshop",
  "The archive",
  "The arcade",
  "The hidden garden",
];
let paused = reducedMotion.matches;
let offsets = [];
let scene;
let frame = 0;
let disposed = false;
let messageTimer;
let chirps = 0;

function positionHotspot(element, x, y, width, height) {
  const contentEdge = innerWidth < 760 ? innerHeight * 0.52 : 100;
  element.hidden =
    y - height / 2 < contentEdge ||
    y > innerHeight - 95 ||
    x < 22 ||
    x > innerWidth - 22;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
}

function updateHotspots(layout) {
  positionHotspot(
    canary,
    layout.artX + MINE_ART.canary.x * layout.pixelScale,
    layout.artY + MINE_ART.canary.y * layout.pixelScale,
    46,
    46,
  );
  positionHotspot(
    cabinet,
    layout.artX + MINE_ART.arcade.x * layout.pixelScale,
    layout.artY + MINE_ART.arcade.y * layout.pixelScale,
    38 * layout.pixelScale,
    48 * layout.pixelScale,
  );
}

function update() {
  frame = 0;
  const journey = getJourney(window.scrollY, offsets);
  depthValue.textContent = String(journey.depth).padStart(3, "0");
  levelLabel.textContent = levelNames[journey.stop];
  root.dataset.level = sections[journey.stop].id;
  levelLinks.forEach((link, index) => {
    if (index === journey.stop) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
  scene?.update(journey.progress, paused);
}

function scheduleUpdate() {
  if (!frame) frame = requestAnimationFrame(update);
}

function measure() {
  const max = Math.max(0, root.scrollHeight - innerHeight);
  offsets = sections.map((section) => Math.min(section.offsetTop, max));
  scheduleUpdate();
}

function setMotion(value) {
  paused = value;
  motionButton.setAttribute("aria-pressed", String(paused));
  const label = paused ? "Resume ambience" : "Pause ambience";
  motionButton.setAttribute("aria-label", label);
  motionButton.querySelector("span").textContent = label;
  motionButton
    .querySelector("path")
    .setAttribute("d", paused ? "M7 4l8 6-8 6z" : "M7 5v10M13 5v10");
  scheduleUpdate();
}

function toggleMotion() {
  setMotion(!paused);
}
function respectMotion(event) {
  setMotion(event.matches);
}

function greetCanary() {
  const messages = [
    "Chirp! I’m Pip. Head of underground morale.",
    "Pip says: the arcade is three floors down. Strictly for research.",
    "Pip would like you to know that the garden is worth the trip.",
  ];
  status.textContent = messages[chirps++ % messages.length];
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    status.textContent = "";
  }, 5000);
}

window.addEventListener("scroll", scheduleUpdate, { passive: true });
window.addEventListener("resize", measure);
window.addEventListener("pageshow", measure);
document.addEventListener("visibilitychange", scheduleUpdate);
reducedMotion.addEventListener("change", respectMotion);
motionButton.addEventListener("click", toggleMotion);
canary.addEventListener("click", greetCanary);
const resizeObserver = new ResizeObserver(measure);
resizeObserver.observe(document.querySelector("main"));
document.fonts.ready.then(() => {
  if (!disposed) measure();
});
measure();
setMotion(paused);

// Async IIFE, not top-level await: Vite production builds silently never
// resolve a top-level `await app.init()` (works in dev only).
(async () => {
  try {
    const { createWorkshop } = await import("./workshop.js");
    const workshop = await createWorkshop(
      document.querySelector("#mine"),
      updateHotspots,
    );
    if (disposed) {
      workshop.destroy();
      return;
    }
    scene = workshop;
    update();
    motionButton.hidden = false;
    root.dataset.scene = "ready";
  } catch (error) {
    root.dataset.scene = "fallback";
    document.querySelector("#mine").hidden = true;
    console.warn(
      "The mine illustration is unavailable; navigation remains accessible.",
      error,
    );
  }
})();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    clearTimeout(messageTimer);
    resizeObserver.disconnect();
    window.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", measure);
    window.removeEventListener("pageshow", measure);
    document.removeEventListener("visibilitychange", scheduleUpdate);
    reducedMotion.removeEventListener("change", respectMotion);
    motionButton.removeEventListener("click", toggleMotion);
    canary.removeEventListener("click", greetCanary);
    scene?.destroy();
  });
}
