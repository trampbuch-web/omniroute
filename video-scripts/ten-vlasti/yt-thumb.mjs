// YouTube thumbnail (1280×720) from a landscape episode page: a clean frame plus a big title.
// Usage: node yt-thumb.mjs <episode-dir> <second> "<big line>" "<small line>" "<brand>"
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const [dir, t, big, small, brand] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(pathToFileURL(path.resolve(dir, "episode.html")).href + "?capture");
await p.evaluate((t) => window.render(t), +t);
await p.evaluate(([big, small, brand]) => {
  for (const id of ["caps", "capbg", "brand", "epi", "place", "stamp", "src", "prog", "chap", "title"]) {
    const e = document.getElementById(id);
    if (e) e.style.display = "none";
  }
  const o = document.createElement("div");
  o.style.cssText = "position:fixed;inset:0;z-index:99;font-family:'DejaVu Sans',Arial;pointer-events:none;background:linear-gradient(0deg,rgba(0,0,0,.9) 0%,rgba(0,0,0,.6) 30%,rgba(0,0,0,0) 52%)";
  o.innerHTML = `<div style="position:absolute;left:50%;transform:translateX(-50%);top:40px;padding:10px 24px;background:rgba(0,0,0,.7);border:4px solid #e2b25a;color:#e2b25a;font-size:44px;font-weight:900;letter-spacing:8px">${brand}</div>
    <div style="position:absolute;left:0;right:0;text-align:center;bottom:150px;color:#fff;font-size:118px;line-height:1.02;font-weight:900;text-shadow:0 6px 24px #000">${big}</div>
    <div style="position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;bottom:50px;padding:10px 26px;background:#e3262f;color:#fff;font-size:54px;font-weight:900;letter-spacing:3px">${small}</div>`;
  document.body.appendChild(o);
}, [big, small, brand]);
await p.screenshot({ path: path.join(dir, "yt-thumb-full.png") });
await b.close();
