"""Generic documentary-style story video. Usage (cwd = work dir with g00.mp3/json ...): python3 story.py spec.json out.mp4"""
import json, os, re, subprocess, sys, numpy as np
from PIL import Image, ImageDraw
from common import *

ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
ORANGE = (255, 150, 30)
AD_EVERY = 50.0
SPEC = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
L = SPEC["lines"]
EPS = {int(k): v for k, v in SPEC["episodes"].items()}
PAL = dict(blue=(20, 40, 70), navy=(18, 32, 55), green=(10, 55, 35), red=(110, 15, 20), dark=(28, 28, 38),
           purple=(45, 25, 70), amber=(60, 42, 18), teal=(10, 50, 60), steel=(25, 30, 45))

# ---- timeline: ad near every 50 s at a sentence boundary
clips = [load_audio(f"g{i:02d}.mp3") for i in range(len(L))]
starts, ads = [], []
cur, target = 0.8, AD_EVERY
for i, c in enumerate(clips):
    dur = len(c) / SR
    if cur + dur / 2 > target:
        ads.append(cur); cur += BANNER_DUR + 0.4; target += AD_EVERY
    if i and L[i]["ep"] != L[i - 1]["ep"]:
        cur += 0.5
    starts.append(cur); cur += dur + 0.35
total = cur + 1.6
ends = [s + len(c) / SR for s, c in zip(starts, clips)]
words = []
for i in range(len(L)):
    words += [w for w in words_from_alignment(f"g{i:02d}.json", 1.0, starts[i]) if not w[0].startswith("[")]
groups, g = [], []
for w in words:
    g.append(w)
    if len(g) == 3 or sum(len(x[0]) for x in g) > 16 or re.search(r"[.,?!:»—]$", w[0]):
        groups.append(g); g = []
if g: groups.append(g)

# scenes: a line with "scene" starts a new one; others inherit
scenes, scene_of = [], []
for i, ln in enumerate(L):
    if "scene" in ln or not scenes:
        scenes.append(dict(ln.get("scene", {}), start=starts[i], lines=[]))
    scenes[-1]["lines"].append(i); scene_of.append(len(scenes) - 1)
for sc in scenes:
    lt = [starts[i] for i in sc["lines"]]
    items = sc.get("items", [])
    sc["item_t"] = [lt[k] if k < len(lt) else lt[-1] + 0.7 * (k - len(lt) + 1) for k in range(len(items))]
    sc["end"] = ends[sc["lines"][-1]]
stamps = [(starts[i], ln["stamp"]) for i, ln in enumerate(L) if ln.get("stamp")]
whooshes = [sc["start"] for sc in scenes[1:]]
line_at = lambda t: max([i for i in range(len(L)) if starts[i] <= t] or [0])

# ---- audio (music kept quiet under the voice)
n = int(total * SR) + SR
voice = np.zeros(n, np.float32)
for c, st in zip(clips, starts): place(voice, c, st)
voice *= 0.85 / np.abs(voice).max()
tt = np.arange(n) / SR
rms = lambda x, r: x * (r / (np.sqrt(np.mean(x ** 2)) + 1e-9))
ep_start = {}
for i, ln in enumerate(L): ep_start.setdefault(ln["ep"], starts[i] - 0.6)
eps = sorted(ep_start); ep_start[eps[0]] = 0.0
bed = np.zeros(n, np.float32); XF = 1.2
for j, ep in enumerate(eps):
    lp = rms(load_audio(os.path.join(ASSETS, EPS[ep].get("music", "m1") + ".mp3")), 0.1)
    a0 = ep_start[ep]; a1 = ep_start[eps[j + 1]] + XF if j + 1 < len(eps) else total
    ln_ = int((a1 - a0) * SR)
    seg = np.tile(lp, ln_ // len(lp) + 1)[:ln_].copy(); x = np.arange(ln_) / SR
    seg *= np.minimum(1, x / (XF if j else 0.4)) * np.minimum(1, (ln_ / SR - x) / XF)
    place(bed, seg, a0)
duck = np.full(n, 0.55, np.float32)
for st, e in zip(starts, ends): duck[int(st * SR):int(e * SR)] = 0.2
for a_ in ads: duck[int(a_ * SR):int((a_ + BANNER_DUR) * SR)] = 0.08
duck = np.convolve(duck, np.ones(6000) / 6000, "same").astype(np.float32)
buf = voice + bed * duck * np.clip((total - tt) / 1.8, 0, 1).astype(np.float32)
_fx = {}


def fx(name):
    if name not in _fx:
        v = load_audio(os.path.join(ASSETS, f"fx_{name}.mp3")); _fx[name] = v * (0.6 / np.abs(v).max())
    return _fx[name]


GAIN = dict(impact=0.8, glitch=0.4, coins=0.5, phone=0.35, typing=0.3, siren=0.35, knock=0.7, gavel=0.7, riser=0.45, whoosh=0.5)
for i, ln in enumerate(L):
    for s in ln.get("sfx", []):
        place(buf, fx(s), starts[i] - (3.8 if s == "riser" else 0), GAIN.get(s, 0.5))
for w in whooshes: place(buf, fx("whoosh"), w - 0.4, GAIN["whoosh"])
write_wav("story.wav", buf)

# ---- visuals
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
vig = np.clip(1.15 - np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H * 0.42) / H) ** 2) * 1.5, 0, 1)[..., None]
_bg = {}
rng = np.random.default_rng(3)
digits = ["".join(rng.choice(list("0123456789ABCDEF"), 60)) for _ in range(28)]
speeds = rng.uniform(60, 180, 28)


