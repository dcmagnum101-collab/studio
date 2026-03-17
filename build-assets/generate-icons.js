#!/usr/bin/env node
/**
 * Generates icon.icns for the Monica AI Hub Electron app.
 * Requires: macOS with sips + iconutil (built-in), and icon.png at build-assets/icon.png
 *
 * Usage: node build-assets/generate-icons.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SOURCE_PNG = path.join(__dirname, 'icon.png');
const ICONSET_DIR = path.join(__dirname, 'icon.iconset');
const OUTPUT_ICNS = path.join(__dirname, 'icon.icns');

if (!fs.existsSync(SOURCE_PNG)) {
  console.error('❌  build-assets/icon.png not found.');
  console.error('   Create a 1024×1024 PNG with the Monica AI Hub logo and place it at build-assets/icon.png');
  process.exit(1);
}

// Create iconset directory
fs.mkdirSync(ICONSET_DIR, { recursive: true });

const sizes = [
  [16, 1], [16, 2],
  [32, 1], [32, 2],
  [128, 1], [128, 2],
  [256, 1], [256, 2],
  [512, 1], [512, 2],
];

console.log('Generating icon sizes...');
for (const [size, scale] of sizes) {
  const px = size * scale;
  const suffix = scale === 2 ? `@2x` : '';
  const outFile = path.join(ICONSET_DIR, `icon_${size}x${size}${suffix}.png`);
  execSync(`sips -z ${px} ${px} "${SOURCE_PNG}" --out "${outFile}" --silent`);
  console.log(`  ✓ ${size}x${size}${suffix} (${px}px)`);
}

console.log('Converting iconset to icns...');
execSync(`iconutil -c icns "${ICONSET_DIR}" -o "${OUTPUT_ICNS}"`);
fs.rmSync(ICONSET_DIR, { recursive: true });

console.log(`✅  Generated: ${OUTPUT_ICNS}`);
