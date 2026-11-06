# Generates script.tsv + build.py for an episode from <dir>/spec.json, using the latest
# hand-made episode (2026-11-05) as the template. Usage: python3 gen.py <episode-dir>
# spec: {"ticker": [...], "scenes": [{"say": str, "who": "H"|"T", "type": ..., ...}], "drink_before": [i, ...]}
# scene types: title{sub} | head{tag,h2,big} | items{tag,items,ru} | stats{tag,stats:[[v,k],..],big} |
#              quote{text,hl,src} | final{}. Optional per scene: "pause" (s before it), "stand": true.
import html as H, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ep = sys.argv[1]
spec = json.load(open(os.path.join(ep, "spec.json")))
sc_ = spec["scenes"]
drink = set(spec.get("drink_before", []))
e = H.escape


def body(s):
    t = s["type"]
    if t == "title":
        return f'<h1 class="el" data-d="0.3">УДАР<br /><b>В МОЗГ</b></h1>\\n<div class="big muted el" data-d="1.4" style="margin-top: 30px">{e(s["sub"])}</div>'
    if t == "head":
        return (f'<div class="tag el" data-d="0">{e(s["tag"])}</div>\\n<h2 class="el" data-d="0.4">{e(s["h2"])}</h2>'
                + (f'\\n<div class="big el" data-d="2.0" style="margin-top: 30px">{s["big"]}</div>' if s.get("big") else ""))
    if t == "items":
        tag = (f'<div class="tag el" data-d="0" style="background: var(--gold); color: #111">{e(s["tag"])}</div>' if s.get("ru")
               else f'<div class="tag el" data-d="0">{e(s["tag"])}</div>')
        return tag + "".join(f'\\n<div class="item el" data-d="{0.8 + j * 1.8:.1f}"><span class="n">{j + 1:02d}</span>{e(x)}</div>' for j, x in enumerate(s["items"]))
    if t == "stats":
        st = "".join(f'\\n<div class="stat el" data-d="{0.4 + j * 2.4:.1f}"><div class="v">{e(v)}</div><div class="k">{e(k)}</div></div>' for j, (v, k) in enumerate(s["stats"]))
        return (f'<div class="tag el" data-d="0">{e(s["tag"])}</div>\\n<div class="stats">{st}\\n</div>'
                + (f'\\n<div class="big el" data-d="5.0" style="margin-top: 30px">{s["big"]}</div>' if s.get("big") else ""))
    if t == "quote":
        txt = e(s["text"]).replace(e(s["hl"]), f'<span class="hl">{e(s["hl"])}</span>') if s.get("hl") else e(s["text"])
        return f'<div class="quote el" data-d="0.4">«{txt}»</div>\\n<div class="src el" data-d="1.4">{e(s["src"])}</div>'
    if t == "final":
        return '<div class="big el" data-d="0.3" style="font-size: 50px; font-weight: 900">Берегите голову!</div>\\n<h1 class="el" data-d="1.2" style="margin-top: 44px; font-size: 90px">УДАР <b>В МОЗГ</b></h1>'
    raise SystemExit(f"unknown scene type {t}")


# a quote line (who=T) shares the slide of the line before it
groups, i = [], 0
while i < len(sc_):
    j = i + 1 if i + 1 < len(sc_) and sc_[i + 1].get("who") == "T" else i
    groups.append((i, j))
    i = j + 1
open(os.path.join(ep, "script.tsv"), "w").write("".join(f'{s.get("who", "H")}\t{s["say"]}\n' for s in sc_))

pause = {i: s.get("pause", 0.4) for i, s in enumerate(sc_) if i}
for i in drink:
    pause[i] = max(pause.get(i, 0), 1.6)  # silent sip before this line
scenes = ",\n".join(
    f" sc({a},{b},'{body(sc_[a])}'" + (', "scene ru"' if sc_[a].get("ru") else "") + ")" for a, b in groups)

GEST = {"title": "explain", "head": "open", "items": "explain", "stats": "count", "quote": "explain", "final": "wave"}
alt = ["open", "point", "both", "explain"]
gest = ['[0,"wave"]', '[G(0,2.6),"rest"]']
for k, s in enumerate(sc_[1:], 1):
    if k in drink:
        gest += [f'[G({k},-1.5),"drink"]', f'[G({k},-0.1),"rest"]']
    if s.get("who") == "T":
        gest.append(f'[G({k},-0.1),"rest"]')
        continue
    if s["type"] == "final":
        gest += [f'[G({k}),"wave"]', f'[G({k},2.6),"rest"]']
        continue
    g = GEST[s["type"]]
    gest.append(f'[G({k}),"{alt[k % 4] if g == "open" else g}"]')
gest += ['[round(D-1.1-1.0,2),"windup"]', '[round(D-1.1-0.4,2),"strike"]', '[round(D-1.1+0.8,2),"rest"]']
stand = ["[0,0]"]
for k, s in enumerate(sc_):
    if s.get("stand"):
        stand += [f"[G({k},-0.4),0]", f"[G({k},0.4),1]", f"[ends({k})-0.4,1]", f"[ends({k})+0.4,0]"]
cam = ["[0,1.28,470,420]", "[4,1,960,540]"]
for k, s in enumerate(sc_[1:], 1):
    if s["type"] == "stats":
        cam += [f"[G({k}),1.04,1360,400]", f"[ends({k}),1,960,540]"]
cam.append("[D,0.98,960,540]")

src = open(os.path.join(HERE, "2026-11-05", "build.py")).read()
src = re.sub(r"^PAUSE = \{.*\}$", "PAUSE = " + json.dumps(pause).replace('"', ""), src, count=1, flags=re.M)
i0 = src.index('scenes = "\\n".join([')
i1 = src.index("])\n", i0) + 3
src = src[:i0] + 'scenes = "\\n".join([\n' + scenes + "\n])\n" + src[i1:]
i0 = src.index("gest = [[0,")
i1 = src.index("js = f'''")
src = src[:i0] + f"gest = [{', '.join(gest)}]\nstand = [{', '.join(stand)}]\ncam = [{', '.join(cam)}]\n" + src[i1:]
i0 = src.index("<span>", src.index('<div class="run" id="run">'))
i1 = src.index("      \\2'''", i0)
tick = spec["ticker"] * 2
src = src[:i0] + "".join(f"<span>{e(x)}</span>\n        " for x in tick).rstrip() + "\n" + src[i1:]
open(os.path.join(ep, "build.py"), "w").write(src)
print(f"{ep}: {len(sc_)} lines, {len(groups)} slides")
