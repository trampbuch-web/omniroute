// Cover 1080×1920: a frame of the episode without captions. Usage: node preview.mjs <episode-dir> [time]
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const dir = path.resolve(process.argv[2]);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(pathToFileURL(path.join(dir, "episode.html")).href + "?capture");
await p.evaluate((t) => {
  window.render(t);
  const c = document.getElementById("caps");
  c.dataset.h = "";
  c.className = "";
  c.innerHTML = `«${EP.title.toUpperCase()}»`;
  c.style.cssText += "font-size:120px;color:#ffd98a;top:1500px;letter-spacing:4px";
  document.getElementById("prog").style.display = "none";
}, +(process.argv[3] || 4.6));
await p.screenshot({ path: path.join(dir, "preview.png") });
await b.close();
console.log("preview:", path.join(dir, "preview.png"));
