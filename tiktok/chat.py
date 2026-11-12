import json, numpy as np
from PIL import Image, ImageDraw
from common import *

import sys
C = json.load(open(sys.argv[1]))
P = C["prefix"]
msgs = C["msgs"]
TEMPO = C.get("tempo", 1.08)
BG, PANEL, OUT, IN = (14, 22, 33), (23, 33, 43), (43, 82, 120), (24, 37, 51)
TOP, BOTTOM = 520, 1470  # chat viewport
MAXW = 660
fmsg, fsmall = font(44, REG), font(26, REG)


def is_emoji(tok):
    return any(ord(c) > 0x2500 for c in tok)


def bubble(text, out, hhmm):
    toks = text.split(" ")
    d = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    tw = lambda s: d.textlength(s, font=fmsg)
    lines, cur = [], []
    for tk in toks:
        trial = cur + [tk]
        wdt = sum(52 if is_emoji(x) else tw(x) for x in trial) + tw(" ") * (len(trial) - 1)
        if cur and wdt > MAXW:
            lines.append(cur); cur = [tk]
        else:
            cur = trial
    lines.append(cur)
    lw = [sum(52 if is_emoji(x) else tw(x) for x in l) + tw(" ") * (len(l) - 1) for l in lines]
    w = int(max(max(lw) + 56, 240)); h = int(len(lines) * 56 + 70)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dd = ImageDraw.Draw(im)
    dd.rounded_rectangle((0, 0, w - 1, h - 1), 30, fill=OUT if out else IN)
    y = 22
    for l in lines:
        x = 28
        for tk in l:
            if is_emoji(tk):
                em = emoji(tk, 46); im.alpha_composite(em, (int(x), y + 4)); x += 52
            else:
                dd.text((x, y), tk, font=fmsg, fill="white"); x += tw(tk)
            x += tw(" ")
        y += 56
    meta = hhmm + (" ✓✓" if out else "")
    dd.text((w - 20, h - 14), meta, font=fsmall, fill=(150, 185, 215) if out else (110, 130, 150), anchor="rs")
    return im


# ---- timeline
events = []  # dicts: kind, t, ...
t = 1.3
clock = 41
for i, (side, shown, spoken) in enumerate(msgs):
    if side == "SKIP":
        continue
    if side == "PAUSE":
        events.append(dict(kind="sys", t=t + 0.2, text=C["pause_text"]))
        pause_t = t + 1.4
        clock += 7
        t = pause_t + BANNER_DUR + 0.35
        continue
    clip = load_audio(f"{P}{i:02d}.mp3", TEMPO)
    if side == "g":
        typ = min(0.6, 0.03 * len(shown))
        events.append(dict(kind="type", t=t, end=t + typ, text=shown)); t += typ
    else:
        events.append(dict(kind="dots", t=t, end=t + 0.45)); t += 0.45
    events.append(dict(kind="msg", t=t, out=side == "g", img=bubble(shown, side == "g", f"12:{clock}"), clip=clip))
    t += len(clip) / SR + 0.12
end_t = t + 0.3
total = end_t + 2.4

