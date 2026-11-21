import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const [svg, png] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto("file://" + svg);
await p.screenshot({ path: png });
await b.close();
