"""Comic-book look for story videos (spec "style": "comic"): ink panels, halftone, speed lines,
narration boxes, SFX bursts and hand-drawn props instead of emoji."""
import os, math, numpy as np
from PIL import Image, ImageDraw, ImageFont

FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "fonts")
_f = {}


def F(name, size):
    k = (name, size)
    if k not in _f:
        _f[k] = ImageFont.truetype(os.path.join(FD, {"hand": "Pangolin-Regular.ttf", "title": "RussoOne-Regular.ttf",
                                                       "sfx": "RubikMonoOne-Regular.ttf"}[name]), size)
    return _f[k]


INK, PAPER, YEL, RED = (12, 12, 16), (246, 238, 220), (255, 222, 60), (226, 36, 40)
PAL = dict(blue=(52, 110, 196), navy=(34, 58, 120), green=(46, 150, 90), red=(206, 46, 46), dark=(58, 54, 70),
           purple=(116, 66, 170), amber=(232, 150, 40), teal=(28, 140, 150), steel=(96, 112, 136))
SFX = dict(impact="БАХ!", glitch="ЩЁЛК!", siren="УИУ-УИУ!", knock="ТУК-ТУК!", coins="ДЗЫНЬ!", gavel="БУМ!",
           phone="ДЗЗЗ!", typing="ТАК-ТАК!")
PW, PH = 1000, 1010  # panel size
OW = 12              # ink width

# ---------- props: flat colours + thick ink, drawn on a 520x520 canvas
SKIN, HAIR, COAT = (240, 196, 160), (70, 46, 30), (60, 64, 80)


def _c():
    im = Image.new("RGBA", (520, 520), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)


def _person(d, hat=True):
    d.polygon([(150, 500), (190, 250), (330, 250), (370, 500)], fill=COAT, outline=INK, width=OW)
    d.polygon([(235, 250), (260, 330), (285, 250)], fill="white", outline=INK, width=6)
    d.ellipse((190, 90, 330, 250), fill=SKIN, outline=INK, width=OW)
    d.line((225, 180, 245, 180), fill=INK, width=8); d.line((275, 180, 295, 180), fill=INK, width=8)
    if hat:
        d.ellipse((140, 110, 380, 160), fill=INK); d.rounded_rectangle((195, 40, 325, 140), 18, fill=INK)
        d.rectangle((195, 105, 325, 125), fill=(150, 30, 30))


def p_person():
    im, d = _c(); _person(d); return im


def p_head():
    im, d = _c()
    d.ellipse((120, 80, 400, 420), fill=SKIN, outline=INK, width=OW)
    d.pieslice((110, 60, 410, 300), 180, 360, fill=HAIR, outline=INK, width=OW)
    for ex in (205, 315):
        d.ellipse((ex - 34, 220, ex + 34, 288), fill="white", outline=INK, width=8); d.ellipse((ex - 12, 242, ex + 12, 266), fill=INK)
    d.ellipse((230, 320, 290, 390), fill=(120, 30, 30), outline=INK, width=8)
    return im


def p_crowd():
    im, d = _c()
    for k, (x, s, c) in enumerate([(90, .8, (80, 80, 96)), (420, .8, (90, 86, 100)), (175, .95, (60, 62, 78)), (345, .95, (66, 60, 74)), (260, 1.1, (44, 46, 58))]):
        h = 230 * s; d.polygon([(x - 80 * s, 510), (x - 55 * s, 510 - h), (x + 55 * s, 510 - h), (x + 80 * s, 510)], fill=c, outline=INK, width=10)
        d.ellipse((x - 48 * s, 510 - h - 100 * s, x + 48 * s, 510 - h + 4), fill=c, outline=INK, width=10)
    return im


def p_prison():
    im, d = _c()
    d.polygon([(60, 140), (60, 40), (520, 60), (520, 150)], fill=(255, 240, 150, 160))  # searchlight
    d.rectangle((40, 200, 500, 470), fill=(150, 150, 160), outline=INK, width=OW)
    for x in range(80, 480, 50):
        d.rectangle((x, 270, x + 26, 400), fill=(40, 40, 50), outline=INK, width=6)
        for bx in (x + 8, x + 18): d.line((bx, 270, bx, 400), fill=(170, 170, 180), width=4)
    d.rectangle((20, 60, 130, 470), fill=(176, 176, 186), outline=INK, width=OW); d.rectangle((10, 40, 140, 80), fill=(120, 120, 130), outline=INK, width=OW)
    d.ellipse((55, 90, 95, 130), fill=YEL, outline=INK, width=8)
    d.rectangle((0, 470, 520, 520), fill=(90, 80, 70), outline=INK, width=OW)
    return im