# ---- audio
buf = np.zeros(int(total * SR) + SR, np.float32)
click, pop_in, pop_out = sfx_click(), sfx_pop(900, 1500), sfx_pop(1300, 700)
for e in events:
    if e["kind"] == "type":
        n = max(3, len(e["text"]) // 2)
        for k in range(n):
            place(buf, click, e["t"] + (e["end"] - e["t"]) * k / n)
    elif e["kind"] == "msg":
        place(buf, pop_out if e["out"] else pop_in, e["t"])
        place(buf, e["clip"], e["t"] + 0.08)
    elif e["kind"] == "sys":
        place(buf, sfx_pop(500, 400, 0.12), e["t"])
place(buf, sfx_pop(600, 1600, 0.25), end_t)
# soft pad: Cmaj7 Am7 Fmaj7 G6, 2.4s each
tt = np.arange(len(buf)) / SR
chords = [[261.6, 329.6, 392.0, 493.9], [220.0, 261.6, 329.6, 392.0], [174.6, 220.0, 261.6, 329.6], [196.0, 246.9, 293.7, 329.6]]
pad = np.zeros_like(buf)
seg = int(2.4 * SR)
for s in range(0, len(buf), seg):
    ch = chords[(s // seg) % 4]
    n = min(seg, len(buf) - s)
    x = np.arange(n) / SR
    env = np.minimum(1, x / 0.4) * np.minimum(1, (n / SR - x) / 0.4)
    pad[s:s + n] = sum(np.sin(2 * np.pi * f / 2 * x) for f in ch) * env
buf += (pad * 0.009).astype(np.float32)
write_wav(P + ".wav", buf)

# ---- static layers
yy, xx = np.mgrid[0:H, 0:W]
pattern = ((xx % 60 < 3) & (yy % 60 < 3))
bgarr = np.zeros((H, W, 3), np.uint8); bgarr[:] = BG; bgarr[pattern] = (24, 34, 46)
bg = Image.fromarray(bgarr).convert("RGBA")
d = ImageDraw.Draw(bg)
text_stroke(d, (W / 2, 210), C["pov"][0], font(62), "white", 7)
text_stroke(d, (W / 2 - 30, 290), C["pov"][1], font(62), "white", 7)
nw = d.textlength(C["pov"][1], font=font(62))
bg.alpha_composite(emoji(C["pov_emoji"], 66), (int(W / 2 - 30 + nw / 2 + 12), 257))
d.rectangle((0, 370, W, 500), fill=PANEL)
d.text((50, 435), "‹", font=font(70, REG), fill=(100, 170, 230), anchor="lm")
d.ellipse((110, 385, 210, 485), fill=(70, 110, 170))
bg.alpha_composite(emoji(C["avatar"], 60), (130, 405))
d.text((235, 415), C["name"], font=font(44), fill="white", anchor="lm")
d.rectangle((0, 1490, W, 1600), fill=PANEL)
d.ellipse((960, 1510, 1030, 1580), fill=(60, 140, 210))
d.polygon([(985, 1525), (985, 1565), (1018, 1545)], fill="white")


def ease(k):
    k = max(0.0, min(1.0, k)); return 1 - (1 - k) ** 3


def frame(t):
    im = bg.copy()
    d = ImageDraw.Draw(im)
    shown = [e for e in events if e["kind"] in ("msg", "sys", "dots") and e["t"] <= t
             and not (e["kind"] == "dots" and t >= e["end"])]
    typing_ai = any(e["kind"] == "dots" for e in shown)
    d.text((235, 462), "печатает..." if typing_ai else "в сети", font=font(30, REG),
           fill=(100, 170, 230), anchor="lm")
    ty = [e for e in events if e["kind"] == "type" and e["t"] <= t < e["end"] + 0.05]
    if ty:
        e = ty[0]; n = int(len(e["text"]) * min(1, (t - e["t"]) / (e["end"] - e["t"])))
        s = e["text"][:n]
        while d.textlength(s, font=font(40, REG)) > 860: s = s[1:]
        d.text((50, 1545), s + ("|" if int(t * 4) % 2 else ""), font=font(40, REG), fill="white", anchor="lm")
    else:
        d.text((50, 1545), "Сообщение", font=font(40, REG), fill=(100, 115, 130), anchor="lm")
    base_bottom = im.crop((0, 1478, W, H))
    # stack from bottom
    items = []
    for e in shown:
        if e["kind"] == "msg": img = e["img"]
        elif e["kind"] == "dots":
            img = Image.new("RGBA", (150, 80), (0, 0, 0, 0)); dd = ImageDraw.Draw(img)
            dd.rounded_rectangle((0, 0, 149, 79), 30, fill=IN)
            for k in range(3):
                a = 0.5 + 0.5 * np.sin(t * 9 - k * 0.9)
                c = int(110 + 100 * a); dd.ellipse((35 + k * 30 - 9, 31, 35 + k * 30 + 9, 49), fill=(c, c, c))
        else:
            fs = font(34)
            tw = int(d.textlength(e["text"], font=fs)) + 60
            img = Image.new("RGBA", (tw, 64), (0, 0, 0, 0)); dd = ImageDraw.Draw(img)
            dd.rounded_rectangle((0, 0, tw - 1, 63), 32, fill=(40, 55, 70))
            dd.text((tw / 2, 32), e["text"], font=fs, fill=(220, 230, 240), anchor="mm")
        items.append((e, img))
    y = BOTTOM
    for e, img in reversed(items):
        k = ease((t - e["t"]) / 0.18)
        y -= int((img.height + 18) * k)
        if y + img.height < TOP - 200: break
        sc = 0.85 + 0.15 * k
        im2 = img.resize((max(1, int(img.width * sc)), max(1, int(img.height * sc)))) if k < 1 else img
        if e["kind"] == "sys": x = (W - im2.width) // 2
        elif e.get("out"): x = W - 40 - im2.width
        else: x = 40
        im.alpha_composite(im2, (x, y))
    # re-cover area above viewport (header + POV stay on top)
    im.paste(bg.crop((0, 0, W, 500)), (0, 0))
    im.paste(base_bottom, (0, 1478))
    d = ImageDraw.Draw(im)
    d.text((235, 462), "печатает..." if typing_ai else "в сети", font=font(30, REG), fill=(100, 170, 230), anchor="lm")
    if t >= end_t:
        k = ease((t - end_t) / 0.3)
        ov = Image.new("RGBA", (W, H), (0, 0, 0, int(170 * k))); im.alpha_composite(ov)
        d = ImageDraw.Draw(im)
        text_stroke(d, (W / 2, 820), C["end"][0], font(76), "white", 8)
        text_stroke(d, (W / 2, 920), C["end"][1], font(76), "white", 8)
        text_stroke(d, (W / 2, 1020), C["end"][2], font(76), (255, 214, 10), 8)
        em = emoji(C["pov_emoji"], int(150 * k) + 1); im.alpha_composite(em, (W // 2 - em.width // 2, 1110))
    return im.convert("RGB")


p = video_writer(P + "_raw.mp4")
frozen = None
for i in range(int(total * FPS)):
    t = i / FPS
    if pause_t <= t < pause_t + BANNER_DUR:
        if frozen is None: frozen = frame(pause_t).tobytes()
        p.stdin.write(frozen)
    else:
        p.stdin.write(frame(t).tobytes())
p.stdin.close(); p.wait()
finalize(P + "_raw.mp4", P + ".wav", pause_t, sys.argv[2])
print("pause", pause_t, "total", total)
