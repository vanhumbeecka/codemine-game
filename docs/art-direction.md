# Pixel workshop

A simple pixel-art cutaway connects the surface, workshop, archive, arcade, and garden. Flat colours, chunky tiles, tiny characters, square controls, and Pixelify Sans headings define the visual language.

User preference (2026-09-06): simple pixel design. The realistic storybook treatment was rejected; preserve this preference in future visual changes.

## Rendering decisions

- Normal HTML scrolling controls the camera. Section offsets, rather than assumed viewport heights, map to the five stops (0, 40, 120, 260, 500 metres).
- The 256 × 768 mine, 24 × 32 lift, and HTML hotspots share the coordinates in `MINE_ART` and `getSceneLayout`. The shaft centre is at x=140. Use integer scaling, rounded positions, and nearest-neighbour sampling to keep pixels crisp.
- Links, headings, and level navigation are HTML. The canvas is decorative and never intercepts touch scrolling.
- Reduced motion and the pause control stop ambient rendering; scrolling still moves the camera. Hidden tabs stop the ticker.
- A static pixel scene and all destination links remain available without JavaScript or WebGL.
- Renderer preference is `["webgl"]`: a string preference also permits PixiJS to fall through to WebGPU or Canvas. The no-WebGL browser test caught that distinction.
- Fonts are served locally; OFL licenses accompany them.

## Artwork

Active assets: `public/assets/pixel-mine.svg` and `public/assets/pixel-lift.svg`. These are authored from simple pixel shapes with reusable trees, lamps, crates, shelves, and plants. They contain no generated bitmap imagery.

## Earlier art study

The unused `public/assets/workshop-mine.jpg` was generated with the built-in image generation tool. Its prompt is retained below for provenance, not as direction for further work.

```text
Use case: illustration-story.
Asset type: production environment painting for a scroll-driven website. A single continuous very tall portrait illustration, 1024 x 3072.
Primary request: a delightful handcrafted underground workshop mine, seen straight on in architectural cutaway like a dollhouse. Polished editorial storybook gouache, paper grain, confident chunky shapes, sophisticated restrained details, no pixel art, no 3D render.
Composition: continuous vertical mine shaft centered at x=512 running from the surface to the bottom, with two narrow guide rails and EMPTY passage for an elevator to be animated in code. No elevator cages painted in. Rooms on both sides open onto this shaft. Image edges fade into near-black navy #101b22, no frame. FIVE distinctly spaced levels from top to bottom:
Top 0-600: dusky blue sky, tiny stars, pine trees, a little timber mining headframe and pulley, grassy surface, amber lit entrance, a tiny canary on a post. This is an inviting establishing scene.
600-1200: roots and timber beams, warmly lit inventor's workshop with a cluttered workbench, desk lamp, laptop, tools, copper pipes, coffee mug, a tiny seated miner in blue overalls.
1200-1800: cozy underground library with tall bookshelves, ladder, reading chair, hanging lamps and scattered books.
1800-2400: tiny underground arcade lounge with a single teal and burnt orange arcade cabinet with glowing colorful tetromino blocks on screen, a stool, cables, a small poster without readable text.
2400-3072: secret underground garden, small turquoise pool, ferns, luminous mushrooms, tiny amber lights, a bench, peaceful magical ending.
Color: midnight blue and slate rock, warm honey and copper wood, buttery yellow lights, dusty teal accents. Warm light pools in rooms; large areas of calm shadow. Make the timber tactile, slightly crooked, beautiful.
Constraints: no words, no typography, no logos, no watermark, no UI. Every level clearly distinguishable. Consistent scale and connected rails all the way down. Art must be detailed enough to reward exploration yet graphic and legible at website scale.
```

A separate elevator generation did not provide usable alpha transparency, including after a targeted correction. It was not shipped. Inspect alpha metadata before relying on generated sprite transparency.