def p_plane():
    im, d = _c()
    d.polygon([(200, 250), (330, 250), (210, 470), (150, 470)], fill=(200, 205, 215), outline=INK, width=OW)
    d.rounded_rectangle((20, 200, 500, 300), 50, fill=(236, 238, 244), outline=INK, width=OW)
    d.polygon([(400, 200), (470, 70), (510, 70), (480, 210)], fill=(200, 60, 60), outline=INK, width=OW)
    for x in range(90, 400, 46): d.ellipse((x, 228, x + 24, 252), fill=(80, 150, 220), outline=INK, width=5)
    d.pieslice((20, 200, 120, 300), 90, 270, fill=(90, 150, 220), outline=INK, width=OW)
    return im.rotate(12, resample=Image.BICUBIC)


def p_door():
    im, d = _c()
    d.polygon([(130, 470), (390, 470), (470, 520), (50, 520)], fill=(255, 220, 120, 200))
    d.rectangle((130, 30, 390, 470), fill=(140, 82, 48), outline=INK, width=OW)
    d.rectangle((165, 70, 355, 230), outline=INK, width=8); d.rectangle((165, 270, 355, 430), outline=INK, width=8)
    d.ellipse((330, 245, 366, 281), fill=YEL, outline=INK, width=6)
    return im


def p_money():
    im, d = _c()
    for k in range(4):
        y = 330 - k * 46; x = 70 + (k % 2) * 30
        d.rounded_rectangle((x, y, x + 380, y + 150), 16, fill=(110, 190, 110), outline=INK, width=OW)
        d.ellipse((x + 150, y + 35, x + 230, y + 115), fill=(200, 240, 190), outline=INK, width=6)
    d.text((260, 248), "$", font=F("title", 80), fill=INK, anchor="mm")
    return im


def p_phone():
    im, d = _c()
    for r in (60, 110): d.arc((260 - 120 - r, 90 - r, 260 + 120 + r, 430 + r), -40, 40, fill=INK, width=10); d.arc((260 - 120 - r, 90 - r, 260 + 120 + r, 430 + r), 140, 220, fill=INK, width=10)
    d.rounded_rectangle((150, 60, 370, 470), 36, fill=(40, 40, 50), outline=INK, width=OW)
    d.rectangle((172, 110, 348, 410), fill=(90, 170, 240))
    d.text((260, 260), "?", font=F("title", 140), fill="white", anchor="mm")
    return im


def p_letter():
    im, d = _c()
    d.rectangle((60, 140, 460, 400), fill="white", outline=INK, width=OW)
    d.line((60, 140, 260, 290, 460, 140), fill=INK, width=10); d.line((60, 400, 210, 260), fill=INK, width=8); d.line((460, 400, 310, 260), fill=INK, width=8)
    d.ellipse((225, 255, 295, 325), fill=RED, outline=INK, width=8)
    return im


def p_clock():
    im, d = _c()
    d.ellipse((60, 60, 460, 460), fill="white", outline=INK, width=OW + 4)
    for k in range(12):
        a = k * math.pi / 6; d.line((260 + 165 * math.cos(a), 260 + 165 * math.sin(a), 260 + 185 * math.cos(a), 260 + 185 * math.sin(a)), fill=INK, width=10)
    d.line((260, 260, 260, 130), fill=INK, width=14); d.line((260, 260, 360, 300), fill=RED, width=10)
    d.ellipse((240, 240, 280, 280), fill=INK)
    return im


def p_lock():
    im, d = _c()
    d.arc((150, 40, 370, 300), 180, 360, fill=INK, width=60); d.arc((150, 40, 370, 300), 180, 360, fill=(170, 170, 180), width=36)
    d.rounded_rectangle((110, 200, 410, 470), 30, fill=YEL, outline=INK, width=OW)
    d.ellipse((235, 280, 285, 330), fill=INK); d.polygon([(245, 320), (275, 320), (285, 400), (235, 400)], fill=INK)
    return im


