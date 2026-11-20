# YouTube 16:9 version of a built «Тень власти» episode (the episode must be built with "wide": true).
# Usage: python3 yt.py <episode-dir>  -> <episode-dir>/ten-vlasti-<name>-16x9.mp4
# The vertical film sits in the centre over a blurred copy of itself; chapter list, stamps, sources and
# captions are drawn by wide.html as transparent overlay frames, one per change, timed with ffmpeg concat.
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
EP_DIR = os.path.abspath(sys.argv[1])
name = os.path.basename(EP_DIR)
src = os.path.join(EP_DIR, f"ten-vlasti-{name}.mp4")
page = open(os.path.join(EP_DIR, "episode.html")).read()
ep = json.loads(re.search(r"const EP = (\{.*?\});\n", page, re.S).group(1))
meta = json.load(open(os.path.join(EP_DIR, "episode.json")))
ep["subtitle"] = meta.get("subtitle", "")
assert ep.get("wide"), "build the episode with \"wide\": true first"

# change points: scene cuts, caption chunks, line ends, the end card
pts = {0.0, ep["out0"], ep["D"]}
for s in ep["scenes"]:
    pts.add(s["t0"])
    for l in s["lines"]:
        pts.add(l["t1"] + 0.2)
        for c in l["chunks"]:
            pts.add(c["t0"])
pts = sorted(p for p in pts if 0 <= p <= ep["D"])

ov_dir = os.path.join(EP_DIR, "ov")
os.makedirs(ov_dir, exist_ok=True)
html = os.path.join(ov_dir, "wide.html")
open(html, "w").write(open(os.path.join(HERE, "wide.html")).read().replace("__EP__", json.dumps(ep, ensure_ascii=False)))
js = f"""
const {{ chromium }} = require("playwright");
(async () => {{
  const b = await chromium.launch(); const p = await b.newPage({{ viewport: {{ width: 1920, height: 1080 }} }});
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://{html}");
  const pts = {json.dumps(pts)};
  for (let i = 0; i < pts.length - 1; i++) {{
    await p.evaluate((t) => window.render(t), (pts[i] + pts[i + 1]) / 2);
    await p.screenshot({{ path: `{ov_dir}/f${{String(i).padStart(5, "0")}}.png`, omitBackground: true }});
  }}
  if (errs.length) throw new Error(errs.join("\\n"));
  await b.close();
}})();
"""
subprocess.run(["node", "-e", js], check=True)
lst = os.path.join(ov_dir, "list.txt")
with open(lst, "w") as f:
    for i in range(len(pts) - 1):
        f.write(f"file 'f{i:05d}.png'\nduration {pts[i + 1] - pts[i]:.3f}\n")
    f.write(f"file 'f{len(pts) - 2:05d}.png'\n")
out = os.path.join(EP_DIR, f"ten-vlasti-{name}-16x9.mp4")
fc = ("[0:v]split[a][b];[a]scale=1920:-2,crop=1920:1080,boxblur=28:2,eq=brightness=-0.32:saturation=0.75[bg];"
      "[b]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0[base];[1:v]fps=25,format=rgba[ov];[base][ov]overlay=0:0:shortest=1[v]")
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-f", "concat", "-safe", "0", "-i", lst, "-filter_complex", fc,
                "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "25",
                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
subprocess.run(["rm", "-rf", ov_dir], check=True)
# YouTube chapters for the description
chap = [(s["t0"], s["chapter"]) for s in ep["scenes"] if s.get("chapter")]
with open(os.path.join(EP_DIR, "chapters.txt"), "w") as f:
    for i, (t, c) in enumerate(chap):
        t = 0 if i == 0 else t
        f.write(f"{int(t // 60)}:{int(t % 60):02d} {c}\n")
print("done:", out)
