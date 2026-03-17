#!/usr/bin/env node
/**
 * scripts/generate-dmg-bg.js
 * Renders build-assets/dmg-background.html to a 540x400 @2x PNG
 * using Puppeteer. Output: build-assets/dmg-background.png
 */

const path = require('path');
const fs = require('fs');

async function run() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (_) {
    console.warn('⚠  puppeteer not found — install it with: npm install --save-dev puppeteer');
    console.warn('   Skipping DMG background generation. A placeholder will be used.');
    return;
  }

  const htmlPath = path.join(__dirname, '../build-assets/dmg-background.html');
  const outPath = path.join(__dirname, '../build-assets/dmg-background.png');

  if (!fs.existsSync(htmlPath)) {
    console.error('❌  build-assets/dmg-background.html not found');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  const page = await browser.newPage();
  // 540x400 @2x = 1080x800 physical pixels
  await page.setViewport({ width: 540, height: 400, deviceScaleFactor: 2 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();

  console.log('✓ DMG background generated:', outPath);
}

run().catch(err => {
  console.error('Error generating DMG background:', err.message);
  process.exit(1);
});
