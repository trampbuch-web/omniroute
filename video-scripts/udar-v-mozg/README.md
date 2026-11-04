# «Удар в мозг»

Ежедневный ролик (~90 с) по главной для России новости BBC News Русская служба.

- `make.sh <папка выпуска>` — собирает видео целиком: озвучка → анимация → рендер → музыка.
- Папка выпуска (`2026-11-04/` — образец): `script.tsv` (строки `H`/`T` + табуляция + текст; `T` — цитата Трампа другим голосом, не клон), `build.py` (слайды, жесты, когда встаёт/пьёт; в конце бьёт в гонг), `scenario.md`, `telegram-post.md` (≤1024 знаков), `tg-preview.svg` → `preview.png` (`node svg2png.mjs in.svg out.png`).
- Студия берётся из `../midterms-animation.html`, рендер — `../render-animation.mjs`, музыка — `music-bed.m4a`.
- Нужно: `pip install edge-tts`, ffmpeg, Playwright с Chromium.
