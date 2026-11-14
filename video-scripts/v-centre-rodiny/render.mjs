// Renders a vertical 1080×1920 episode page to MP4 frame by frame.
// Usage: node render.mjs page.html out.mp4 [fps]
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

// require() also finds a globally installed Playwright (NODE_PATH), ESM import does not
const { chromium } = createRequire(import.meta.url)("playwright");
const [html, out, fpsArg] = process.argv.slice(2);
const fps = Number(fpsArg || 25);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(pathToFileURL(path.resolve(html)).href + "?capture");
const duration = await page.evaluate(() => window.DURATION);
if (errors.length) throw new Error(errors.join("\n"));
const ff = spawn(
  "ffmpeg",
  [
    "-y",
    "-v",
    "error",
    "-f",
    "image2pipe",
    "-framerate",
    String(fps),
    "-i",
    "-",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "21",
    "-preset",
    "veryfast",
    out,
  ],
  { stdio: ["pipe", "inherit", "inherit"] }
);
const frames = Math.round(duration * fps);
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.render(t), i / fps);
  const buf = await page.screenshot({ type: "jpeg", quality: 90 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await new Promise((r, j) =>
  ff.on("close", (c) => (c === 0 ? r() : j(new Error(`ffmpeg exit ${c}`))))
);
await browser.close();
if (errors.length) throw new Error(errors.join("\n"));
console.log("rendered", frames, "frames");