def p_waves():
    im, d = _c()
    for row, (y, c) in enumerate([(200, (60, 120, 200)), (300, (40, 96, 180)), (400, (30, 74, 150))]):
        pts = [(x, y + 30 * math.sin(x / 40 + row)) for x in range(0, 521, 10)]
        d.polygon(pts + [(520, 520), (0, 520)], fill=c, outline=INK); d.line(pts, fill="white", width=10)
    return im


def p_city():
    im, d = _c()
    d.ellipse((330, 30, 450, 150), fill=(250, 240, 190), outline=INK, width=OW)
    for x, h in [(10, 240), (110, 330), (210, 200), (300, 380), (400, 260)]:
        d.rectangle((x, 520 - h, x + 100, 520), fill=(40, 40, 62), outline=INK, width=10)
        for wy in range(520 - h + 30, 500, 50):
            for wx in (x + 20, x + 60):
                if (wx + wy) % 3: d.rectangle((wx, wy, wx + 18, wy + 22), fill=YEL)
    return im


def p_magnifier():
    im, d = _c()
    d.line((330, 330, 470, 470), fill=INK, width=60); d.line((330, 330, 470, 470), fill=(140, 80, 40), width=36)
    d.ellipse((60, 60, 360, 360), fill=(190, 225, 250), outline=INK, width=OW + 6); d.arc((100, 100, 320, 320), 200, 250, fill="white", width=16)
    return im


def p_bomb():
    im, d = _c()
    d.ellipse((90, 150, 410, 470), fill=(40, 40, 46), outline=INK, width=OW); d.arc((140, 200, 320, 380), 200, 260, fill=(150, 150, 160), width=14)
    d.rectangle((300, 120, 360, 180), fill=(90, 90, 100), outline=INK, width=8); d.line((330, 120, 380, 60, 430, 70), fill=INK, width=8)
    _star(d, 440, 60, 55, 28, YEL)
    return im


def _star(d, cx, cy, r1, r2, col, n=10):
    pts = [(cx + (r1 if k % 2 == 0 else r2) * math.cos(k * math.pi / n * 1.0), cy + (r1 if k % 2 == 0 else r2) * math.sin(k * math.pi / n)) for k in range(2 * n)]
    d.polygon(pts, fill=col, outline=INK, width=6)


def p_boat():
    im, d = _c()
    d.polygon([(60, 300), (460, 300), (400, 400), (120, 400)], fill=(230, 120, 40), outline=INK, width=OW)
    d.line((260, 300, 260, 80), fill=INK, width=12); d.polygon([(268, 90), (268, 280), (420, 280)], fill="white", outline=INK, width=8)
    pts = [(x, 420 + 20 * math.sin(x / 30)) for x in range(0, 521, 10)]
    d.polygon(pts + [(520, 520), (0, 520)], fill=(40, 96, 180), outline=INK); d.line(pts, fill="white", width=8)
    return im


def p_police():
    im, d = _c()
    for a in range(0, 360, 30):
        r = math.radians(a); d.line((260, 230, 260 + 250 * math.cos(r), 230 + 250 * math.sin(r)), fill=(255, 255, 255, 140), width=14)
    d.pieslice((150, 110, 370, 350), 180, 270, fill=RED, outline=INK, width=OW); d.pieslice((150, 110, 370, 350), 270, 360, fill=(40, 90, 220), outline=INK, width=OW)
    d.rectangle((130, 230, 390, 300), fill=(60, 60, 70), outline=INK, width=OW)
    return im


def p_building():
    im, d = _c()
    d.polygon([(40, 170), (260, 50), (480, 170)], fill=(230, 226, 214), outline=INK, width=OW)
    for x in range(80, 460, 80): d.rectangle((x, 180, x + 40, 420), fill=(240, 236, 226), outline=INK, width=8)
    d.rectangle((40, 420, 480, 460), fill=(200, 196, 186), outline=INK, width=OW); d.rectangle((10, 460, 510, 500), fill=(180, 176, 166), outline=INK, width=OW)
    return im


def p_question():
    im, d = _c(); d.text((260, 260), "?", font=F("title", 420), fill=YEL, anchor="mm", stroke_width=14, stroke_fill=INK); return im


def p_key():
    im, d = _c()
    d.ellipse((40, 170, 220, 350), fill=YEL, outline=INK, width=OW); d.ellipse((95, 225, 165, 295), fill=(0, 0, 0, 0), outline=INK, width=OW)
    d.rectangle((210, 235, 480, 285), fill=YEL, outline=INK, width=OW)
    for x in (380, 440): d.rectangle((x, 280, x + 36, 350), fill=YEL, outline=INK, width=10)
    return im


