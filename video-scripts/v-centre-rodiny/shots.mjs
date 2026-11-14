// Screenshots of a vertical episode page at given times: node shots.mjs page.html out-prefix t1 t2 ...
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const [html, out, ...ts] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(pathToFileURL(path.resolve(html)).href + "?capture");
for (const t of ts) {
  await p.evaluate((t) => window.render(t), +t);
  await p.screenshot({ path: `${out}-${t}.jpg`, quality: 70 });
}
console.log("errors:", errs);
await b.close();
