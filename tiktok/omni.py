"""OmniVoice batch TTS (run with the OmniVoice venv python).

    python omni.py jobs.json      # jobs: [{"voice": "me|ai|grandma", "text": "...", "out": "/abs/path/g00"}]

Writes <out>.mp3 and <out>.json (ElevenLabs-style alignment: characters + character_start_times_seconds),
word times from Whisper. Each line is re-generated (up to 3 tries) if Whisper hears it badly.
"""
import difflib, json, os, re, subprocess, sys
import numpy as np, soundfile as sf, torch
from omnivoice import OmniVoice, VoiceClonePrompt
from transformers import pipeline

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 24000
CACHE = os.environ.get("OMNI_CACHE", os.path.expanduser("~/.cache/tiktok-omni"))
# The user's own voice sample (their TikTok video). Kept out of the public repo on purpose.
ME_SRC = os.environ.get("ME_VOICE_SRC", "/root/.claude/uploads/35878073-d42e-5e14-aec9-6f46ff767017/8aa4a430-v09044g40000cbaiph3c77u4f4eicmgg.mp4")
ME_CUT = ("6.4", "16.3")  # cleanest ~10 s of speech in that video
ALIASES = dict(narrator="me", young_m="me", dad="me", man="me", young_f="ai", woman="ai")
TAGS = {"laughs": "laughter", "laughter": "laughter", "sighs": "sigh", "sigh": "sigh"}

norm = lambda s: re.sub(r"[^а-яa-z0-9 ]", "", s.lower().replace("ё", "е")).split()


def clean(text):  # keep only tags OmniVoice knows, drop ElevenLabs-style ones
    return re.sub(r"\[(\w+)\]\s*", lambda m: f"[{TAGS[m.group(1)]}] " if m.group(1) in TAGS else "", text).strip()


def main():
    jobs = json.load(open(sys.argv[1]))
    os.makedirs(CACHE, exist_ok=True)
    torch.set_num_threads(os.cpu_count() or 4)
    model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cpu", dtype=torch.float32, asr_device="cpu")
    asr = pipeline("automatic-speech-recognition", model="openai/whisper-large-v3-turbo", device="cpu")
    prompts = {}

    def prompt(voice):
        voice = ALIASES.get(voice, voice)
        if voice not in prompts:
            pt = os.path.join(CACHE, f"{voice}.pt")
            if not os.path.exists(pt):
                if voice == "me":
                    ref = os.path.join(CACHE, "me_ref.wav")
                    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", ME_CUT[0], "-to", ME_CUT[1], "-i", ME_SRC, "-vn", "-ac", "1",
                                    "-ar", str(SR), ref], check=True)
                    model.create_voice_clone_prompt(ref_audio=ref).save(pt)  # ref_text via Whisper
                else:
                    base = os.path.join(HERE, "assets", "voices", voice)
                    model.create_voice_clone_prompt(ref_audio=base + ".wav", ref_text=open(base + ".txt").read()).save(pt)
            prompts[voice] = VoiceClonePrompt.load(pt)
        return prompts[voice]

    for j in jobs:
        if os.path.exists(j["out"] + ".mp3"):
            continue
        text = clean(j["text"]); plain = re.sub(r"\[\w+\]\s*", "", text)
        best = None
        for _ in range(3):
            a = model.generate(text=text, voice_clone_prompt=prompt(j["voice"]), num_step=16)[0]
            r = asr({"raw": a, "sampling_rate": SR}, return_timestamps="word", generate_kwargs={"language": "russian"})
            sim = difflib.SequenceMatcher(None, norm(plain), norm(r["text"])).ratio()
            if not best or sim > best[0]:
                best = (sim, a, r["chunks"])
            if sim >= 0.8:
                break
        sim, a, chunks = best
        print(f"{os.path.basename(j['out'])} sim={sim:.2f}", flush=True)
        sf.write(j["out"] + ".wav", a, SR)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", j["out"] + ".wav", "-b:a", "192k", j["out"] + ".mp3"], check=True)
        os.remove(j["out"] + ".wav")
        # word start times for the script's own words
        words = plain.split()
        if len(chunks) == len(words):
            starts = [c["timestamp"][0] for c in chunks]
        else:  # word counts differ (numbers etc.): spread by characters over the spoken span
            t0 = chunks[0]["timestamp"][0] if chunks else 0.0
            t1 = (chunks[-1]["timestamp"][1] or len(a) / SR) if chunks else len(a) / SR
            cum = np.cumsum([0] + [len(w) + 1 for w in words])
            starts = [t0 + (t1 - t0) * c / cum[-1] for c in cum[:-1]]
        chars, times = [], []
        for w, st in zip(words, starts):
            if chars:
                chars.append(" "); times.append(st)
            chars += list(w); times += [st] * len(w)
        json.dump({"characters": chars, "character_start_times_seconds": times}, open(j["out"] + ".json", "w"), ensure_ascii=False)


if __name__ == "__main__":
    main()
