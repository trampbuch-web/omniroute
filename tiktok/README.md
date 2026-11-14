# TikTok video pipeline

Builds 1080x1920 videos with a local OmniVoice voice-over (the user's own cloned voice) and the LuxerVPN
banner inserted at pauses. CPU only: a story takes ~15 min of TTS, a chat ~7 min.
`setup_omni.sh` installs the venv on first use (~2 GB); models download from HuggingFace automatically.
Voices: `me` (user's voice, cloned from their uploaded video; never commit that sample, the repo is public),
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

## Daily routine (scheduled 11:30 and 18:00 MSK)
1. Read `history.md`, invent one NEW chat and one NEW story (no repeats), add them to `history.md`.
2. Write `specs/<YYYY-MM-DD>-<HHMM>-chat.json` and `-story.json`.
3. Build both, check a few frames, send both files with ready-to-paste descriptions (with `#luxerpvn`).
4. Commit specs + history to this branch.
