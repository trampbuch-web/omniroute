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
TEMPO, GAP = SPEC.get("tempo", 1.0), SPEC.get("gap", 0.35)
MANUAL_ADS = any(ln.get("ad_before") for ln in L)
clips = [load_audio(f"g{i:02d}.mp3", TEMPO) for i in range(len(L))]
starts, ads = [], []
cur, target = 0.8, AD_EVERY
for i, c in enumerate(clips):
    dur = len(c) / SR
    if L[i].get("ad_before") if MANUAL_ADS else cur + dur / 2 > target:
        ads.append(cur); cur += BANNER_DUR + 0.4; target += AD_EVERY
    if i and L[i]["ep"] != L[i - 1]["ep"]:
        cur += 0.5
    starts.append(cur); cur += dur + GAP
total = cur + 1.6
ends = [s + len(c) / SR for s, c in zip(starts, clips)]
words = []
for i in range(len(L)):
    words += [w for w in words_from_alignment(f"g{i:02d}.json", TEMPO, starts[i]) if not w[0].startswith("[")]
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
    sc["item_t"] = [lt[0] + 0.35 * k if sc.get("letters") else lt[k] if k < len(lt) else lt[-1] + 0.7 * (k - len(lt) + 1) for k in range(len(items))]
    sc["end"] = ends[sc["lines"][-1]]
stamps = [(starts[i], ln["stamp"]) for i, ln in enumerate(L) if ln.get("stamp")]
toasts = [(starts[i], min(3.2, ends[i] - starts[i] + 0.6), ln["toast"]) for i, ln in enumerate(L) if ln.get("toast")]
levels = [(starts[i], ln["level"]) for i, ln in enumerate(L) if ln.get("level")]
stat_events = [(starts[i], ln["stats"]) for i, ln in enumerate(L) if ln.get("stats")]
speaking = lambda t: any(a <= t < b for a, b in zip(starts, ends))
whooshes = [sc["start"] for sc in scenes[1:]]
line_at = lambda t: max([i for i in range(len(L)) if starts[i] <= t] or [0])

# ---- audio (music kept quiet under the voice)
n = int(total * SR) + SR
voice = np.zeros(n, np.float32)
for c, st in zip(clips, starts): place(voice, c, st)
# louder, even voice: RMS to ~-16 dBFS over speech, soft-limited so peaks never clip
_v = voice[np.abs(voice) > 1e-4]
voice = (np.tanh(voice * (0.16 / (np.sqrt(np.mean(_v ** 2)) + 1e-9)) * 1.6) / np.tanh(1.6)).astype(np.float32) * 0.95
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
for st, e in zip(starts, ends): duck[int(st * SR):int(e * SR)] = 0.14
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
for st, _, _ in toasts: place(buf, sfx_pop(900, 1500, 0.09), st, 0.7)
for st, _ in levels:
    for k, f0 in enumerate((523, 659, 784, 1047)): place(buf, sfx_pop(f0, f0, 0.18), st + k * 0.09, 0.6)
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


HOOD = {1: (92, 98, 115), 2: (40, 95, 205), 3: (22, 22, 28)}


