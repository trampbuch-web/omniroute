"""Build one TikTok video from a spec.

    python3 tiktok/make.py story tiktok/specs/<id>.json <out.mp4>
    python3 tiktok/make.py chat  tiktok/specs/<id>.json <out.mp4>

Voices: ElevenLabs eleven_v3 (auth injected by the proxy). Exit code 3 = ElevenLabs quota exhausted.
"""
import base64, difflib, json, os, re, subprocess, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
API = "https://api.elevenlabs.io/v1"
NARRATOR = "JBFqnCBsd6RMkjVDRZzb"  # George
VOICES = dict(grandma="XrExE9yKIg1WjnnlVkGX", ai="onwK4e9ZLuTAKqWW03F9", dad="pNInz6obpgDQGcFmaJgB",
              young_f="cgSgspJ2msm6clMCkdW9", young_m="TX3LPaxmHKxFdv7VOQHJ", woman="pFZP5JQG7iQjIQuC4Bku",
              man="iP95p4xoKVk53GoZ742B", narrator=NARRATOR)


class QuotaError(Exception):
    pass


def tts(voice, text, out):
    if os.path.exists(out + ".mp3"):
        return
    body = json.dumps({"text": text, "model_id": "eleven_v3", "language_code": "ru",
                       "voice_settings": {"stability": 0.5}}).encode()
    for attempt in range(6):
        req = urllib.request.Request(f"{API}/text-to-speech/{VOICES.get(voice, voice)}/with-timestamps", data=body,
                                     headers={"xi-api-key": "x", "Content-Type": "application/json"})
        try:
            d = json.load(urllib.request.urlopen(req, timeout=180)); break
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")
            if e.code in (401, 402) or "quota" in msg:
                raise QuotaError(msg[:300])
            if e.code != 429 and attempt >= 2:
                raise
            time.sleep(4 * (attempt + 1))
    else:
        raise RuntimeError("TTS failed after retries")
    open(out + ".mp3", "wb").write(base64.b64decode(d["audio_base64"]))
    json.dump(d["alignment"], open(out + ".json", "w"), ensure_ascii=False)


def similarity(path, text):
    r = subprocess.run(["curl", "-sS", "-X", "POST", f"{API}/speech-to-text", "-H", "xi-api-key: x", "-F", "model_id=scribe_v1",
                        "-F", f"file=@{path}", "-F", "language_code=ru"], capture_output=True, text=True)
    try:
        heard = json.loads(r.stdout)["text"]
    except Exception:
        return 1.0  # STT unavailable: don't block the build
    norm = lambda s: re.sub(r"[^а-яa-z0-9 ]", "", re.sub(r"\[.*?\]", "", s.lower()).replace("ё", "е")).split()
    return difflib.SequenceMatcher(None, norm(text), norm(heard)).ratio()


def speak_checked(voice, text, out):
    tts(voice, text, out)
    if similarity(out + ".mp3", text) < 0.75:  # v3 sometimes drops/invents words: regenerate once
        os.remove(out + ".mp3"); tts(voice, text, out)


def main():
    kind, spec_path, out = sys.argv[1], os.path.abspath(sys.argv[2]), os.path.abspath(sys.argv[3])
    spec = json.load(open(spec_path))
    work = os.path.join(os.path.dirname(out), "work_" + os.path.splitext(os.path.basename(out))[0])
    os.makedirs(work, exist_ok=True); os.chdir(work)
    try:
        if kind == "story":
            for i, ln in enumerate(spec["lines"]):
                tag = f"[{ln['tag']}] " if ln.get("tag") else ""
                speak_checked(spec.get("voice", "narrator"), tag + ln["text"], f"g{i:02d}")
        else:
            for i, (side, shown, spoken) in enumerate(spec["msgs"]):
                if spoken:
                    speak_checked(spec["voices"][side], spoken, f"{spec['prefix']}{i:02d}")
    except QuotaError as e:
        print("ELEVENLABS_QUOTA_EXHAUSTED:", e); sys.exit(3)
    subprocess.run([sys.executable, os.path.join(HERE, f"{kind}.py"), spec_path, out], check=True)
    print("OK", out)


if __name__ == "__main__":
    main()
