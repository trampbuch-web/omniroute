# Builds one «В центре Родины» episode (vertical, <=60 s) from <episode-dir>/episode.json.
# Usage: python3 build.py <episode-dir> [--frames t1,t2,...]   (--frames: only screenshots for a check)
import json, os, re, subprocess, sys, time, wave, zlib

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
EP_DIR = os.path.abspath(sys.argv[1])
FPS = 25
MAX_LEN = 60.0
VOICES = {"H": ("ru-RU-DmitryNeural", "+15%", "+8Hz"), "P": ("ru-RU-SvetlanaNeural", "+10%", "+4Hz")}
LEAD = {"coffee": 1.3, "eat": 1.3}  # silent sip / bite before he talks
GAP_LINE, GAP_SEG = 0.3, 0.45


def sh(*a, **k):
    return subprocess.run(a, check=True, **k)


def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))


ep = json.load(open(os.path.join(EP_DIR, "episode.json")))
if ep.get("voice_h"):
    VOICES["H"] = tuple(ep["voice_h"])  # e.g. ["silero:aidar", "+15%", "+0Hz"]
seg_dir = os.path.join(EP_DIR, "seg")
os.makedirs(seg_dir, exist_ok=True)

# 1. voices with word timings (edge-tts is flaky: retry)
items = []
for s in ep["segments"]:
    for who, txt in s["lines"]:
        i = len(items)
        mp3 = os.path.join(seg_dir, f"{i}.mp3")
        meta = os.path.join(seg_dir, f"{i}.txt")
        if not (os.path.exists(mp3) and os.path.exists(meta) and open(meta).read() == " ".join(VOICES[who]) + who + txt):
            for k in range(12):
                if subprocess.run(["python3", os.path.join(HERE, "tts_words.py"), *VOICES[who], txt, mp3], capture_output=True).returncode == 0:
                    break
                time.sleep(5)  # edge-tts drops requests in bursts
            else:
                raise SystemExit(f"tts failed: {txt}")
            open(meta, "w").write(" ".join(VOICES[who]) + who + txt)
        items.append((who, mp3, json.load(open(mp3[:-4] + ".words.json"))))

# 2. timeline
t = 0.4
segs, places, k = [], [], 0
for s in ep["segments"]:
    seg = {k2: s[k2] for k2 in ("loc", "action", "place") if k2 in s}
    seg["card"] = s.get("card")
    seg["t0"] = round(t, 3)
    seg["lead"] = LEAD.get(s["action"], 0)
    t += seg["lead"]
    seg["lines"] = []
    for _ in s["lines"]:
        who, mp3, words = items[k]
        k += 1
        st = t - words[0][0]  # audio placed so the first word lands at t
        ws = [[round(st + a, 3), round(st + b, 3), w] for a, b, w in words]
        chunks, cur = [], []
        for w in ws:
            if cur and (len(cur) == 3 or sum(len(x[2]) for x in cur) + len(w[2]) > 16):
                chunks.append(cur)
                cur = []
            cur.append(w)
        chunks.append(cur)
        chunks = [{"t0": c[0][0], "t1": (chunks[j + 1][0][0] if j + 1 < len(chunks) else c[-1][1]), "words": c} for j, c in enumerate(chunks)]
        seg["lines"].append({"who": who, "t0": ws[0][0], "t1": ws[-1][1], "chunks": chunks, "audio": mp3, "at": round(st, 3)})
        t = ws[-1][1] + GAP_LINE
    t += GAP_SEG - GAP_LINE
    seg["t1"] = round(t, 3)
    segs.append(seg)
D = round(t + 0.6, 2)
segs[-1]["t1"] = D
MAX_LEN = ep.get("max_len", MAX_LEN)
assert D <= MAX_LEN, f"episode is {D:.1f} s, must be <= {MAX_LEN} s: shorten the text"

