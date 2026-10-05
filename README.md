# Chauffeur

A Vite + React marketing website with a separately linked shopping demo.

## Run locally

From this folder, run `npm install` then `npm run dev`. Vite prints the local address. The default port is 5174; if that port is busy, use the address Vite prints.

- `/` — the public website. `App.jsx` and `main.jsx`.
- `/demo/` — the shopping demo. `ShoppingDemo.jsx` and `demo/main.jsx`.

These are separate HTML pages and React entry points. Website links can pass a sample request to `/demo/?q=...`. The demo's shopping state never runs on the website.

## Check and build

- `npm test` — catalogue/order rules and a homepage-render regression check.
- `npm run build` — builds both pages into `dist/` using the two entries in `vite.config.js`.

The demo contains eight fictional clothing items. No real purchases, live AI, store accounts, backend, voice or WhatsApp are connected. Preferences and orders last only until the demo page reloads.

The site uses original generated brand art (`public/images/style-gallery.jpg`). It is not product photography. Art direction and exact prompt live under `design/`. Fonts are self-hosted with their licenses under `public/fonts/`.

Hosting must use the project's Convex static hosting workflow. This iteration has not been deployed.
