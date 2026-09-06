import { Application, Assets, Graphics, Sprite } from "pixi.js";
import { getSceneLayout } from "./journey.js";

export async function createWorkshop(canvas, onLayout) {
  const app = new Application();
  try {
    await app.init({
      canvas,
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: false,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      autoStart: false,
      roundPixels: true,
      preference: ["webgl"],
    });

    // Pixi's EventSystem sets touch-action: none on the canvas, which blocks
    // touch scrolling on mobile. The scroll IS the interaction here, so allow
    // vertical panning again (must be after init — Pixi sets it inline).
    app.canvas.style.touchAction = "pan-y";
    app.stage.eventMode = "none";

    const [mineTexture, liftTexture] = await Promise.all(
      ["pixel-mine.svg", "pixel-lift.svg"].map((name) =>
        Assets.load({
          src: `${import.meta.env.BASE_URL}assets/${name}`,
          data: { resolution: 1 },
        }),
      ),
    );
    mineTexture.source.scaleMode = "nearest";
    liftTexture.source.scaleMode = "nearest";
    const mine = new Sprite({ texture: mineTexture, roundPixels: true });
    const cable = new Graphics().rect(0, 0, 1, 1).fill(0x9ba7ae);
    const lift = new Sprite({
      texture: liftTexture,
      anchor: 0.5,
      roundPixels: true,
    });
    app.stage.addChild(mine, cable, lift);

    const sparks = Array.from({ length: 12 }, () => {
      const spark = new Graphics().rect(0, 0, 1, 1).fill(0xf0ca7e);
      app.stage.addChild(spark);
      return spark;
    });
    let layout = getSceneLayout(innerWidth, innerHeight, 0);
    let elapsed = 0;

    function animate() {
      sparks.forEach((spark, index) => {
        const { artX, artWidth, pixelScale } = layout;
        const step = Math.floor(elapsed * (1 + (index % 3)));
        spark.position.set(
          artX + ((index * 31 + Math.floor(step / 5)) % 256) * pixelScale,
          (((index * 59 - step * pixelScale) % innerHeight) + innerHeight) %
            innerHeight,
        );
        spark.scale.set(pixelScale);
        spark.visible =
          Math.floor(elapsed * 2 + index) % 5 < 2 &&
          spark.x > artX &&
          spark.x < artX + artWidth;
        spark.alpha = 0.5;
      });
    }

    app.ticker.maxFPS = 20;
    app.ticker.add((ticker) => {
      elapsed += ticker.deltaMS / 1000;
      animate();
    });

    return {
      update(progress, paused) {
        if (paused || document.hidden) app.stop();
        else app.start();
        if (
          app.screen.width !== innerWidth ||
          app.screen.height !== innerHeight
        )
          app.resize();
        layout = getSceneLayout(app.screen.width, app.screen.height, progress);
        mine.position.set(layout.artX, layout.artY);
        mine.scale.set(layout.pixelScale);
        lift.position.set(layout.liftX, layout.liftY);
        lift.scale.set(layout.pixelScale);
        const cableTop = layout.artY + 108 * layout.pixelScale;
        cable.position.set(layout.liftX, cableTop);
        cable.width = layout.pixelScale;
        cable.height = Math.max(
          0,
          layout.liftY - 16 * layout.pixelScale - cableTop,
        );
        animate();
        onLayout(layout);
        app.render();
      },
      destroy() {
        app.destroy(
          { removeView: false },
          { children: true, texture: true, textureSource: true },
        );
      },
    };
  } catch (error) {
    if (app.renderer) app.destroy({ removeView: false }, { children: true });
    throw error;
  }
}
