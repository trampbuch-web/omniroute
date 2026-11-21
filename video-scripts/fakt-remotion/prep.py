# Prepares one «Интересный факт» episode for the Remotion project:
# voice (edge-tts, Dmitry) with word timings, Rhubarb mouth shapes, SFX, data.json.
# Usage: python3 prep.py <slug>   (reads ../interesny-fakt/<slug>/episode2.json, writes public/<slug>/)
import json, os, re, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
VS = os.path.dirname(HERE)
sys.path.insert(0, VS)
import lipsync  # noqa: E402

FPS = 30
VOICE = ("ru-RU-DmitryNeural", "+15%", "+8Hz")  # the channel voice, do not change
slug = sys.argv[1]
ep = json.load(open(os.path.join(VS, "interesny-fakt", slug, "episode2.json")))
out = os.path.join(HERE, "public", slug)
os.makedirs(out, exist_ok=True)


def sh(*a):
    subprocess.run(a, check=True, capture_output=True)


def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))


# 1. voice lines
t = 0.5
segs, mouth_src = [], []
for si, s in enumerate(ep["segments"]):
    seg = {k: v for k, v in s.items() if k != "say"}
    t += s.get("pause", 0.35 if si else 0)
    seg["start"] = round(t * FPS)
    mp3 = os.path.join(out, f"v{si}.mp3")
    meta = mp3 + ".txt"
    if not (os.path.exists(mp3) and os.path.exists(meta) and open(meta).read() == s["say"]):
        for k in range(12):
            if subprocess.run(["python3", os.path.join(VS, "v-centre-rodiny", "tts_words.py"), *VOICE, s["say"], mp3], capture_output=True).returncode == 0:
                break
            time.sleep(5)  # edge-tts drops requests in bursts
        else:
            raise SystemExit("tts failed: " + s["say"])
        open(meta, "w").write(s["say"])
    words = json.load(open(mp3[:-4] + ".words.json"))
    at = t - words[0][0]  # first word lands at t
    seg["voice"] = {"src": f"{slug}/v{si}.mp3", "from": round(at * FPS)}
    seg["words"] = [[round((at + a) * FPS), round((at + b) * FPS), w] for a, b, w in words]
    t = at + words[-1][1]
    seg["end"] = round((t + 0.3) * FPS)
    mouth_src.append((mp3, at))
    segs.append(seg)
D = round((t + 1.4) * FPS)

# 2. lip-sync: one mono track, Rhubarb shapes per frame
voice = os.path.join(out, "voice.wav")
ins = sum([["-i", m] for m, _ in mouth_src], [])
fc = ";".join(f"[{i}]adelay={int(a * 1000)}:all=1[a{i}]" for i, (_, a) in enumerate(mouth_src))
fc += ";" + "".join(f"[a{i}]" for i in range(len(mouth_src))) + f"amix=inputs={len(mouth_src)}:normalize=0,apad,atrim=0:{D / FPS}[v]"
sh("ffmpeg", "-nostdin", "-y", *ins, "-filter_complex", fc, "-map", "[v]", "-ar", "16000", "-ac", "1", voice)
lipsync.FPS = FPS
mouth = lipsync.frames(voice, D / FPS)
os.remove(voice)

# 3. sound effects, synthesised once (no third-party samples)
sfx_dir = os.path.join(HERE, "public", "sfx")
os.makedirs(sfx_dir, exist_ok=True)
SFX = {
    "whoosh": "anoisesrc=d=0.5:c=pink:a=0.6,highpass=f=300,lowpass=f=4000,afade=t=in:d=0.18,afade=t=out:st=0.2:d=0.3,volume=0.9",
    "pop": "sine=f=880:d=0.09,afade=t=out:st=0.02:d=0.07,volume=0.7",
    "ding": "sine=f=1318:d=0.6,afade=t=out:st=0.05:d=0.55,volume=0.45",
    "tick": "sine=f=2200:d=0.03,afade=t=out:st=0.005:d=0.025,volume=0.35",
}
for name, f in SFX.items():
    p = os.path.join(sfx_dir, f"{name}.wav")
    if not os.path.exists(p):
        sh("ffmpeg", "-nostdin", "-y", "-f", "lavfi", "-i", f, "-ar", "44100", p)
bed = os.path.join(HERE, "public", "music-bed.m4a")
if not os.path.exists(bed):
    sh("cp", os.path.join(VS, "udar-v-mozg", "music-bed.m4a"), bed)

json.dump({"fps": FPS, "durationInFrames": D, "segs": segs, "mouth": [[round(o, 2), round(w, 2)] for o, w in mouth],
           "brand": ep.get("brand", "ИНТЕРЕСНЫЙ ФАКТ")}, open(os.path.join(out, "data.json"), "w"), ensure_ascii=False)
print(f"{slug}: {D / FPS:.1f} s, {len(segs)} segments")
