"""Animated comic characters + scene sets for comic stories.

Spec (scene level):
  "set": "cell" | "corridor" | "night" | "sea" | "roof" | "room" | "street" | "plane" | "office" | "forest" | "court"
  "actors": [{"who": "<cast id>", "x": 500, "s": 1.0, "face": "r"|"l", "pose": "<pose>", "mood": "<mood>",
              "from": x0, "to": x1, "t0": 0, "t1": 2,        # move (walk/run/sneak) between scene-relative times
              "hold": "<prop>", "at": 0.0, "fall_at": 1.2}]
  "props": [{"name": "<prop>", "x": 700, "y": 820, "s": 0.4}]
Spec (line level): "say": {"who": "<cast id>", "text": "..."} -> speech balloon over that actor while the line plays.
Spec (top level): "cast": {"<id>": {"top": "uniform|prison|suit|coat|hoodie|shirt", "hair": "short|long|bald|cap|fedora|beanie",
                                    "color": [r,g,b], "hair_color": [r,g,b], "skin": [r,g,b], "mustache": true, "glasses": true}}
Poses: idle walk run talk point shock cheer sleep fall sneak dig knock sit hold jump.
Moods: normal wide closed angry sad happy.
"""
import math, numpy as np
from PIL import Image, ImageDraw
import comic as C

INK = C.INK; OW = 9
GROUND = 900


def _limb(d, pts, col, w):
    for a, b in zip(pts, pts[1:]): d.line((*a, *b), fill=INK, width=w + 2 * OW)
    for p in pts: d.ellipse((p[0] - w / 2 - OW, p[1] - w / 2 - OW, p[0] + w / 2 + OW, p[1] + w / 2 + OW), fill=INK)
    for a, b in zip(pts, pts[1:]): d.line((*a, *b), fill=col, width=w)
    for p in pts: d.ellipse((p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2), fill=col)


def _rot(p, o, a):
    x, y = p[0] - o[0], p[1] - o[1]
    return (o[0] + x * math.cos(a) - y * math.sin(a), o[1] + x * math.sin(a) + y * math.cos(a))


def pose_params(pose, lt, mood):
    """Angles (radians, 0 = straight down, + = toward facing) for a pose at local time lt."""
    P = dict(thF=0.05, shF=0.0, thB=-0.05, shB=0.0, arF=0.15, elF=-0.15, arB=-0.1, elB=-0.1, lean=0.0, bob=0.0,
             mouth=0.0, head=0.0, rot=0.0, lift=0.0)
    br = math.sin(lt * 2.2)
    P["arF"] += 0.04 * br; P["arB"] -= 0.04 * br; P["bob"] = 3 * br
    if pose in ("walk", "run", "sneak"):
        sp, amp = {"walk": (1.7, 0.45), "run": (2.6, 0.8), "sneak": (1.1, 0.35)}[pose]
        ph = lt * 2 * math.pi * sp; s = math.sin(ph)
        P.update(thF=amp * s, thB=-amp * s, shF=-0.7 * max(0, -s) - 0.15, shB=-0.7 * max(0, s) - 0.15,
                 arF=-amp * 0.9 * s, arB=amp * 0.9 * s, elF=-0.3, elB=-0.3, bob=-abs(s) * 10)
        if pose == "run": P.update(lean=0.28, elF=-1.4, elB=-1.4)
        if pose == "sneak": P.update(lean=0.35, lift=-70, thF=P["thF"] + 0.6, thB=P["thB"] + 0.6, shF=-1.1, shB=-1.1, elF=-1.0, elB=-1.0, arF=0.6, arB=0.3)
    elif pose == "talk":
        P.update(arF=0.7 + 0.35 * math.sin(lt * 4.1), elF=-0.9 - 0.3 * math.sin(lt * 3.3), head=0.05 * math.sin(lt * 5.7))
    elif pose == "point":
        P.update(arF=1.55, elF=0.0, lean=-0.04)
    elif pose in ("shock", "cheer"):
        w = math.sin(lt * (9 if pose == "cheer" else 3))
        P.update(arF=2.7 + 0.15 * w, elF=0.3, arB=-2.7 - 0.15 * w, elB=-0.3, lift=abs(math.sin(lt * 7)) * (30 if pose == "cheer" else 0))
        if pose == "shock": P.update(lean=-0.12, lift=max(0, 40 * math.sin(min(lt, 0.4) / 0.4 * math.pi)))
    elif pose == "dig":
        P.update(lean=0.45, lift=-60, thF=0.9, shF=-1.3, thB=0.6, shB=-1.2, arF=1.3 + 0.5 * math.sin(lt * 9), elF=-0.4, arB=1.0 + 0.4 * math.sin(lt * 9 + 1), elB=-0.6)
    elif pose == "knock":
        P.update(arF=1.35 + 0.25 * math.sin(lt * 15), elF=-1.1)
    elif pose == "sit":
        P.update(thF=1.55, shF=-1.55, thB=1.45, shB=-1.45, lift=-115, arF=0.5, elF=-0.6)
    elif pose == "hold":
        P.update(arF=1.0, elF=-0.6)
    elif pose == "jump":
        P.update(lift=abs(math.sin(lt * 5)) * 90, thF=0.5, shF=-0.9, thB=0.2, shB=-0.6, arF=2.4, arB=-2.4)
    elif pose == "sleep":
        P.update(rot=-math.pi / 2, arF=0.1, arB=-0.1)
    if pose in ("talk", "point", "shock") or mood == "wide":
        P["mouth"] = 0.3 + 0.7 * abs(math.sin(lt * 11) * math.sin(lt * 4.3)) if pose == "talk" else (0.9 if pose == "shock" else 0.2)
    return P


