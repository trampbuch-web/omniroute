# OmniVoice (k2-fsa, Apache-2.0) for «Тень власти». Run with the venv that has `omnivoice`:
#   ~/.cache/ov-venv/bin/python tts_ov.py jobs.json
# jobs.json: [{"voice": "N" | "<voice-design tags>", "text": ..., "out": "x.wav"}, ...]
# "N" = the narrator: the channel owner's own voice, cloned from voice/narrator-ref.wav with his consent.
# Any other voice is a synthetic one designed from tags ("male, elderly, low pitch") — never a clone of a real person.
import json, os, sys

import soundfile as sf
import torch
from omnivoice import OmniVoice

HERE = os.path.dirname(os.path.abspath(__file__))
jobs = json.load(open(sys.argv[1]))
model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cpu", dtype=torch.float32)
ref = os.path.join(HERE, "voice", "narrator-ref.wav")
ref_text = open(os.path.join(HERE, "voice", "narrator-ref.txt")).read().strip()
for j in jobs:
    kw = {"ref_audio": ref, "ref_text": ref_text} if j["voice"] == "N" else {"instruct": j["voice"]}
    audio = model.generate(text=j["text"], language=j.get("lang", "ru"), **kw)
    sf.write(j["out"], audio[0], model.sampling_rate)
    print("ok", j["out"], flush=True)
