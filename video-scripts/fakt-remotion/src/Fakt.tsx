import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Host, HostState, POSE } from "./Host";
import { ACCENT, clamp, Data, ease, pop, Seg, T } from "./lib";
import { Desk, StudioBack } from "./Studio";
import { Viz } from "./Viz";

// host placement: 600×900 viewBox drawn 780 px wide, head top near y≈600
const HX = 150, HY = 442, HW = 780, HH = 1170;
const FACE: [number, number] = [540, 920];

type Gest = [number, string];

function gestures(d: Data): Gest[] {
  const g: Gest[] = [[0, "rest"]];
  const fps = d.fps;
  const cycle = ["explain", "open", "both", "count"];
  d.segs.forEach((s, i) => {
    if (s.drink) {
      g.push([s.start - 2.6 * fps, "reach"], [s.start - 2.0 * fps, "drink"], [s.start - 0.9 * fps, "reach"], [s.start - 0.35 * fps, "rest"]);
    }
    if (s.kind === "hook") g.push([s.start, "wave"], [s.start + 2.2 * fps, "rest"]);
    else if (s.kind === "cta") g.push([s.start, "open"], [s.end - 2.6 * fps, "wave"], [s.end - 0.4 * fps, "rest"]);
    else {
      g.push([s.start + T.viz - 4, "point"]); // shows the graphic as it lands
      for (let t = s.start + T.viz + 1.6 * fps, k = i; t < s.end - 0.5 * fps; t += 2.4 * fps, k++) g.push([t, cycle[k % 4]]);
    }
  });
  return g.sort((a, b) => a[0] - b[0]);
}

function poseAt(g: Gest[], f: number, fps: number) {
  let i = g.findIndex(([k]) => k > f);
  i = i === -1 ? g.length : i;
  const cur = g[Math.max(0, i - 1)], prev = g[Math.max(0, i - 2)];
  const p = Easing.bezier(0.33, 0, 0.2, 1)(Math.max(0, Math.min(1, (f - cur[0]) / (0.55 * fps))));
  const A = POSE[prev[1]], B = POSE[cur[1]];
  const arms = [0, 1].map((s) => [A[s][0] + (B[s][0] - A[s][0]) * p, A[s][1] + (B[s][1] - A[s][1]) * p]) as HostState["arms"];
  return { arms, name: cur[1], prev: prev[1], since: (f - cur[0]) / fps, p };
}

const Captions: React.FC<{ s: Seg }> = ({ s }) => {
  const f = useCurrentFrame() + s.start; // absolute frame
  const chunks: Seg["words"][] = [];
  let cur: Seg["words"] = [];
  for (const w of s.words) {
    if (cur.length && (cur.length === 3 || cur.reduce((a, x) => a + x[2].length, 0) + w[2].length > 13)) { chunks.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) chunks.push(cur);
  const idx = chunks.findIndex((c, i) => f >= c[0][0] && (i === chunks.length - 1 || f < chunks[i + 1][0][0]));
  if (idx < 0 || f > s.end + 6) return null;
  const c = chunks[idx];
  const p = pop(f, c[0][0], 8);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1580, textAlign: "center", whiteSpace: "nowrap", scale: String(0.85 + 0.15 * p), opacity: Math.min(1, p * 1.6) }}>
      {c.map((w, i) => {
        const on = f >= w[0] && f < w[1] + 3;
        return (
          <span key={i} style={{ display: "inline-block", margin: "0 18px", fontSize: 78, fontWeight: 900, textTransform: "uppercase", color: on ? "#ffd400" : "#fff", WebkitTextStroke: "4px #000", paintOrder: "stroke fill", textShadow: "0 8px 0 #000", scale: on ? "1.08" : "1" }}>{w[2]}</span>
        );
      })}
    </div>
  );
};

