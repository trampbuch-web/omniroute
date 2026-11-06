# edge-tts with word timings: python3 tts_words.py voice rate pitch text out.mp3  -> also writes out.words.json
import asyncio, json, ssl, sys
import os
import edge_tts, edge_tts.communicate as c

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from stress import accent, strip  # noqa: E402

c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")  # agent proxy CA
voice, rate, pitch, text, out = sys.argv[1:6]
text = accent(text)  # stress marks for names and rare words


# Silero (local, free; licence CC BY-NC) for voices given as "silero:<speaker>"
ABBR = {"КПРФ": "ка пэ эр эф", "КПСС": "ка пэ эс эс", "ЛДПР": "эл дэ пэ эр", "ЛДПСС": "эл дэ пэ эс эс",
        "СССР": "эс эс эс эр", "США": "сэ шэ а", "НАТО": "н+ато", "ЦИК": "ц+ик", "ГУМ": "г+ум", "Faberlic": "фаберл+ик"}


def silero(text, speaker, rate, out):
    import re
    import subprocess
    import numpy as np
    import torch

    say = text
    for k, v in ABBR.items():
        say = re.sub(rf"(?<!\w){k}(?!\w)", v, say)
    say = re.sub(r"(\w)\u0301", r"+\1", say)  # our stress mark -> Silero "+" before the vowel
    say = say.replace("«", "").replace("»", "").replace("—", ",")
    imp = torch.package.PackageImporter(os.path.expanduser("~/.cache/silero/v5_2_ru.pt"))
    model = imp.load_pickle("tts_models", "model")
    a = model.apply_tts(text=say, speaker=speaker, sample_rate=48000).numpy()
    tempo = 1 + float(rate.strip("%")) / 100
    raw = out[:-4] + ".raw.wav"
    import wave
    w = wave.open(raw, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000)
    w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", raw, "-af", f"atempo={tempo}", "-ar", "24000", out], check=True)
    os.remove(raw)
    # shortcut: no word timestamps from Silero, so words are spread over the voiced span by vowel count
    dec = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", out, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], check=True, capture_output=True).stdout
    x = np.frombuffer(dec, np.int16).astype(np.float32) / 32768
    hop = 160
    e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    on = np.where(e > max(0.01, e.max() * 0.06))[0]
    t0, t1 = on[0] * hop / 16000, (on[-1] + 1) * hop / 16000
    toks = re.findall(r"[\w\-]+", strip(text))
    wts = [max(1, len(re.findall(r"[аеёиоуыэюяaeiouy]", ABBR.get(w, w).lower()))) for w in toks]
    tot, acc, words = sum(wts), 0, []
    for tkn, wt in zip(toks, wts):
        a0 = t0 + (t1 - t0) * acc / tot
        acc += wt
        words.append([round(a0, 3), round(t0 + (t1 - t0) * acc / tot, 3), tkn])
    json.dump(words, open(out[:-4] + ".words.json", "w"), ensure_ascii=False)


async def main():
    words = []
    com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    with open(out, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, strip(ch["text"])])
    if not words:
        raise SystemExit("no audio")
    json.dump(words, open(out[:-4] + ".words.json", "w"), ensure_ascii=False)


if voice.startswith("silero:"):
    silero(text, voice.split(":", 1)[1], rate, out)
else:
    asyncio.run(main())
