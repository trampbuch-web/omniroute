# Mouth shapes from Rhubarb Lip Sync (phonetic recognizer, works for Russian speech).
# frames(wav, D, offset=0) -> per-frame [open 0..1, width factor] at FPS, for the page's mouth.
import json, os, subprocess, urllib.request, zipfile

FPS = 25
VER = "1.13.0"
HOME = os.path.expanduser(os.environ.get("RHUBARB_HOME", "~/.cache/rhubarb"))
BIN = os.path.join(HOME, f"Rhubarb-Lip-Sync-{VER}-Linux", "rhubarb")
# Rhubarb mouth A–H, X (see its README): openness and width of our cartoon mouth
SHAPES = {"A": (0, 1), "B": (0.22, 1), "C": (0.55, 1.05), "D": (0.95, 1.12), "E": (0.5, 0.82),
          "F": (0.28, 0.62), "G": (0.12, 1), "H": (0.42, 1), "X": (0, 1)}


def ensure():
    if os.path.exists(BIN):
        return BIN
    os.makedirs(HOME, exist_ok=True)
    z = os.path.join(HOME, "rhubarb.zip")
    url = f"https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v{VER}/Rhubarb-Lip-Sync-{VER}-Linux.zip"
    urllib.request.urlretrieve(url, z)
    zipfile.ZipFile(z).extractall(HOME)
    os.chmod(BIN, 0o755)
    os.remove(z)
    return BIN


def cues(wav):
    out = subprocess.run([ensure(), "-r", "phonetic", "-f", "json", "-q", wav], check=True, capture_output=True, text=True).stdout
    return json.loads(out)["mouthCues"]


def frames(wav, D, offset=0.0, into=None):
    n = int(D * FPS) + 1
    fr = into if into is not None else [[0, 1] for _ in range(n)]
    for c in cues(wav):
        o, w = SHAPES.get(c["value"], (0, 1))
        for i in range(max(0, int((offset + c["start"]) * FPS)), min(n, int((offset + c["end"]) * FPS))):
            fr[i] = [o, w]
    return fr
