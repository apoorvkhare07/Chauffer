import React from 'react';
import BrandIcon from './BrandIcon.jsx';
import BrandLogo from './BrandLogo.jsx';
import FashionLoader from './FashionLoader.jsx';
import './brand-assets.css';
export default function BrandAssetsPreview(){return <main className="brand-assets"><header><BrandLogo/><a href="/">Back to website ↗</a></header><h1>Brand assets</h1><p>One identity. Three reusable pieces. <a href="/brand/chauffer-brand-assets.zip" download>Download the full asset kit ↓</a></p><div className="brand-assets-grid">
<section><h2>01 · Brand Icon</h2><div className="brand-asset-stage"><BrandIcon size={100}/></div><p>A still shopping bag. Six spokes gently rotating inside.</p><div><a href="/brand/chauffer-icon-animated.svg" download>Animated SVG ↓</a><a href="/brand/chauffer-icon.svg" download>Static SVG ↓</a></div></section>
<section><h2>02 · Full Logo</h2><div className="brand-asset-stage"><BrandLogo/></div><p>The icon with the Inter wordmark and blue full stop.</p><div><a href="/brand/chauffer-logo-animated.svg" download>Animated SVG ↓</a><a href="/brand/chauffer-logo.svg" download>Static SVG ↓</a></div></section>
<section><h2>03 · Fashion Loader</h2><div className="brand-asset-stage"><FashionLoader compact label="Getting things ready…"/></div><p>The six-feature animation for loading and other motion uses.</p><div><a href="/brand/chauffer-fashion-loader.svg" download>Animated SVG ↓</a><a href="/?preview=loader">Full preview ↗</a></div></section>
</div><p className="brand-assets-note">SVG files stay sharp at any size. Animated versions respect reduced-motion settings in browsers; use static files for print or apps that don’t support animation.</p></main>}
