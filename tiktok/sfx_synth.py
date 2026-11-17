"""Synthesises horror SFX into assets/fx_<name>.mp3 (ElevenLabs quota is gone). Run once: python3 tiktok/sfx_synth.py"""
import os, subprocess, numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
rng = np.random.default_rng(13)
t_ = lambda s: np.arange(int(s * SR)) / SR


def save(name, x):
    x = (x / (np.abs(x).max() + 1e-9) * 0.95).astype(np.float32)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "160k",
                    os.path.join(OUT, f"fx_{name}.mp3")], input=x.tobytes(), check=True)


def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, "same")


# stinger: dissonant cluster + sub hit + noise crack, sharp attack, long tail
t = t_(2.6); env = np.exp(-t * 2.2)
cluster = sum(np.sign(np.sin(2 * np.pi * f * t)) * 0.25 + np.sin(2 * np.pi * f * 2.01 * t) * 0.2 for f in (110, 116.5, 155.6, 164.8))
sub = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t * 20)) / SR) * np.exp(-t * 3) * 2.2
crack = rng.standard_normal(len(t)) * np.exp(-t * 30) * 1.2
save("hit", np.tanh((lowpass(cluster, 6) * env + sub + crack) * 1.5))

# reverse swell: noise + rising tone that ends abruptly (place it so it ends on the cut)
t = t_(1.4); k = (t / t[-1]) ** 3
sw = lowpass(rng.standard_normal(len(t)), 3) * k + np.sin(2 * np.pi * np.cumsum(200 + 900 * k) / SR) * k * 0.6
save("reverse", sw)

# heartbeat: two low thumps
t = t_(1.0); hb = np.zeros(len(t))
for st, a in ((0.0, 1.0), (0.22, 0.7)):
    i = int(st * SR); tt = t[: len(t) - i]
    hb[i:] += np.sin(2 * np.pi * np.cumsum(45 + 30 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 14) * a
save("heartbeat", hb)

# static burst
t = t_(0.45); st = rng.standard_normal(len(t)) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 23 * t)))
save("static", (st - lowpass(st, 4)) * np.minimum(1, (0.45 - t) / 0.1))

# tinnitus ring
t = t_(2.0); save("ring", np.sin(2 * np.pi * 4200 * t) * np.minimum(1, t / 0.05) * np.exp(-t * 1.3))

# low boom with long sub tail
t = t_(3.0); save("boom", np.tanh(np.sin(2 * np.pi * np.cumsum(30 + 50 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.1) * 3))

# creepy whisper-like air
t = t_(1.6); w = lowpass(rng.standard_normal(len(t)), 2) - lowpass(rng.standard_normal(len(t)), 40)
save("whisper", w * np.sin(np.pi * t / 1.6) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)))
print("ok")
