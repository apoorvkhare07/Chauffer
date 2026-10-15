# Chauffer brand assets

Primary blue: `#2950B8`. Wordmark: **chauffer.**, Inter 600, dark ink with a blue full stop. The approved spelling is retained from the existing logo.

| Name | React source | Portable files in `public/brand/` |
| --- | --- | --- |
| Brand Icon | `BrandIcon.jsx` + `brand-icon.css` | `chauffer-icon.svg`, `chauffer-icon-animated.svg` |
| Full Logo | `BrandLogo.jsx` + `../brand-header.css` | `chauffer-logo.svg`, `chauffer-logo-animated.svg` |
| Fashion Loader | `FashionLoader.jsx` + `fashion-loader.css` | `chauffer-fashion-loader.svg` |

- Brand Icon: stationary outlined shopping bag; only the six spokes inside rotate, once every eight seconds. `animated={false}` produces the static version; `size` controls dimensions.
- Full Logo: icon plus Inter wordmark. Shared by website, app header and website footer. Root `Brand.jsx` re-exports the canonical component for compatibility.
- Fashion Loader: existing six-feature emerging/orbiting loop; keep it separate from the everyday logo. Use it for genuine loading states, or as a decorative asset without implying completed actions. Root `FashionLoader.jsx` re-exports the canonical component.
- All animations respect reduced-motion preferences. Full-logo SVG text is converted to vector outlines, so it needs no installed font. Inter's licence is in `public/fonts/inter-license.txt`.
- Browser favicon uses the static bag icon.

Preview and download: `/?preview=brand`. Full loader preview: `/?preview=loader`.

Regenerate icon/loader exports with `node scripts/export-brand-assets.mjs`. Then regenerate outlined wordmarks with `python scripts/export-brand-wordmark.py` in a Python environment containing `fonttools` and `brotli`. Keep React and exported SVG geometry in sync when changing the mark.

Loader timing: the centre icon keeps its original opening effect, then turns at a constant angular speed from 28% through 94% of the 6.8-second cycle, until the feature icons finish collapsing.