def p_eye():
    im, d = _c()
    d.polygon([(30, 260)] + [(260 + 230 * math.cos(a), 260 - 150 * math.sin(a)) for a in np.linspace(0, math.pi, 20)][::-1] + [(490, 260)] +
              [(260 + 230 * math.cos(a), 260 + 150 * math.sin(a)) for a in np.linspace(0, math.pi, 20)], fill="white", outline=INK, width=OW)
    d.ellipse((180, 180, 340, 340), fill=(70, 130, 200), outline=INK, width=10); d.ellipse((230, 230, 290, 290), fill=INK); d.ellipse((240, 236, 262, 258), fill="white")
    return im


def p_flashlight():
    im, d = _c()
    d.polygon([(250, 230), (520, 60), (520, 420), (250, 300)], fill=(255, 245, 160, 170))
    d.rounded_rectangle((40, 220, 260, 310), 20, fill=(60, 60, 70), outline=INK, width=OW); d.rectangle((230, 205, 280, 325), fill=(150, 150, 160), outline=INK, width=OW)
    return im


def p_folder():
    im, d = _c()
    d.polygon([(50, 120), (200, 120), (230, 160), (470, 160), (470, 450), (50, 450)], fill=(230, 180, 80), outline=INK, width=OW)
    d.rectangle((90, 190, 430, 420), fill="white", outline=INK, width=8)
    d.rectangle((120, 260, 400, 340), outline=RED, width=10); d.text((260, 300), "СЕКРЕТНО", font=F("title", 42), fill=RED, anchor="mm")
    return im


def p_spoon():
    im, d = _c(); d.line((260, 220, 300, 490), fill=INK, width=44); d.line((260, 220, 300, 490), fill=(190, 190, 200), width=24)
    d.ellipse((180, 40, 330, 250), fill=(200, 200, 210), outline=INK, width=OW); return im


def p_rain():
    im, d = _c()
    for x in range(90, 460, 50): d.line((x, 280, x - 30, 470), fill=(120, 170, 230), width=10)
    for cx, cy, r in [(170, 200, 90), (270, 160, 110), (370, 210, 85)]: d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(150, 156, 170), outline=INK, width=OW)
    d.rectangle((100, 200, 440, 280), fill=(150, 156, 170)); d.line((90, 285, 450, 285), fill=INK, width=OW)
    return im


def p_trees():
    im, d = _c()
    for x, s in [(110, .8), (400, .85), (250, 1.1)]:
        d.rectangle((x - 16 * s, 470 - 60 * s, x + 16 * s, 470), fill=(110, 70, 40), outline=INK, width=8)
        for k in range(3):
            y = 470 - 60 * s - k * 90 * s; d.polygon([(x - 120 * s + k * 25, y), (x + 120 * s - k * 25, y), (x, y - 150 * s)], fill=(40, 120, 70), outline=INK, width=10)
    return im


def p_gavel():
    im, d = _c()
    d.rounded_rectangle((90, 400, 430, 470), 20, fill=(140, 82, 48), outline=INK, width=OW)
    d.line((180, 330, 420, 110), fill=INK, width=44); d.line((180, 330, 420, 110), fill=(160, 98, 58), width=24)
    d.rounded_rectangle((60, 180, 260, 300), 26, fill=(120, 70, 40), outline=INK, width=OW)
    return im.rotate(-10, resample=Image.BICUBIC)


def p_island():
    im, d = _c()
    pts = [(x, 430 + 16 * math.sin(x / 30)) for x in range(0, 521, 10)]
    d.polygon(pts + [(520, 520), (0, 520)], fill=(40, 96, 180), outline=INK)
    d.pieslice((90, 340, 430, 520), 180, 360, fill=(236, 206, 140), outline=INK, width=OW)
    d.line((260, 360, 290, 130), fill=INK, width=30); d.line((260, 360, 290, 130), fill=(140, 90, 50), width=16)
    for a in (200, 240, 290, 330): r = math.radians(a); d.chord((290 - 130, 130 - 60, 290 + 130, 130 + 60), a - 30, a + 30, fill=(40, 140, 70), outline=INK, width=8)
    return im