def draw_actor(panel, a, cast, lt, talking=False):
    who = cast.get(a.get("who"), {})
    s = a.get("s", 1.0); pose = a.get("pose", "idle"); mood = a.get("mood", "normal")
    x = a.get("x", 500)
    if "from" in a and "to" in a:
        t0, t1 = a.get("t0", 0), a.get("t1", 2.0); k = min(1, max(0, (lt - t0) / max(0.01, t1 - t0)))
        x = a["from"] + (a["to"] - a["from"]) * k
        if k >= 1 and pose in ("walk", "run", "sneak"): pose = a.get("then", "idle")
        if k <= 0 and pose in ("walk", "run", "sneak") and t0 > 0: pose = "idle"
    if talking and pose == "idle": pose = "talk"
    fall = a.get("fall_at")
    P = pose_params(pose, lt, mood)
    if fall is not None and lt >= fall:
        P["rot"] = -math.pi / 2 * min(1, (lt - fall) / 0.35); mood = "wide"
    if pose == "sleep": mood = "closed"
    skin = tuple(who.get("skin", (240, 196, 160))); col = tuple(who.get("color", (70, 90, 140)))
    pants = tuple(who.get("pants", tuple(int(c * 0.55) for c in col))); hc = tuple(who.get("hair_color", (70, 46, 30)))
    top = who.get("top", "shirt"); hair = who.get("hair", "short")
    # draw at canonical scale on a layer facing right, origin = feet at (300, 700)
    L = Image.new("RGBA", (600, 760), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    ox, oy = 300, 700
    hip = (ox, oy - 250 + P["bob"] - P["lift"] * 0 + (P["lift"] if P["lift"] < 0 else 0) * -1 * 0)
    hip = (ox, oy - 250 + P["bob"] - (P["lift"] if P["lift"] > 0 else 0) - (P["lift"] if P["lift"] < 0 else 0) * -1)
    sh = _rot((hip[0], hip[1] - 185), hip, P["lean"])
    def leg(th, shn):
        k = (hip[0] + 125 * math.sin(th), hip[1] + 125 * math.cos(th))
        f = (k[0] + 125 * math.sin(th + shn), k[1] + 125 * math.cos(th + shn)); return [hip, k, f]
    def arm(ar, el):
        e = (sh[0] + 100 * math.sin(ar), sh[1] + 100 * math.cos(ar))
        h = (e[0] + 95 * math.sin(ar + el), e[1] + 95 * math.cos(ar + el)); return [sh, e, h]
    dark = tuple(int(c * 0.78) for c in col); darkp = tuple(int(c * 0.78) for c in pants)
    aB = arm(P["arB"], P["elB"]); _limb(d, aB, dark, 34); d.ellipse((aB[2][0] - 20, aB[2][1] - 20, aB[2][0] + 20, aB[2][1] + 20), fill=skin, outline=INK, width=6)
    lB = leg(P["thB"], P["shB"]); _limb(d, lB, darkp, 42)
    d.ellipse((lB[2][0] - 14, lB[2][1] - 18, lB[2][0] + 46, lB[2][1] + 14), fill=INK)
    lF = leg(P["thF"], P["shF"]); _limb(d, lF, pants, 42)
    d.ellipse((lF[2][0] - 14, lF[2][1] - 18, lF[2][0] + 46, lF[2][1] + 14), fill=INK)
    # torso
    long = top == "coat"
    tw, bw = 64, (70 if not long else 84); bot = (hip[0], hip[1] + (95 if long else 18))
    poly = [_rot(p, hip, P["lean"]) for p in [(sh[0] - tw, sh[1] - 4), (sh[0] + tw, sh[1] - 4), (bot[0] + bw, bot[1]), (bot[0] - bw, bot[1])]]
    poly = [(hip[0] - tw, sh[1]), (hip[0] + tw, sh[1]), (hip[0] + bw, bot[1]), (hip[0] - bw, bot[1])]
    poly = [_rot((p[0], p[1]), hip, P["lean"]) for p in poly]
    poly = [(p[0] + (sh[0] - _rot((hip[0], sh[1]), hip, P["lean"])[0]), p[1]) for p in poly]
    d.polygon(poly, fill=col, outline=INK, width=OW)
    if top == "prison":
        for k in range(1, 5):
            y = sh[1] + k * (bot[1] - sh[1]) / 5; d.line((min(p[0] for p in poly) + 6, y, max(p[0] for p in poly) - 6, y), fill=INK, width=10)
    if top == "uniform":
        cx = (poly[0][0] + poly[1][0]) / 2; C._star(d, cx + 30, sh[1] + 50, 18, 8, C.YEL, n=5)
        d.line((cx, sh[1] + 5, cx, bot[1] - 5), fill=INK, width=4)
    if top in ("suit", "coat"):
        cx = (poly[0][0] + poly[1][0]) / 2
        d.polygon([(cx - 22, sh[1]), (cx + 22, sh[1]), (cx, sh[1] + 70)], fill="white", outline=INK, width=4)
        if top == "suit": d.polygon([(cx - 8, sh[1] + 8), (cx + 8, sh[1] + 8), (cx + 6, sh[1] + 80), (cx, sh[1] + 92), (cx - 6, sh[1] + 80)], fill=C.RED, outline=INK, width=3)
    if top == "hoodie":
        cx = (poly[0][0] + poly[1][0]) / 2; d.line((cx - 16, sh[1] + 10, cx - 18, sh[1] + 80), fill="white", width=5); d.line((cx + 16, sh[1] + 10, cx + 18, sh[1] + 80), fill="white", width=5)
    # head
    hcx, hcy = sh[0] + 6 + 30 * math.sin(P["lean"]), sh[1] - 72
    hd = Image.new("RGBA", (220, 220), (0, 0, 0, 0)); h = ImageDraw.Draw(hd); c = 110
    if hair == "long": h.rounded_rectangle((c - 78, c - 70, c + 70, c + 90), 50, fill=hc, outline=INK, width=OW)
    h.ellipse((c - 66, c - 66, c + 66, c + 66), fill=skin, outline=INK, width=OW)
    h.ellipse((c - 82, c - 10, c - 52, c + 26), fill=skin, outline=INK, width=6)  # ear
    if hair in ("short", "long"): h.chord((c - 70, c - 74, c + 70, c + 40), 180, 360, fill=hc, outline=INK, width=OW)
    if hair == "cap":
        h.chord((c - 70, c - 80, c + 70, c + 30), 180, 360, fill=col, outline=INK, width=OW); h.rounded_rectangle((c - 10, c - 38, c + 92, c - 20), 8, fill=INK)
        C._star(h, c + 8, c - 58, 12, 5, C.YEL, n=5)
    if hair == "fedora":
        h.ellipse((c - 92, c - 46, c + 92, c - 18), fill=INK); h.rounded_rectangle((c - 56, c - 104, c + 56, c - 30), 16, fill=(40, 40, 50), outline=INK, width=6)
        h.rectangle((c - 56, c - 52, c + 56, c - 38), fill=(140, 30, 30))
    if hair == "beanie": h.chord((c - 72, c - 86, c + 72, c + 30), 180, 360, fill=(160, 40, 40), outline=INK, width=OW); h.rectangle((c - 72, c - 36, c + 72, c - 18), fill=(130, 30, 30), outline=INK, width=5)
    ex = [c + 8, c + 44]
    for e_ in ex:
        if mood == "closed" or (mood == "normal" and (lt % 3.7) < 0.12):
            h.line((e_ - 11, c + 2, e_ + 11, c + 2), fill=INK, width=6)
        elif mood == "wide":
            h.ellipse((e_ - 15, c - 16, e_ + 15, c + 16), fill="white", outline=INK, width=5); h.ellipse((e_ - 5, c - 5, e_ + 7, c + 7), fill=INK)
        else:
            h.ellipse((e_ - 8, c - 10, e_ + 8, c + 10), fill=INK)
        bi = {"angry": (14, -2), "sad": (-4, 10), "wide": (-14, -14)}.get(mood, (0, 0))
        h.line((e_ - 14, c - 26 + bi[1] * 0 + (bi[0] if e_ == ex[0] else bi[1]) * 0.6, e_ + 14, c - 26 + (bi[1] if e_ == ex[0] else bi[0]) * 0.6), fill=INK, width=6)
    if who.get("glasses"):
        for e_ in ex: h.ellipse((e_ - 17, c - 15, e_ + 17, c + 15), outline=INK, width=5)
        h.line((ex[0] + 17, c, ex[1] - 17, c), fill=INK, width=5)
    h.line((c + 58, c + 6, c + 70, c + 24, c + 56, c + 28), fill=INK, width=5)  # nose
    if who.get("mustache"): h.chord((c + 18, c + 26, c + 72, c + 50), 180, 360, fill=hc, outline=INK, width=4)
    mo = P["mouth"]
    if mo > 0.1: h.ellipse((c + 22, c + 38, c + 56, c + 40 + 30 * mo), fill=(120, 30, 30), outline=INK, width=5)
    elif mood == "sad": h.arc((c + 20, c + 40, c + 56, c + 62), 200, 340, fill=INK, width=6)
    elif mood == "happy": h.chord((c + 18, c + 30, c + 58, c + 60), 0, 180, fill=(120, 30, 30), outline=INK, width=5)
    else: h.line((c + 24, c + 44, c + 52, c + 42), fill=INK, width=6)
    hd = hd.rotate(-math.degrees(P["head"]), resample=Image.BICUBIC)
    L.alpha_composite(hd, (int(hcx - 110), int(hcy - 110)))
    aF = arm(P["arF"], P["elF"]); _limb(d, aF, col, 36)
    d.ellipse((aF[2][0] - 21, aF[2][1] - 21, aF[2][0] + 21, aF[2][1] + 21), fill=skin, outline=INK, width=6)
    if a.get("hold"):
        it = C.prop(a["hold"]).resize((150, 150), Image.LANCZOS); L.alpha_composite(it, (int(aF[2][0] - 40), int(aF[2][1] - 110)))
    pad = 0
    if P["rot"]:  # lying/falling: rotate on a wider canvas so the head is not clipped
        pad = 450; big = Image.new("RGBA", (600 + 2 * pad, 760), (0, 0, 0, 0)); big.alpha_composite(L, (pad, 0))
        L = big.rotate(math.degrees(P["rot"]), center=(ox + pad, oy - 20), resample=Image.BICUBIC)
    if a.get("face", "r") == "l": L = L.transpose(Image.FLIP_LEFT_RIGHT)
    if s != 1.0: L = L.resize((int(L.width * s), int(760 * s)), Image.LANCZOS)
    gy = a.get("y", GROUND)
    if not P["rot"]:  # soft contact shadow
        sh_ = Image.new("RGBA", (int(260 * s), int(50 * s)), (0, 0, 0, 0)); ImageDraw.Draw(sh_).ellipse((0, 0, sh_.width - 1, sh_.height - 1), fill=(0, 0, 0, 90))
        panel.alpha_composite(sh_, (int(x - sh_.width / 2), int(gy - sh_.height / 2)))
    panel.alpha_composite(L, (int(x - (300 + pad) * s), int(gy - 700 * s)))
    if pose == "sleep":
        d2 = ImageDraw.Draw(panel)
        for k in range(3):
            ph = (lt * 0.8 + k / 3) % 1
            d2.text((x + 60 * s + 40 * ph * 3, gy - 240 * s - 160 * ph), "z", font=C.F("title", int(40 + 30 * ph)), fill="white", stroke_width=5, stroke_fill=INK)
    return (x, gy - (680 if pose != "sleep" else 300) * s)  # balloon anchor (above head)


def balloon(panel, anchor, text, k):
    d = ImageDraw.Draw(panel); f = C.F("hand", 46)
    words, lines, cur = text.split(), [], ""
    for w in words:
        if d.textlength((cur + " " + w).strip(), font=f) > 420: lines.append(cur); cur = w
        else: cur = (cur + " " + w).strip()
    lines.append(cur)
    w = max(d.textlength(l, font=f) for l in lines) + 70; h = 56 * len(lines) + 50
    ax, ay = anchor; bx = min(max(ax - w / 2 + 60, 20), C.PW - w - 20); by = max(20, ay - h - 70)
    sc = min(1, 0.6 + k * 2)
    cx, cy = bx + w / 2, by + h / 2; w2, h2 = w * sc, h * sc
    tail = [(cx - 30, cy + h2 / 2 - 10), (cx + 20, cy + h2 / 2 - 10), (ax, ay - 10)]
    d.polygon(tail, fill="white", outline=INK, width=OW)
    d.ellipse((cx - w2 / 2 - 20, cy - h2 / 2 - 10, cx + w2 / 2 + 20, cy + h2 / 2 + 10), fill="white", outline=INK, width=OW)
    d.polygon([(tail[0][0] + 8, tail[0][1] - 12), (tail[1][0] - 8, tail[1][1] - 12), (ax, ay - 26)], fill="white")
    if k > 0.15:
        for i, l in enumerate(lines): d.text((cx, cy - (len(lines) - 1) * 28 + i * 56), l, font=f, fill=INK, anchor="mm")


# ---------- sets (drawn over the halftone panel)
def draw_set(panel, name, t):
    base = panel.convert("RGB"); _draw_set(base, name, t); panel.paste(base.convert("RGBA"))


def _draw_set(panel, name, t):
    # drawn on an RGB copy: PIL blends translucent fills there (it does not on RGBA targets)
    d = ImageDraw.Draw(panel, "RGBA"); W_, H_ = C.PW, C.PH
    if name in ("cell", "corridor", "room", "office", "court", "plane"):
        wall = {"cell": (150, 146, 140), "corridor": (130, 130, 140), "room": (196, 170, 140), "office": (170, 180, 196),
                "court": (150, 110, 80), "plane": (226, 226, 232)}[name]
        d.rectangle((0, 0, W_, GROUND), fill=wall + (235,))
        if name in ("cell", "corridor"):
            for y in range(0, GROUND, 60):
                for x in range((y // 60 % 2) * 60 - 60, W_, 120): d.rectangle((x, y, x + 120, y + 60), outline=INK + (90,), width=4)
        if name == "cell":
            d.rectangle((640, 120, 860, 330), fill=(30, 40, 70), outline=INK, width=OW)
            for x in range(670, 860, 40): d.line((x, 120, x, 330), fill=(160, 160, 170), width=10)
            d.rectangle((40, 640, 420, 700), fill=(120, 80, 50), outline=INK, width=OW); d.rectangle((40, 600, 420, 645), fill=(230, 230, 220), outline=INK, width=OW)
            for x in (60, 400): d.rectangle((x - 10, 700, x + 10, GROUND), fill=INK)
        if name == "corridor":
            for x in range(0, W_, 250):
                d.rectangle((x + 20, 220, x + 200, GROUND), fill=(40, 40, 50), outline=INK, width=OW)
                for bx in range(x + 40, x + 200, 30): d.line((bx, 220, bx, GROUND), fill=(170, 170, 180), width=8)
        if name == "room":
            d.rectangle((600, 150, 880, 420), fill=(40, 60, 110), outline=INK, width=OW); d.line((740, 150, 740, 420), fill=INK, width=OW)
            d.ellipse((790, 190, 840, 240), fill=(250, 240, 190))
        if name == "office":
            for x in range(60, 900, 140): d.rectangle((x, 120, x + 100, 420), fill=(200, 160, 90), outline=INK, width=6)
            d.rectangle((0, 640, W_, 700), fill=(120, 80, 50), outline=INK, width=OW)
        if name == "court":
            d.rectangle((250, 120, 750, 600), fill=(110, 70, 40), outline=INK, width=OW); d.rectangle((150, 560, 850, 700), fill=(130, 84, 50), outline=INK, width=OW)
        if name == "plane":
            for x in range(80, W_, 220): d.rounded_rectangle((x, 230, x + 110, 400), 50, fill=(120, 170, 230), outline=INK, width=OW)
            d.rectangle((0, 540, W_, 560), fill=(180, 180, 190), outline=INK, width=5)
        d.rectangle((0, GROUND, W_, H_), fill=(90, 80, 74), outline=INK, width=OW)
    elif name in ("night", "sea", "roof", "street", "forest"):
        sky = {"night": (24, 30, 70), "sea": (30, 40, 86), "roof": (24, 30, 70), "street": (60, 90, 150), "forest": (40, 70, 70)}[name]
        d.rectangle((0, 0, W_, H_), fill=sky + (225,))
        if name != "street":
            for k in range(40):
                r = np.random.default_rng(k); x, y = r.integers(0, W_), r.integers(0, 500)
                if (t * 2 + k) % 5 > 0.4: d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(255, 255, 230))
            d.ellipse((760, 80, 900, 220), fill=(250, 240, 190), outline=INK, width=OW)
        if name in ("night", "sea"):
            if name == "night":
                d.polygon([(80, 560), (240, 420), (620, 420), (760, 560)], fill=(60, 56, 60), outline=INK)
                d.rectangle((260, 330, 600, 440), fill=(110, 110, 120), outline=INK, width=OW)
                d.polygon([(560, 330), (980, 180 + 40 * math.sin(t)), (980, 300 + 40 * math.sin(t))], fill=(255, 245, 160, 120))
            for row in range(4):
                y = 560 + row * 110; pts = [(x, y + 18 * math.sin(x / 50 + t * 2 + row)) for x in range(0, W_ + 11, 10)]
                d.polygon(pts + [(W_, H_), (0, H_)], fill=(30 + row * 6, 70 + row * 8, 150 - row * 8), outline=INK); d.line(pts, fill=(220, 235, 255), width=6)
        if name == "roof":
            d.rectangle((0, 700, W_, H_), fill=(70, 70, 80), outline=INK, width=OW)
            d.rectangle((120, 560, 260, 700), fill=(120, 120, 130), outline=INK, width=OW)
            for x in range(140, 260, 25): d.line((x, 570, x, 690), fill=INK, width=5)
        if name == "street":
            top_, bot_ = sky, tuple(min(255, int(c * 1.9 + 30)) for c in sky)  # sky gradient toward a glowing horizon
            for y in range(0, GROUND, 6):
                k = y / GROUND; d.rectangle((0, y, W_, y + 6), fill=tuple(int(top_[i] + (bot_[i] - top_[i]) * k) for i in range(3)) + (235,))
            for x in range(-40, W_, 90):  # distant skyline in haze
                hh = 260 + int(160 * abs(math.sin(x * 0.37)))
                d.rectangle((x, GROUND - hh - 140, x + 80, GROUND), fill=(110, 120, 150, 170))
                for wy in range(GROUND - hh - 120, GROUND - 160, 40): d.rectangle((x + 14, wy, x + 26, wy + 14), fill=(255, 230, 150, 120))
            d.rectangle((0, GROUND - 260, W_, GROUND), fill=(200, 210, 230, 40))
            for x, hgt in [(0, 520), (200, 640), (420, 480), (600, 700), (800, 560)]:
                d.rectangle((x, GROUND - hgt, x + 200, GROUND), fill=(80, 76, 96), outline=INK, width=OW)
                for wy in range(GROUND - hgt + 40, GROUND - 60, 80):
                    for wx in (x + 30, x + 120): d.rectangle((wx, wy, wx + 50, wy + 50), fill=C.YEL if (wx + wy) % 3 else (40, 40, 60), outline=INK, width=4)
            d.rectangle((0, GROUND, W_, H_), fill=(60, 60, 66), outline=INK, width=OW)
            for k in range(0, W_, 160): d.rectangle((k + 30, GROUND + 50, k + 110, GROUND + 60), fill=(230, 230, 220))  # road marks
            for lx in (150, 850):  # street lamps with glow
                d.rectangle((lx - 8, GROUND - 520, lx + 8, GROUND), fill=(40, 40, 46), outline=INK, width=4)
                d.line((lx, GROUND - 520, lx + 70, GROUND - 540), fill=INK, width=14); d.ellipse((lx + 50, GROUND - 556, lx + 100, GROUND - 524), fill=(255, 236, 160), outline=INK, width=5)
                for r in (160, 110, 70): d.ellipse((lx + 75 - r, GROUND - 540 - r, lx + 75 + r, GROUND - 540 + r), fill=(255, 220, 140, 26))
                d.polygon([(lx + 55, GROUND - 530), (lx + 95, GROUND - 530), (lx + 200, GROUND), (lx - 50, GROUND)], fill=(255, 230, 160, 30))
        if name == "forest":
            for x, s in [(80, .8), (300, 1.0), (560, .9), (820, 1.1)]:
                for k in range(3):
                    y = GROUND - 80 * s - k * 120 * s; d.polygon([(x - 150 * s + k * 30, y), (x + 150 * s - k * 30, y), (x, y - 200 * s)], fill=(30, 100, 60), outline=INK, width=8)
            d.rectangle((0, GROUND, W_, H_), fill=(60, 50, 40), outline=INK, width=OW)


def weather(panel, kind, t):
    """Atmosphere over the set: rain streaks, drifting fog bands or dust motes in the light."""
    lay = Image.new("RGBA", panel.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay); W_, H_ = panel.size
    rng = np.random.default_rng(7)
    if kind == "rain":
        for k in range(140):
            x0, y0, sp = rng.uniform(0, W_ + 200), rng.uniform(0, H_), rng.uniform(900, 1400)
            y = (y0 + t * sp) % (H_ + 100) - 50; x = (x0 - (y0 + t * sp) * 0.25) % (W_ + 200) - 100
            d.line((x, y, x - 10, y + 40), fill=(210, 225, 255, 120), width=3)
        for k in range(10):  # splashes on the ground
            x = rng.uniform(0, W_); ph = (t * 2 + k * 0.37) % 1
            d.ellipse((x - 26 * ph, GROUND + 20 - 6 * ph, x + 26 * ph, GROUND + 20 + 6 * ph), outline=(220, 235, 255, int(160 * (1 - ph))), width=2)
    elif kind == "fog":
        for k in range(5):
            y = 300 + k * 140; x = (t * (20 + 8 * k) + k * 300) % (W_ + 800) - 800
            d.ellipse((x, y, x + 900, y + 160), fill=(220, 225, 235, 28))
            d.ellipse((x - 500, y + 40, x + 300, y + 200), fill=(220, 225, 235, 22))
    elif kind == "dust":
        for k in range(45):
            x = (rng.uniform(0, W_) + 12 * math.sin(t * 0.7 + k)) % W_; y = (rng.uniform(0, H_) - t * rng.uniform(8, 20)) % H_
            r = rng.uniform(1.5, 4); d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 240, 200, int(rng.uniform(60, 160))))
    panel.alpha_composite(lay)


def reflect(panel, alpha=0.3):
    """Wet-ground mirror: flipped strip of what stands on the ground line, faded downward."""
    h = panel.height - GROUND
    if h <= 0: return
    strip = panel.crop((0, GROUND - h, panel.width, GROUND)).transpose(Image.FLIP_TOP_BOTTOM)
    m = Image.linear_gradient("L").resize((panel.width, h)).point(lambda v: int((255 - v) * alpha))
    strip.putalpha(m); panel.alpha_composite(strip, (0, GROUND))
