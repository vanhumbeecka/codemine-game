# codemine-game

The landing page for [codemine.be](https://codemine.be): scroll into a pixel-art underground workshop.

Five stops connect the surface, Andries’s workshop, the blog archive, the [3D Tetris arcade](https://3dtetris.codemine.be/), and a hidden garden. Direct links are always available in the header.

## Stack

- Vite + vanilla JavaScript
- PixiJS v8 for the pixel mine, miner’s lift, and drifting sparks
- Native HTML scrolling and navigation, with keyboard access, reduced motion, and a pause control
- Local fonts and a static illustration fallback when JavaScript or WebGL is unavailable

The camera and hotspots use the same responsive coordinates in `src/journey.js`. The active scene is `src/workshop.js`; `src/main.js` connects it to the page.

## Development

```sh
npm install
npm run dev
npm test
npm run test:e2e
npm run build
```

Browser tests use installed Google Chrome, build the production site, and serve it on port 4173. They exercise descent, navigation, the arcade, mobile layout, reduced motion, and the no-JavaScript fallback. Screenshots are written to `test-results/`.

## Art and fonts

The mine and lift are editable pixel SVGs, rendered at whole-number scale with nearest-neighbour sampling. See [art direction](docs/art-direction.md).

Pixelify Sans is served locally under the SIL Open Font License. Its license is included in `public/assets/`.

The retained cave tileset and backgrounds are [Pixel Valley | Cave](https://kauzz.itch.io/kpc) by **Kauzz**. They are not used by the workshop scene. The raw pack is not committed (`data/` is gitignored).

## Deployment

Pushes to `main` build and deploy to GitHub Pages via `.github/workflows/deploy.yml`. Vite uses a relative base for both the custom domain and repository subpaths.