def p_balloon():
    im, d = _c()
    d.polygon([(170, 360), (120, 480), (250, 380)], fill="white", outline=INK, width=OW)
    d.ellipse((40, 60, 480, 400), fill="white", outline=INK, width=OW); d.polygon([(175, 355), (130, 465), (245, 375)], fill="white")
    d.text((260, 230), "?!", font=F("title", 190), fill=RED, anchor="mm", stroke_width=8, stroke_fill=INK)
    return im


def p_painting():
    im, d = _c()
    d.rectangle((70, 60, 450, 460), fill=(200, 150, 50), outline=INK, width=OW); d.rectangle((115, 105, 405, 415), fill=(90, 110, 80), outline=INK, width=8)
    d.ellipse((205, 150, 315, 280), fill=(210, 170, 120), outline=INK, width=6); d.polygon([(170, 415), (210, 290), (310, 290), (350, 415)], fill=(50, 50, 40), outline=INK, width=6)
    return im


def p_suitcase():
    im, d = _c()
    d.rounded_rectangle((180, 100, 340, 180), 20, outline=INK, width=22)
    d.rounded_rectangle((60, 160, 460, 460), 26, fill=(140, 82, 48), outline=INK, width=OW)
    d.line((60, 260, 460, 260), fill=INK, width=8); d.rectangle((235, 240, 285, 290), fill=YEL, outline=INK, width=6)
    return im


def p_seat():
    im, d = _c()
    d.rounded_rectangle((150, 60, 370, 340), 40, fill=(60, 90, 160), outline=INK, width=OW); d.rounded_rectangle((120, 320, 400, 420), 30, fill=(60, 90, 160), outline=INK, width=OW)
    d.rectangle((160, 420, 190, 500), fill=INK); d.rectangle((330, 420, 360, 500), fill=INK); d.rectangle((180, 70, 340, 130), fill="white", outline=INK, width=6)
    return im


def p_car():
    im, d = _c()
    d.polygon([(40, 330), (120, 230), (380, 230), (470, 330)], fill=(180, 40, 40), outline=INK, width=OW)
    d.rounded_rectangle((20, 320, 500, 420), 30, fill=(200, 50, 50), outline=INK, width=OW)
    d.polygon([(140, 245), (240, 245), (240, 320), (85, 320)], fill=(150, 200, 240), outline=INK, width=8)
    d.polygon([(260, 245), (370, 245), (430, 320), (260, 320)], fill=(150, 200, 240), outline=INK, width=8)
    for x in (130, 390): d.ellipse((x - 60, 370, x + 60, 490), fill=(30, 30, 36), outline=INK, width=OW); d.ellipse((x - 25, 405, x + 25, 455), fill=(170, 170, 180))
    d.ellipse((460, 340, 495, 370), fill=(255, 230, 120), outline=INK, width=5)
    return im


def p_cup():
    im, d = _c()
    for k in range(3):
        x = 200 + k * 50; d.line([(x + 15 * math.sin(y / 20), y) for y in range(60, 200, 10)], fill=(255, 255, 255), width=10)
    d.ellipse((60, 400, 460, 470), fill="white", outline=INK, width=OW)
    d.polygon([(130, 220), (390, 220), (360, 430), (160, 430)], fill="white", outline=INK, width=OW)
    d.arc((340, 250, 450, 360), -90, 90, fill=INK, width=24); d.ellipse((130, 205, 390, 245), fill=(110, 60, 30), outline=INK, width=8)
    return im


def p_screen():
    im, d = _c()
    d.rectangle((30, 60, 490, 400), fill=(30, 30, 36), outline=INK, width=OW)
    r = np.random.default_rng(3)
    for y in range(80, 385, 8):
        g = int(r.integers(60, 200)); d.line((50, y, 470, y), fill=(g, g, int(g * 1.1)), width=5)
    d.rectangle((60, 90, 200, 125), fill=RED); d.text((130, 108), "REC", font=F("title", 26), fill="white", anchor="mm")
    d.rectangle((240, 400, 280, 480), fill=INK); d.rectangle((150, 470, 370, 500), fill=INK)
    return im