def draw_hero(im, cx, cy, tier, t):
    """Same guy at every tier (shaggy brown hair, hood); outfit upgrades with the level. Mood comes from the line."""
    mood = L[line_at(t)].get("mood", "neutral"); talk = speaking(t)
    lay = Image.new("RGBA", (640, 820), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x, y = 320, 260  # face centre inside the layer
    hood = HOOD.get(tier, HOOD[1]); dark = tuple(int(c * 0.7) for c in hood); skin = (238, 200, 170); hair = (96, 64, 42)
    # hands: idle / talking gesture / both up / at the head
    if mood == "hype": hands = [(x - 235, y - 150 + 26 * np.sin(t * 9)), (x + 235, y - 150 + 26 * np.sin(t * 9 + 1.5))]
    elif mood == "shock": hands = [(x - 150, y + 10), (x + 150, y + 10)]
    else:
        hands = [(x - 200 + 8 * np.sin(t * 1.9), y + 330), (x + 200, y + 330)]
        if talk: hands[1] = (x + 215 + 30 * np.sin(t * 5.1), y + 150 + 55 * np.sin(t * 3.3))
        if talk and mood == "happy": hands[0] = (x - 215 + 30 * np.sin(t * 4.3 + 2), y + 150 + 55 * np.sin(t * 3.7 + 1))
    for sx, (hx, hy) in zip((-1, 1), hands):
        d.line((x + sx * 150, y + 130, hx, hy), fill=hood, width=64); d.ellipse((x + sx * 150 - 32, y + 98, x + sx * 150 + 32, y + 162), fill=hood)
        d.ellipse((hx - 36, hy - 36, hx + 36, hy + 36), fill=skin)
    d.rounded_rectangle((x - 170, y + 40, x + 170, y + 380), 70, fill=hood)               # torso
    d.line((x - 28, y + 90, x - 34, y + 190), fill=(230, 230, 235), width=6); d.line((x + 28, y + 90, x + 34, y + 190), fill=(230, 230, 235), width=6)
    d.ellipse((x - 125, y - 185, x + 125, y + 75), fill=dark)                               # hood
    d.ellipse((x - 88, y - 140, x + 88, y + 50), fill=skin)                                 # face
    d.pieslice((x - 98, y - 160, x + 98, y + 10), 180, 360, fill=hair)
    for k in range(-3, 4): d.ellipse((x + k * 26 - 20, y - 90, x + k * 26 + 20, y - 48), fill=hair)
    look = 5 * np.sin(t * 0.9); blink = (t % 3.4) < 0.12
    if tier >= 3:
        d.rounded_rectangle((x - 78, y - 52, x + 78, y - 14), 14, fill=(10, 10, 14)); d.line((x - 60, y - 44, x - 30, y - 44), fill=(120, 120, 140), width=4)
    else:
        for ex in (-36, 36):
            r = 17 if mood == "shock" else 13
            if blink and mood != "shock": d.line((x + ex - 12, y - 30, x + ex + 12, y - 30), fill=(40, 30, 25), width=5)
            else:
                d.ellipse((x + ex - r, y - 31 - r, x + ex + r, y - 31 + r), fill="white")
                d.ellipse((x + ex - 8 + look, y - 39, x + ex + 8 + look, y - 23), fill=(40, 30, 25))
            # brows: (inner dy, outer dy)
            bi, bo = dict(sad=(-14, 0), shock=(-22, -22), hype=(-4, -14), happy=(-8, -12)).get(mood, (-6, -6))
            d.line((x + ex - np.sign(ex) * 16, y - 58 + bi, x + ex + np.sign(ex) * 18, y - 58 + bo), fill=hair, width=8)
    m = abs(np.sin(t * 11.3) * np.sin(t * 4.7))  # talking mouth openness
    if mood == "shock": d.ellipse((x - 16, y + 2, x + 16, y + 38), fill=(120, 50, 50))
    elif talk or mood == "hype":
        w_, h_ = (30, 34) if mood == "hype" else (20, 8 + 26 * m)
        d.ellipse((x - w_, y + 14 - h_ / 2, x + w_, y + 14 + h_ / 2), fill=(120, 50, 50))
    elif mood == "sad": d.arc((x - 22, y + 8, x + 22, y + 36), 200, 340, fill=(120, 50, 50), width=5)
    else: d.arc((x - 26, y - 10, x + 26, y + 24), 20, 160, fill=(120, 50, 50), width=6)
    if tier == 1:  # cheap headphones, one cup taped
        d.arc((x - 112, y - 175, x + 112, y + 40), 180, 360, fill=(40, 40, 46), width=14)
        d.rounded_rectangle((x - 122, y - 70, x - 86, y + 10), 12, fill=(40, 40, 46)); d.rounded_rectangle((x + 86, y - 70, x + 122, y + 10), 12, fill=(40, 40, 46))
        d.line((x + 90, y - 50, x + 120, y - 10), fill=(200, 200, 205), width=7)
    if tier >= 2: d.arc((x - 60, y + 40, x + 60, y + 170), 0, 180, fill=(255, 200, 40), width=8 if tier == 2 else 14)
    if tier >= 3: d.ellipse((x - 22, y + 150, x + 22, y + 194), fill=(255, 200, 40))
    # body language: sway, nod while talking, jump when hyped, slump when sad
    ang = 2.5 * np.sin(t * 1.7) + (2.2 * np.sin(t * 6.3) if talk else 0) + (5 if mood == "sad" else 0)
    dy = -abs(np.sin(t * 9)) * 34 if mood == "hype" else (14 if mood == "sad" else 5 * np.sin(t * 2.2))
    lay = lay.rotate(ang, resample=Image.BICUBIC, center=(x, y + 380))
    im.alpha_composite(lay, (int(cx - x), int(cy - y + dy)))


def draw_room(im, t):
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((690, 290, 990, 580), fill=(12, 20, 45), outline=(70, 75, 90), width=10)  # window, night
    d.ellipse((900, 320, 950, 370), fill=(230, 230, 200)); d.line((840, 290, 840, 580), fill=(70, 75, 90), width=8)
    for k in range(9): d.rectangle((705 + k * 31, 520 - (k * 37) % 90, 728 + k * 31, 575), fill=(25, 35, 70))
    d.rectangle((70, 300, 300, 560), fill=(50, 40, 70), outline=(90, 80, 110), width=6)  # poster
    d.text((185, 430), "ЦЕЛЬ:\nСТАДИОН", font=font(34), fill=(200, 190, 230), anchor="mm", align="center")
    g = int(150 + 50 * np.sin(t * 13) * np.sin(t * 3.1))
    d.rounded_rectangle((60, 660, 330, 880), 14, fill=(170, 165, 150)); d.rectangle((84, 684, 306, 846), fill=(40, 90, g))  # old CRT
    d.line((100, 720, 250, 720), fill=(200, 230, 255), width=5); d.line((100, 750, 200, 750), fill=(200, 230, 255), width=5)
    d.rectangle((0, 920, W, 965), fill=(92, 62, 40))  # desk
    d.rectangle((820, 800, 840, 920), fill=(60, 60, 66)); d.ellipse((800, 760, 860, 820), fill=(90, 90, 98))  # cheap mic


def draw_stage(im, t):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for k, col in enumerate([(255, 60, 200), (60, 200, 255), (255, 210, 60), (160, 90, 255)]):
        x0 = 140 + k * 270; x1 = x0 + int(360 * np.sin(t * 1.3 + k * 1.7))
        d.polygon([(x0 - 14, 180), (x0 + 14, 180), (x1 + 170, 1250), (x1 - 170, 1250)], fill=col + (46,))
    im.alpha_composite(lay); d = ImageDraw.Draw(im, "RGBA")
    r = np.random.default_rng(int(t * 12))
    for _ in range(5):
        x, y = int(r.integers(30, W - 30)), int(r.integers(1010, 1250)); d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(255, 255, 255, 230))
    for row in range(3):
        for k in range(15):
            x = k * 78 + (row % 2) * 39 - 10; y = 1040 + row * 70 + int(8 * np.sin(t * 6 + k + row))
            d.ellipse((x - 34, y - 34, x + 34, y + 34), fill=(8, 8, 14)); d.rectangle((x - 40, y + 20, x + 40, y + 200), fill=(8, 8, 14))
            if (k + row) % 3 == 0: d.line((x + 30, y, x + 48, y - 80), fill=(8, 8, 14), width=16)


