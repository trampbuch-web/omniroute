# Builds one «Тень власти» episode (vertical 9:16, ~60–75 s) from <episode-dir>/episode.json.
# Usage: python3 build.py <episode-dir> [--frames t1,t2,...]
# Voices: OmniVoice (tts_ov.py, needs the venv ~/.cache/ov-venv with `pip install omnivoice`).
import hashlib, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
VC = os.path.join(HERE, "..", "v-centre-rodiny")  # shared host markup and renderer
sys.path[:0] = [VC, os.path.join(HERE, "..")]
import lipsync  # noqa: E402
from host import host_svg  # noqa: E402

EP_DIR = os.path.abspath(sys.argv[1])
FPS, GAP = 25, 0.22
OV_PY = os.path.expanduser("~/.cache/ov-venv/bin/python")
# narrator: a touch lower, chest and presence boosted, compressed, a short dark room behind him
FX_N = "asetrate=24000*0.97,aresample=44100,atempo=1.03,equalizer=f=110:t=q:w=1:g=4,equalizer=f=3200:t=q:w=1.2:g=3,acompressor=threshold=0.09:ratio=4:attack=8:release=160:makeup=2.5,aecho=0.8:0.5:38|71:0.16|0.09"
FX_Q = "aresample=44100,highpass=f=140,lowpass=f=5200,acompressor=threshold=0.1:ratio=3:makeup=2,aecho=0.8:0.4:24:0.12"  # quotes sound like a recording


def sh(*a, **k):
    return subprocess.run(a, check=True, **k)


def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))


ep = json.load(open(os.path.join(EP_DIR, "episode.json")))
seg_dir = os.path.join(EP_DIR, "seg")
NARR_ID = hashlib.md5(open(os.path.join(HERE, "voice", "narrator-ref.wav"), "rb").read()).hexdigest()[:8]
os.makedirs(seg_dir, exist_ok=True)

# 1. voices (cached by voice + text)
jobs, lines = [], []
for s in ep["scenes"]:
    for l in s["lines"]:
        voice = "N" if l[0] == "N" else ep["voices"][l[0]]
        LANG = ep.get("lang", "ru")
        key = voice + (NARR_ID if voice == "N" else "") + (LANG if LANG != "ru" else "") + l[1]  # a new narrator sample re-voices his lines
        raw = os.path.join(seg_dir, hashlib.md5(key.encode()).hexdigest()[:10] + ".wav")
        if not os.path.exists(raw):
            jobs.append({"voice": voice, "text": l[1], "out": raw, "lang": LANG})
        lines.append((s, l, raw))
if jobs:
    jf = os.path.join(seg_dir, "jobs.json")
    json.dump(jobs, open(jf, "w"), ensure_ascii=False)
    sh(OV_PY, os.path.join(HERE, "tts_ov.py"), jf)

CW, CC = ep.get("chunk", [3, 17])  # caption chunk: max words, max letters
# 2. timeline: scenes back to back, each as long as its lines
t, scenes, k, cuts = 0.45, [], 0, []
for s in ep["scenes"]:
    sc = {kk: v for kk, v in s.items() if kk != "lines"}
    sc["t0"], sc["lines"] = round(t - 0.25 if scenes else 0, 3), []
    cuts.append(sc["t0"])
    for l in s["lines"]:
        raw = lines[k][2]
        k += 1
        fx = raw[:-4] + ".fx.wav"
        sh("ffmpeg", "-nostdin", "-v", "error", "-y", "-i", raw, "-af",
           "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse," + (FX_N if l[0] == "N" else FX_Q), "-ar", "44100", "-ac", "1", fx)
        d = dur(fx)
        # shortcut: OmniVoice gives no word timestamps, words are spread over the line by length; use an aligner if captions drift
        words = l[1].split()
        tot = sum(len(w) + 2 for w in words)
        ws, a = [], t
        for w in words:
            b = a + d * (len(w) + 2) / tot
            ws.append([round(a, 3), round(b, 3), w])
            a = b
        chunks, cur = [], []
        for w in ws:
            if cur and (len(cur) == CW or sum(len(x[2]) for x in cur) + len(w[2]) > CC):
                chunks.append(cur)
                cur = []
            cur.append(w)
        chunks.append(cur)
        chunks = [{"t0": c[0][0], "t1": (chunks[j + 1][0][0] if j + 1 < len(chunks) else c[-1][1]), "words": c} for j, c in enumerate(chunks)]
        sc["lines"].append({"who": l[0], "label": l[2] if len(l) > 2 else "", "t0": round(t, 3), "t1": round(t + d, 3), "chunks": chunks, "audio": fx})
        t += d + GAP
    t += s.get("hold", 0.35)
    sc["t1"] = round(t - 0.25, 3)
    scenes.append(sc)
out0 = scenes[-1]["t1"] = round(t, 3)
D = round(out0 + 2.2, 2)  # end card
assert D <= ep.get("max_len", 80), f"episode is {D:.1f} s: shorten the text"

