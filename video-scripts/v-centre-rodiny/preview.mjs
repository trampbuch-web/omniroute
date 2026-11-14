// Vertical Telegram/TikTok cover from a clean frame of the episode page.
// Usage: node preview.mjs <episode-dir> <time-s> "<date line>" "<headline html>" "tag1|tag2|tag3"
// Needs <episode-dir>/episode.html (python3 build.py <dir> --frames 1 makes it).
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const [dir, t, date, title, tags] = process.argv.slice(2);
const ep = path.resolve(dir);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(pathToFileURL(path.join(ep, "episode.html")).href + "?capture");
await p.evaluate((t) => {
  window.render(t);
  for (const id of ["caps", "card", "place", "brand", "credit"])
    document.getElementById(id).style.display = "none";
}, +t);
await p.screenshot({ path: path.join(ep, "frame.jpg"), quality: 92 });
const tagHtml = tags
  .split("|")
  .map((s) => `<span>${s}</span>`)
  .join("");
writeFileSync(
  path.join(ep, "preview.html"),
  `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;width:1080px;height:1920px;overflow:hidden;font-family:"DejaVu Sans",Arial,sans-serif}
.bg{position:absolute;inset:0;background:url(frame.jpg) center/cover}
.cover{position:absolute;left:0;right:0;top:0;height:640px;background:linear-gradient(#0b1030 55%,rgba(11,16,48,0))}
.bottom{position:absolute;left:0;right:0;bottom:0;height:820px;background:linear-gradient(rgba(0,0,0,0),#000 55%)}
.brand{position:absolute;left:60px;top:90px;background:#e3262f;color:#fff;font-weight:900;font-size:58px;letter-spacing:4px;padding:18px 30px;border-radius:14px}
.date{position:absolute;left:64px;top:220px;color:#fff;font-size:40px;font-weight:700;opacity:.85}
.foot{position:absolute;left:60px;right:60px;bottom:80px;display:flex;flex-direction:column;gap:34px}
.h{color:#fff;font-weight:900;font-size:88px;line-height:1.05;text-transform:uppercase;-webkit-text-stroke:3px #000;paint-order:stroke fill}
.h b{color:#ffd400}
.tags{display:flex;gap:14px;flex-wrap:wrap}
.tags span{background:#fff;color:#111;font-weight:900;font-size:32px;padding:10px 18px;border-radius:12px}
</style></head><body><div class="bg"></div><div class="cover"></div><div class="bottom"></div>
<div class="brand">В ЦЕНТРЕ РОДИНЫ</div><div class="date">${date}</div>
<div class="foot"><div class="h">${title}</div><div class="tags">${tagHtml}</div></div></body></html>`
);
await p.goto(pathToFileURL(path.join(ep, "preview.html")).href);
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(ep, "preview.png") });
await b.close();
for (const f of ["frame.jpg", "preview.html"]) unlinkSync(path.join(ep, f));
console.log("preview:", path.join(ep, "preview.png"));
