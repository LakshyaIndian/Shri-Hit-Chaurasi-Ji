/**
 * Generates PWA PNG icons from an inline SVG using Playwright.
 * Run once: node generate-icons.js
 * Output: icon-512.png, icon-192.png, apple-touch-icon.png
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname);

// The icon SVG — a professional open-book design with saffron theme.
// Designed to read cleanly at both 512px and 48px.
const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="SIZE" height="SIZE">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#EA7400"/>
      <stop offset="100%" stop-color="#7E2600"/>
    </linearGradient>
    <linearGradient id="pageL" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%"   stop-color="#FFE8C0"/>
      <stop offset="100%" stop-color="#FFFCF2"/>
    </linearGradient>
    <linearGradient id="pageR" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#FFE8C0"/>
      <stop offset="100%" stop-color="#FFF4E0"/>
    </linearGradient>
    <filter id="bookShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Subtle inner vignette for depth -->
  <radialGradient id="vign" cx="50%" cy="50%" r="70%">
    <stop offset="60%" stop-color="transparent"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.18)"/>
  </radialGradient>
  <rect width="512" height="512" fill="url(#vign)"/>

  <!-- ── Book ─────────────────────────────────────────── -->
  <g filter="url(#bookShadow)">
    <!-- Left page -->
    <path d="M62,104 L242,128 L242,404 L62,380 Z" fill="url(#pageL)"/>
    <!-- Right page -->
    <path d="M450,104 L270,128 L270,404 L450,380 Z" fill="url(#pageR)"/>
  </g>

  <!-- Top binding arc -->
  <path d="M62,104 Q256,72 450,104"
        fill="none" stroke="#5C1A00" stroke-width="10" stroke-linecap="round"/>

  <!-- Bottom binding arc -->
  <path d="M62,380 Q256,408 450,380"
        fill="none" stroke="#5C1A00" stroke-width="10" stroke-linecap="round"/>

  <!-- Spine -->
  <rect x="242" y="118" width="28" height="292" fill="#5C1A00" rx="5"/>

  <!-- Spine highlight (left edge) -->
  <rect x="242" y="118" width="5" height="292" fill="rgba(255,200,100,0.18)" rx="2"/>

  <!-- ── Left page — big "श्री" ─────────────────────── -->
  <text x="152" y="300"
        font-family="serif"
        font-size="130"
        fill="#6B2000"
        text-anchor="middle"
        font-weight="bold">श्री</text>

  <!-- ── Right page — ruled lines ──────────────────── -->
  <rect x="292" y="178" width="134" height="7" rx="3.5" fill="#B86020" opacity="0.50"/>
  <rect x="292" y="218" width="134" height="7" rx="3.5" fill="#B86020" opacity="0.50"/>
  <rect x="292" y="258" width="134" height="7" rx="3.5" fill="#B86020" opacity="0.50"/>
  <rect x="292" y="298" width="134" height="6" rx="3"   fill="#B86020" opacity="0.42"/>
  <rect x="292" y="336" width="106" height="6" rx="3"   fill="#B86020" opacity="0.34"/>
  <rect x="292" y="372" width="76"  height="5" rx="2.5" fill="#B86020" opacity="0.24"/>

  <!-- ── Decorative dots at spine bottom ───────────── -->
  <circle cx="256" cy="422" r="7"  fill="rgba(255,200,100,0.50)"/>
  <circle cx="256" cy="440" r="4"  fill="rgba(255,200,100,0.30)"/>
</svg>
`;

async function renderIcon(size) {
  const svg = ICON_SVG.replace(/SIZE/g, String(size));
  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <style>
    * { margin:0; padding:0; }
    html, body { width:${size}px; height:${size}px; overflow:hidden; background:transparent; }
  </style>
</head>
<body>${svg}</body>
</html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(200);

  const buffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: false,
  });
  await browser.close();
  return buffer;
}

(async () => {
  console.log('Generating icons…');

  const buf512 = await renderIcon(512);
  fs.writeFileSync(path.join(OUT_DIR, 'icon-512.png'), buf512);
  console.log('✓ icon-512.png');

  const buf192 = await renderIcon(192);
  fs.writeFileSync(path.join(OUT_DIR, 'icon-192.png'), buf192);
  console.log('✓ icon-192.png');

  // iOS apple-touch-icon is 180×180
  const buf180 = await renderIcon(180);
  fs.writeFileSync(path.join(OUT_DIR, 'apple-touch-icon.png'), buf180);
  console.log('✓ apple-touch-icon.png');

  console.log('All icons generated.');
})();
