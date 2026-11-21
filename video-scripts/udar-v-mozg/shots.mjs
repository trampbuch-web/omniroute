import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const [html, out, ...ts] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + html + "?capture");
for (const t of ts) {
  await p.evaluate((t) => window.render(t), +t);
  await p.screenshot({ path: `${out}-${t}.jpg`, quality: 70 });
}
console.log("errors:", errs);
await b.close();