def draw_stats(im, t):
    cur = [e for e in stat_events if e[0] <= t]
    if not cur: return
    st, now = cur[-1]; prev = stat_events[stat_events.index(cur[-1]) - 1][1] if len(cur) > 1 else SPEC.get("stats_start", {k: 0 for k in now})
    k_ = ease((t - st) / 0.9); d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((60, 985, W - 60, 1285), 22, fill=(8, 10, 18, 215), outline=(70, 80, 110), width=2)
    for r, (name, val) in enumerate(now.items()):
        y = 1010 + r * 38; old = prev.get(name, 0); v = old + (val - old) * k_; up = val != old and t - st < 2.2
        d.text((90, y + 12), name, font=font(25), fill=(120, 255, 150) if up else (215, 220, 230), anchor="lm")
        d.rounded_rectangle((380, y, 880, y + 24), 12, fill=(40, 46, 66))
        if v > 0.5: d.rounded_rectangle((380, y, 380 + max(24, int(500 * v / 100)), y + 24), 12, fill=(120, 255, 150) if up else ORANGE)
        d.text((W - 90, y + 12), (f"+{val - old}" if up and val > old else str(int(round(v)))), font=font(25), fill=(120, 255, 150) if up else "white", anchor="rm")


def draw_overlays(im, t):
    d = ImageDraw.Draw(im, "RGBA")
    for st, dur, txt in toasts:
        if not st <= t < st + dur: continue
        y = int(200 - 140 * (1 - ease((t - st) / 0.25)) - 140 * ease((t - st - dur + 0.25) / 0.25))
        d.rounded_rectangle((90, y, W - 90, y + 96), 30, fill=(245, 246, 250, 245))
        tok = txt.split(" ", 1); x = 125
        if len(tok) == 2 and ord(tok[0][0]) > 0x2000:
            im.alpha_composite(emoji(tok[0], 56), (x, y + 20)); x += 76; txt = tok[1]
        d.text((x, y + 48), txt, font=fit(d, txt, 40, W - 300), fill=(15, 18, 28), anchor="lm")
    for st, (n_, title) in levels:
        if not st <= t < st + 2.2: continue
        k_ = ease((t - st) / 0.3); w_ = int(460 * k_)
        d.rounded_rectangle((W / 2 - w_, 318, W / 2 + w_, 452), 26, fill=(255, 200, 40, 245), outline=(255, 255, 255), width=5)
        if k_ > 0.6:
            d.text((W / 2, 360), f"УРОВЕНЬ {n_}", font=font(54), fill=(20, 16, 6), anchor="mm")
            d.text((W / 2, 416), title, font=fit(d, title, 36, 860), fill=(60, 44, 10), anchor="mm")


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
    if eff == "room": draw_room(im, t)
    if eff == "stage": draw_stage(im, t)
    if sc.get("hero"):
        draw_hero(im, W // 2, 560, sc["hero"], t)
        if eff != "stage": draw_stats(im, t)
        d = ImageDraw.Draw(im, "RGBA")
    items = sc.get("items", [])
    if sc.get("big_top"): d.text((W / 2, 420), sc["big_top"], font=fit(d, sc["big_top"], 90, 900), fill=ORANGE, anchor="mm", stroke_width=4, stroke_fill="black")
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
        d.text((x + 75, y + 75), "АБВГ"[k] if sc.get("letters") else str(k + 1), font=font(54), fill="black", anchor="mm")
        d.text((x + 150, y + 75), it, font=fit(d, it, 40, 720), fill="white", anchor="lm")


def hud(im, t, ep):
    d = ImageDraw.Draw(im); f = font(28, MONO)
    if int(t * 2) % 2: d.ellipse((40, 128, 58, 146), fill=(230, 40, 40))
    d.text((70, 137), f"{SPEC.get('hud_label') or f'ЭПИЗОД {ep:02d}'} · {EPS[ep]['title']}", font=f, fill=(190, 190, 200), anchor="lm")
    hh, mm = map(int, SPEC.get("clock_start", "21:00").split(":"))
    sec = int(t) + hh * 3600 + mm * 60
    d.text((W - 40, 137), f"{EPS[ep].get('date', '')}  {sec // 3600 % 24:02d}:{sec // 60 % 60:02d}:{sec % 60:02d}", font=f, fill=(190, 190, 200), anchor="rm")
    d.line((40, 170, W - 40, 170), fill=(70, 70, 85), width=2)


import comic as C


def comic_frame(t, captions=True):
    i = line_at(t); si = scene_of[i]; sc = scenes[si]; lt = t - sc["start"]
    im = Image.new("RGBA", (W, H), C.PAPER + (255,)); d = ImageDraw.Draw(im)
    ep = L[i]["ep"]; lab = f"{SPEC.get('hud_label') or f'ЭПИЗОД {ep}'} · {EPS[ep]['title']}"
    f = C.F("title", 34); wl = d.textlength(lab, font=f)
    d.rectangle((40, 100, 40 + wl + 40, 160), fill=C.INK); d.text((60, 130), lab, font=f, fill="white", anchor="lm")
    dt = EPS[ep].get("date", "")
    if dt:
        wd = d.textlength(dt, font=f); d.rectangle((W - 40 - wd - 40, 100, W - 40, 160), fill=C.YEL, outline=C.INK, width=5)
        d.text((W - 60, 130), dt, font=f, fill=C.INK, anchor="rm")
    panel = C.halftone(C.PAL.get(sc.get("bg", "dark"), C.PAL["dark"])); dp = ImageDraw.Draw(panel, "RGBA")
    eff = sc.get("fx", "none")
    dramatic = eff in ("alarm", "police") or any(L[j].get("tag") == "dramatic" and starts[j] <= t for j in sc["lines"])
    if dramatic: C.speed_lines(dp, t)
    if eff == "alarm": dp.rectangle((0, 0, C.PW, C.PH), fill=(255, 0, 0, int(25 + 25 * np.sin(t * 8))))
    if eff == "police":
        side = int(t * 3) % 2
        dp.rectangle((0, 0, 120, C.PH), fill=(255, 30, 30, 90) if side else (30, 60, 255, 90))
        dp.rectangle((C.PW - 120, 0, C.PW, C.PH), fill=(30, 60, 255, 90) if side else (255, 30, 30, 90))
    items = sc.get("items", [])
    name = sc.get("prop") or C.EMOJI2PROP.get(sc.get("emoji", ""), "question" if sc.get("emoji") else None)
    if name:
        dur = max(1.0, sc["end"] - sc["start"]); k = ease(lt / 0.3)
        size = int((260 if items else (480 if sc.get("big") else 600)) * (0.55 + 0.45 * k) * (1 + 0.08 * min(1, lt / dur)))
        pr = C.prop(name).resize((size, size), Image.LANCZOS)
        if eff == "shake" or (eff == "rings" and (t * 2) % 2 < 1.2): pr = pr.rotate(4 * np.sin(t * 40), resample=Image.BICUBIC)
        cy = 250 if items else (430 if sc.get("big") else 480)
        panel.alpha_composite(pr, (int(C.PW / 2 - size / 2), int(cy - size / 2 + 8 * np.sin(t * 1.8))))
    if sc.get("big") and not items:
        big = sc["big"]
        if sc.get("count"):
            a_, b_ = sc["count"]; v = int(a_ + (b_ - a_) * ease(lt / max(0.5, sc["end"] - sc["start"])))
            big = big.replace("{n}", f"{v:,}".replace(",", " "))
        C.title_text(dp, big, C.PW / 2, 830, int(90 + 40 * ease(lt / 0.35)), col=C.YEL)
    if sc.get("big_top"): C.title_text(dp, sc["big_top"], C.PW / 2, 110, 90, col=C.YEL)
    for k_, (it, st) in enumerate(zip(items, sc["item_t"])):
        if t < st: continue
        e = ease((t - st) / 0.35); y = (230 if sc.get("big_top") else 430) + k_ * 170; x = int(60 - (1 - e) * 1000)
        dp.rectangle((x + 10, y + 10, x + 890, y + 150), fill=C.INK); dp.rectangle((x, y, x + 880, y + 140), fill="white", outline=C.INK, width=8)
        dp.ellipse((x + 25, y + 25, x + 115, y + 115), fill=C.INK)
        dp.text((x + 70, y + 72), "АБВГ"[k_] if sc.get("letters") else str(k_ + 1), font=C.F("title", 54), fill=C.YEL, anchor="mm")
        ff = C.F("hand", 48)
        while dp.textlength(it, font=ff) > 700 and ff.size > 28: ff = C.F("hand", ff.size - 2)
        dp.text((x + 140, y + 70), it, font=ff, fill=C.INK, anchor="lm")
    if sc.get("sub") and not items: panel.alpha_composite(C.narration_box(sc["sub"]), (30, 30))
    for j in range(len(L)):
        hit = [s_ for s_ in L[j].get("sfx", []) if s_ in C.SFX]
        if hit and 0 <= t - starts[j] < 0.9 and scene_of[j] == si:
            bu = C.burst(C.SFX[hit[0]], (t - starts[j]) / 0.9); panel.alpha_composite(bu, (int(C.PW - bu.width + 20), 120))
    dp.rectangle((0, 0, C.PW - 1, C.PH - 1), outline=C.INK, width=14)
    k = ease(lt / 0.3) if si else 1.0
    pr = panel.rotate((1.2 if si % 2 else -1.2) * (1 + 2 * (1 - k)), expand=True, resample=Image.BICUBIC)
    im.alpha_composite(pr, (int(W / 2 - pr.width / 2 + (1 - k) * 1100), int(200 + C.PH / 2 - pr.height / 2)))
    for st, txt in stamps:
        if st <= t and scene_of[line_at(st)] == si: stamp(im, txt, t - st)
    if captions:
        gs = [g for g in groups if g[0][1] <= t]
        if gs and t < ends[-1] + 0.6:
            g = gs[-1]; d = ImageDraw.Draw(im)
            parts = [w.upper() for w, _ in g]; f = C.F("title", 70)
            while sum(d.textlength(p + " ", font=f) for p in parts) > 900: f = C.F("title", f.size - 4)
            tw = sum(d.textlength(p + " ", font=f) for p in parts) - d.textlength(" ", font=f); x = W / 2 - tw / 2
            d.rectangle((x - 30 + 10, 1290 + 10, x + tw + 30 + 10, 1400 + 10), fill=C.INK)
            d.rectangle((x - 30, 1290, x + tw + 30, 1400), fill="white", outline=C.INK, width=8)
            for p, (_, ws) in zip(parts, g):
                d.text((x, 1345), p, font=f, fill=C.RED if ws <= t else C.INK, anchor="lm"); x += d.textlength(p + " ", font=f)
    return im.convert("RGB")


def frame(t, captions=True):
    if SPEC.get("style") == "comic": return comic_frame(t, captions)
    i = line_at(t); sc = scenes[scene_of[i]]
    im = bgimg(sc.get("bg", "dark"))
    draw_scene(im, sc, t)
    for st, txt in stamps:
        if st <= t and scene_of[line_at(st)] == scene_of[i]: stamp(im, txt, t - st)
    if any(0 <= t - w < 0.12 for w in whooshes):
        im.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, 90)))
    draw_overlays(im, t)
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
    # full-screen ad: banner card scaled to the full frame width, paused video behind it blacked out
    fc.append(f"[{2 + k}:v]setpts=PTS/1.1,chromakey=0x00D300:0.16:0.06,despill=type=green,scale=iw*1.12:-2,crop=1080:1920,"
              f"setpts=PTS-STARTPTS+{a}/TB[b{k}]")
    fc.append(f"{vin}drawbox=c=black@0.88:t=fill:enable='between(t,{a},{a + BANNER_DUR})'[d{k}]")
    fc.append(f"[d{k}][b{k}]overlay=(W-w)/2:(H-h)/2:eof_action=pass[v{k}]"); vin = f"[v{k}]"
    ms = int(a * 1000); fc.append(f"[{2 + k}:a]atempo=1.1,adelay={ms}|{ms}[ba{k}]"); ain.append(f"[ba{k}]")
fc.append(f"[1:a]{''.join(ain)}amix=inputs={1 + len(ads)}:normalize=0:duration=first[a]")
cmd = ["ffmpeg", "-v", "error", "-y", "-i", "story_raw.mp4", "-i", "story.wav"]
for _ in ads: cmd += ["-i", BANNER]
cmd += ["-filter_complex", ";".join(fc), "-map", vin, "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
        "-maxrate", "8M", "-bufsize", "12M", "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT]
subprocess.run(cmd, check=True)
print("ads", ads, "total", total)
