// Step 1 of 2: voices the subtitles of hook-sleva-animation.html with RHVoice, adds a generated
// music bed (ducked under speech) and a gong, and writes:
//   hook-sleva-audio.m4a  — final soundtrack
//   timing.json           — time map that stretches the animation to the real voiceover
// Step 2: node video-scripts/render-animation.mjs (renders frames with timing.json, muxes the audio)
// Needs: apt-get install rhvoice rhvoice-russian ffmpeg
// Usage: node video-scripts/add-audio.mjs [host-voice] [quote-voice] [rate%]
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const hostVoice = process.argv[2] || "aleksandr-hq";
const quoteVoice = process.argv[3] || "yuriy";
const rate = process.argv[4] || "145";
const tmp = mkdtempSync(path.join(tmpdir(), "hook-audio-"));
const PAD = 0.35; // breath after each line
const GONG_OLD_T = 78; // gong moment in the original (unstretched) layout

// SUBS in the HTML is the single source of truth for text and layout timing
const html = readFileSync(path.join(dir, "hook-sleva-animation.html"), "utf8");
const subs = JSON.parse(html.match(/const SUBS = (\[[\s\S]*?\]);/)[1].replace(/,(\s*\])/g, "$1"));
const oldDuration = Number(html.match(/const DURATION = (\d+)/)[1]);

const probe = (f) =>
  Number(
    execFileSync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      f,
    ]).toString()
  );

// 1. synthesize every line
const lines = subs.map(([start, end, text, host], i) => {
  // the on-screen quote is "Трамп: «…»" — speak only the quoted words, in a second voice
  const spoken = host ? text : text.replace(/^[^:]+:\s*/, "").replace(/[«»…]/g, "");
  const txt = path.join(tmp, `${i}.txt`);
  const wav = path.join(tmp, `${i}.wav`);
  writeFileSync(txt, spoken);
  execFileSync("RHVoice-test", [
    "-p",
    host ? hostVoice : quoteVoice,
    "-r",
    rate,
    "-i",
    txt,
    "-o",
    wav,
  ]);
  return { start, end, wav, len: probe(wav) };
});

// 2. time map: every subtitle slot grows to fit its line, silent gaps keep their length
const map = [[0, 0]];
let now = 0;
let prevOld = 0;
for (const l of lines) {
  if (l.start > prevOld) map.push([(now += l.start - prevOld), l.start]);
  l.newStart = now;
  map.push([(now += Math.max(l.end - l.start, l.len + PAD)), l.end]);
  prevOld = l.end;
}
if (oldDuration > prevOld) map.push([(now += oldDuration - prevOld), oldDuration]);
const duration = now;
const fromOld = (o) => {
  const i = map.findIndex(([, ot]) => ot >= o);
  const [n0, o0] = map[i - 1];
  const [n1, o1] = map[i];
  return n0 + ((o - o0) / (o1 - o0)) * (n1 - n0);
};
writeFileSync(path.join(dir, "timing.json"), JSON.stringify(map));

// 3. generated music bed: Am–F–C–G pad + bass, kick on beats, hats on offbeats, 8th-note arp
const BEAT = 0.6;
const BAR = BEAT * 4;
const chords = [
  [110, 130.81, 164.81],
  [87.31, 110, 130.81],
  [130.81, 164.81, 196],
  [98, 123.47, 146.83],
];
const k = `mod(floor(t/${BAR}),4)`;
const pick = (idx) =>
  chords.reduceRight(
    (acc, c, ci) => (ci === 3 ? `${c[idx]}` : `if(eq(${k},${ci}),${c[idx]},${acc})`),
    ""
  );
const tone = (idx) => `(${pick(idx)})`;
const chordEnv = `min(1,mod(t,${BAR})*6)*min(1,(${BAR}-mod(t,${BAR}))*6)`;
const pad = `0.05*${chordEnv}*(sin(2*PI*${tone(0)}*t)+sin(2*PI*${tone(1)}*t)+sin(2*PI*${tone(2)}*t))`;
const bass = `0.12*${chordEnv}*sin(2*PI*${tone(0)}/2*t)`;
const kb = `mod(t,${BEAT})`;
const kick = `0.35*sin(2*PI*(45+90*exp(-30*${kb}))*${kb})*exp(-9*${kb})`;
const hat = `0.05*(random(0)*2-1)*exp(-70*mod(t+${BEAT / 2},${BEAT}))`;
const eighth = BEAT / 2;
const arpIdx = `mod(floor(t/${eighth}),3)`;
const arpF = `if(eq(${arpIdx},0),${tone(0)},if(eq(${arpIdx},1),${tone(1)},${tone(2)}))*2`;
const arp = `0.06*sin(2*PI*${arpF}*t)*exp(-10*mod(t,${eighth}))`;
const music = path.join(tmp, "music.wav");
execFileSync("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-f",
  "lavfi",
  "-i",
  `aevalsrc='${[pad, bass, kick, hat, arp].join("+")}':s=48000:d=${duration}`,
  "-af",
  `afade=t=in:d=1.5,afade=t=out:st=${duration - 3}:d=3`,
  music,
]);

// 4. mix: voice lines at their new starts, music ducked under the voice, gong on the final hit
const gongAt = fromOld(GONG_OLD_T);
const inputs = ["-i", music, ...lines.flatMap((l) => ["-i", l.wav])];
const f = lines.map(
  (l, i) =>
    `[${i + 1}:a]aresample=48000,adelay=${Math.round(l.newStart * 1000)}:all=1,volume=1.5[v${i}]`
);
f.push(
  `${lines.map((_, i) => `[v${i}]`).join("")}amix=inputs=${lines.length}:normalize=0:duration=longest,asplit[voice][sc]`,
  `[0:a]volume=0.5[bed]`,
  `[bed][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck]`,
  `aevalsrc='0.7*sin(2*PI*98*t)*exp(-1.5*t)+0.4*sin(2*PI*231*t)*exp(-2.5*t)+0.25*sin(2*PI*412*t)*exp(-4*t)':s=48000:d=2.5,adelay=${Math.round(gongAt * 1000)}:all=1[gong]`,
  `[voice][duck][gong]amix=inputs=3:normalize=0:duration=longest,alimiter=limit=0.95[a]`
);
const out = path.join(dir, "hook-sleva-audio.m4a");
execFileSync("ffmpeg", [
  "-y",
  "-v",
  "error",
  ...inputs,
  "-filter_complex",
  f.join(";"),
  "-map",
  "[a]",
  "-c:a",
  "aac",
  "-b:a",
  "160k",
  "-t",
  duration.toFixed(2),
  out,
]);
console.log(`soundtrack: ${out} (${duration.toFixed(1)} s), timing.json written`);
