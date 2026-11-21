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
  const [name, tag] = EP.title.split(" · ");
  const size = Math.min(120, 940 / ((name.length + 2) * 0.86)); // long titles shrink to one line
  c.innerHTML = `«${name.toUpperCase()}»` + (tag ? `<div style="font-size:48px;color:#e3262f;letter-spacing:8px;margin-top:10px">${tag.toUpperCase()}</div>` : "");
  c.style.cssText += `font-size:${size}px;color:#ffd98a;top:1500px;letter-spacing:4px`;
  for (const id of ["prog", "src"]) document.getElementById(id).style.display = "none";
  document.querySelectorAll("[id$=\"-big\"]").forEach((e) => (e.style.display = "none")); // scene numbers would clash with the title
}, +(process.argv[3] || 4.6));
await p.screenshot({ path: path.join(dir, "preview.png") });
await b.close();
console.log("preview:", path.join(dir, "preview.png"));