const Panel: React.FC<{ s: Seg; accent: string; total: number }> = ({ s, accent, total }) => {
  const f = useCurrentFrame();
  const len = s.end - s.start;
  const inP = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: Easing.spring({ damping: 14 }) });
  const outP = interpolate(f, [len - 6, len + 6], [0, 1], clamp);
  const words = s.title.split(" ");
  const tag = s.tag ?? `ФАКТ №${s.n}`; // a bonus fact brings its own tag
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 150, minHeight: 560, padding: "34px 40px", borderRadius: 36, background: "linear-gradient(160deg, rgba(20,28,56,0.92), rgba(8,12,26,0.92))", border: `3px solid ${accent}`, boxShadow: `0 20px 60px rgba(0,0,0,.5), 0 0 40px ${accent}44`, translate: `${(1 - inP) * 1100 - outP * 1100}px 0px`, rotate: `${(1 - inP) * 4}deg` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "inline-block", background: accent, color: "#fff", fontWeight: 900, fontSize: 32, letterSpacing: 3, padding: "8px 18px", borderRadius: 10, scale: String(pop(f, 2, 12)) }}>{tag}</div>
        {s.kind === "fact" && !s.tag && (
          <div style={{ display: "flex", gap: 10 }}>
            {Array.from({ length: total }, (_, i) => <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: i < (s.n || 0) ? "#ffd400" : "#ffffff33", scale: i === (s.n || 0) - 1 ? String(1 + 0.25 * Math.sin(f / 5)) : "1" }} />)}
          </div>
        )}
      </div>
      {/* headline: words rise one after another */}
      <div style={{ marginTop: 18, fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1.08 }}>
        {words.map((w, i) => {
          const p = pop(f, T.head + i * 3, 14);
          return <span key={i} style={{ display: "inline-block", marginRight: 16, opacity: p, translate: `0px ${(1 - p) * 40}px` }}>{w}</span>;
        })}
      </div>
      {/* marker sweep under the headline */}
      <div style={{ height: 8, borderRadius: 4, background: "#ffd400", width: `${ease(f, T.head + words.length * 3, 12) * 60}%`, marginTop: 10 }} />
      <div style={{ marginTop: 26 }}><Viz viz={s.viz} accent={accent} /></div>
    </div>
  );
};

