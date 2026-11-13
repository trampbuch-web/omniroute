# Builds one «Весь дом в курсе» episode (vertical 9:16) from <episode-dir>/episode.json.
# Usage: python3 build.py <episode-dir> [--frames t1,t2,...]   (--frames: only screenshots for a check)
import json, os, subprocess, sys, time, zlib

HERE = os.path.dirname(os.path.abspath(__file__))
VC = os.path.join(HERE, "..", "v-centre-rodiny")  # shared host markup, TTS with word timings, renderer
sys.path[:0] = [VC, os.path.join(HERE, "..")]
import lipsync  # noqa: E402
from host import host_svg  # noqa: E402

EP_DIR = os.path.abspath(sys.argv[1])
FPS = 25
# the host keeps his usual voice; neighbours are the two free Russian voices with their own pitch and pace
VOICES = {"H": ("ru-RU-DmitryNeural", "+15%", "+8Hz"), "Z": ("ru-RU-SvetlanaNeural", "-4%", "-14Hz"),
          "T": ("ru-RU-DmitryNeural", "-2%", "-20Hz"), "K": ("ru-RU-SvetlanaNeural", "+16%", "+18Hz"),
          "G": ("ru-RU-DmitryNeural", "+8%", "+24Hz"), "P": ("ru-RU-SvetlanaNeural", "+12%", "+42Hz"),
          "B": ("ru-RU-SvetlanaNeural", "-10%", "+30Hz")}
RESIDENT = {1: "Z", 2: "T", 3: "K", 4: "G", 5: "P", "roof": "B"}
GAP = 0.28


def sh(*a, **k):
    return subprocess.run(a, check=True, **k)


ep = json.load(open(os.path.join(EP_DIR, "episode.json")))
seg_dir = os.path.join(EP_DIR, "seg")
os.makedirs(seg_dir, exist_ok=True)
stops = ep["stops"]
assert stops[-1]["floor"] == "roof", "the last stop is the roof (the cat closes the loop)"
for s in stops:
    for who, _ in s["lines"]:
        assert who in ("H", RESIDENT[s["floor"]]), f"floor {s['floor']} is home to {RESIDENT[s['floor']]}, not {who}"

# 1. voices with word timings (edge-tts is flaky: retry)
script = [("H", ep["hook_say"])] + [tuple(l) for s in stops for l in s["lines"]]
items = []
for i, (who, txt) in enumerate(script):
    mp3, meta = os.path.join(seg_dir, f"{i}.mp3"), os.path.join(seg_dir, f"{i}.txt")
    key = " ".join(VOICES[who]) + who + txt
    if not (os.path.exists(mp3) and os.path.exists(meta) and open(meta).read() == key):
        for _ in range(12):
            if subprocess.run(["python3", os.path.join(VC, "tts_words.py"), *VOICES[who], txt, mp3], capture_output=True).returncode == 0:
                break
            time.sleep(5)
        else:
            raise SystemExit(f"tts failed: {txt}")
        open(meta, "w").write(key)
    items.append((who, mp3, json.load(open(mp3[:-4] + ".words.json"))))


def place(k, t):
    """Line k starts speaking at t -> timed line with caption chunks."""
    who, mp3, words = items[k]
    st = t - words[0][0]
    ws = [[round(st + a, 3), round(st + b, 3), w] for a, b, w in words]
    chunks, cur = [], []
    for w in ws:
        if cur and (len(cur) == 3 or sum(len(x[2]) for x in cur) + len(w[2]) > 15):
            chunks.append(cur)
            cur = []
        cur.append(w)
    chunks.append(cur)
    chunks = [{"t0": c[0][0], "t1": (chunks[j + 1][0][0] if j + 1 < len(chunks) else c[-1][1]), "words": c} for j, c in enumerate(chunks)]
    return {"who": who, "t0": ws[0][0], "t1": ws[-1][1], "chunks": chunks, "audio": mp3, "at": round(st, 3)}


# 2. timeline: hook over the whole house -> dive to the first stop -> ride / talk ... -> roof -> pull back (loop)
intro = place(0, 0.12)
t = max(1.6, intro["t1"] - 0.35)
segs, k, prev = [], 1, None
sfx = []  # (time, kind)
for s in stops:
    fl = s["floor"]
    if prev is None:
        ride = [round(t, 3), round(t + 0.95, 3)]  # camera dive from the wide shot
        sfx.append((t, "whoosh"))
    else:
        n = (5 if fl == "roof" else fl) - prev + (1 if fl == "roof" else 0)
        ride = [round(t, 3), round(t + 0.8 + 0.28 * (abs(n) - 1), 3)]
        sfx.append((t, "hum:%.2f" % (ride[1] - ride[0])))
    t = ride[1]
    if fl != "roof":
        sfx.append((t - 0.05, "ding"))
    t += 0.3
    seg = {"floor": fl, "who": RESIDENT[fl], "ride": ride, "card": s.get("card"), "lines": []}
    for _ in s["lines"]:
        seg["lines"].append(place(k, t))
        t = seg["lines"][-1]["t1"] + GAP
        k += 1
    seg["t0"], seg["t1"] = ride[0], round(t, 3)
    segs.append(seg)
    prev = 5 if fl == "roof" else fl
out0 = round(t + 0.7, 3)  # hold on the cat so its «translation» can be read, then pull back to the first frame
sfx.append((out0, "whoosh"))
D = round(out0 + 2.3, 2)
MAX_LEN = ep.get("max_len", 60)
assert D <= MAX_LEN, f"episode is {D:.1f} s, must be <= {MAX_LEN} s: shorten the text"

