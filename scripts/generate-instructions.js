#!/usr/bin/env node
/**
 * scripts/generate-instructions.js
 * Renders the Monica AI Hub setup instructions as a PDF.
 * Output: dist/Monica AI Hub — Setup Instructions.pdf
 *
 * Runs automatically via "postdist" in package.json.
 */

const path = require('path');
const fs = require('fs');

const HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  @page { margin: 0; size: letter; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Helvetica Neue', sans-serif;
    background: white; color: #1e293b; padding: 60px;
  }
  .header {
    background: #1E3A8A; color: white;
    margin: -60px -60px 48px; padding: 40px 60px;
    display: flex; align-items: center; gap: 20px;
  }
  .logo { font-size: 40px; color: #A88A2A; }
  .header h1 { font-size: 26px; font-weight: 700; }
  .header p { font-size: 13px; opacity: 0.6; margin-top: 4px; }
  h2 {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: #A88A2A; margin-bottom: 16px;
  }
  .step {
    display: flex; gap: 16px; margin-bottom: 20px;
    align-items: flex-start;
  }
  .num {
    width: 32px; height: 32px; border-radius: 50%;
    background: #1E3A8A; color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
    line-height: 32px; text-align: center;
  }
  .step-content strong { font-size: 15px; display: block; margin-bottom: 4px; }
  .step-content p { font-size: 13px; color: #64748b; line-height: 1.5; }
  em { font-style: normal; font-weight: 600; color: #1e293b; }
  .warning {
    background: #FFF7ED; border: 1px solid #FED7AA;
    border-radius: 10px; padding: 16px 20px; margin: 24px 0;
  }
  .warning strong { color: #C2410C; display: block; margin-bottom: 6px; font-size: 13px; }
  .warning p { font-size: 13px; color: #9A3412; line-height: 1.5; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }
  .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; }
  .contact-box {
    background: #F8FAFC; border-radius: 10px;
    padding: 20px; display: flex; gap: 24px;
    margin-top: 24px;
  }
  .contact-box div { flex: 1; }
  .contact-box strong {
    font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.05em; color: #94a3b8;
    display: block; margin-bottom: 4px;
  }
  .contact-box span { font-size: 14px; color: #1e293b; font-weight: 600; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">✦</div>
    <div>
      <h1>Monica AI Hub — Setup Guide</h1>
      <p>Your personal real estate command center</p>
    </div>
  </div>

  <h2>Installing Your App</h2>

  <div class="step">
    <div class="num">1</div>
    <div class="step-content">
      <strong>Open the file you received</strong>
      <p>Double-click the file named <em>Monica AI Hub.dmg</em> that was sent to you. A window will appear showing the app icon.</p>
    </div>
  </div>

  <div class="step">
    <div class="num">2</div>
    <div class="step-content">
      <strong>Drag the app to Applications</strong>
      <p>Click and drag the Monica AI Hub icon to the Applications folder shown in the same window. Wait for it to copy — this takes about 10 seconds.</p>
    </div>
  </div>

  <div class="step">
    <div class="num">3</div>
    <div class="step-content">
      <strong>Open your Applications folder and find Monica AI Hub</strong>
      <p>Open Finder → click <em>Applications</em> in the left sidebar → find Monica AI Hub.</p>
    </div>
  </div>

  <div class="step">
    <div class="num">4</div>
    <div class="step-content">
      <strong>Right-click the app and select Open</strong>
      <p>Do NOT double-click — right-click (or two-finger tap on trackpad) the Monica AI Hub icon and choose <em>Open</em> from the menu.</p>
    </div>
  </div>

  <div class="warning">
    <strong>⚠ Important — You will see a security warning the first time only</strong>
    <p>A message will appear saying the app is from an "unidentified developer." Click <strong>Open</strong> on that message. This only happens once — after that the app opens normally every time by double-clicking.</p>
  </div>

  <div class="step">
    <div class="num">5</div>
    <div class="step-content">
      <strong>Wait for the blue loading screen to finish</strong>
      <p>You will see a blue screen with a spinning circle for about 10–15 seconds. This is normal — the app is starting up. Do not click anything.</p>
    </div>
  </div>

  <div class="step">
    <div class="num">6</div>
    <div class="step-content">
      <strong>You're in! Your Hub will open automatically.</strong>
      <p>From now on, just double-click Monica AI Hub in your Applications folder to open it any time.</p>
    </div>
  </div>

  <hr class="divider">

  <h2>Need Help?</h2>
  <div class="contact-box">
    <div>
      <strong>Contact Derek</strong>
      <span>Frontline AI · FrontlineAIHub.com</span>
    </div>
    <div>
      <strong>For issues with</strong>
      <span>App not opening · Data not loading · Anything technical</span>
    </div>
  </div>

  <div class="footer">
    Monica AI Hub · Built exclusively for Monica Selvaggio · Century21 Americana · Nevada License S.0190894
  </div>
</body>
</html>`;

async function run() {
  const distDir = path.join(__dirname, '../dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  const outPath = path.join(distDir, 'Monica AI Hub — Setup Instructions.pdf');

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (_) {
    console.warn('⚠  puppeteer not found — install with: npm install --save-dev puppeteer');
    console.warn('   Skipping instruction PDF generation.');
    return;
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(HTML, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outPath,
    format: 'Letter',
    printBackground: true,
  });
  await browser.close();

  console.log('✓ Instructions PDF generated:', outPath);
}

run().catch(err => {
  console.error('Error generating instructions PDF:', err.message);
  process.exit(1);
});
