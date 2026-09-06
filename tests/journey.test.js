import assert from "node:assert/strict";
import { test } from "node:test";
import { getJourney, getSceneLayout } from "../src/journey.js";

const stops = [0, 800, 1600, 2400, 3200];

test("the descent reaches each room at its actual scroll position", () => {
  const depths = [0, 40, 120, 260, 500];
  stops.forEach((scroll, index) => {
    const journey = getJourney(scroll, stops);
    assert.equal(journey.stop, index);
    assert.equal(journey.depth, depths[index]);
    assert.equal(journey.progress, index / 4);
  });
});

test("descent interpolates between rooms and reverses without accumulated state", () => {
  assert.equal(getJourney(1200, stops).depth, 80);
  assert.equal(getJourney(2000, stops).depth, 190);
  assert.equal(getJourney(1200, stops).depth, 80);
});

test("overscroll and a page without scrollable height stay within the mine", () => {
  assert.equal(getJourney(-200, stops).depth, 0);
  assert.equal(getJourney(4000, stops).depth, 500);
  assert.equal(getJourney(0, [0, 0, 0, 0, 0]).depth, 0);
});

test("responsive section heights do not change the room reached", () => {
  assert.equal(getJourney(1100, [0, 550, 1100, 1800, 2600]).depth, 120);
});

test("the painting and elevator share coordinates on desktop and mobile", () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [844, 390],
  ]) {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const layout = getSceneLayout(width, height, progress);
      assert.ok(layout.artWidth > 0);
      assert.ok(layout.liftX > 0 && layout.liftX < width);
      assert.ok(layout.liftY > 0 && layout.liftY < height);
      assert.equal(layout.liftX, layout.artX + (layout.artWidth * 140) / 256);
      assert.ok(Number.isFinite(layout.artY));
    }
  }
});

test("pixel artwork uses whole-number scaling and stays aligned to the pixel grid", () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 568],
    [844, 390],
  ]) {
    for (const progress of [0, 0.13, 0.5, 0.82, 1]) {
      const layout = getSceneLayout(width, height, progress);
      assert.equal(layout.artWidth % 256, 0);
      assert.equal(layout.artHeight, layout.artWidth * 3);
      for (const coordinate of [
        layout.artX,
        layout.artY,
        layout.liftX,
        layout.liftY,
      ]) {
        assert.equal(coordinate, Math.round(coordinate));
      }
    }
  }
});
