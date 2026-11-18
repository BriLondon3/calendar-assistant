// Records the homepage review demo into public/demo/review-demo.gif.
// Usage: start the app (pnpm dev or pnpm start), then:
//   node scripts/record-demo-gif.mjs [http://localhost:3000]
// Needs Playwright (npx playwright install chromium) and ffmpeg on your PATH.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.argv[2] || 'http://localhost:3000';
const out = 'public/demo';
const width = 1280;
const height = 860;
const videoDir = mkdtempSync(join(tmpdir(), 'demo-video-'));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: videoDir, size: { width, height } } });
const page = await context.newPage();
await page.goto(url);
// Hide the stickers and controls, then crop the video to the demo window.
await page.addStyleTag({ content: '.lp-sticker, .demo-controls { display: none !important; } html { scroll-behavior: auto !important; }' });
await page.locator('.demo-window').evaluate(el => el.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(300);
const box = await page.locator('.demo-window').boundingBox();
const pad = 14;
const crop = [box.width + pad * 2, box.height + pad * 2, box.x - pad, box.y - pad].map(n => Math.round(n)).map(n => n - (n % 2)).join(':');
await page.evaluate(() => document.querySelector('[aria-label="Restart demo"]').click());
await page.waitForTimeout(19500);
await context.close();
await browser.close();

const video = join(videoDir, readdirSync(videoDir)[0]);
const skip = 0.6;
mkdirSync(out, { recursive: true });
execFileSync('ffmpeg', ['-y', '-ss', String(skip), '-t', '18.6', '-i', video,
  '-vf', `crop=${crop},fps=10,scale=760:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
  '-loop', '0', join(out, 'review-demo.gif')], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-ss', String(skip), '-t', '18.6', '-i', video, '-an', '-vf', `crop=${crop},scale=1100:-2`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(out, 'review-demo.mp4')], { stdio: 'inherit' });
rmSync(videoDir, { recursive: true, force: true });
console.log(`Saved ${out}/review-demo.gif and ${out}/review-demo.mp4`);
