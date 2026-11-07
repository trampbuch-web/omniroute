import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease, easeOut, pop, T } from "./lib";

// Small flat icons drawn in a 100×100 box
const ICONS: Record<string, React.ReactNode> = {
  wheat: (
    <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
      <path d="M50 92 V28" />
      {[30, 44, 58, 72].map((y) => (
        <g key={y}><path d={`M50 ${y} q-18 -6 -20 -20 q16 2 20 20`} fill="currentColor" /><path d={`M50 ${y} q18 -6 20 -20 q-16 2 -20 20`} fill="currentColor" /></g>
      ))}
    </g>
  ),
  house: <g fill="currentColor"><path d="M10 50 L50 14 L90 50 Z" /><rect x="20" y="48" width="60" height="42" rx="4" /><rect x="42" y="64" width="16" height="26" fill="#0b1124" /><circle cx="70" cy="34" r="0" /></g>,
  school: <g fill="currentColor"><path d="M50 10 L92 32 L50 54 L8 32 Z" /><path d="M24 44 V66 Q50 84 76 66 V44 L50 58 Z" /><rect x="86" y="32" width="5" height="34" /></g>,
  ballot: <g fill="currentColor"><rect x="12" y="44" width="76" height="46" rx="6" /><rect x="30" y="38" width="40" height="8" fill="#0b1124" /><path d="M36 10 H64 V44 H36 Z" fill="#fff" /><path d="M42 26 L48 32 L58 18" stroke="#0b1124" strokeWidth="5" fill="none" /></g>,
  shop: <g fill="currentColor"><path d="M8 30 L18 10 H82 L92 30 Z" /><rect x="14" y="34" width="72" height="56" rx="4" /><rect x="40" y="56" width="20" height="34" fill="#0b1124" /></g>,
  city: <g fill="currentColor"><rect x="8" y="40" width="24" height="52" /><rect x="38" y="14" width="26" height="78" /><rect x="70" y="50" width="22" height="42" /></g>,
  phone: <g fill="currentColor"><rect x="28" y="6" width="44" height="88" rx="10" /><rect x="34" y="16" width="32" height="62" fill="#0b1124" /><path d="M40 40 h20 M40 50 h14" stroke="currentColor" strokeWidth="5" /></g>,
  briefcase: <g fill="currentColor"><rect x="8" y="30" width="84" height="58" rx="8" /><path d="M36 30 V18 H64 V30" stroke="currentColor" strokeWidth="7" fill="none" /></g>,
  pin: <g fill="currentColor"><path d="M50 94 C30 64 18 50 18 34 A32 32 0 0 1 82 34 C82 50 70 64 50 94 Z" /><circle cx="50" cy="34" r="12" fill="#0b1124" /></g>,
  star: <path d="M50 6 L62 38 L96 38 L68 58 L78 92 L50 72 L22 92 L32 58 L4 38 L38 38 Z" fill="currentColor" />,
};

export const Icon: React.FC<{ name: string; size: number; color: string }> = ({ name, size, color }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ color }}>{ICONS[name] || ICONS.star}</svg>
);

const fmt = (v: number, d = 0) => v.toFixed(d).replace(".", ",");