# 3. one voice track per speaker + Rhubarb mouth shapes
lines = [intro] + [l for s in segs for l in s["lines"]]
mouth, tracks = {}, []
for who in VOICES:
    mine = [l for l in lines if l["who"] == who]
    if not mine:
        continue
    out = os.path.join(EP_DIR, f"voice-{who}.wav")
    ins = sum([["-i", l["audio"]] for l in mine], [])
    fc = ";".join(f"[{i}]adelay={int(l['at'] * 1000)}:all=1[a{i}]" for i, l in enumerate(mine))
    fc += ";" + "".join(f"[a{i}]" for i in range(len(mine))) + f"amix=inputs={len(mine)}:normalize=0,apad,atrim=0:{D}[v]"
    sh("ffmpeg", "-nostdin", "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[v]", "-ar", "16000", "-ac", "1", out)
    mouth[who] = lipsync.frames(out, D)
    tracks.append(out)

# 4. page
host = host_svg().replace(">ВЦР<", ">ДОМ<")
data = {"D": D, "fps": FPS, "seed": zlib.crc32(ep["date"].encode()) % 2147483646 + 1, "date": ep["date"], "mouth": mouth,
        "hook": ep["hook"], "cta": ep.get("cta", "ПОДПИШИСЬ — ЗАВТРА ЛИФТ ПОЕДЕТ СНОВА"), "out0": out0,
        "intro": {k2: v for k2, v in intro.items() if k2 not in ("audio", "at")},
        "segs": [{**s, "lines": [{k2: v for k2, v in l.items() if k2 not in ("audio", "at")} for l in s["lines"]]} for s in segs]}
page = open(os.path.join(HERE, "dom.html")).read()
page = page.replace("__HOUSE__", open(os.path.join(HERE, "house.js")).read()).replace("__HOST__", host).replace("__EP__", json.dumps(data, ensure_ascii=False))
html_path = os.path.join(EP_DIR, "episode.html")
open(html_path, "w").write(page)
print(f"timeline: {D} s, stops at", [s["ride"][1] for s in segs])

if "--frames" in sys.argv:
    ts = sys.argv[sys.argv.index("--frames") + 1]
    sh("node", os.path.join(VC, "shots.mjs"), html_path, os.path.join(EP_DIR, "check"), *ts.split(","))
    sys.exit(0)

# 5. render + mix: voices, lift sounds, quiet music bed ducked under the speech
video = os.path.join(EP_DIR, "video.mp4")
sh("node", os.path.join(VC, "render.mjs"), html_path, video, str(FPS))
SFX = {"ding": "sine=f=1318:d=0.9,volume=0.5,afade=t=out:st=0.05:d=0.85[x1];sine=f=1046:d=0.9,adelay=180:all=1,volume=0.5,afade=t=out:st=0.25:d=0.65[x2];[x1][x2]amix=inputs=2:normalize=0",
       "whoosh": "anoisesrc=d=0.9:c=pink:a=0.6,bandpass=f=900:w=700,afade=t=in:d=0.45,afade=t=out:st=0.45:d=0.45,volume=1.6"}
ins, fc = sum([["-i", x] for x in tracks], []), ""
nv = len(tracks)
for j, (at, kind) in enumerate(sfx):
    if kind.startswith("hum:"):
        d = float(kind[4:])
        src = f"sine=f=74:d={d},volume=0.9,afade=t=in:d=0.2,afade=t=out:st={d - 0.25:.2f}:d=0.25[h1];anoisesrc=d={d}:c=brown:a=0.5,lowpass=f=420,afade=t=in:d=0.2,afade=t=out:st={d - 0.25:.2f}:d=0.25[h2];[h1][h2]amix=inputs=2:normalize=0"
    else:
        src = SFX[kind]
    src = src.replace("[x", f"[x{j}_").replace("[h", f"[h{j}_")  # unique pad names per sound
    fc += f"{src},adelay={int(max(0, at) * 1000)}:all=1[s{j}];"
bed = os.path.join(HERE, "..", "udar-v-mozg", "music-bed.m4a")
fc += "".join(f"[{i}]" for i in range(nv)) + f"amix=inputs={nv}:normalize=0,loudnorm=I=-15:TP=-1.5,apad,atrim=0:{D}[v];[v]asplit[v1][v2];" \
      f"[{nv}]atrim=start=4,asetpts=PTS-STARTPTS,volume=0.5,afade=t=out:st={D - 1.2}:d=1.2[m];[m][v1]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=350[md];" \
      + "".join(f"[s{j}]" for j in range(len(sfx))) + f"amix=inputs={len(sfx)}:normalize=0,volume=0.5[fx];" \
      f"[v2][md][fx]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.95[a]"
mix = os.path.join(EP_DIR, "mix.wav")
sh("ffmpeg", "-nostdin", "-v", "error", "-y", *ins, "-i", bed, "-filter_complex", fc, "-map", "[a]", "-t", str(D), "-ar", "44100", "-ac", "2", mix)
final = os.path.join(EP_DIR, f"ves-dom-{os.path.basename(EP_DIR)}.mp4")
sh("ffmpeg", "-nostdin", "-v", "error", "-y", "-i", video, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(D), final)
for f in [video, mix] + tracks:
    os.remove(f)
print("done:", final)