def bgimg(name):
    if name not in _bg:
        _bg[name] = Image.fromarray((vig * np.array(PAL.get(name, PAL["dark"]), np.float32) + 4).astype(np.uint8)).convert("RGBA")
    return _bg[name].copy()


def ease(k): k = max(0.0, min(1.0, k)); return 1 - (1 - k) ** 3


def paste_c(im, e, cx, cy): im.alpha_composite(e, (int(cx - e.width / 2), int(cy - e.height / 2)))


def fit(d, text, size, maxw):
    while size > 30 and d.textlength(text, font=font(size)) > maxw: size -= 4
    return font(size)


def stamp(im, text, k):
    if k <= 0: return
    f = fit(ImageDraw.Draw(im), text, 96, 800)
    w = int(ImageDraw.Draw(im).textlength(text, font=f)) + 70
    lay = Image.new("RGBA", (w, 170), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    d.rounded_rectangle((5, 5, w - 6, 164), 18, outline=(230, 30, 40), width=10)
    d.text((w / 2, 86), text, font=f, fill=(230, 30, 40), anchor="mm")
    sc = 1.6 - 0.6 * ease(k * 3)
    lay = lay.resize((int(w * sc), int(170 * sc))).rotate(-10, expand=True, resample=Image.BICUBIC)
    paste_c(im, lay, W / 2, 800)


def draw_scene(im, sc, t):
    d = ImageDraw.Draw(im, "RGBA"); lt = t - sc["start"]; eff = sc.get("fx", "none")
    if eff == "rain":
        f = font(34, MONO)
        for k, (s, sp) in enumerate(zip(digits, speeds)):
            d.text((20 + k * 38, (t * sp + k * 97) % (H + 600) - 600), "\n".join(s[:14]), font=f, fill=(40, 90, 140, 160))
    elif eff == "alarm":
        im.alpha_composite(Image.new("RGBA", (W, H), (255, 0, 0, int(20 + 20 * (0.5 + 0.5 * np.sin(t * 8))))))
    elif eff in ("police", "glow"):
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
        if eff == "police":
            side = int(t * 3) % 2
            ld.rectangle((0, 0, 140, H), fill=(255, 30, 30, 70) if side else (30, 60, 255, 70))
            ld.rectangle((W - 140, 0, W, H), fill=(30, 60, 255, 70) if side else (255, 30, 30, 70))
        else:
            for r in range(6):
                g_ = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                ImageDraw.Draw(g_).ellipse((W / 2 - 300 - r * 40, 500 - r * 40, W / 2 + 300 + r * 40, 800 + r * 40), fill=(60, 140, 255, 14))
                lay.alpha_composite(g_)
        im.alpha_composite(lay); d = ImageDraw.Draw(im, "RGBA")
    items = sc.get("items", [])
    ey, es = (420, 150) if items else (650, 270)
    if eff == "rings":
        for r in range(3):
            rr = ((lt * 300 + r * 160) % 480) + 120
            d.ellipse((W / 2 - rr, ey - rr, W / 2 + rr, ey + rr), outline=(180, 120, 255, int(200 * (1 - (rr - 120) / 480))), width=6)
    if sc.get("emoji"):
        sh = int(10 * np.sin(t * 60)) if eff in ("shake", "rings") and (t * 2) % 2 < 1.2 else 0
        size = int(es * (0.6 + 0.4 * ease(lt / 0.3)))
        paste_c(im, emoji(sc["emoji"], max(size, 8)), W / 2 + sh, ey + 10 * np.sin(t * 1.8))
    if sc.get("big") and not items:
        k = ease(lt / 0.35); big = sc["big"]
        if sc.get("count"):
            a, b = sc["count"]; v = int(a + (b - a) * ease(lt / max(0.5, sc["end"] - sc["start"])))
            big = big.replace("{n}", f"{v:,}".replace(",", " "))
        f = fit(d, big, int(80 + 60 * k), 960)
        d.text((W / 2, 930), big, font=f, fill=ORANGE, anchor="mm", stroke_width=4, stroke_fill="black")
    if sc.get("sub") and not items:
        d.text((W / 2, 1040), sc["sub"], font=fit(d, sc["sub"], 42, 960), fill=(225, 225, 230), anchor="mm")
    for k, (it, st) in enumerate(zip(items, sc["item_t"])):
        if t < st: continue
        e = ease((t - st) / 0.35); y = 540 + k * 180; x = int(90 - (1 - e) * 900)
        d.rounded_rectangle((x, y, x + 900, y + 150), 24, fill=(35, 42, 60, 230), outline=ORANGE, width=3)
        d.ellipse((x + 30, y + 30, x + 120, y + 120), fill=ORANGE)
        d.text((x + 75, y + 75), str(k + 1), font=font(54), fill="black", anchor="mm")
        d.text((x + 150, y + 75), it, font=fit(d, it, 40, 720), fill="white", anchor="lm")


def hud(im, t, ep):
    d = ImageDraw.Draw(im); f = font(28, MONO)
    if int(t * 2) % 2: d.ellipse((40, 128, 58, 146), fill=(230, 40, 40))
    d.text((70, 137), f"ЭПИЗОД {ep:02d} · {EPS[ep]['title']}", font=f, fill=(190, 190, 200), anchor="lm")
    hh, mm = map(int, SPEC.get("clock_start", "21:00").split(":"))
    sec = int(t) + hh * 3600 + mm * 60
    d.text((W - 40, 137), f"{EPS[ep].get('date', '')}  {sec // 3600 % 24:02d}:{sec // 60 % 60:02d}:{sec % 60:02d}", font=f, fill=(190, 190, 200), anchor="rm")
    d.line((40, 170, W - 40, 170), fill=(70, 70, 85), width=2)


def frame(t, captions=True):
    i = line_at(t); sc = scenes[scene_of[i]]
    im = bgimg(sc.get("bg", "dark"))
    draw_scene(im, sc, t)
    for st, txt in stamps:
        if st <= t and scene_of[line_at(st)] == scene_of[i]: stamp(im, txt, t - st)
    if any(0 <= t - w < 0.12 for w in whooshes):
        im.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, 90)))
    hud(im, t, L[i]["ep"])
    if captions:
        gs = [g for g in groups if g[0][1] <= t]
        if gs and t < ends[-1] + 0.6:
            g = gs[-1]; d = ImageDraw.Draw(im)
            parts = [w.upper() for w, _ in g]; sz = 78
            while sum(d.textlength(p + " ", font=font(sz)) for p in parts) > 940: sz -= 4
            f = font(sz); x = W / 2 - sum(d.textlength(p + " ", font=f) for p in parts) / 2
            for p, (_, ws) in zip(parts, g):
                d.text((x, 1330), p, font=f, fill=ORANGE if ws <= t else "white", stroke_width=8, stroke_fill="black", anchor="lm")
                x += d.textlength(p + " ", font=f)
    return im.convert("RGB")