export const Viz: React.FC<{ viz: any; accent: string }> = ({ viz, accent }) => {
  const f = useCurrentFrame(); // frame inside the segment
  const v0 = T.viz;
  const label = (txt: string, at: number) => (
    <div style={{ fontSize: 34, color: "#c9d2e6", marginTop: 18, opacity: ease(f, at), translate: `0px ${(1 - ease(f, at)) * 20}px` }}>{txt}</div>
  );

  if (viz.type === "title") {
    const p = pop(f, v0, 22);
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 190, fontWeight: 900, color: "#fff", letterSpacing: 8, scale: String(0.4 + 0.6 * p), opacity: p, textShadow: `0 0 50px ${accent}` }}>{viz.text}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ width: 34, height: 34, borderRadius: "50%", background: accent, scale: String(pop(f, v0 + 14 + i * 5, 12)) }} />)}
        </div>
        {label(viz.sub, v0 + 40)}
      </div>
    );
  }

  if (viz.type === "timeline") {
    const n = viz.items.length;
    const line = ease(f, v0, 40);
    return (
      <div style={{ position: "relative", height: 300, marginTop: 10 }}>
        <div style={{ position: "absolute", left: 40, top: 70, height: 8, borderRadius: 4, width: 820 * line, background: `linear-gradient(90deg, #ffffff55, ${accent})` }} />
        {viz.items.map(([year, txt]: [string, string], i: number) => {
          const at = v0 + i * T.item;
          const p = pop(f, at, 16);
          const x = 40 + (820 / (n - 1)) * i;
          const hl = i === viz.hl;
          return (
            <div key={i} style={{ position: "absolute", left: x - 130, top: 0, width: 260, textAlign: "center", opacity: p, translate: `0px ${(1 - p) * 30}px` }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: hl ? "#ffd400" : "#fff" }}>{year}</div>
              <div style={{ margin: "8px auto", width: hl ? 34 : 26, height: hl ? 34 : 26, borderRadius: "50%", background: hl ? "#ffd400" : accent, boxShadow: hl ? "0 0 30px #ffd400" : "none", scale: String(hl ? 1 + 0.12 * Math.sin(f / 5) : 1) }} />
              <div style={{ fontSize: 30, color: hl ? "#fff" : "#c9d2e6", fontWeight: hl ? 800 : 500, lineHeight: 1.15 }}>{txt}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (viz.type === "gauge") {
    const p = interpolate(f, [v0, v0 + T.count], [0, 1], { ...clamp, easing: easeOut });
    const val = viz.value * p;
    const R = 120, C = Math.PI * R;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 10 }}>
        <svg width={300} height={180} viewBox="0 0 300 180">
          <path d={`M30 160 A${R} ${R} 0 0 1 270 160`} stroke="#ffffff22" strokeWidth="28" fill="none" strokeLinecap="round" />
          <path d={`M30 160 A${R} ${R} 0 0 1 270 160`} stroke={accent} strokeWidth="28" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - (val / 100))} />
          <line x1="150" y1="160" x2={150 - 100 * Math.cos(Math.PI * val / 100)} y2={160 - 100 * Math.sin(Math.PI * val / 100)} stroke="#fff" strokeWidth="8" strokeLinecap="round" />
          <circle cx="150" cy="160" r="14" fill="#fff" />
        </svg>
        <div>
          <div style={{ fontSize: 130, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{fmt(val, viz.decimals || 0)}{viz.suffix}</div>
          {label(viz.label, v0 + 10)}
        </div>
      </div>
    );
  }

  if (viz.type === "counter") {
    const p = interpolate(f, [v0, v0 + T.count], [0, 1], { ...clamp, easing: easeOut });
    const val = Math.round(viz.from + (viz.to - viz.from) * p);
    const pages = Math.floor(p * 8);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 46, marginTop: 10 }}>
        {/* tear-off calendar flipping */}
        <div style={{ position: "relative", width: 210, height: 230 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: "#fff", boxShadow: "0 12px 30px rgba(0,0,0,.4)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 56, borderRadius: "18px 18px 0 0", background: accent }} />
          <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontSize: 72, fontWeight: 900, color: "#111" }}>{val}</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 56, height: 174, borderRadius: "0 0 18px 18px", background: "#f2f2f2", transformOrigin: "50% 0%", rotate: `x ${(p * 8 - pages) * 180}deg`, opacity: p < 1 ? 0.9 : 0 }} />
        </div>
        <div>
          <div style={{ fontSize: 120, fontWeight: 900, color: "#ffd400", lineHeight: 1 }}>{viz.sub.split(" ")[0]}</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>{viz.sub.split(" ").slice(1).join(" ")}</div>
          {label(viz.label, v0 + 20)}
        </div>
      </div>
    );
  }

  if (viz.type === "icons") {
    return (
      <div style={{ marginTop: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {viz.icons.map((ic: string, i: number) => {
            const p = pop(f, v0 + i * T.item, 16);
            return (
              <div key={i} style={{ textAlign: "center", width: 260, scale: String(p), opacity: Math.min(1, p * 2) }}>
                <div style={{ width: 150, height: 150, margin: "0 auto", borderRadius: 34, background: `${accent}33`, border: `3px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", rotate: `${Math.sin(f / 18 + i) * 4}deg` }}>
                  <Icon name={ic} size={100} color="#fff" />
                </div>
                <div style={{ fontSize: 30, color: "#fff", marginTop: 12, fontWeight: 700 }}>{viz.labels?.[i]}</div>
              </div>
            );
          })}
        </div>
        {viz.stat && (
          <div style={{ textAlign: "center", marginTop: 18, opacity: ease(f, v0 + 3 * T.item + 10), scale: String(0.8 + 0.2 * pop(f, v0 + 3 * T.item + 10)) }}>
            <span style={{ fontSize: 76, fontWeight: 900, color: "#ffd400" }}>{viz.stat}</span>
            <span style={{ fontSize: 32, color: "#c9d2e6", marginLeft: 18 }}>{viz.statLabel}</span>
          </div>
        )}
      </div>
    );
  }

  if (viz.type === "bars") {
    const max = Math.max(...viz.items.map((x: [string, number]) => x[1]));
    return (
      <div style={{ marginTop: 4 }}>
        {viz.items.map(([name, val]: [string, number], i: number) => {
          const at = v0 + i * 8;
          const p = interpolate(f, [at, at + 30], [0, 1], { ...clamp, easing: easeOut });
          const hl = i === viz.hl;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 14, opacity: ease(f, at, 8) }}>
              <div style={{ width: 170, fontSize: 40, fontWeight: 900, color: hl ? "#ffd400" : "#fff" }}>{name}</div>
              <div style={{ height: 54, width: 600 * (val / max) * p, minWidth: 8, borderRadius: 12, background: hl ? `linear-gradient(90deg, ${accent}, #ffd400)` : "#ffffff44", boxShadow: hl ? `0 0 26px ${accent}` : "none" }} />
              <div style={{ marginLeft: 16, fontSize: 40, fontWeight: 900, color: "#fff" }}>{viz.prefix ?? "≈"}{fmt(val * p, viz.decimals || 0)}{viz.suffix ?? ""}</div>
            </div>
          );
        })}
        {label(viz.label, v0 + viz.items.length * 8 + 10)}
      </div>
    );
  }

  if (viz.type === "quote") {
    const p = pop(f, v0, 20);
    return (
      <div style={{ marginTop: 20, padding: "26px 34px", borderLeft: `12px solid ${accent}`, background: "#ffffff10", borderRadius: 16, scale: String(0.9 + 0.1 * p), opacity: p }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>«{viz.text}»</div>
        {label(viz.src, v0 + 16)}
      </div>
    );
  }

  if (viz.type === "pin") {
    const p = pop(f, v0, 18);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 14 }}>
        <div style={{ translate: `0px ${(1 - p) * -120}px`, opacity: Math.min(1, p * 2) }}>
          <Icon name="pin" size={170} color={accent} />
        </div>
        <div>
          <div style={{ fontSize: 66, fontWeight: 900, color: "#fff" }}>{viz.place}</div>
          {label(viz.label, v0 + 14)}
        </div>
      </div>
    );
  }

  if (viz.type === "cta") {
    const p = pop(f, v0, 20);
    return (
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: "#fff", scale: String(0.8 + 0.2 * p), opacity: p }}>{viz.text}</div>
        <div style={{ display: "inline-flex", gap: 24, marginTop: 26 }}>
          {["💬", "❤️", "➕"].map((e, i) => (
            <div key={i} style={{ fontSize: 86, scale: String(pop(f, v0 + 12 + i * 6, 14) * (1 + 0.08 * Math.sin(f / 6 + i))) }}>{e}</div>
          ))}
        </div>
        {label(viz.sub, v0 + 30)}
      </div>
    );
  }
  return null;
};