# 3. voice tracks per speaker + lip-sync envelope
lines = [l for s in segs for l in s["lines"]]
env, mouth = {}, {}
sys.path.insert(0, os.path.join(HERE, ".."))
import lipsync  # noqa: E402
for who in ("H", "P"):
    mine = [l for l in lines if l["who"] == who]
    out = os.path.join(EP_DIR, f"voice-{who}.wav")
    if not mine:
        continue
    ins = sum([["-i", l["audio"]] for l in mine], [])
    fc = ";".join(f"[{i}]adelay={int(l['at'] * 1000)}:all=1[a{i}]" for i, l in enumerate(mine))
    fc += ";" + "".join(f"[a{i}]" for i in range(len(mine))) + f"amix=inputs={len(mine)}:normalize=0,apad,atrim=0:{D}[v]"
    sh("ffmpeg", "-nostdin", "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[v]", "-ar", "16000", "-ac", "1", out)
    w = wave.open(out)
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    hop = 16000 // FPS
    rms = np.sqrt(np.array([np.mean(a[i * hop:(i + 1) * hop] ** 2) for i in range(len(a) // hop)]))
    ref = np.percentile(rms[rms > 1e-4], 90) if (rms > 1e-4).any() else 1
    e = np.clip(rms / ref, 0, 1.2)
    e = np.convolve(e, [0.25, 0.5, 0.25], "same")  # soften frame-to-frame jitter
    env[who] = [round(float(x), 3) for x in e]
    mouth[who] = lipsync.frames(out, D)  # Rhubarb mouth shapes for real lip-sync

# 4. page
from host import host_svg  # noqa: E402
host = host_svg()

data = {"D": D, "fps": FPS, "seed": zlib.crc32(ep["date"].encode()) % 2147483646 + 1, "env": env, "mouth": mouth, "brand": ep.get("brand"), "credit": ep.get("credit"), "punch": ep.get("punch", False),
        "segs": [{**s, "lines": [{k2: v for k2, v in l.items() if k2 not in ("audio", "at")} for l in s["lines"]]} for s in segs]}
page = open(os.path.join(HERE, "city.html")).read()
page = page.replace("__HOST__", host).replace("__SCENES__", open(os.path.join(HERE, "scenes.js")).read()).replace("__EP__", json.dumps(data, ensure_ascii=False))
html_path = os.path.join(EP_DIR, "episode.html")
open(html_path, "w").write(page)
print(f"timeline: {D} s, segments at", [s["t0"] for s in segs])

if "--frames" in sys.argv:
    ts = sys.argv[sys.argv.index("--frames") + 1]
    sh("node", os.path.join(HERE, "shots.mjs"), html_path, os.path.join(EP_DIR, "check"), *ts.split(","))
    sys.exit(0)

# 5. render + mix (voices, quiet music bed under them)
video = os.path.join(EP_DIR, "video.mp4")
sh("node", os.path.join(HERE, "render.mjs"), html_path, video, str(FPS))
inputs = ["-i", os.path.join(EP_DIR, "voice-H.wav")] + (["-i", os.path.join(EP_DIR, "voice-P.wav")] if "P" in env else [])
nv = len(inputs) // 2
bed = os.path.join(HERE, "..", "udar-v-mozg", "music-bed.m4a")
fc = "".join(f"[{i}]" for i in range(nv)) + f"amix=inputs={nv}:normalize=0,loudnorm=I=-15:TP=-1.5,apad,atrim=0:{D}[v];[v]asplit[v1][v2];" \
     f"[{nv}]atrim=start=4,asetpts=PTS-STARTPTS,volume=0.55,afade=t=out:st={D - 1.5}:d=1.5[m];[m][v1]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=350[md];" \
     f"[v2][md]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]"
mix = os.path.join(EP_DIR, "mix.wav")
sh("ffmpeg", "-nostdin", "-v", "error", "-y", *inputs, "-i", bed, "-filter_complex", fc, "-map", "[a]", "-t", str(D), "-ar", "44100", "-ac", "2", mix)
final = os.path.join(EP_DIR, f"{ep.get('slug', 'v-centre-rodiny')}-{os.path.basename(EP_DIR)}.mp4")
sh("ffmpeg", "-nostdin", "-v", "error", "-y", "-i", video, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(D), final)
for f in (video, mix, os.path.join(EP_DIR, "voice-H.wav"), os.path.join(EP_DIR, "voice-P.wav")):
    if os.path.exists(f):
        os.remove(f)
print("done:", final)
