#!/usr/bin/env node
/**
 * scripts/generate-icon.js
 * Renders a 1024x1024 app icon PNG using Puppeteer, then converts
 * it to icon.icns using macOS sips + iconutil.
 * Output: build-assets/icon.icns
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const iconHtml = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; }
  body {
    width: 1024px; height: 1024px;
    background: #1E3A8A;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .symbol {
    font-size: 560px;
    color: #A88A2A;
    font-family: -apple-system, 'SF Pro Display', sans-serif;
    font-weight: 800;
    line-height: 1;
    margin-top: 40px;
  }
</style>
</head>
<body>
  <div class="symbol">✦</div>
</body>
</html>`;

async function run() {
  const buildDir = path.join(__dirname, '../build-assets');
  const htmlPath = path.join(buildDir, 'icon-temp.html');
  const pngPath = path.join(buildDir, 'icon-base.png');
  const icnsPath = path.join(buildDir, 'icon.icns');
  const iconsetDir = path.join(buildDir, 'icon.iconset');

  // Skip if icns already exists and user hasn't forced regeneration
  if (fs.existsSync(icnsPath) && !process.env.FORCE_ICON) {
    console.log('✓ icon.icns already exists (set FORCE_ICON=1 to regenerate)');
    return;
  }

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (_) {
    console.warn('⚠  puppeteer not found — install with: npm install --save-dev puppeteer');
    console.warn('   Skipping icon generation.');
    return;
  }

  console.log('Rendering app icon...');
  fs.writeFileSync(htmlPath, iconHtml, 'utf-8');

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: pngPath, type: 'png' });
  await browser.close();
  fs.unlinkSync(htmlPath);
  console.log('✓ icon-base.png rendered');

  if (process.platform !== 'darwin') {
    console.log('ℹ  Not on macOS — skipping .icns conversion (run on Mac to generate icon.icns)');
    return;
  }

  // Generate iconset
  if (fs.existsSync(iconsetDir)) fs.rmSync(iconsetDir, { recursive: true });
  fs.mkdirSync(iconsetDir);

  const sizes = [16, 32, 64, 128, 256, 512];
  for (const size of sizes) {
    execSync(`sips -z ${size} ${size} "${pngPath}" --out "${iconsetDir}/icon_${size}x${size}.png" --silent`);
    execSync(`sips -z ${size * 2} ${size * 2} "${pngPath}" --out "${iconsetDir}/icon_${size}x${size}@2x.png" --silent`);
  }

  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
  fs.rmSync(iconsetDir, { recursive: true });

  console.log('✓ icon.icns generated:', icnsPath);
}

run().catch(err => {
  console.error('Error generating icon:', err.message);
  process.exit(1);
});
