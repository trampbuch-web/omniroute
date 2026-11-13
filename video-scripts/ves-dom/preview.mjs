// Cover 1080×1920 for an episode: the whole house with the hook, no captions. Usage: node preview.mjs <episode-dir>
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const dir = path.resolve(process.argv[2]);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(pathToFileURL(path.join(dir, "episode.html")).href + "?capture");
await p.evaluate(() => {
  window.render(0.9);
  for (const id of ["caps", "prog"]) document.getElementById(id).style.display = "none";
});
await p.screenshot({ path: path.join(dir, "preview.png") });
await b.close();
console.log("preview:", path.join(dir, "preview.png"));
