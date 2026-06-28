#!/usr/bin/env node
/* ============================================================================
 * render.js — turn a storyboard.json into a polished MP4.
 *   node render.js <storyboard.json> [out.mp4] [--audio path] [--scale 1]
 * Pipeline: build self-contained HTML → Puppeteer seeks each frame →
 * JPEG buffers piped straight into ffmpeg → H.264 mp4.
 * Deterministic: every pixel is a pure function of the frame index.
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

const args = process.argv.slice(2);
const sbPath = args[0];
if (!sbPath) { console.error('usage: node render.js <storyboard.json> [out.mp4] [--audio f] [--scale n] [--fps n]'); process.exit(1); }
const outPath = (args[1] && !args[1].startsWith('--')) ? args[1] : 'video.mp4';
const getFlag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const audio = getFlag('--audio', null);
const scale = parseFloat(getFlag('--scale', '1'));
const cliFps = getFlag('--fps', null);

const ENGINE = __dirname;
const sb = JSON.parse(fs.readFileSync(sbPath, 'utf8'));
const FPS = parseInt(cliFps || sb.fps || 30, 10);

/* ---- assemble a single self-contained HTML document ---------------------- */
function dataURI(file, mime) {
  const b = fs.readFileSync(path.join(ENGINE, file));
  return `data:${mime};base64,${b.toString('base64')}`;
}
let css = fs.readFileSync(path.join(ENGINE, 'tokens.css'), 'utf8');
// inline fonts as base64 so rendering never touches the filesystem/network
css = css.replace(/url\('\.\/fonts\/Inter\.woff2'\)/, `url('${dataURI('fonts/Inter.woff2', 'font/woff2')}')`);
css = css.replace(/url\('\.\/fonts\/InterTight\.woff2'\)/, `url('${dataURI('fonts/InterTight.woff2', 'font/woff2')}')`);
// apply theme overrides → :root vars
let themeCSS = '';
if (sb.theme) { themeCSS = ':root{' + Object.entries(sb.theme).map(([k, v]) => `--${k}:${v};`).join('') + '}'; }

const engineJS = fs.readFileSync(path.join(ENGINE, 'engine.js'), 'utf8');
const scenesJS = fs.readFileSync(path.join(ENGINE, 'scenes.js'), 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}\n${themeCSS}</style></head>
<body><div id="stage"></div>
<script>window.__FPS__=${FPS};</script>
<script>${scenesJS}</script>
<script>${engineJS}</script>
<script>window.__SB__=${JSON.stringify(sb)};</script>
</body></html>`;

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb',
           '--hide-scrollbars', '--disable-gpu', '--font-render-hinting=none']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: scale });
  page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(async () => { await window.__boot(window.__SB__); });
  await page.waitForFunction('window.__READY__ === true', { timeout: 20000 });
  const total = await page.evaluate(() => window.__TOTAL_FRAMES__);
  const dur = (total / FPS).toFixed(1);
  console.log(`Rendering ${total} frames @ ${FPS}fps  (~${dur}s)  scale=${scale}`);

  /* ffmpeg: receive jpeg frames on stdin, optional audio, emit mp4 ---------- */
  const ff = ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (audio) ff.push('-i', audio, '-shortest', '-c:a', 'aac', '-b:a', '160k');
  ff.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
          '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outPath);
  const enc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });

  for (let f = 0; f < total; f++) {
    await page.evaluate(F => window.__seek(F), f);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`\r  frame ${f}/${total}`);
  }
  enc.stdin.end();
  process.stdout.write(`\r  frame ${total}/${total}\n`);
  await new Promise(res => enc.on('close', res));
  await browser.close();
  console.log('✓ wrote', outPath);
})().catch(e => { console.error(e); process.exit(1); });