def p_watch():
    im, d = _c()
    d.rounded_rectangle((200, 20, 320, 500), 30, fill=(60, 50, 44), outline=INK, width=OW)
    d.ellipse((90, 120, 430, 460), fill=(200, 204, 210), outline=INK, width=OW + 4); d.ellipse((120, 150, 400, 430), fill="white", outline=INK, width=6)
    for k in range(12):
        a = k * math.pi / 6; d.line((260 + 115 * math.cos(a), 290 + 115 * math.sin(a), 260 + 130 * math.cos(a), 290 + 130 * math.sin(a)), fill=INK, width=8)
    d.line((260, 290, 260, 172), fill=INK, width=8); d.line((260, 290, 215, 368), fill=INK, width=13)  # 19:00 exactly
    d.line((330, 200, 400, 140), fill=INK, width=6); d.line((345, 225, 420, 190), fill=INK, width=6)  # cracked glass
    d.ellipse((246, 276, 274, 304), fill=RED)
    return im


def p_calls():
    im, d = _c()
    d.rounded_rectangle((120, 20, 400, 500), 40, fill=(30, 30, 36), outline=INK, width=OW); d.rectangle((140, 70, 380, 450), fill=(240, 242, 246))
    d.text((260, 105), "47 ПРОПУЩЕННЫХ", font=F("title", 24), fill=RED, anchor="mm")
    for k in range(6):
        y = 150 + k * 50; d.line((150, y + 22, 370, y + 22), fill=(210, 210, 216), width=2)
        d.text((160, y), "Марк (я)", font=F("hand", 30), fill=INK); d.text((370, y + 4), "18:59", font=F("hand", 26), fill=(120, 120, 130), anchor="ra")
    return im


def p_sms():
    im, d = _c()
    d.rounded_rectangle((110, 20, 410, 500), 40, fill=(30, 30, 36), outline=INK, width=OW); d.rectangle((130, 70, 390, 450), fill=(18, 22, 30))
    d.text((260, 100), "Марк (я)", font=F("title", 26), fill="white", anchor="mm")
    d.rounded_rectangle((145, 150, 375, 330), 22, fill=(60, 110, 220))
    for k, l in enumerate(["Не выходи", "на улицу", "в 19:00.", "Ты уже", "однажды умер"]):
        d.text((160, 158 + k * 34), l, font=F("hand", 30), fill="white")
    return im


def p_note():
    im, d = _c()
    d.polygon([(70, 90), (450, 60), (470, 440), (90, 470)], fill=(250, 246, 220), outline=INK, width=OW)
    for k, l in enumerate(["Они ушли", "в 19:00.", "Не смотри", "в небо."]): d.text((120, 120 + k * 80), l, font=F("hand", 64), fill=(40, 40, 140))
    return im


def p_capsule():
    im, d = _c()
    d.rectangle((70, 210, 300, 330), fill=(200, 204, 212), outline=INK, width=OW)  # service module
    for x in range(100, 300, 50): d.line((x, 214, x, 326), fill=(150, 154, 162), width=6)
    d.polygon([(30, 230), (70, 250), (70, 290), (30, 310)], fill=(90, 90, 100), outline=INK, width=8)  # engine bell
    d.polygon([(300, 205), (300, 335), (460, 290), (460, 250)], fill=(226, 228, 234), outline=INK, width=OW)  # command module
    d.ellipse((350, 245, 380, 275), fill=(90, 150, 220), outline=INK, width=5)
    d.rectangle((150, 330, 230, 350), fill=(60, 60, 70)); d.polygon([(150, 120), (250, 120), (230, 210), (170, 210)], fill=(230, 200, 80), outline=INK, width=8)  # antenna/panel
    return im


def p_tent():
    im, d = _c()
    d.polygon([(30, 440), (180, 160), (470, 200), (500, 440)], fill=(140, 120, 80), outline=INK, width=OW)
    d.polygon([(30, 440), (180, 160), (250, 440)], fill=(120, 100, 66), outline=INK, width=OW)
    d.line((300, 230, 330, 420), fill=INK, width=8); d.line((330, 230, 360, 420), fill=INK, width=8)  # slits cut from inside
    d.polygon([(300, 230), (330, 420), (345, 420), (318, 230)], fill=(20, 20, 26))
    d.polygon([(0, 440), (520, 440), (520, 520), (0, 520)], fill=(236, 240, 250), outline=INK, width=6)
    d.polygon([(330, 200), (470, 200), (500, 300), (360, 260)], fill=(236, 240, 250))  # half buried in snow
    return im