export const Fakt: React.FC<{ slug: string; data: Data }> = ({ slug, data }) => {
  const f = useCurrentFrame();
  const fps = data.fps;
  const accent = ACCENT[slug] || "#e0262f";
  const segs = data.segs;
  const g = gestures(data);
  const pose = poseAt(g, f, fps);
  const si = Math.max(0, segs.findIndex((s, i) => f < (segs[i + 1]?.start ?? Infinity)));
  const seg = segs[si];
  const total = segs.filter((s) => s.kind === "fact" && !s.tag).length;

  // talking & lip-sync
  const mouth = data.mouth[Math.min(data.mouth.length - 1, f)] || [0, 1];
  const talking = data.mouth.slice(Math.max(0, f - 6), f + 1).some((m) => m[0] > 0.05);
  const holding = pose.name === "drink" || (pose.name === "reach" && (pose.prev === "drink" ? pose.since < 0.35 : pose.since >= 0.35));
  const sip = pose.name === "drink" ? Math.min(1, Math.max(0, (pose.since - 0.45) / 0.3)) * Math.min(1, Math.max(0, (1.05 - pose.since) / 0.25)) : 0;
  const lt = f - seg.start;
  const vizLand = lt >= T.viz - 2 && lt < T.viz + 1.4 * fps && seg.kind === "fact";
  const blink = (f + Math.round(Math.sin(f / 37) * 20)) % 110 < 4;
  const beat = talking ? Math.sin(f / 5.5) * 8 + Math.sin(f / 13) * 5 : 0;
  const s: HostState = {
    arms: pose.arms,
    wiggleL: ["explain", "both", "open"].includes(pose.name) ? beat : beat * 0.25,
    wiggleR: pose.name === "wave" && pose.since < 2 ? Math.sin(pose.since * 9) * 22 : ["drink", "reach"].includes(pose.name) ? 0 : beat * 0.6,
    finger: pose.name === "point" || pose.name === "count" ? [0, pose.p] : [0, 0],
    mouth: sip > 0.3 ? [0, 1] : mouth,
    brows: (lt < 0.9 * fps ? Math.sin((lt / (0.9 * fps)) * Math.PI) : 0) + (vizLand ? 0.5 : 0),
    lid: blink ? 0.08 : 1,
    look: vizLand ? [6, -4] : [Math.sin(f / 60) * 1.5, 0],
    head: (talking ? Math.sin(f / 14) * 2.4 + Math.sin(f / 8) : Math.sin(f / 40) * 0.8) + (sip > 0.3 ? -7 : 0) + (vizLand ? 3 : 0),
    headY: talking ? -Math.abs(Math.sin(f / 7)) * 2 : 0,
    fringe: Math.sin(f / 18) * 1.5,
    glint: ((f % 150) / 40),
    cup: holding,
    sip,
  };

  // jump cut: every other line the camera punches in on the face
  const punch = si % 2 === 1 ? 1.12 : 1;
  const sway = Math.sin(f / 50) * 6;
  const breathe = 1 + Math.sin(f / 26) * 0.004;
  const flash = interpolate(lt, [0, 8], [0.5, 0], clamp);

  // sound effects keyed to what appears on screen
  const sfx: [string, number, number][] = [];
  segs.forEach((x, i) => {
    if (i) sfx.push(["whoosh", x.start - 4, 0.5]);
    sfx.push(["pop", x.start + T.head, 0.35]);
    const v = x.viz;
    const at = x.start + T.viz;
    if (v.type === "timeline" || v.type === "icons") v.items?.forEach?.((_: any, k: number) => sfx.push(["pop", at + k * T.item, 0.4]));
    if (v.type === "icons") v.icons.forEach((_: any, k: number) => sfx.push(["pop", at + k * T.item, 0.4]));
    if (v.type === "gauge" || v.type === "counter") {
      for (let k = 0; k < T.count; k += 3) sfx.push(["tick", at + k, 0.25]);
      sfx.push(["ding", at + T.count, 0.4]);
    }
    if (v.type === "bars") { v.items.forEach((_: any, k: number) => sfx.push(["pop", at + k * 8, 0.3])); sfx.push(["ding", at + v.items.length * 8 + 22, 0.35]); }
    if (["title", "quote", "pin", "cta"].includes(v.type)) sfx.push(["ding", at, 0.35]);
  });

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: "DejaVu Sans, Arial, sans-serif" }}>
      <AbsoluteFill style={{ scale: String(punch), transformOrigin: `${FACE[0]}px ${FACE[1]}px` }}>
        <StudioBack accent={accent} />
        <div style={{ position: "absolute", left: HX + sway, top: HY, width: HW, height: HH, scale: `1 ${breathe}`, transformOrigin: "50% 100%" }}>
          <Host s={s} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        </div>
        <div style={{ position: "absolute", left: HX, top: HY, width: HW, height: HH }}>
          <Desk mugVisible={!holding} accent={accent} />
        </div>
      </AbsoluteFill>

      {/* top bar: progress, brand, ON AIR, clock */}
      <div style={{ position: "absolute", left: 0, top: 0, height: 12, width: `${(f / data.durationInFrames) * 100}%`, background: "#ffd400" }} />
      <div style={{ position: "absolute", left: 50, top: 58, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ background: "#e3262f", color: "#fff", fontWeight: 900, fontSize: 34, letterSpacing: 3, padding: "10px 20px", borderRadius: 12 }}>{data.brand}</div>
      </div>
      <div style={{ position: "absolute", right: 50, top: 64, display: "flex", gap: 12, alignItems: "center", color: "#fff", fontSize: 28, fontWeight: 800 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#ff3b3b", opacity: Math.sin(f / 6) > 0 ? 1 : 0.25, boxShadow: "0 0 12px #ff3b3b" }} />
        ЭФИР
      </div>

      {segs.map((x, i) => (
        <Sequence key={i} from={x.start} durationInFrames={(segs[i + 1]?.start ?? data.durationInFrames) - x.start + 6} layout="none">
          <Panel s={x} accent={accent} total={total} />
        </Sequence>
      ))}
      {segs.map((x, i) => (
        <Sequence key={`c${i}`} from={x.start} durationInFrames={x.end - x.start + 8} layout="none">
          <Captions s={x} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)", opacity: flash, translate: `${interpolate(lt, [0, 8], [-600, 600], clamp)}px 0px`, pointerEvents: "none" }} />

      {segs.map((x, i) => <Audio key={`v${i}`} src={staticFile(x.voice.src)} from={x.voice.from} />)}
      <Audio src={staticFile("music-bed.m4a")} volume={0.13} />
      {sfx.map(([name, at, vol], i) => <Audio key={`s${i}`} src={staticFile(`sfx/${name}.wav`)} from={Math.max(0, Math.round(at))} volume={vol} />)}
    </AbsoluteFill>
  );
};
