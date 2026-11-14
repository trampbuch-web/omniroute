// Renders <episode>-animation.html to MP4 frame by frame (EPISODE env, default hook-sleva).
// If add-audio.mjs was run first, uses its <episode>-timing.json and muxes <episode>-audio.m4a.
// Usage: node video-scripts/render-animation.mjs [out.mp4] [fps]
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

// require() also finds a globally installed Playwright (NODE_PATH), ESM import does not
const { chromium } = createRequire(import.meta.url)("playwright");

const dir = path.dirname(fileURLToPath(import.meta.url));
const ep = process.env.EPISODE || "hook-sleva";
const out = process.argv[2] || path.join(dir, `${ep}-animation.mp4`);
const fps = Number(process.argv[3] || 25);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(path.join(dir, `${ep}-animation.html`)).href + "?capture");
const timing = path.join(dir, `${ep}-timing.json`);
const audio = path.join(dir, `${ep}-audio.m4a`);
if (existsSync(timing)) {
  await page.evaluate((m) => window.setTimeMap(m), JSON.parse(readFileSync(timing, "utf8")));
}
const duration = await page.evaluate(() => window.DURATION);
const audioArgs = existsSync(audio) ? ["-i", audio, "-c:a", "copy", "-shortest"] : [];

const ff = spawn(
  "ffmpeg",
  [
    "-y",
    "-f",
    "image2pipe",
    "-framerate",
    String(fps),
    "-i",
    "-",
    ...audioArgs,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "20",
    "-preset",
    "veryfast",
    out,
  ],
  { stdio: ["pipe", "inherit", "inherit"] }
);

const frames = Math.round(duration * fps);
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.render(t), i / fps);
  const buf = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % (fps * 10) === 0) console.log(`frame ${i}/${frames}`);
}
ff.stdin.end();
await new Promise((r, j) =>
  ff.on("close", (c) => (c === 0 ? r() : j(new Error(`ffmpeg exit ${c}`))))
);
await browser.close();
console.log("done:", out);
