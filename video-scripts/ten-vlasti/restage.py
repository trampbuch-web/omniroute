# Re-stage the Shenzhen YouTube episode: more narrator shots, street inserts, the summit table.
# Lines are untouched (TTS cache stays valid); scenes are retyped and split.
import json, sys
KEEP = ("chapter", "place", "stamp", "src")
H = lambda bg: {"type": "host", "bg": bg}
ST = lambda city, **k: {"type": "street", "city": city, **k}
SM = lambda focus=None, **k: {"type": "summit", **({"focus": focus, "active": focus} if focus else {}), **k}
# scene index -> list of (new scene keys or None = keep as is, number of lines)
PLAN = {
    0: [(ST("shenzhen", motorcade=True), 1), (SM(stamp="RECON"), 1)],
    3: [(H("newsroom"), 2), (None, 1)],
    6: [(None, 2), (H("studio"), 1)],
    7: [(ST("moscow"), 2)],
    9: [(ST("washington"), 2), (None, 1)],
    10: [(None, 2), (H("kremlin"), 1)],
    16: [(SM(), 2)],
    17: [(SM("xi"), 1)], 18: [(SM("putin"), 1)], 19: [(SM("trump"), 2)],
    20: [(H("newsroom"), 2)],
    25: [(ST("shenzhen"), 2)],
    26: [(H("studio"), 2)],
    28: [(None, 2), (H("newsroom"), 1)],
    30: [(ST("washington"), 2), (H("skyline"), 1)],
    32: [(H("newsroom"), 2)],
    37: [(H("skyline"), 2)],
}
for d in sys.argv[1:]:
    p = f"{d}/episode.json"
    ep = json.load(open(p))
    recon = "RECONSTRUCTION" if ep.get("lang") == "en" else "РЕКОНСТРУКЦИЯ"
    out = []
    for i, s in enumerate(ep["scenes"]):
        lines, first = list(s["lines"]), True
        for new, n in PLAN.get(i, [(None, len(lines))]):
            if new is None:
                sc = dict(s)
            else:
                sc = {k: s[k] for k in KEEP if k in s}
                sc.update({k: (recon if v == "RECON" else v) for k, v in new.items()})
                if new["type"] == "summit" and "stamp" not in new and not s.get("stamp", "").startswith(("ВЕР", "VER")):
                    sc["stamp"] = recon
            if not first:
                sc.pop("chapter", None)
            sc["lines"], lines, first = lines[:n], lines[n:], False
            out.append(sc)
        assert not lines, (d, i)
    assert [l for s in out for l in s["lines"]] == [l for s in ep["scenes"] for l in s["lines"]]
    ep["scenes"] = out
    json.dump(ep, open(p, "w"), ensure_ascii=False, indent=1)
    print(d, len(out), "scenes:", ", ".join(s["type"] for s in out))