# 3. voice tracks; Rhubarb mouth for the narrator (he is on screen in some scenes)
allL = [l for s in scenes for l in s["lines"]]


def track(sel, out):
    ins = sum([["-i", l["audio"]] for l in sel], [])
    fc = ";".join(f"[{i}]adelay={int(l['t0'] * 1000)}:all=1[a{i}]" for i, l in enumerate(sel))
    fc += ";" + "".join(f"[a{i}]" for i in range(len(sel))) + f"amix=inputs={len(sel)}:normalize=0,apad,atrim=0:{D}[v]"
    sh("ffmpeg", "-nostdin", "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[v]", "-ar", "44100", "-ac", "1", out)


vN, vAll = os.path.join(EP_DIR, "voice-N.wav"), os.path.join(EP_DIR, "voice-all.wav")
track([l for l in allL if l["who"] == "N"], vN)
track(allL, vAll)
n16 = os.path.join(EP_DIR, "voice-N16.wav")
sh("ffmpeg", "-nostdin", "-v", "error", "-y", "-i", vN, "-ar", "16000", n16)
mouth = lipsync.frames(n16, D)

# 4. page
data = {"D": D, "fps": FPS, "out0": out0, "lang": ep.get("lang", "ru"), "wide": ep.get("wide", False), "title": ep["title"], "season": ep["season"], "episode": ep["episode"], "sources": ep.get("sources", []),
        "next": ep.get("next", "СЛЕДУЮЩАЯ СЕРИЯ — ЧЕРЕЗ ДВА ДНЯ"), "mouth": mouth,
        "scenes": [{**s, "lines": [{kk: v for kk, v in l.items() if kk != "audio"} for l in s["lines"]]} for s in scenes]}
page = open(os.path.join(HERE, "shadow.html")).read()
page = page.replace("__SCENES__", open(os.path.join(HERE, "scenes.js")).read()).replace("__HOST__", host_svg()).replace("__EP__", json.dumps(data, ensure_ascii=False))
html_path = os.path.join(EP_DIR, "episode.html")
open(html_path, "w").write(page)
print(f"timeline: {D} s, cuts at", cuts)

if "--frames" in sys.argv:
    sh("node", os.path.join(VC, "shots.mjs"), html_path, os.path.join(EP_DIR, "check"), *sys.argv[sys.argv.index("--frames") + 1].split(","))
    sys.exit(0)

# 5. render + sound: voices, a synthesized score (drone, heartbeat, ticking), a hit on every cut, a door slam to open
video = os.path.join(EP_DIR, "video.mp4")
sh("node", os.path.join(VC, "render.mjs"), html_path, video, str(FPS))
hit = "sine=f=44:d=0.9,volume=1.4,afade=t=out:st=0.03:d=0.85[{p}a];anoisesrc=d=0.16:c=brown:a=0.9,lowpass=f=900,afade=t=out:d=0.16[{p}b];[{p}a][{p}b]amix=inputs=2:normalize=0"
fc = (f"sine=f=55:d={D},volume=0.30[d1];sine=f=82.6:d={D},volume=0.14[d2];sine=f=110.4:d={D},tremolo=f=0.25:d=0.8,volume=0.07[d3];"
      f"sine=f=46:d={D},volume='0.9*exp(-14*mod(t,1.2))':eval=frame[hb];"
      f"anoisesrc=d={D}:c=white:a=0.5,highpass=f=3500,volume='if(lt(mod(t,0.6),0.02),0.5,0)':eval=frame[tk];"
      f"[d1][d2][d3][hb][tk]amix=inputs=5:normalize=0,afade=t=in:d=0.6,afade=t=out:st={D - 1.5}:d=1.5[bed];")
for j, at in enumerate(cuts + [out0]):
    fc += hit.format(p=f"h{j}") + f",volume={1.6 if j == 0 else 0.8},adelay={int(at * 1000)}:all=1[s{j}];"
n = len(cuts) + 1
fc += (f"[0]loudnorm=I=-14:TP=-1.5,apad,atrim=0:{D},asplit[v1][v2];[bed][v1]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=400[bd];"
       + "".join(f"[s{j}]" for j in range(n)) + f"amix=inputs={n}:normalize=0[fx];[v2][bd][fx]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.95[a]")
mix = os.path.join(EP_DIR, "mix.wav")
sh("ffmpeg", "-nostdin", "-v", "error", "-y", "-i", vAll, "-filter_complex", fc, "-map", "[a]", "-t", str(D), "-ar", "44100", "-ac", "2", mix)
final = os.path.join(EP_DIR, f"ten-vlasti-{os.path.basename(EP_DIR)}.mp4")
sh("ffmpeg", "-nostdin", "-v", "error", "-y", "-i", video, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(D), final)
for f in (video, mix, vN, vAll, n16):
    os.remove(f)
print("done:", final)
