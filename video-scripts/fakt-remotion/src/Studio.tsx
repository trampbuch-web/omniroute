import { AbsoluteFill, useCurrentFrame } from "remotion";
import { rand } from "./lib";

// Studio behind the host: video wall in the party colour, sweeping beams, dust, LED pillars, ON-AIR lamp
export const StudioBack: React.FC<{ accent: string }> = ({ accent }) => {
  const f = useCurrentFrame();
  const beams = [180, 540, 900];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #22325e 0%, #101831 55%, #070a14 100%)", overflow: "hidden" }}>
      {/* back wall grid, drifting slowly for parallax */}
      <div style={{ position: "absolute", inset: -60, translate: `${Math.sin(f / 90) * 12}px 0px`, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.04) 2px, transparent 2px)", backgroundSize: "60px 60px" }} />
      {/* video wall: rings pulsing out in the accent colour */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 760, height: 620, borderRadius: 40, overflow: "hidden", border: `4px solid ${accent}55`, background: "#0b1124", boxShadow: `0 0 80px ${accent}33` }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const p = ((f / 90 + i / 5) % 1);
          return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 1400 * p, height: 1400 * p, translate: "-50% -50%", borderRadius: "50%", border: `6px solid ${accent}`, opacity: 0.35 * (1 - p) }} />;
        })}
        {/* scan lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 6px)", translate: `0px ${(f * 1.5) % 6}px` }} />
      </div>
      {/* LED pillars with a light running up */}
      {[40, 1012].map((x, i) => (
        <div key={x} style={{ position: "absolute", left: x, top: 520, width: 28, height: 980, borderRadius: 14, background: "#121a33", overflow: "hidden", boxShadow: `0 0 30px ${accent}44` }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 260, top: 980 - ((f * 6 + i * 400) % 1240), background: `linear-gradient(transparent, ${accent}, transparent)` }} />
        </div>
      ))}
      {/* sweeping beams from the ceiling */}
      {beams.map((x, i) => (
        <div key={x} style={{ position: "absolute", left: x - 110, top: -40, width: 220, height: 1500, transformOrigin: "50% 0%", rotate: `${Math.sin(f / 70 + i * 2) * 14}deg`, background: "linear-gradient(rgba(255,255,255,0.16), rgba(255,255,255,0))", clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)", mixBlendMode: "screen" }} />
      ))}
      {/* ceiling lamps */}
      {[180, 360, 540, 720, 900].map((x, i) => (
        <div key={x} style={{ position: "absolute", left: x - 22, top: 118, width: 44, height: 44, borderRadius: "50%", background: "#ffe7a8", boxShadow: "0 0 50px 18px rgba(255,220,140,0.35)", opacity: 0.75 + 0.25 * Math.sin(f / 9 + i) }} />
      ))}
      {/* dust in the light: slow rise, twinkle */}
      {Array.from({ length: 46 }, (_, i) => {
        const y = (1500 - ((f * (0.6 + rand(i) * 1.2) + rand(i + 9) * 1500) % 1500));
        const x = rand(i + 3) * 1080 + Math.sin(f / 40 + i) * 14;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 3 + rand(i + 5) * 5, height: 3 + rand(i + 5) * 5, borderRadius: "50%", background: "#fff", opacity: 0.15 + 0.35 * Math.abs(Math.sin(f / 15 + i)) }} />;
      })}
      {/* soft bokeh */}
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: rand(i + 40) * 1080, top: 300 + rand(i + 50) * 900, width: 80 + rand(i + 60) * 90, height: 80 + rand(i + 60) * 90, borderRadius: "50%", background: i % 3 ? "rgba(255,210,140,0.10)" : `${accent}22`, filter: "blur(14px)", translate: `${Math.sin(f / 80 + i) * 20}px ${Math.cos(f / 95 + i) * 16}px` }} />
      ))}
    </AbsoluteFill>
  );
};

// Desk in front of the host, drawn in the host's own coordinates (viewBox units) so the mug
// sits exactly where his hand reaches for it.
export const Desk: React.FC<{ mugVisible: boolean; accent: string }> = ({ mugVisible, accent }) => {
  const f = useCurrentFrame();
  const steam = (k: number) => `M${574 + k * 16} 732 q${-10 + Math.sin(f / 9 + k) * 6} -20 0 -40 q${10 + Math.sin(f / 7 + k) * 6} -20 0 -42`;
  return (
    <svg viewBox="0 0 600 900" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="deskTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a4462" /><stop offset="1" stopColor="#232a40" /></linearGradient>
        <linearGradient id="deskFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#171d2e" /><stop offset="1" stopColor="#0a0d17" /></linearGradient>
      </defs>
      <path d="M-160 822 Q300 800 760 822 L740 852 Q300 832 -140 852 Z" fill="url(#deskTop)" />
      <path d="M-140 852 Q300 832 740 852 L720 1300 L-120 1300 Z" fill="url(#deskFront)" />
      <path d="M-130 905 Q300 885 730 905" stroke={accent} strokeWidth="5" fill="none" />
      <path d="M-130 905 Q300 885 730 905" stroke={accent} strokeWidth="16" fill="none" opacity={0.2 + 0.1 * Math.sin(f / 12)} />
      {/* papers with a pen, slightly fanned */}
      <path d="M40 818 L150 812 L158 826 L46 832 Z" fill="#eceff4" />
      <path d="M52 814 L160 810 L166 822 L58 827 Z" fill="#ffffff" />
      <path d="M70 818 L140 815 M72 821 L132 818" stroke="#9aa3b5" strokeWidth="1.5" />
      <path d="M170 822 L235 814" stroke="#1e2433" strokeWidth="5" strokeLinecap="round" />
      <path d="M232 814 L240 813" stroke="#e3262f" strokeWidth="5" strokeLinecap="round" />
      {/* tablet with a blinking chart */}
      <path d="M300 820 L420 814 L428 830 L306 836 Z" fill="#0d0f14" stroke="#2c3346" strokeWidth="2" />
      <path d="M312 828 L330 822 L346 826 L362 818 L378 822 L400 816" stroke={accent} strokeWidth="2.5" fill="none" opacity={0.6 + 0.4 * Math.sin(f / 6)} />
      {/* the mug, with steam while it stands on the desk */}
      {mugVisible && (
        <g>
          <g transform="translate(586 779) scale(1.45)">
            <rect x="-24" y="-28" width="48" height="56" rx="7" fill="#f4f4f4" />
            <rect x="-24" y="-12" width="48" height="11" fill="#e3262f" />
            <path d="M24 -18 Q46 -14 44 0 Q42 12 24 10" stroke="#f4f4f4" strokeWidth="7" fill="none" />
          </g>
          {[0, 1].map((k) => <path key={k} d={steam(k)} stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity={0.25 + 0.1 * Math.sin(f / 8 + k)} />)}
        </g>
      )}
      <text x="300" y="1070" textAnchor="middle" fontFamily="DejaVu Sans, Arial" fontSize="34" fontWeight={900} fill="#f4f4f4" letterSpacing="4">
        ИНТЕРЕСНЫЙ <tspan fill="#ffd36b">ФАКТ</tspan>
      </text>
    </svg>
  );
};
