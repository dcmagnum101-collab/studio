'use strict';

const path = require('path');
const fs = require('fs');

async function generateIcons() {
  // Dynamic import for sharp (ESM/CJS compatibility)
  const sharp = require('sharp');

  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const size = 1024;

  // Build SVG for the icon
  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="grad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#C800FF"/>
      <stop offset="100%" stop-color="#6B00B6"/>
    </radialGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Black background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}" fill="#0A0A0A"/>

  <!-- Glowing circle -->
  <circle
    cx="${size / 2}"
    cy="${size / 2}"
    r="${size * 0.38}"
    fill="url(#grad)"
    filter="url(#glow)"
    opacity="0.9"
  />

  <!-- "M" lettermark -->
  <text
    x="${size / 2}"
    y="${size * 0.645}"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif"
    font-weight="700"
    font-size="${size * 0.42}"
    fill="#FFFFFF"
    letter-spacing="-8"
  >M</text>
</svg>`;

  const sourcePng = path.join(assetsDir, 'icon-source.png');

  console.log('Generating icon-source.png (1024x1024)...');
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(sourcePng);

  console.log(`Saved: ${sourcePng}`);

  // Generate .icns using png2icons
  console.log('Generating icon.icns...');
  try {
    const png2icons = require('png2icons');
    const input = fs.readFileSync(sourcePng);
    const icns = png2icons.createICNS(input, png2icons.BILINEAR, 0);
    if (icns) {
      const icnsPath = path.join(assetsDir, 'icon.icns');
      fs.writeFileSync(icnsPath, icns);
      console.log(`Saved: ${icnsPath}`);
    } else {
      console.warn('png2icons returned null — skipping .icns (electron-builder can auto-generate from PNG)');
      // Fallback: copy PNG as icon.png for electron-builder auto-conversion
      fs.copyFileSync(sourcePng, path.join(assetsDir, 'icon.png'));
      console.log('Saved fallback: assets/icon.png');
    }
  } catch (err) {
    console.warn('png2icons error:', err.message);
    fs.copyFileSync(sourcePng, path.join(assetsDir, 'icon.png'));
    console.log('Saved fallback: assets/icon.png');
  }

  console.log('Icon generation complete.');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
