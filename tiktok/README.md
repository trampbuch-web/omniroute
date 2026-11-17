# TikTok video pipeline

Builds 1080x1920 videos with a local OmniVoice voice-over (the user's own cloned voice) and the LuxerVPN
banner inserted at pauses. CPU only: a story takes ~15 min of TTS, a chat ~7 min.
`setup_omni.sh` installs the venv on first use (~2 GB); models download from HuggingFace automatically.
Voices: `narrator2` (user's channel narrator, for stories), `me` (user's voice, for the series, cloned from their uploaded video; never commit that sample, the repo is public),
`ai`, `grandma` (synthetic refs in `assets/voices/`). Old ElevenLabs names map to these.
Set `TTS_ENGINE=elevenlabs` to use ElevenLabs instead (free quota is exhausted).

```
python3 tiktok/make.py chat  tiktok/specs/<id>.json <out.mp4>   # POV chat, one ad at the "typing..." pause
python3 tiktok/make.py story tiktok/specs/<id>.json <out.mp4>   # documentary story, ad every ~50 s
```
Exit code 3 = ElevenLabs quota exhausted (only with TTS_ENGINE=elevenlabs).

Banner rules (sponsor): centered, played at 1.1x, full-frame scale (>=25%), chroma key removed,
`#luxerpvn` in the description. All handled by the renderers.

## Specs
See `specs/example_chat.json` and `specs/example_story.json`.

**chat**: `msgs` = `[side, shown_text, spoken_text]`; side `g` = human (right), `a` = AI/other (left),
exactly one `["PAUSE", null, null]` (ad goes there, `pause_text` is shown before it).
`voices`: `{"g": "grandma|dad|young_f|young_m|woman|man", "a": "ai|..."}` (see VOICES in make.py).
`tempo` ~1.1. Aim for ~45 s of speech => ~60-65 s video. Emojis only at the end of a message.
Only `[laughter]` and `[sigh]` tags are voiced; other `[tags]` are dropped. Write numbers as words in spoken text.

**story**: `lines[]` with `ep`, `text`, optional `tag` (serious/dramatic/whispers/curious), `scene`, `sfx`, `stamp`.
A `scene` lasts until the next line that has one: `bg` (blue navy green red dark purple amber teal steel),
`fx` (rain alarm police glow rings shake none), `emoji`, `big` (may contain `{n}` with `count:[from,to]`),
`sub`, or `items` (list cards, one per line). `sfx`: impact glitch coins phone typing siren knock gavel riser whoosh.
`episodes`: title, date, music (m1 tense pulse, m2 hacker beat, m3 dark ambient). ~28 lines / ~90 s narration.
Real events: only well-known, verifiable facts.

## Daily routine (two videos a day, ready by 10:30 MSK)
1. Series episode: «Город, который умер вчера» — read `city/series.md` + the episode's script in `city/PRODUCTION.md`,
   write `specs/city-s01eNN.json` (comic style with characters, see `specs/city-s01e01.json`), build, update `city/series.md`.
   The old «Нолик» series (`series.md`) is finished/replaced — do not continue it.
2. Documentary story (comic style — NO emoji): spec `"style": "comic"`; every scene uses `"prop"` (one of:
   balloon, boat, bomb, building, city, clock, crowd, door, eye, flashlight, folder, gavel, head, island, key, letter, lock, magnifier, money, painting, person, phone, plane, police, prison, question, rain, seat, spoon, suitcase, trees, waves) instead of `emoji`, plus `big` (comic title), `sub` (yellow narration box), `fx`
   (alarm/police/rings/shake), `sfx` (impact/glitch/siren/knock/coins/gavel/phone/typing draw a «БАХ!»-style burst),
   `tag: "dramatic"` adds speed lines. Then: read `history.md`, NEW topic, spec with `"voice": "narrator2", "tempo": 1.28, "gap": 0.1` (fast, tense: short punchy
   sentences of 3-8 words, a twist or sfx every 5-8 s, `tag` "dramatic" on key beats), build, add to `history.md`.
No chat videos. Ads are full-screen (banner scaled to frame width, video behind blacked out) — done by `story.py`.
Send both with ready-to-paste descriptions. Every description: hook line, then an ad mention line
(`Реклама: LuxerVPN — ищи @LuxerVpnBot в Telegram`), then hashtags including `#luxerpvn`. Commit specs + md files to this branch.

## Horror mode (`"horror": true` in a spec)
Scene cuts = rising swell slamming into static + a black flash; lines tagged `dramatic` = stinger hit + red flash, with the
music cut to silence for 0.6 s right before. Extra synthesized SFX (from `sfx_synth.py`): hit, reverse, heartbeat,
static, ring, boom, whisper — use them in `sfx`. The first line must be a scroll-stopping hook (shocking fact in ≤2 s).
