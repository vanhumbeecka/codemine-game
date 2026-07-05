# codemine-game

The landing page for [codemine.be](https://codemine.be) — a scroll-driven "code mining" scene. Dwarves mine languages (C#, TS, PY, …) in a dark shaft lit by torches, and scrolling the page drives the mine elevator down. Art direction: Spelunky 2-ish, but darker, with heavy torch light/shadow contrast.

The blog lives at [blog.codemine.be](https://blog.codemine.be) and is linked from the page.

## Stack

- [Vite](https://vite.dev) + vanilla JS (ES2022)
- [PixiJS v8](https://pixijs.com) for the canvas scene
- No frameworks, no scroll hijacking — real HTML sections scroll over a fixed canvas, and the canvas camera follows scroll progress

The shaft layout uses a seeded PRNG, so the scene is identical on every visit.

## Art credits

- Cave tileset & backgrounds: [Pixel Valley | Cave](https://kauzz.itch.io/kpc) by **Kauzz**
- Miner character: [16Bit Miner Animated Character](https://dkproductions.itch.io/16bit-miner-animated-character) by **Daniel Kole Productions**

The raw packs are not part of this repository (`data/` is gitignored); only the
sprite sheets used by the page are committed under `public/assets/`. Support the
artists via the links above.

## Development

```sh
npm install
npm run dev      # dev server
npm run build    # production build to dist/
```

## Deployment

Pushes to `main` build and deploy to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