PROPS = {k[2:]: v for k, v in globals().items() if k.startswith("p_")}
EMOJI2PROP = {"🕴️": "person", "👤": "person", "👷": "person", "🧑‍💻": "person", "👥": "crowd", "✈️": "plane", "🛫": "plane",
              "🚪": "door", "💰": "money", "💵": "money", "💸": "money", "📱": "phone", "✉️": "letter", "⏳": "clock",
              "⏰": "clock", "🔒": "lock", "🔓": "lock", "🌊": "waves", "🌙": "city", "🌆": "city", "🔎": "magnifier",
              "🔍": "magnifier", "💣": "bomb", "🛶": "boat", "🚤": "boat", "🚨": "police", "🏛️": "building",
              "❓": "question", "🔑": "key", "👁": "eye", "🔦": "flashlight", "🗂️": "folder", "📂": "folder", "📄": "folder",
              "😱": "head", "🥄": "spoon", "🌧️": "rain", "🌲": "trees", "⚖️": "gavel", "🏝️": "island", "💬": "balloon",
              "🖼️": "painting", "🧳": "suitcase", "💺": "seat", "🕵️": "magnifier", "🛡️": "lock"}
_pc = {}


def prop(name):
    if name not in _pc:
        _pc[name] = PROPS.get(name, p_question)()
    return _pc[name]


# ---------- panel pieces
_ht = {}


def halftone(col):
    """Panel background: flat colour + darker dot screen toward the bottom-right."""
    if col not in _ht:
        im = Image.new("RGB", (PW, PH), col); d = ImageDraw.Draw(im); dark = tuple(int(c * 0.72) for c in col)
        for y in range(0, PH, 26):
            for x in range((y // 26 % 2) * 13, PW, 26):
                r = 2 + 9 * min(1, ((x / PW) * 0.6 + (y / PH) * 0.8)); d.ellipse((x - r, y - r, x + r, y + r), fill=dark)
        _ht[col] = im.convert("RGBA")
    return _ht[col].copy()


def speed_lines(d, t, cx=PW / 2, cy=PH * 0.45):
    rng = np.random.default_rng(int(t * 10))
    for a in np.linspace(0, 2 * math.pi, 64, endpoint=False):
        a += rng.uniform(-0.03, 0.03); r0 = rng.uniform(330, 430)
        d.polygon([(cx + r0 * math.cos(a), cy + r0 * math.sin(a)), (cx + 900 * math.cos(a - 0.012), cy + 900 * math.sin(a - 0.012)),
                   (cx + 900 * math.cos(a + 0.012), cy + 900 * math.sin(a + 0.012))], fill=(255, 255, 255, 150))


def burst(text, k):
    """SFX starburst with lettering; k = 0..1 pop-in."""
    w = 560; im = Image.new("RGBA", (w, 360), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    pts = []
    for j in range(28):
        a = j * math.pi / 14; r = (170 if j % 2 == 0 else 110)
        pts.append((w / 2 + r * 1.55 * math.cos(a), 180 + r * math.sin(a)))
    d.polygon(pts, fill=YEL, outline=INK, width=10)
    f = F("sfx", 64)
    while d.textlength(text, font=f) > 400: f = F("sfx", f.size - 4)
    d.text((w / 2 + 6, 186), text, font=f, fill=INK, anchor="mm"); d.text((w / 2, 180), text, font=f, fill=RED, anchor="mm", stroke_width=5, stroke_fill=INK)
    s = 0.4 + 0.75 * (1 - (1 - min(1, k * 2.5)) ** 3) - 0.1 * max(0, k * 2.5 - 1)
    return im.resize((max(1, int(w * s)), max(1, int(360 * s)))).rotate(-8, expand=True, resample=Image.BICUBIC)


def narration_box(text):
    f = F("hand", 46); d0 = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    while d0.textlength(text, font=f) > 760 and f.size > 28: f = F("hand", f.size - 2)
    w = int(d0.textlength(text, font=f)) + 60
    im = Image.new("RGBA", (w + 12, 100), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle((12, 12, w + 12, 100), fill=INK); d.rectangle((0, 0, w, 88), fill=YEL, outline=INK, width=6)
    d.text((w / 2, 46), text, font=f, fill=INK, anchor="mm")
    return im


def title_text(d, text, cx, cy, size=120, maxw=900, col=(255, 255, 255)):
    f = F("title", size)
    while d.textlength(text, font=f) > maxw and f.size > 40: f = F("title", f.size - 6)
    d.text((cx + 10, cy + 10), text, font=f, fill=INK, anchor="mm", stroke_width=10, stroke_fill=INK)
    d.text((cx, cy), text, font=f, fill=col, anchor="mm", stroke_width=10, stroke_fill=INK)