if len(sys.argv) > 3:  # preview: story.py spec out t1 t2 ...
    for ts in sys.argv[3:]: frame(float(ts)).resize((360, 640)).save(f"prev_{ts}.png")
    print("ads", ads, "total", total); raise SystemExit
p = video_writer("story_raw.mp4"); frozen = {}
for k in range(int(total * FPS)):
    t = k / FPS
    a = [a for a in ads if a <= t < a + BANNER_DUR]
    if a:
        if a[0] not in frozen: frozen[a[0]] = frame(a[0], captions=False).tobytes()
        p.stdin.write(frozen[a[0]])
    else:
        p.stdin.write(frame(t).tobytes())
p.stdin.close(); p.wait()
fc, vin, ain = [], "[0:v]", []
for k, a in enumerate(ads):
    fc.append(f"[{2 + k}:v]setpts=PTS/1.1,chromakey=0x00D300:0.16:0.06,despill=type=green,setpts=PTS-STARTPTS+{a}/TB[b{k}]")
    fc.append(f"{vin}[b{k}]overlay=(W-w)/2:(H-h)/2:eof_action=pass[v{k}]"); vin = f"[v{k}]"
    ms = int(a * 1000); fc.append(f"[{2 + k}:a]atempo=1.1,adelay={ms}|{ms}[ba{k}]"); ain.append(f"[ba{k}]")
fc.append(f"[1:a]{''.join(ain)}amix=inputs={1 + len(ads)}:normalize=0:duration=first[a]")
cmd = ["ffmpeg", "-v", "error", "-y", "-i", "story_raw.mp4", "-i", "story.wav"]
for _ in ads: cmd += ["-i", BANNER]
cmd += ["-filter_complex", ";".join(fc), "-map", vin, "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
        "-maxrate", "8M", "-bufsize", "12M", "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT]
subprocess.run(cmd, check=True)
print("ads", ads, "total", total)
