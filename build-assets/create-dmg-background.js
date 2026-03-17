#!/usr/bin/env node
/**
 * Generates a DMG background image (660×400 @2x = 1320×800).
 * Outputs build-assets/dmg-background.png
 *
 * Requires: macOS with sips, or any PNG generator.
 * If you have a custom background, just place it at build-assets/dmg-background.png (1320×800px).
 *
 * This script generates a simple gradient background using Python's PIL if available,
 * or falls back to a solid color via sips.
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'dmg-background.png');

if (fs.existsSync(OUT)) {
  console.log('dmg-background.png already exists, skipping.');
  process.exit(0);
}

// Try Python Pillow
const pyScript = `
from PIL import Image, ImageDraw
import sys

w, h = 1320, 800
img = Image.new('RGB', (w, h), '#1E3A8A')
draw = ImageDraw.Draw(img)

# Gradient effect (simple horizontal bands)
for i in range(h):
  t = i / h
  r = int(30 + t * 10)
  g = int(58 + t * 5)
  b = int(138 - t * 20)
  draw.line([(0, i), (w, i)], fill=(r, g, b))

img.save(sys.argv[1])
print('Done')
`;

const pyResult = spawnSync('python3', ['-c', pyScript, OUT], { encoding: 'utf-8' });

if (pyResult.status === 0) {
  console.log('✅  dmg-background.png generated via Python PIL');
} else {
  // Fallback: create a 1320×800 solid color PNG using sips
  console.log('Python PIL not available, using solid color fallback...');
  // Create a minimal 1x1 PNG and scale it up
  const tmpPng = path.join(__dirname, '_tmp_1x1.png');
  // Write a minimal blue 1x1 PNG
  const bluePng = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
    '2e0000000c4944415478016360f8cfb0000000020001e221bc330000000049454e44ae426082',
    'hex'
  );
  fs.writeFileSync(tmpPng, bluePng);
  execSync(`sips -z 800 1320 "${tmpPng}" --out "${OUT}" --silent 2>/dev/null || cp "${tmpPng}" "${OUT}"`);
  fs.unlinkSync(tmpPng);
  console.log('✅  dmg-background.png generated (solid blue fallback)');
}
