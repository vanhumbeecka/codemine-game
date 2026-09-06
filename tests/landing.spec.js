import { chromium, expect, test } from "@playwright/test";

test("visitors can descend, explore the arcade, and return to the surface", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good things lie beneath." }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-scene", "ready");
  const entryButton = await page
    .getByRole("link", { name: "Step inside" })
    .boundingBox();
  expect(entryButton.y + entryButton.height).toBeLessThan(
    page.viewportSize().height - 100,
  );
  await page.getByRole("button", { name: "Pause ambience" }).click();
  await expect(
    page.getByRole("button", { name: "Resume ambience" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: "test-results/desktop-surface.png" });
  await page.getByRole("link", { name: "Step inside" }).click();
  await expect(
    page.locator('[aria-label="Mine levels"] a[aria-current="step"]'),
  ).toHaveAttribute("href", "#about");
  await expect(page.locator("#depth-value")).toHaveText("040");
  await page.screenshot({ path: "test-results/desktop-workshop.png" });
  await page.getByRole("link", { name: "02 The archive" }).click();
  await expect(page.locator("#depth-value")).toHaveText("120");
  await page.screenshot({ path: "test-results/desktop-archive.png" });
  await page.getByRole("link", { name: "03 The arcade" }).click();
  await expect(
    page.locator('[aria-label="Mine levels"] a[aria-current="step"]'),
  ).toHaveAttribute("href", "#arcade");
  await expect(
    page.getByRole("link", { name: "Play 3D Tetris" }),
  ).toHaveAttribute("href", "https://3dtetris.codemine.be/");
  await expect(page.locator("#depth-value")).toHaveText("260");
  await expect(
    page.getByRole("link", { name: "Play at the arcade cabinet" }),
  ).toHaveAttribute("href", "https://3dtetris.codemine.be/");
  await page.screenshot({ path: "test-results/desktop-arcade.png" });
  await page.getByRole("link", { name: "04 The garden" }).click();
  await expect(page.locator("#depth-value")).toHaveText("500");
  await page.screenshot({ path: "test-results/desktop-garden.png" });
  await page.getByRole("link", { name: "Back to the surface" }).click();
  await expect(page.locator("#depth-value")).toHaveText("000");
  await page.getByRole("button", { name: "Say hello to the canary" }).click();
  await expect(page.getByRole("status")).toContainText("Pip");
  for (const message of errors) {
    expect(message).toMatch(
      /^\[\.WebGL-0x[0-9a-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels( \(this message will no longer repeat\))?$/,
    );
  }
});

test("small screens retain native scrolling and usable destinations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-scene", "ready");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("#mine")).toHaveCSS("touch-action", "pan-y");
  await page.screenshot({ path: "test-results/mobile-surface.png" });
  await page.getByRole("link", { name: "03 The arcade" }).click();
  await expect(
    page.getByRole("link", { name: "Play 3D Tetris" }),
  ).toBeInViewport();
  await expect(page.locator("#depth-value")).toHaveText("260");
  await page.screenshot({ path: "test-results/mobile-arcade.png" });
  await page.setViewportSize({ width: 320, height: 568 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("reduced motion disables ambient movement without disabling navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#blog");
  await expect(page.locator("html")).toHaveAttribute("data-scene", "ready");
  await expect(
    page.getByRole("button", { name: "Resume ambience" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#depth-value")).toHaveText("120");
  const still = await page.locator("#mine").screenshot();
  await page.waitForTimeout(150);
  expect(await page.locator("#mine").screenshot()).toEqual(still);
  await page.getByRole("link", { name: "03 The arcade" }).click();
  await expect(page.locator("#depth-value")).toHaveText("260");
});

test("content and destination links work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await expect(
    page.getByRole("heading", { name: "Good things lie beneath." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "03 The arcade" }).click();
  await expect(
    page.getByRole("link", { name: "Play 3D Tetris" }),
  ).toBeInViewport();
  await expect(
    page.getByRole("link", { name: "Read the blog" }),
  ).toHaveAttribute("href", "https://blog.codemine.be");
  await context.close();
});

test("native scrolling and keyboard shortcuts reach the content", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to the content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#depth-value")).toHaveText("040");
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(900, 350);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
});

test("a browser without WebGL retains the illustrated landing page and links", async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--disable-webgl"],
  });
  try {
    const page = await browser.newPage();
    const warnings = [];
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "warning") warnings.push(message.text());
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4173/");
    await expect(page.locator("html")).toHaveAttribute(
      "data-scene",
      "fallback",
    );
    await expect(page.locator(".scene-fallback")).toBeVisible();
    await page.getByRole("link", { name: "03 The arcade" }).click();
    await expect(
      page.getByRole("link", { name: "Play 3D Tetris" }),
    ).toBeInViewport();
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(
      "The mine illustration is unavailable; navigation remains accessible.",
    );
  } finally {
    await browser.close();
  }
});

test("llms.txt is published at the site root for language models", async ({
  request,
}) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toMatch(/^# Codemine\n/);
  expect(body).toContain("https://blog.codemine.be");
  expect(body).toContain("https://andries.codemine.be");
  expect(body).toContain("https://3dtetris.codemine.be/");
});
