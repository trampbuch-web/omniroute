#!/usr/bin/env bash
# Builds one «Удар в мозг» episode: voice -> animation -> render -> mix.
# Usage: video-scripts/udar-v-mozg/make.sh video-scripts/udar-v-mozg/<date>
# The episode folder needs script.tsv (H|T <tab> text) and build.py (scenes, gestures).
set -euo pipefail
U="$(cd "$(dirname "$0")" && pwd)"; VS="$(dirname "$U")"; cd "$1"; NAME="udar-v-mozg-$(basename "$PWD")"
TRIM="silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
mkdir -p seg; i=0
while IFS=$'\t' read -r who txt; do
  if [ "$who" = T ]; then v=en-US-BrianMultilingualNeural r=+0% p=-4Hz f="highpass=f=250,lowpass=f=5000,"  # quote voice, not a clone
  else v=ru-RU-DmitryNeural r=+15% p=+8Hz f=""; fi
  for try in $(seq 12); do python3 "$U/tts.py" $v $r $p "$txt" seg/r$i.mp3 </dev/null 2>/dev/null && [ -s seg/r$i.mp3 ] && break; sleep 8; done  # edge-tts drops requests in bursts
  ffmpeg -nostdin -v error -y -i seg/r$i.mp3 -af "${f}$TRIM" -ar 44100 -ac 2 seg/$i.wav; i=$((i+1))
done < script.tsv
python3 build.py
cp udar-animation.html "$VS/udar-tmp-animation.html"
EPISODE=udar-tmp node "$VS/render-animation.mjs" "$PWD/video.mp4" 25; rm "$VS/udar-tmp-animation.html"
python3 - <<'PY'
import json, subprocess
j = json.load(open("starts.json")); D = j["D"]; S = j["starts"]; n = len(S)
ins = sum([["-i", f"seg/{i}.wav"] for i in range(n)], [])
fc = ";".join(f"[{i}]adelay={int(st*1000)}:all=1[a{i}]" for i, (st, _) in enumerate(S)) + ";" + "".join(f"[a{i}]" for i in range(n)) \
   + f"amix=inputs={n}:normalize=0,loudnorm=I=-16:TP=-1.5,apad,atrim=0:{D}[v]"
subprocess.run(["ffmpeg","-nostdin","-v","error","-y",*ins,"-filter_complex",fc,"-map","[v]","-ar","44100","-ac","2","voice.wav"], check=True)
open("bed_offset", "w").write(str(max(0, 90.9 - (D - 1.1))))  # gong hit in music-bed is at 90.9 s
PY
OFF=$(cat bed_offset)
ffmpeg -nostdin -v error -y -i voice.wav -i "$U/music-bed.m4a" -filter_complex "[1]atrim=start=$OFF,asetpts=PTS-STARTPTS[m];[m][0]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=400[md];[0][md]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]" -map "[a]" mix.wav
ffmpeg -nostdin -v error -y -i video.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$NAME.mp4"
rm -rf seg voice.wav mix.wav video.mp4 bed_offset udar-animation.html starts.json
echo "done: $PWD/$NAME.mp4"
