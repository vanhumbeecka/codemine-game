const DEPTHS = [0, 40, 120, 260, 500];
const ART_STOPS = [0.125, 0.3, 0.49, 0.685, 0.88];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const MINE_ART = {
  width: 256,
  height: 768,
  shaftX: 140,
  canary: { x: 183, y: 72 },
  arcade: { x: 78, y: 525 },
};

export function getJourney(scrollY, offsets) {
  if (offsets.at(-1) <= 0) return { progress: 0, depth: 0, stop: 0 };
  const position = clamp(scrollY, 0, offsets.at(-1));
  let index = 0;
  while (index < offsets.length - 2 && position >= offsets[index + 1]) index++;
  const distance = offsets[index + 1] - offsets[index];
  const fraction = distance > 0 ? (position - offsets[index]) / distance : 0;
  return {
    progress: (index + fraction) / (DEPTHS.length - 1),
    depth: Math.round(
      DEPTHS[index] + fraction * (DEPTHS[index + 1] - DEPTHS[index]),
    ),
    stop: Math.round(index + fraction),
  };
}

export function getSceneLayout(width, height, progress) {
  const mobile = width < 760;
  const desiredWidth = mobile
    ? Math.max(width * 1.12, height * 0.58)
    : Math.min(width * 0.65, height * 1.08);
  const pixelScale = Math.max(
    mobile ? 2 : 1,
    Math.round(desiredWidth / MINE_ART.width),
  );
  const artWidth = MINE_ART.width * pixelScale;
  const artHeight = artWidth * 3;
  const artX = Math.round(
    mobile ? (width - artWidth) / 2 : width * 0.73 - artWidth / 2,
  );
  const position = clamp(progress, 0, 1) * (ART_STOPS.length - 1);
  const index = Math.min(Math.floor(position), ART_STOPS.length - 2);
  const focus =
    ART_STOPS[index] +
    (ART_STOPS[index + 1] - ART_STOPS[index]) * (position - index);
  const center = height * (mobile ? 0.68 : 0.51);
  const artY = Math.round(center - focus * artHeight);
  return {
    artX,
    artY,
    artWidth,
    artHeight,
    pixelScale,
    liftX: artX + MINE_ART.shaftX * pixelScale,
    liftY: Math.round(
      Math.min(height * 0.84, Math.max(center + 38, artY + artHeight * 0.173)),
    ),
  };
}
