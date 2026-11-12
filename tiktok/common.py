import os, subprocess, json, numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, SR = 1080, 1920, 30, 44100
BANNER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "banner.mp4")
BANNER_DUR = 3.9 / 1.1  # banner played at 1.1x
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
_fonts = {}


def font(size, path=BOLD):
    k = (path, size)
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(path, size)
    return _fonts[k]


_emo = {}


def emoji(ch, size):
    k = (ch, size)
    if k not in _emo:
        f = ImageFont.truetype(EMOJI, 109)
        im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((10, 10), ch, font=f, embedded_color=True)
        im = im.crop(im.getbbox()).resize((size, size), Image.LANCZOS)
        _emo[k] = im
    return _emo[k]


def load_audio(path, tempo=1.0):
    af = ["-af", f"atempo={tempo}"] if tempo != 1.0 else []
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, *af, "-f", "f32le", "-ac", "1",
                          "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def place(buf, clip, t, gain=1.0):
    i = int(t * SR)
    n = min(len(clip), len(buf) - i)
    if n > 0:
        buf[i:i + n] += clip[:n] * gain


def words_from_alignment(path, tempo, offset):
    a = json.load(open(path))
    words, cur, st = [], "", None
    for ch, s in zip(a["characters"], a["character_start_times_seconds"]):
        if ch.isspace():
            if cur:
                words.append((cur, st / tempo + offset))
            cur, st = "", None
        else:
            if st is None:
                st = s
            cur += ch
    if cur:
        words.append((cur, st / tempo + offset))
    return words


def sfx_pop(f0=700, f1=1300, dur=0.07):
    t = np.arange(int(dur * SR)) / SR
    f = np.linspace(f0, f1, len(t))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)).astype(np.float32) * 0.5


def sfx_click():
    n = int(0.012 * SR)
    rng = np.random.default_rng(len(_fonts) + n)
    return (rng.uniform(-1, 1, n) * np.exp(-np.arange(n) / (0.002 * SR))).astype(np.float32) * 0.25


def sfx_boom(dur=1.6):
    t = np.arange(int(dur * SR)) / SR
    f = 70 * np.exp(-t * 1.5) + 30
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)).astype(np.float32) * 0.9


def write_wav(path, buf):
    peak = np.abs(buf).max()
    if peak > 0.98:
        buf = buf * (0.98 / peak)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    path], input=buf.astype(np.float32).tobytes(), check=True)


def video_writer(path):
    return subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s",
                             f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast",
                             "-crf", "18", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)


def finalize(video, wav, pause_t, out):
    """Overlay chroma-keyed banner (1.1x speed, full-frame = centered, 100% scale) at pause_t."""
    ms = int(pause_t * 1000)
    fc = (f"[2:v]setpts=PTS/1.1,chromakey=0x00D300:0.16:0.06,despill=type=green,"
          f"setpts=PTS-STARTPTS+{pause_t}/TB[b];"
          f"[0:v][b]overlay=(W-w)/2:(H-h)/2:eof_action=pass[v];"
          f"[2:a]atempo=1.1,adelay={ms}|{ms},volume=1.0[ba];"
          f"[1:a][ba]amix=inputs=2:normalize=0:duration=first[a]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", wav, "-i", BANNER,
                    "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset",
                    "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a",
                    "192k", "-movflags", "+faststart", out], check=True)


def text_stroke(d, xy, txt, f, fill, stroke=8, anchor="mm"):
    d.text(xy, txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0), anchor=anchor)
