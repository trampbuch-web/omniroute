// «Весь дом в курсе»: a five-storey house cut open like a doll's house. World units: the house is
// 1500 wide (lift shaft + one flat per floor), a floor is 1200 high. Everything is SVG markup;
// dom.html moves a camera over it and animates the ids/classes named here.
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shade = (hex, k) => "#" + hex.slice(1).match(/../g).map((h) => Math.max(0, Math.min(255, Math.round(parseInt(h, 16) * k))).toString(16).padStart(2, "0")).join("");
const WW = 4200, WH = 7400, BX = 1350, BW = 1500, FH = 1200, F1 = 7000, ROOF = F1 - 5 * FH;
const SH0 = BX + 40, SH1 = SH0 + 380, RX0 = SH1 + 30, RX1 = BX + BW - 40; // shaft and room spans
const fy = (n) => F1 - FH * (n - 1); // floor line of floor n (1..5)
const R = (x, y, w, h, f, e = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${e}/>`;
const C = (x, y, r, f, e = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${e}/>`;
const E = (x, y, rx, ry, f, e = "") => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${e}/>`;
const P = (d, f, e = "") => `<path d="${d}" fill="${f}" ${e}/>`;
const L = (d, s, w, e = "") => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" ${e}/>`;
const T = (x, y, s, size, f, e = "") => `<text x="${x}" y="${y}" font-size="${size}" fill="${f}" font-family="DejaVu Sans, Arial" ${e}>${s}</text>`;
const G = (tr, s, e = "") => `<g transform="${tr}" ${e}>${s}</g>`;
const times = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");

const DEFS = `<defs>
  <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b24"/><stop offset="0.55" stop-color="#1b2352"/><stop offset="0.92" stop-color="#4b3f74"/><stop offset="1" stop-color="#7a5a86"/></linearGradient>
  <radialGradient id="h-moon"><stop offset="0" stop-color="#fff7d6" stop-opacity="0.55"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient>
  <radialGradient id="h-warm"><stop offset="0" stop-color="#ffe2a0" stop-opacity="0.85"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
  <radialGradient id="h-pink"><stop offset="0" stop-color="#ff8fc8" stop-opacity="0.8"/><stop offset="1" stop-color="#ff8fc8" stop-opacity="0"/></radialGradient>
  <radialGradient id="h-white"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  <radialGradient id="h-tv"><stop offset="0" stop-color="#9fd0ff" stop-opacity="0.75"/><stop offset="1" stop-color="#9fd0ff" stop-opacity="0"/></radialGradient>
  <linearGradient id="h-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.34"/><stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="0.85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></linearGradient>
  <linearGradient id="h-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.3"/><stop offset="0.12" stop-color="#000" stop-opacity="0"/><stop offset="0.9" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.26"/></linearGradient>
  <linearGradient id="h-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d95a3"/><stop offset="0.5" stop-color="#d5dae3"/><stop offset="1" stop-color="#8d95a3"/></linearGradient>
  <linearGradient id="h-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#101736"/><stop offset="1" stop-color="#2a3468"/></linearGradient>
  <pattern id="h-cut" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="26" height="26" fill="#9b9488"/><rect width="9" height="26" fill="#857e72"/></pattern>
  <pattern id="h-brick" width="64" height="40" patternUnits="userSpaceOnUse"><rect width="64" height="40" fill="#272a38"/><path d="M0 0H64M0 20H64M0 40H64M16 0V20M48 20V40" stroke="#1b1d28" stroke-width="3"/></pattern>
  <pattern id="h-diamond" width="70" height="90" patternUnits="userSpaceOnUse"><path d="M35 8 L52 45 L35 82 L18 45 Z" fill="none" stroke="#c5ad80" stroke-width="3"/><circle cx="35" cy="45" r="5" fill="#c59a6a"/><circle cx="0" cy="0" r="4" fill="#c5ad80"/><circle cx="70" cy="90" r="4" fill="#c5ad80"/><circle cx="70" cy="0" r="4" fill="#c5ad80"/><circle cx="0" cy="90" r="4" fill="#c5ad80"/></pattern>
  <pattern id="h-tile" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="56" height="56" fill="#ebe8dc"/><path d="M0 0H56V56" fill="none" stroke="#cfcbbb" stroke-width="3"/></pattern>
  <pattern id="h-check" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#b08a5a"/><rect width="40" height="40" fill="#96744a"/><rect x="40" y="40" width="40" height="40" fill="#96744a"/></pattern>
  <pattern id="h-plank" width="150" height="70" patternUnits="userSpaceOnUse"><path d="M0 0H150M0 35H150M60 0V35M120 35V70" stroke="#000" stroke-opacity="0.18" stroke-width="3"/></pattern>
  <pattern id="h-hex" width="84" height="96" patternUnits="userSpaceOnUse"><path d="M42 4 L78 24 L78 68 L42 88 L6 68 L6 24 Z" fill="#20263e" stroke="#151a2c" stroke-width="3"/></pattern>
  <pattern id="h-oil" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="#f3efe4"/><rect width="25" height="25" fill="#d9534f"/><rect x="25" y="25" width="25" height="25" fill="#d9534f"/></pattern>
  <pattern id="h-flower" width="46" height="52" patternUnits="userSpaceOnUse"><circle cx="12" cy="14" r="5" fill="#fff"/><circle cx="12" cy="14" r="2" fill="#f2c04a"/><circle cx="35" cy="40" r="5" fill="#f6a9c0"/><circle cx="35" cy="40" r="2" fill="#fff"/></pattern>
  <pattern id="h-stars" width="54" height="60" patternUnits="userSpaceOnUse"><path d="M14 8 l3 7 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1z" fill="#ffd84a"/><circle cx="40" cy="42" r="4" fill="#fff"/></pattern>
  <pattern id="h-dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="4.5" fill="#fff"/><circle cx="26" cy="26" r="4.5" fill="#fff"/></pattern>
</defs>`;

// ---------- outside: night sky, moon, neighbours, yard ----------
function exterior() {
  let s = R(0, 0, WW, WH, "url(#h-sky)");
  s += times(190, (i) => C(rnd() * WW, rnd() * 5200, 2 + rnd() * 5, "#fff", `opacity="${0.25 + rnd() * 0.6}" ${i < 34 ? 'class="tw"' : ""}`));
  s += G("translate(2890 470)", C(0, 0, 520, "url(#h-moon)") + C(0, 0, 190, "#fff3c4") + C(-60, -50, 34, "#ecdca6") + C(50, 60, 48, "#ecdca6") + C(70, -60, 20, "#ecdca6"));
  // far skyline
  for (let x = -60; x < WW; x += 150 + rnd() * 90) {
    const h = 900 + rnd() * 2600, w = 160 + rnd() * 120;
    s += R(x, F1 - h, w, h + 20, "#131a3e");
    s += times(Math.floor(h / 150), (j) => times(3, (k) => (rnd() < 0.3 ? R(x + 22 + k * (w / 3.4), F1 - h + 50 + j * 150, 26, 44, rnd() < 0.5 ? "#ffd98a" : "#9fc4ff", 'opacity="0.55"') : "")));
  }
  // two neighbours: panel houses with living windows
  const block = (x, w, top, col, cols) => {
    let b = R(x, top, w, F1 - top, col) + R(x - 14, top - 30, w + 28, 36, shade(col, 0.7));
    const cw = w / cols;
    for (let y = top + 90; y < F1 - 260; y += 300) {
      b += R(x, y + 236, w, 8, shade(col, 0.82));
      for (let c2 = 0; c2 < cols; c2++) {
        const on = rnd() < 0.55, wx = x + c2 * cw + cw * 0.2, ww = cw * 0.6;
        const light = ["#ffd98a", "#ffe9b8", "#ffc46b", "#b8d4ff", "#ffb3c8"][Math.floor(rnd() * 5)];
        b += R(wx - 8, y - 8, ww + 16, 196, shade(col, 0.6)) + R(wx, y, ww, 180, on ? light : "#141a36", on ? 'class="nw"' : "");
        b += R(wx + ww / 2 - 4, y, 8, 180, shade(col, 0.6)) + R(wx, y + 62, ww, 7, shade(col, 0.6));
        if (on && rnd() < 0.6) b += P(`M${wx} ${y} h${ww * 0.34} q-10 90 -${ww * 0.3} 180 h-${ww * 0.04} Z`, shade(light, 0.72)) + P(`M${wx + ww} ${y} h-${ww * 0.34} q10 90 ${ww * 0.3} 180 h${ww * 0.04} Z`, shade(light, 0.72));
        if (rnd() < 0.35) b += R(wx - 14, y + 190, ww + 28, 14, "#5b6278") + times(5, (q) => R(wx - 10 + q * ((ww + 16) / 4), y + 204, 6, 60, "#5b6278")) + R(wx - 14, y + 262, ww + 28, 10, "#5b6278");
      }
    }
    return b + R(x + w / 2 - 70, F1 - 230, 140, 230, "#2a2233") + R(x + w / 2 - 100, F1 - 262, 200, 34, shade(col, 0.6)) + C(x + w / 2, F1 - 300, 22, "#ffe2a0") + C(x + w / 2, F1 - 300, 120, "url(#h-warm)");
  };
  s += block(120, 1060, ROOF + 40, "#5d6687", 4) + block(3030, 1040, 420, "#6b6384", 4);
  // yard: snow, lamps, trees, a car, a snowman
  s += R(0, F1, WW, WH - F1, "#dfe7f6") + P(`M0 ${F1} Q500 ${F1 - 60} 1100 ${F1} T2300 ${F1} T3400 ${F1} T${WW} ${F1} V${F1 + 40} H0 Z`, "#eef3fb");
  s += R(0, F1 + 150, WW, 150, "#3a3f55") + times(14, (i) => R(i * 320 + 40, F1 + 216, 150, 14, "#e9e4c8"));
  const tree = (x, k) => G(`translate(${x} ${F1}) scale(${k})`, L("M0 0 V-520 M0 -300 L-110 -470 M0 -360 L120 -540 M0 -430 L-70 -600 M0 -520 L40 -700 M-110 -470 L-170 -520 M120 -540 L190 -560 M-70 -600 L-90 -680 M120 -540 L130 -640", "#241d2e", 22) + L("M-110 -474 L-170 -524 M120 -544 L190 -564 M-70 -604 L-90 -684", "#eef3fb", 7));
  s += tree(1210, 1.5) + tree(2990, 1.2) + tree(640, 1) + tree(3880, 1.7);
  const lamp = (x) => R(x - 9, F1 - 640, 18, 640, "#1c1d2a") + P(`M${x} ${F1 - 640} q0 -50 70 -50 h20 v18 h-20 q-52 0 -52 32 Z`, "#1c1d2a") + C(x + 84, F1 - 668, 26, "#ffe9b0") + C(x + 84, F1 - 640, 300, "url(#h-warm)", 'opacity="0.8"');
  s += lamp(930) + lamp(3180);
  // «Жигули» under a snow cap
  s += G(`translate(3340 ${F1 + 100})`, P("M0 0 h520 v-70 q0 -30 -40 -36 l-70 -8 l-60 -90 h-200 l-70 90 l-50 8 q-30 6 -30 36 Z", "#b9443c") + P("M105 -118 l50 -70 h80 v70 Z M250 -118 v-70 h70 l44 70 Z", "#9fc4e8") + P("M88 -200 h216 q30 -34 -10 -44 h-190 q-44 8 -16 44 Z", "#eef3fb") + C(110, 4, 50, "#1a1a22") + C(110, 4, 22, "#8d95a3") + C(410, 4, 50, "#1a1a22") + C(410, 4, 22, "#8d95a3") + R(492, -52, 30, 18, "#ffe9b0"));
  // snowman by the entrance
  s += G(`translate(${BX - 190} ${F1})`, C(0, -70, 80, "#f6f9ff") + C(0, -190, 58, "#f6f9ff") + C(0, -280, 42, "#f6f9ff") + C(-14, -288, 6, "#222") + C(14, -288, 6, "#222") + P("M0 -276 l46 10 l-46 6 Z", "#f08a2a") + P("M-34 -316 h68 l-10 -60 h-48 Z", "#3a6fb8") + L("M-56 -200 L-130 -260 M56 -200 L132 -250", "#3b2a1e", 9) + P("M-40 -246 q40 22 80 0 l6 20 q-46 26 -92 0 Z", "#e3262f") + R(22, -236, 20, 70, "#e3262f"));
  s += times(70, () => `<circle class="snow" r="${5 + rnd() * 7}" fill="#fff" opacity="${0.5 + rnd() * 0.45}" data-x="${rnd() * WW}" data-y="${rnd() * WH}" data-v="${130 + rnd() * 170}" data-p="${rnd() * 6}"/>`);
  return s;
}

// ---------- shared room pieces ----------
const room = (y, wall, pat, floorC, extra = "") =>
  R(RX0, y - 1120, RX1 - RX0, 1120, wall) + (pat ? R(RX0, y - 1120, RX1 - RX0, 1120, pat) : "") + extra +
  R(RX0, y - 84, RX1 - RX0, 14, shade(wall, 0.62)) + R(RX0, y - 70, RX1 - RX0, 70, floorC) + R(RX0, y - 70, RX1 - RX0, 70, "url(#h-plank)");
const roomShade = (y) => R(RX0, y - 1120, RX1 - RX0, 1120, "url(#h-shade)", 'pointer-events="none"') + R(RX0, y - 1120, RX1 - RX0, 1120, "url(#h-side)");
const win = (x, y, w, h, curt) => {
  let s = R(x - 16, y - 16, w + 32, h + 32, "#f4f1ea") + R(x, y, w, h, "url(#h-glass)");
  s += times(9, () => C(x + 12 + rnd() * (w - 24), y + 12 + rnd() * (h * 0.55), 2.5 + rnd() * 2.5, "#fff", 'opacity="0.8"'));
  s += times(5, (i) => R(x + 10 + i * (w / 5), y + h - 40 - rnd() * 70, w / 6.5, 120, "#0c1130")) + times(7, () => R(x + 14 + rnd() * (w - 40), y + h - 70 + rnd() * 50, 9, 12, "#ffd98a", 'opacity="0.8"'));
  s += `<g clip-path="inset(0)">` + times(7, () => `<circle class="wsnow" r="${3 + rnd() * 3}" fill="#fff" opacity="0.85" data-x="${x + rnd() * w}" data-y0="${y}" data-h="${h}" data-v="${40 + rnd() * 50}" data-p="${rnd() * h}"/>`) + `</g>`;
  s += R(x + w / 2 - 6, y, 12, h, "#f4f1ea") + R(x, y + h * 0.36, w, 10, "#f4f1ea") + R(x - 30, y + h + 16, w + 60, 20, "#e2ddd0");
  if (curt) s += P(`M${x - 22} ${y - 30} h${w * 0.36} q-6 ${h * 0.55} -${w * 0.3} ${h + 40} h-${w * 0.06} Z`, curt, 'opacity="0.93"') + P(`M${x + w + 22} ${y - 30} h-${w * 0.36} q6 ${h * 0.55} ${w * 0.3} ${h + 40} h${w * 0.06} Z`, curt, 'opacity="0.93"') + R(x - 40, y - 44, w + 80, 16, "#8a6a4a", 'rx="8"');
  return s;
};
const lampGlow = (x, y, r, g = "h-warm", o = 0.8) => C(x, y, r, `url(#${g})`, `opacity="${o}"`);
const ceilLamp = (x, y, col) => L(`M${x} ${y - 1120} V${y - 1010}`, "#222", 5) + P(`M${x - 70} ${y - 950} q70 -110 140 0 Z`, col) + C(x, y - 950, 20, "#fff5cf") + lampGlow(x, y - 930, 420, "h-warm", 0.55);

// ---------- floor 1: баба Зина ----------
function flat1(y) {
  let s = room(y, "#d9c7a3", "url(#h-diamond)", "#8a5a3a");
  s += ceilLamp(2300, y, "#d98a4a");
  // ковёр на стене
  s += G(`translate(2440 ${y - 950})`, R(0, 0, 340, 440, "#8e1f2a") + R(14, 14, 312, 412, "none", 'stroke="#e2b25a" stroke-width="7"') + R(34, 34, 272, 372, "none", 'stroke="#2f4a7a" stroke-width="9"') + P("M170 70 L270 220 L170 370 L70 220 Z", "#c8323c", 'stroke="#e2b25a" stroke-width="6"') + P("M170 140 L224 220 L170 300 L116 220 Z", "#2f4a7a") + C(170, 220, 18, "#e2b25a") + times(4, (i) => C(i < 2 ? 62 : 278, i % 2 ? 68 : 372, 15, "#e2b25a")) + times(17, (i) => R(6 + i * 20, 440, 7, 22, "#e2b25a")));
  // диван с пледом и подушками
  s += G(`translate(2420 ${y})`, R(0, -350, 380, 150, "#5a6f4c", 'rx="26"') + R(-16, -260, 412, 150, "#6f8760", 'rx="24"') + R(-28, -290, 60, 200, "#4c5f40", 'rx="22"') + R(348, -290, 60, 200, "#4c5f40", 'rx="22"') + R(6, -110, 26, 78, "#3b2a1e") + R(348, -110, 26, 78, "#3b2a1e") + R(40, -338, 110, 100, "#e8d9b8", 'rx="14" transform="rotate(-8 95 -288)"') + P("M60 -320 l70 60 M130 -320 l-70 60", "none", 'stroke="#c8323c" stroke-width="5"') + R(212, -330, 110, 96, "#c8323c", 'rx="14" transform="rotate(7 267 -282)"') + P("M150 -262 h220 v96 q-110 26 -220 0 Z", "#b8862e") + times(5, (i) => L(`M${170 + i * 44} -262 v104`, "#e8c46a", 5)) + times(11, (i) => R(154 + i * 20, -166, 6, 20, "#b8862e")));
  // сервант: хрусталь, фото, телевизор
  s += G(`translate(1890 ${y - 36})`, R(0, -660, 300, 660, "#6b4226", 'rx="8"') + R(16, -644, 268, 250, "#f5ecd8") + R(16, -520, 268, 8, "#6b4226") + R(144, -644, 8, 250, "#6b4226") +
    times(4, (i) => P(`M${34 + i * 28} -530 l8 -44 h-26 l8 44 Z`, "#dff3ff", 'stroke="#9fc4e8" stroke-width="2"')) + E(214, -548, 40, 26, "#f6f6f6", 'stroke="#3a6fb8" stroke-width="4"') + E(214, -548, 20, 12, "none", 'stroke="#3a6fb8" stroke-width="3"') +
    R(34, -500, 60, 80, "#3b2a1e") + R(40, -494, 48, 68, "#cdb9a0") + C(64, -470, 13, "#8a6a55") + P("M46 -430 q18 -26 36 0 Z", "#5a4638") + times(3, (i) => E(170 + i * 38, -410, 15, 22, "#e9f6ff", 'stroke="#9fc4e8" stroke-width="2"')) + T(118, -604, "САХАР", 20, "#8a5a3a", 'font-weight="700"') + R(110, -598, 30, 60, "#e9f6ff", 'stroke="#9fc4e8" stroke-width="2"') +
    R(16, -376, 268, 190, "#2a1a10") + R(40, -362, 220, 160, "#3a3a44", 'rx="14"') + R(54, -350, 150, 136, "#0d1a2e", 'rx="18"') + `<rect id="tvpic" x="54" y="-350" width="150" height="136" rx="18" fill="#3a6fb8"/>` + R(62, -300, 134, 34, "#e3262f") + T(129, -276, "УДАР В МОЗГ", 17, "#fff", 'text-anchor="middle" font-weight="900"') + C(232, -330, 11, "#c8c8d0") + C(232, -296, 11, "#c8c8d0") + times(4, (i) => R(216, -264 + i * 12, 32, 5, "#111")) + L("M150 -362 L96 -452 M150 -362 L210 -446", "#b0b0b8", 4) +
    P("M30 -376 h240 l-14 18 h-212 Z", "#fff", 'opacity="0.9"') + R(16, -170, 128, 154, "#7d4f2e") + R(156, -170, 128, 154, "#7d4f2e") + C(134, -92, 7, "#e2b25a") + C(166, -92, 7, "#e2b25a") + R(0, -18, 300, 18, "#4a2c18"));
  s += `<circle id="tvglow" cx="2020" cy="${y - 320}" r="260" fill="url(#h-tv)"/>`;
  // часы с маятником и отрывной календарь
  s += G(`translate(2260 ${y - 900})`, R(-52, -70, 104, 150, "#5a371f", 'rx="10"') + P("M-62 -70 L0 -112 L62 -70 Z", "#5a371f") + C(0, -8, 42, "#f6efdc", 'stroke="#e2b25a" stroke-width="5"') + times(12, (i) => R(-2, -46, 4, 9, "#3b2a1e", `transform="rotate(${i * 30})"`)) + `<path id="clkH" d="M0 -8 V-30" stroke="#222" stroke-width="5" stroke-linecap="round"/><path id="clkM" d="M0 -8 V-42" stroke="#222" stroke-width="3" stroke-linecap="round"/>` + R(-30, 80, 60, 150, "#4a2c18") + `<g id="pend"><path d="M0 80 V190" stroke="#e2b25a" stroke-width="5"/><circle cx="0" cy="198" r="19" fill="#e2b25a"/></g>`);
  s += G(`translate(2120 ${y - 800})`, R(-40, -10, 80, 26, "#c8323c") + R(-40, 16, 80, 96, "#fff") + `<text id="calDay" x="0" y="82" font-size="54" font-weight="900" text-anchor="middle" fill="#c8323c" font-family="DejaVu Sans, Arial">13</text><text id="calMon" x="0" y="12" font-size="17" font-weight="700" text-anchor="middle" fill="#fff" font-family="DejaVu Sans, Arial">НОЯБРЬ</text>`);
  // торшер с бахромой, банки, лежанка Барсика, половик
  s += G(`translate(2395 ${y - 36})`, R(-5, -520, 10, 520, "#3b2a1e") + E(0, 0, 44, 12, "#3b2a1e") + P("M-70 -520 L-44 -640 H44 L70 -520 Z", "#f0b85a") + times(13, (i) => R(-68 + i * 11, -520, 4, 26, "#c8862e")) + lampGlow(0, -540, 330, "h-warm", 0.75));
  s += E(2290, y - 30, 250, 26, "#b0483a") + E(2290, y - 30, 205, 18, "none", 'stroke="#f0d9a0" stroke-width="5" stroke-dasharray="16 12"');
  s += G(`translate(1990 ${y - 30})`, E(0, 0, 92, 26, "#6b5a8a") + E(0, -6, 66, 15, "#8a78ad") + R(120, -26, 70, 26, "#e9eef6", 'rx="10"') + T(155, -7, "БАРСИК", 13, "#c8323c", 'text-anchor="middle" font-weight="900"') + E(155, -27, 27, 6, "#a8642a"));
  s += G(`translate(1900 ${y - 700})`, times(3, (i) => R(30 + i * 62, -78, 52, 78, "#cfe8d8", 'rx="10" opacity="0.92"') + R(34 + i * 62, -88, 44, 14, "#d9534f", 'rx="4"') + times(3, (k) => E(46 + i * 62 + k * 10, -30 - k * 16, 9, 15, ["#5c8a3a", "#c8323c", "#e2a02e"][i], 'opacity="0.9"'))));
  return s + roomShade(y);
}

// ---------- floor 2: дядя Толя ----------
function flat2(y) {
  let s = room(y, "#b7c9a6", "", "#b08a5a") + R(RX0, y - 70, RX1 - RX0, 70, "url(#h-check)") + R(RX0, y - 560, RX1 - RX0, 476, "url(#h-tile)") + R(RX0, y - 574, RX1 - RX0, 16, "#4a7a8a");
  s += L(`M2300 ${y - 1120} V${y - 1030}`, "#222", 5) + C(2300, y - 1000, 34, "#fff5cf") + lampGlow(2300, y - 1000, 440, "h-warm", 0.6);
  s += win(1940, y - 960, 280, 330, "#f3f6f8");
  // лук в банках на подоконнике
  s += times(3, (i) => G(`translate(${1975 + i * 90} ${y - 614})`, R(-22, -52, 44, 52, "#cfe8f2", 'rx="8" opacity="0.9"') + E(0, -44, 17, 13, "#e8c88a") + L("M-6 -54 q-10 -40 -4 -70 M0 -56 q2 -44 0 -84 M6 -54 q12 -36 8 -66", "#4f9a3a", 5)));
  // стол с клеёнкой, радио, чайник, пельмени
  s += G(`translate(1930 ${y - 36})`, R(18, -250, 16, 250, "#6b4226") + R(236, -250, 16, 250, "#6b4226") + R(0, -280, 270, 34, "#8a5a3a") + P("M-10 -288 h290 v70 l-24 -12 l-24 12 l-24 -12 l-24 12 l-24 -12 l-24 12 l-24 -12 l-24 12 l-24 -12 l-24 12 l-24 -12 l-26 12 Z", "url(#h-oil)") +
    R(20, -360, 110, 72, "#3b2a1e", 'rx="8"') + R(28, -352, 54, 56, "#c8b48a") + times(5, (i) => R(32, -346 + i * 10, 46, 3, "#6b5a3a")) + C(106, -338, 13, "#d8d8d8") + C(106, -306, 9, "#d8d8d8") + L("M118 -360 L172 -450", "#b0b0b8", 4) + `<g id="radio">${L("M150 -420 q24 -14 30 -40", "#ffd84a", 5)}${L("M166 -404 q40 -22 50 -66", "#ffd84a", 5)}</g>` +
    E(205, -292, 46, 12, "#f6f6f6", 'stroke="#3a6fb8" stroke-width="3"') + times(5, (i) => E(180 + i * 12, -298 - (i % 2) * 5, 10, 7, "#f3e3c3", 'stroke="#d9c49a" stroke-width="2"')));
  s += G(`translate(2190 ${y - 36})`, R(-46, -150, 14, 150, "#6b4226") + R(32, -150, 14, 150, "#6b4226") + R(-56, -168, 112, 22, "#c8323c", 'rx="6"'));
  // полка с дрелью и ящиком инструментов
  s += G(`translate(2250 ${y - 800})`, R(0, 0, 250, 14, "#6b4226") + P("M10 14 l24 40 h-12 Z M240 14 l-24 40 h12 Z", "#4a2c18") + `<g id="drill">${R(30, -62, 110, 44, "#e8a02e", 'rx="12"')}${R(138, -50, 34, 20, "#3a3a44")}${R(170, -44, 46, 7, "#b0b0b8")}${R(66, -22, 34, 22, "#3a3a44")}${R(60, -62, 12, 44, "#3a3a44")}</g>` + T(126, 50, "НЕ СВЕРЛИТЬ ПОСЛЕ 23:00", 15, "#5a4a3a", 'text-anchor="middle" font-weight="700"'));
  // плита с кастрюлей и паром
  s += G(`translate(2440 ${y - 36})`, R(0, -300, 170, 300, "#f1efe6", 'rx="6"') + R(0, -300, 170, 26, "#3a3a44") + times(4, (i) => C(24 + i * 40, -246, 10, "#3a3a44")) + R(22, -200, 126, 130, "#1d1f27", 'rx="8"') + R(34, -188, 102, 106, "#4a2c18", 'rx="6" opacity="0.8"') + R(30, -226, 110, 9, "#b0b0b8", 'rx="4"') +
    `<g id="pot">${R(26, -376, 118, 76, "#c8323c", 'rx="10"')}${times(4, (i) => C(46 + i * 26, -338, 8, "#fff"))}${R(8, -362, 20, 12, "#222", 'rx="5"')}${R(142, -362, 20, 12, "#222", 'rx="5"')}<g id="lid">${P("M22 -376 q63 -30 126 0 Z", "#9a1f28")}${C(85, -396, 9, "#222")}</g></g>` +
    times(3, (i) => `<path class="steam" data-i="${i}" d="M${60 + i * 26} -410 q-16 -30 0 -60 q16 -30 0 -60" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.5"/>`));
  s += G(`translate(2440 ${y - 640})`, R(-6, 0, 190, 12, "#6b4226") + times(4, (i) => R(8 + i * 44, -44 - (i % 2) * 10, 30, 44 + (i % 2) * 10, ["#d9534f", "#e8a02e", "#5c8a3a", "#f1efe6"][i], 'rx="6"') + R(8 + i * 44, -52 - (i % 2) * 10, 30, 10, "#3a3a44", 'rx="3"')) + L("M20 12 v70 M60 12 v90 M100 12 v60", "#b0b0b8", 5) + E(20, 96, 15, 20, "#b0b0b8") + E(60, 118, 12, 18, "none", 'stroke="#b0b0b8" stroke-width="5"') + R(92, 72, 16, 34, "#b0b0b8"));
  // холодильник «ЗИЛ» с магнитами, сверху хлебница и банка огурцов
  s += G(`translate(2630 ${y - 36})`, R(0, -620, 170, 620, "#f3ecd6", 'rx="26"') + R(0, -420, 170, 8, "#cfc6aa") + R(138, -560, 12, 110, "#b0b0b8", 'rx="6"') + R(138, -390, 12, 150, "#b0b0b8", 'rx="6"') + T(40, -582, "ЗИЛ", 22, "#8a8468", 'font-weight="900" font-style="italic"') +
    C(40, -520, 13, "#e3262f") + R(66, -536, 30, 22, "#3a6fb8", 'rx="4"') + P("M36 -478 l12 22 h-24 Z", "#e8a02e") + R(60, -480, 56, 44, "#fff8c4", 'transform="rotate(-6 88 -458)"') + L("M68 -468 h40 M68 -456 h30 M68 -444 h36", "#8a8468", 3, 'transform="rotate(-6 88 -458)"') + C(110, -330, 12, "#5c8a3a") + R(30, -350, 34, 26, "#f6a9c0", 'rx="5"') +
    R(10, -700, 100, 80, "#c88a4a", 'rx="14"') + R(22, -664, 76, 6, "#8a5a3a") + R(120, -716, 46, 96, "#cfe8d8", 'rx="10" opacity="0.92"') + R(124, -726, 38, 14, "#e8a02e", 'rx="4"') + times(4, (i) => E(135 + (i % 2) * 16, -640 - i * 16, 9, 15, "#5c8a3a")));
  s += G(`translate(2330 ${y - 690})`, R(-50, -64, 100, 128, "#fff") + R(-50, -64, 100, 34, "#3a6fb8") + T(0, -40, "РЫБАЛКА", 16, "#fff", 'text-anchor="middle" font-weight="900"') + P("M-30 6 q30 -26 56 0 l16 -14 v28 l-16 -14 q-26 26 -56 0 Z", "#5b8aa8") + C(-16, 2, 3, "#111") + T(0, 52, "клёв: 13.11", 14, "#555", 'text-anchor="middle"'));
  return s + roomShade(y);
}

// ---------- floor 3: Кристина ----------
function flat3(y) {
  let s = room(y, "#f3d9df", "", "#d8b98a");
  s += P(`M2440 ${y - 84} V${y - 640} q0 -170 170 -170 q170 0 170 170 V${y - 84} Z`, "#e8a58c") + P(`M2480 ${y - 84} V${y - 630} q0 -130 130 -130 q130 0 130 130 V${y - 84} Z`, "#f0bfa8");
  s += win(1890, y - 980, 300, 380, "#fff7fa");
  // гирлянда
  s += L(`M${RX0} ${y - 1060} q250 90 500 10 q250 -80 ${RX1 - RX0 - 500} 30`, "#5a4a55", 4) + times(14, (i) => { const u = (i + 0.5) / 14, x = RX0 + u * (RX1 - RX0), yy = y - 1060 + Math.sin(u * 6.3) * 38 + 40; return L(`M${x} ${yy - 14} v10`, "#5a4a55", 3) + `<circle class="bulb" data-i="${i}" cx="${x}" cy="${yy + 6}" r="11" fill="#ffd84a"/>`; });
  // неон
  s += `<g id="neon">${C(2610, y - 930, 190, "url(#h-pink)")}${T(2610, y - 905, "ВАЙБ", 92, "none", 'text-anchor="middle" font-weight="900" stroke="#ff4fa8" stroke-width="7" stroke-linejoin="round"')}${T(2610, y - 905, "ВАЙБ", 92, "none", 'text-anchor="middle" font-weight="900" stroke="#fff" stroke-width="2"')}</g>`;
  // туалетный столик с зеркалом в лампочках, пуф
  s += G(`translate(2500 ${y - 36})`, R(20, -250, 14, 250, "#e8e2e6") + R(236, -250, 14, 250, "#e8e2e6") + R(0, -290, 270, 46, "#fff", 'rx="8"') + R(96, -278, 80, 22, "#f3d9df", 'rx="6"') + C(136, -267, 6, "#e2b25a") +
    C(135, -470, 118, "#fff") + C(135, -470, 96, "#cfe3f2") + P("M70 -520 q60 -50 130 0", "none", 'stroke="#fff" stroke-width="10" opacity="0.7" stroke-linecap="round"') + times(12, (i) => `<circle class="mb" data-i="${i}" cx="${135 + Math.cos(i * 0.5236) * 107}" cy="${-470 + Math.sin(i * 0.5236) * 107}" r="11" fill="#fff3c4"/>`) + R(120, -360, 30, 72, "#fff") +
    R(18, -330, 22, 40, "#ff7fb0", 'rx="5"') + R(22, -344, 14, 16, "#e2b25a") + R(48, -322, 16, 32, "#c9a0e8", 'rx="5"') + C(84, -306, 15, "#f6c8a8") + R(206, -340, 26, 50, "#fff", 'rx="6" stroke="#e2b25a" stroke-width="3"') + R(212, -352, 14, 14, "#e2b25a") + L("M236 -290 l10 -66 M244 -290 l18 -60 M252 -290 l26 -50", "#3a3a44", 4));
  s += G(`translate(2590 ${y - 36})`, E(0, -60, 78, 60, "#ff9ec4") + E(0, -92, 70, 24, "#ffb8d4") + R(-60, -14, 14, 16, "#e2b25a") + R(46, -14, 14, 16, "#e2b25a"));
  // шпиц на пуфе
  s += G(`translate(2590 ${y - 150})`, `<g id="dogTail">${E(52, -36, 34, 24, "#fff")}</g>` + E(0, -18, 58, 42, "#fff") + C(-34, -58, 38, "#fff") + P("M-64 -84 l10 -30 l16 24 Z M-22 -90 l12 -28 l12 28 Z", "#fff") + C(-46, -62, 5, "#222") + C(-24, -62, 5, "#222") + E(-36, -48, 7, 5, "#222") + `<path id="dogTongue" d="M-40 -42 q4 14 8 0 Z" fill="#ff7f9a"/>` + R(-52, -30, 40, 9, "#ff4fa8", 'rx="4"'));
  // кольцевая лампа со смартфоном
  s += G(`translate(2080 ${y - 36})`, L("M0 -420 V-60 M0 -60 L-70 0 M0 -60 L70 0 M0 -60 L0 0", "#2a2a33", 9) + `<circle id="ringglow" cx="0" cy="-540" r="260" fill="url(#h-white)" opacity="0.6"/>` + C(0, -540, 112, "none", 'stroke="#fff" stroke-width="30"') + C(0, -540, 112, "none", 'stroke="#ffe9c4" stroke-width="10"') + R(-30, -596, 60, 112, "#1d1f27", 'rx="10"') + R(-24, -588, 48, 96, "#ff9ec4", 'rx="6"') + C(0, -548, 15, "#f6d3bd") + P("M-18 -506 q18 -34 36 0 Z", "#ff7fb0") + C(16, -580, 5, "#e3262f"));
  // монстера, пампасная трава, полка с «кнопкой»
  s += G(`translate(1880 ${y - 36})`, P("M-44 0 h88 l-12 -96 h-64 Z", "#e8e2e6") + R(-50, -106, 100, 20, "#d8cfd6", 'rx="6"') + L("M0 -100 q-10 -120 -70 -190 M0 -100 q10 -160 60 -250 M0 -100 q-4 -100 -10 -300", "#3f7a3a", 8) + `<g class="leaf" data-i="0">${E(-80, -310, 62, 44, "#3f8a3f", 'transform="rotate(-30 -80 -310)"')}${L("M-110 -330 l40 26 M-96 -350 l30 30", "#f3d9df", 6)}</g><g class="leaf" data-i="1">${E(70, -372, 66, 46, "#4a9a48", 'transform="rotate(24 70 -372)"')}${L("M100 -396 l-40 30 M112 -372 l-44 14", "#f3d9df", 6)}</g><g class="leaf" data-i="2">${E(-12, -430, 54, 40, "#3f8a3f", 'transform="rotate(-6 -12 -430)"')}${L("M-30 -452 l22 30", "#f3d9df", 6)}</g>`);
  s += G(`translate(2320 ${y - 820})`, R(-110, 0, 220, 12, "#fff") + R(-86, -70, 96, 70, "#d8d8de", 'rx="8"') + P("M-50 -50 l28 15 l-28 15 Z", "#fff") + T(-38, -76, "100K", 18, "#b0a0aa", 'text-anchor="middle" font-weight="900"') + R(30, -46, 24, 46, "#fff3c4", 'rx="6"') + `<ellipse class="flame" cx="42" cy="-58" rx="6" ry="12" fill="#ffb03a"/>` + R(66, -34, 24, 34, "#f6a9c0", 'rx="6"') + `<ellipse class="flame" cx="78" cy="-46" rx="6" ry="12" fill="#ffb03a"/>`);
  s += G(`translate(2440 ${y - 36})`, R(-18, -90, 36, 90, "#e8a58c", 'rx="12"') + times(5, (i) => L(`M0 -86 q${-40 + i * 20} -120 ${-60 + i * 30} -230`, "#e8d9b8", 12)));
  s += G(`translate(2010 ${y - 36})`, R(-24, -250, 48, 250, "#8a78ad", 'rx="24"') + C(0, -250, 24, "#a896c8") + C(0, -250, 9, "#8a78ad"));
  return s + roomShade(y);
}

// ---------- floor 4: Гоша ----------
function flat4(y) {
  let s = room(y, "#1b2034", "url(#h-hex)", "#2a2f45");
  s += `<path class="rgb" d="M${RX0} ${y - 1106} H${RX1}" stroke="#ff3fa8" stroke-width="14"/><ellipse id="rgbglow" cx="2300" cy="${y - 1100}" rx="560" ry="300" fill="#ff3fa8" opacity="0.16"/>`;
  // окно с жалюзи
  s += G(`translate(1890 ${y - 990})`, R(-14, -14, 288, 368, "#2a2f45") + R(0, 0, 260, 340, "url(#h-glass)") + times(15, (i) => R(0, 6 + i * 22, 260, 14, "#3a4160", i === 9 ? 'transform="rotate(5 130 210)"' : "")) + L("M246 0 v300", "#8d95a3", 3) + C(246, 306, 7, "#8d95a3"));
  // постеры
  s += G(`translate(2290 ${y - 900})`, R(-110, -90, 220, 180, "#0f1322", 'stroke="#3a4160" stroke-width="5"') + T(0, -16, "404", 76, "#4fe3a8", 'text-anchor="middle" font-weight="900"') + T(0, 30, "СОН НЕ НАЙДЕН", 21, "#8d95a3", 'text-anchor="middle" font-weight="700"') + T(0, 62, "ctrl + alt + кофе", 16, "#5a6384", 'text-anchor="middle"'));
  s += G(`translate(2130 ${y - 660})`, R(-60, -60, 120, 120, "#0f1322", 'stroke="#3a4160" stroke-width="5"') + times(7, (i) => times(7, (k) => ([[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [3, 1], [6, 1], [0, 2], [6, 2], [1, 3], [5, 3], [2, 4], [4, 4], [3, 5]].some(([a, b]) => a === k && b === i) ? R(-42 + k * 12, -40 + i * 12, 12, 12, "#ff4f6a") : ""))));
  // серверная стойка и роутер
  s += G(`translate(1890 ${y - 36})`, R(0, -520, 150, 520, "#0f1322", 'rx="8" stroke="#3a4160" stroke-width="5"') + times(8, (i) => R(14, -500 + i * 62, 122, 48, "#1b2034", 'rx="5"') + times(6, (k) => `<circle class="led" data-i="${i * 6 + k}" cx="${28 + k * 14}" cy="${-476 + i * 62}" r="4.5" fill="#4fe3a8"/>`) + R(112, -486 + i * 62, 16, 20, "#3a4160")) +
    R(26, -560, 98, 30, "#e9eef6", 'rx="8"') + L("M40 -560 l-14 -70 M110 -560 l14 -70 M75 -560 v-76", "#e9eef6", 6) + `<circle class="led" data-i="50" cx="46" cy="-545" r="4" fill="#4fe3a8"/><circle class="led" data-i="51" cx="60" cy="-545" r="4" fill="#4fe3a8"/>` + L(`M150 -80 q120 60 200 20 q120 -60 360 30`, "#3a4160", 8));
  // стопка пиццы, банки
  s += G(`translate(2110 ${y - 36})`, times(5, (i) => R(-70 + (i % 2) * 8, -30 - i * 30, 150, 28, "#c8a878", 'stroke="#8a6a4a" stroke-width="3"') + (i === 4 ? C(6, -148, 30, "#e3262f", 'opacity="0.9"') + P("M6 -148 l22 12 l-22 12 l-16 -12 Z", "#fff", 'opacity="0.9"') : "")) + times(4, (i) => R(100 + i * 26, -50 + (i % 2) * 14, 20, 50 - (i % 2) * 14, ["#4fe3a8", "#ff4f6a", "#4fa8ff", "#ffd84a"][i], `rx="5" ${i === 3 ? 'transform="rotate(80 190 -20)"' : ""}`)));
  // стол с тремя мониторами
  s += G(`translate(2450 ${y - 36})`, R(0, -270, 350, 22, "#3a4160", 'rx="6"') + R(10, -250, 16, 250, "#2a2f45") + R(324, -250, 16, 250, "#2a2f45") + R(250, -246, 80, 200, "#0f1322", 'rx="8"') + `<circle class="led" data-i="60" cx="266" cy="-226" r="5" fill="#4fa8ff"/><rect class="rgbf" x="258" y="-200" width="64" height="130" rx="6" fill="#ff3fa8" opacity="0.5"/>` +
    `<path class="rgb" d="M0 -246 H350" stroke="#ff3fa8" stroke-width="7"/>` +
    R(108, -300, 16, 36, "#3a4160") + R(84, -272, 64, 8, "#3a4160") + R(14, -440, 204, 140, "#0a0d18", 'rx="8" stroke="#3a4160" stroke-width="5"') + `<g clip-path="inset(0)" transform="translate(24 -430)"><svg width="184" height="120" viewBox="0 0 184 120"><g id="code">${times(16, (i) => R(6 + (i % 3) * 14, i * 16, 30 + ((i * 37) % 90), 7, ["#4fe3a8", "#4fa8ff", "#ffd84a", "#ff7fb0"][i % 4], 'rx="3"'))}</g></svg></g>` +
    R(230, -470, 104, 170, "#0a0d18", 'rx="8" stroke="#3a4160" stroke-width="5"') + times(6, (i) => R(240, -458 + i * 24, 20, 14, "#3a4160", 'rx="7"') + R(266, -456 + i * 24, 30 + ((i * 23) % 30), 10, i % 2 ? "#4fa8ff" : "#8d95a3", 'rx="5"')) + R(274, -300, 16, 30, "#3a4160") +
    R(40, -292, 150, 16, "#0f1322", 'rx="5"') + times(12, (i) => `<rect class="key" data-i="${i}" x="${46 + i * 12}" y="-289" width="8" height="8" rx="2" fill="#ff3fa8"/>`) + E(214, -280, 14, 9, "#0f1322") +
    G("translate(0 -300)", E(-2, -10, 22, 16, "#ffd84a") + C(-12, -30, 13, "#ffd84a") + P("M-26 -30 l-12 4 l12 4 Z", "#f08a2a") + C(-16, -34, 2.5, "#111")));
  // игровое кресло
  s += G(`translate(2395 ${y - 36})`, R(-8, -120, 16, 90, "#2a2f45") + L("M0 -30 L-60 0 M0 -30 L60 0 M0 -30 V0", "#2a2f45", 12) + R(-66, -150, 132, 36, "#1d1f27", 'rx="14"') + P("M-58 -150 q-14 -260 10 -330 h96 q24 70 10 330 Z", "#1d1f27") + P("M-30 -160 q-8 -230 6 -300 h48 q14 70 6 300 Z", "#e3262f") + R(-40, -470, 80, 44, "#1d1f27", 'rx="16"'));
  // робот-пылесос
  s += `<g id="robo" transform="translate(2000 ${y - 30})"><ellipse cx="0" cy="0" rx="64" ry="18" fill="#e9eef6"/><ellipse cx="0" cy="-5" rx="52" ry="12" fill="#cfd5e2"/><circle id="roboLed" cx="0" cy="-6" r="6" fill="#4fe3a8"/><rect x="-16" y="-22" width="32" height="10" rx="5" fill="#8d95a3"/></g>`;
  return s + roomShade(y);
}

// ---------- floor 5: Петя ----------
function flat5(y) {
  let s = room(y, "#bfe0f2", "", "#c9a878");
  s += times(4, (i) => G(`translate(${1900 + i * 250} ${y - 700 + (i % 2) * 90})`, E(0, 0, 80, 34, "#fff", 'opacity="0.85"') + C(-40, -14, 34, "#fff", 'opacity="0.85"') + C(14, -30, 44, "#fff", 'opacity="0.85"')));
  s += times(12, (i) => `<path class="gstar" data-i="${i}" transform="translate(${RX0 + 60 + ((i * 197) % 900)} ${y - 1080 + ((i * 71) % 90)}) scale(${0.8 + (i % 3) * 0.25})" d="M0 -16 l5 11 12 1 -9 8 3 12 -11 -7 -11 7 3 -12 -9 -8 12 -1z" fill="#d8ff6a"/>`);
  s += win(2130, y - 990, 250, 330, "#ffd84a") + C(2330, y - 910, 30, "#fff3c4");
  // мобиль «Солнечная система»
  s += G(`translate(1990 ${y - 1120})`, L("M0 0 V90", "#555", 3) + C(0, 110, 26, "#ffb03a") + `<g id="mobile">${times(4, (i) => `<g class="planet" data-i="${i}"><circle r="${[9, 13, 11, 16][i]}" fill="${["#b0b0b8", "#e8a02e", "#4fa8ff", "#d98a4a"][i]}"/>${i === 3 ? '<ellipse rx="26" ry="6" fill="none" stroke="#f0d9a0" stroke-width="3"/>' : ""}</g>`)}</g>`);
  // постер с ракетой
  s += G(`translate(2450 ${y - 870})`, R(-70, -100, 140, 200, "#16204a", 'stroke="#fff" stroke-width="6"') + times(8, (i) => C(-56 + ((i * 37) % 112), -86 + ((i * 53) % 150), 2.5, "#fff")) + P("M0 -70 q28 34 20 90 h-40 q-8 -56 20 -90 Z", "#f4f4f4") + C(0, -22, 10, "#4fa8ff") + P("M-20 6 l-18 26 h18 Z M20 6 l18 26 h-18 Z", "#e3262f") + P("M-10 20 q10 44 20 0 Z", "#ffb03a") + T(0, 84, "ПОЕХАЛИ!", 18, "#fff", 'text-anchor="middle" font-weight="900"'));
  // двухъярусная кровать с мишкой
  s += G(`translate(2510 ${y - 36})`, R(0, -660, 18, 660, "#c88a4a") + R(272, -660, 18, 660, "#c88a4a") + R(0, -500, 290, 28, "#c88a4a") + R(0, -190, 290, 28, "#c88a4a") + R(10, -560, 270, 64, "#3b6bd6", 'rx="16"') + R(10, -560, 270, 64, "url(#h-stars)", 'rx="16"') + R(196, -590, 80, 44, "#fff", 'rx="16"') + R(10, -250, 270, 64, "#e3262f", 'rx="16"') + R(196, -280, 80, 44, "#fff", 'rx="16"') +
    R(0, -640, 290, 14, "#c88a4a") + times(4, (i) => R(40 + i * 40, -640, 10, 80, "#c88a4a")) + L("M-36 0 L-8 -500 M-70 0 L-42 -500", "#a86a2e", 12) + times(5, (i) => L(`M${-66 + i * 5.6} ${-60 - i * 90} h34`, "#a86a2e", 10)) +
    G("translate(74 -600)", C(0, 0, 30, "#a8703a") + C(0, -42, 24, "#a8703a") + C(-20, -62, 10, "#a8703a") + C(20, -62, 10, "#a8703a") + E(0, -36, 11, 8, "#e8c88a") + C(-8, -48, 3, "#111") + C(8, -48, 3, "#111") + C(0, -39, 3, "#111") + E(0, 4, 16, 18, "#e8c88a")) +
    P("M10 -186 h270 v150 h-270 Z", "#16204a", 'opacity="0.55"') + times(6, (i) => `<circle class="bulb" data-i="${20 + i}" cx="${34 + i * 46}" cy="${-176 + (i % 2) * 12}" r="8" fill="#ffd84a"/>`));
  // парта: аквариум, глобус, лампа, учебники
  s += G(`translate(1890 ${y - 36})`, R(0, -270, 300, 22, "#e9d9b8", 'rx="6"') + R(12, -250, 16, 250, "#c88a4a") + R(272, -250, 16, 250, "#c88a4a") + R(180, -246, 100, 150, "#f4e8cc", 'stroke="#c88a4a" stroke-width="4"') + C(230, -170, 7, "#c88a4a") +
    R(14, -400, 160, 130, "#9fe0f2", 'rx="8" opacity="0.9" stroke="#e9eef6" stroke-width="6"') + R(14, -290, 160, 20, "#e8c88a") + L("M40 -290 q-10 -40 4 -70 M56 -290 q10 -30 0 -56", "#3f8a3f", 6) + `<g class="fish" data-i="0">${E(0, 0, 17, 10, "#ff8a2a")}${P("M14 0 l14 -10 v20 Z", "#ff8a2a")}${C(-8, -2, 2.5, "#111")}</g><g class="fish" data-i="1">${E(0, 0, 13, 8, "#ffd84a")}${P("M11 0 l12 -8 v16 Z", "#ffd84a")}${C(-6, -2, 2, "#111")}</g>` + times(3, (i) => `<circle class="bub" data-i="${i}" cx="${140 + i * 8}" cy="-300" r="${4 + i}" fill="none" stroke="#fff" stroke-width="2"/>`) +
    G("translate(232 -270)", R(-4, -30, 8, 30, "#8a6a4a") + E(0, 0, 30, 7, "#8a6a4a") + C(0, -66, 40, "#4fa8ff") + P("M-24 -86 q16 -10 26 2 q-6 18 -20 14 Z M6 -60 q18 -8 26 6 q-8 22 -24 12 Z M-30 -56 q10 4 8 18 q-10 -2 -8 -18 Z", "#5cb85c") + L("M-36 -86 A44 44 0 0 1 36 -46", "#e2b25a", 4)) +
    times(4, (i) => R(186 + i * 2, -288 - i * 14, 84 - i * 4, 13, ["#e3262f", "#5cb85c", "#ffd84a", "#3b6bd6"][i], 'rx="3"')));
  // клетка с хомяком, конструктор, мяч, рюкзак
  s += G(`translate(2330 ${y - 760})`, R(-90, 0, 180, 12, "#e9d9b8") + R(-70, -96, 140, 96, "none", 'stroke="#8d95a3" stroke-width="4" rx="10"') + times(6, (i) => L(`M${-50 + i * 20} -96 v96`, "#8d95a3", 2)) + `<g id="wheel" transform="translate(-20 -44)">${C(0, 0, 32, "none", 'stroke="#ff8a2a" stroke-width="5"')}${L("M-32 0 H32 M0 -32 V32 M-22 -22 L22 22 M-22 22 L22 -22", "#ff8a2a", 2)}</g>` + G("translate(-20 -24)", E(0, 0, 17, 12, "#e8c88a") + C(-13, -6, 8, "#e8c88a") + C(-16, -9, 2, "#111") + C(-12, -15, 4, "#f6a9c0")) + R(30, -30, 30, 22, "#5cb85c", 'rx="6"'));
  s += G(`translate(2230 ${y - 36})`, times(5, (i) => R(-40 + (i % 2) * 16, -30 - i * 28, 64, 28, ["#e3262f", "#ffd84a", "#3b6bd6", "#5cb85c", "#e3262f"][i], 'rx="3"') + times(3, (k) => R(-34 + (i % 2) * 16 + k * 20, -36 - i * 28, 12, 7, ["#e3262f", "#ffd84a", "#3b6bd6", "#5cb85c", "#e3262f"][i]))));
  s += `<g id="ball" transform="translate(2440 ${y - 62})"><circle r="32" fill="#fff" stroke="#222" stroke-width="4"/><path d="M0 -12 l12 9 -5 14 h-14 l-5 -14 Z" fill="#222"/><path d="M0 -12 V-32 M12 -3 l18 -8 M7 11 l12 16 M-7 11 l-12 16 M-12 -3 l-18 -8" stroke="#222" stroke-width="3"/></g>`;
  s += G(`translate(2130 ${y - 36})`, R(-44, -110, 88, 110, "#ff8a2a", 'rx="20"') + R(-30, -66, 60, 50, "#e86a1a", 'rx="10"') + L("M-20 -110 q20 -40 40 0", "#3a3a44", 8) + C(0, -84, 9, "#ffd84a"));
  return s + roomShade(y);
}

// ---------- people ----------
// origin = feet centre, ~640 tall; classes are animated by dom.html (arms: shoulder + elbow, head, eyes, brows, mouth)
function person(id, o) {
  const sk = o.skin, sh = o.sh || 76, hip = o.hip || 74, sy = -388;
  const arm = (side) => `<g class="rArm${side}" transform="translate(${side === "L" ? -sh : sh} ${sy})"><g class="up"><rect x="-17" y="-10" width="34" height="120" rx="17" fill="${o.sleeve || o.top}"/>
    <g class="fore" transform="translate(0 100)"><rect x="-15" y="-10" width="30" height="108" rx="15" fill="${o.fore || o.sleeve || o.top}"/><g class="hand" transform="translate(0 100)"><g class="prop">${(side === "R" ? o.propR : o.propL) || ""}</g><ellipse rx="17" ry="19" fill="${sk}"/></g></g></g></g>`;
  const eyeR = o.eyeR || 12;
  return `<g id="res-${id}" class="res"><ellipse cx="0" cy="2" rx="${hip + 40}" ry="13" fill="#000" opacity="0.28"/><g class="rBody">
    ${o.legs || `<rect x="${-hip + 14}" y="-180" width="46" height="172" rx="20" fill="${o.bottom}"/><rect x="${hip - 60}" y="-180" width="46" height="172" rx="20" fill="${o.bottom}"/>`}
    ${o.shoes}
    ${o.torso || `<path d="M${-sh} ${sy - 4} Q0 ${sy - 26} ${sh} ${sy - 4} L${hip} -168 Q0 -148 ${-hip} -168 Z" fill="${o.top}"/>`}
    ${o.body || ""}${arm("L")}${arm("R")}${o.front || ""}
    <g class="rHead"><g transform="translate(0 -420) scale(${o.head || 1}) translate(0 420)">
      ${o.hairBack || ""}<rect x="-22" y="-450" width="44" height="50" fill="${shade(sk, 0.9)}"/>
      <ellipse cx="-78" cy="-500" rx="12" ry="18" fill="${shade(sk, 0.94)}"/><ellipse cx="78" cy="-500" rx="12" ry="18" fill="${shade(sk, 0.94)}"/>
      <ellipse cx="0" cy="-505" rx="78" ry="88" fill="${sk}"/>${o.face || ""}
      <g class="rEyes"><ellipse cx="-30" cy="-512" rx="${eyeR}" ry="${eyeR + 1}" fill="#fff"/><ellipse cx="30" cy="-512" rx="${eyeR}" ry="${eyeR + 1}" fill="#fff"/>
        <g class="rIris"><circle cx="-30" cy="-511" r="${eyeR * 0.62}" fill="${o.eye || "#4a3a2a"}"/><circle cx="30" cy="-511" r="${eyeR * 0.62}" fill="${o.eye || "#4a3a2a"}"/><circle cx="-27" cy="-515" r="2.5" fill="#fff"/><circle cx="33" cy="-515" r="2.5" fill="#fff"/></g>
        <path d="M-44 -521 Q-30 -530 -16 -521 M16 -521 Q30 -530 44 -521" stroke="${o.lash || "#3a2418"}" stroke-width="${o.lashW || 3}" fill="none" stroke-linecap="round"/>${o.eyeX || ""}</g>
      <path class="rBrows" d="${o.brows || "M-48 -540 Q-30 -550 -14 -543 M14 -543 Q30 -550 48 -540"}" stroke="${o.browC || "#4a3324"}" stroke-width="${o.browW || 6}" fill="none" stroke-linecap="round"/>
      <path d="M0 -500 Q-8 -474 3 -470" stroke="${shade(sk, 0.82)}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="-50" cy="-474" rx="15" ry="8" fill="#f29a9a" opacity="${o.blush || 0.45}"/><ellipse cx="50" cy="-474" rx="15" ry="8" fill="#f29a9a" opacity="${o.blush || 0.45}"/>
      <ellipse class="rMouth" cx="0" cy="-448" rx="18" ry="3" fill="#7e222b"/><path class="rLip" d="M-18 -450 Q0 -458 18 -450" stroke="${o.lip || shade(sk, 0.72)}" stroke-width="${o.lipW || 3}" fill="none" stroke-linecap="round"/>
      ${o.hairFront || ""}${o.headX || ""}</g></g>
  </g></g>`;
}
const slippers = (c, pom) => `<ellipse cx="-34" cy="-6" rx="34" ry="13" fill="${c}"/><ellipse cx="34" cy="-6" rx="34" ry="13" fill="${c}"/>` + (pom ? C(-40, -16, 9, pom) + C(40, -16, 9, pom) : "");

const PEOPLE = {
  Z: () => person("Z", {
    skin: "#f0c8ac", sh: 80, hip: 90, top: "#5d7fb8", eye: "#5a6f8a", blush: 0.6, browC: "#b0aaa4", browW: 5, lip: "#c45a63",
    legs: R(-60, -110, 44, 104, "#c9a58a", 'rx="18"') + R(16, -110, 44, 104, "#c9a58a", 'rx="18"'), shoes: slippers("#c8323c", "#fff"),
    torso: P("M-80 -392 Q0 -414 80 -392 L104 -96 Q0 -76 -104 -96 Z", "#5d7fb8") + P("M-80 -392 Q0 -414 80 -392 L104 -96 Q0 -76 -104 -96 Z", "url(#h-flower)"),
    body: L("M0 -396 V-88", "#3f5a8a", 5) + times(4, (i) => C(10, -340 + i * 60, 6, "#f0d9a0")) + R(-70, -230, 46, 50, "#3f5a8a", 'rx="8" opacity="0.6"'),
    front: P("M-88 -396 Q0 -350 88 -396 L96 -330 Q0 -286 -96 -330 Z", "#e9e0d0") + times(9, (i) => L(`M${-88 + i * 22} ${-322 + Math.abs(i - 4) * -4} v18`, "#e9e0d0", 4)),
    hairBack: P("M-90 -510 Q-96 -606 0 -610 Q96 -606 90 -510 Q92 -452 58 -420 Q0 -392 -58 -420 Q-92 -452 -90 -510 Z", "#c8323c") + P("M-90 -510 Q-96 -606 0 -610 Q96 -606 90 -510 Q92 -452 58 -420 Q0 -392 -58 -420 Q-92 -452 -90 -510 Z", "url(#h-dots)", 'opacity="0.85"'),
    face: L("M-60 -498 l-10 -6 M-60 -488 l-11 2 M60 -498 l10 -6 M60 -488 l11 2 M-26 -462 q-8 8 -4 18 M26 -462 q8 8 4 18", "#d9a58a", 2.5),
    hairFront: P("M-58 -566 Q0 -600 58 -566 Q30 -574 0 -560 Q-30 -574 -58 -566 Z", "#d8d4d0") + P("M-80 -540 Q-60 -596 0 -600 Q60 -596 80 -540 Q40 -584 0 -584 Q-40 -584 -80 -540 Z", "#c8323c"),
    headX: C(-30, -512, 23, "none", 'stroke="#8a5a3a" stroke-width="5"') + C(30, -512, 23, "none", 'stroke="#8a5a3a" stroke-width="5"') + L("M-7 -514 q7 -6 14 0", "#8a5a3a", 5) + P("M-16 -420 l-30 34 l34 -10 Z M16 -420 l30 34 l-34 -10 Z", "#c8323c") + C(0, -418, 13, "#a8242e"),
    propL: C(0, 34, 30, "#ff7fb0") + L("M-22 22 q22 -18 44 2 M-26 38 q26 -14 50 6", "#e85a94", 4) + L("M-30 60 L40 -50 M-10 66 L56 -40", "#d8d8de", 5),
  }),
  T: () => person("T", {
    skin: "#e9bf9f", sh: 92, hip: 98, top: "#f1f1ee", sleeve: "#e9bf9f", bottom: "#2b4a8a", eye: "#4a3a2a", browC: "#3a2e26", browW: 9, blush: 0.5,
    shoes: R(-78, -40, 46, 34, "#b8bcc6", 'rx="8"') + R(32, -40, 46, 34, "#b8bcc6", 'rx="8"') + E(-58, -6, 40, 14, "#3b2a1e") + E(58, -6, 40, 14, "#3b2a1e") + R(-80, -20, 30, 12, "#3b2a1e", 'rx="6"') + R(50, -20, 30, 12, "#3b2a1e", 'rx="6"'),
    torso: P("M-92 -392 Q0 -410 92 -392 Q136 -260 108 -164 Q0 -134 -108 -164 Q-136 -260 -92 -392 Z", "#f1f1ee"),
    body: P("M-44 -402 Q0 -326 44 -402 Z", "#e9bf9f") + L("M-12 -372 q6 8 12 0 M2 -360 q6 8 12 0 M-18 -356 q6 8 12 0", "#8a6a55", 3) + P("M-92 -392 q-14 50 6 96 q10 -60 26 -100 Z M92 -392 q14 50 -6 96 q-10 -60 -26 -100 Z", "#e9bf9f") + L("M-104 -168 Q0 -140 104 -168", "#d8d8d2", 5) + R(-98, -180, 196, 22, "#22386b", 'rx="8"') + L("M-12 -170 v40 M12 -170 v34", "#fff", 4) + R(-88, -176, 9, 166, "#fff") + R(79, -176, 9, 166, "#fff") + E(-30, -250, 26, 10, "#e2ddd0", 'opacity="0.7"'),
    hairBack: P("M-86 -500 Q-100 -470 -78 -440 L-66 -520 Z M86 -500 Q100 -470 78 -440 L66 -520 Z", "#5a4a40"),
    face: E(0, -452, 62, 34, "#8a7a6a", 'opacity="0.2"') + E(-24, -574, 26, 10, "#fff", 'opacity="0.35" transform="rotate(-14 -24 -574)"'),
    hairFront: P("M-40 -478 Q0 -500 40 -478 Q44 -458 22 -462 Q0 -474 -22 -462 Q-44 -458 -40 -478 Z", "#4a3a30"),
    brows: "M-50 -538 Q-30 -550 -12 -540 M12 -540 Q30 -550 50 -538",
    propR: G("rotate(0)", R(-5, -150, 10, 170, "#b0b0b8", 'rx="5"') + P("M-30 -150 q30 -50 60 0 Z", "#b0b0b8") + E(0, -150, 30, 9, "#8d95a3")),
  }),
  K: () => person("K", {
    skin: "#f6d3bd", sh: 62, hip: 64, top: "#ff7fb0", bottom: "#2a2a35", eye: "#3a7ab8", eyeR: 14, lash: "#1a1218", lashW: 5, browC: "#5a4030", browW: 4, lip: "#e0457a", lipW: 6, blush: 0.6,
    shoes: R(-64, -34, 60, 34, "#fff", 'rx="14"') + R(4, -34, 60, 34, "#fff", 'rx="14"') + R(-64, -10, 60, 10, "#d8d8de", 'rx="5"') + R(4, -10, 60, 10, "#d8d8de", 'rx="5"') + L("M-50 -26 h26 M18 -26 h26", "#ff7fb0", 4),
    torso: P("M-62 -392 Q0 -410 62 -392 L56 -270 Q0 -258 -56 -270 Z", "#ff7fb0") + P("M-54 -272 Q0 -260 54 -272 L60 -168 Q0 -152 -60 -168 Z", "#f6d3bd"),
    body: R(-60, -200, 120, 34, "#2a2a35", 'rx="10"') + L("M-12 -388 v40 M12 -388 v46", "#fff", 4) + T(0, -300, "♡", 40, "#fff", 'text-anchor="middle"') + C(0, -226, 3, shade("#f6d3bd", 0.8)),
    hairBack: P("M-90 -520 Q-98 -622 0 -620 Q98 -622 90 -520 L104 -300 Q70 -330 50 -400 L-50 -400 Q-70 -330 -104 -300 Z", "#f1d28a") + C(0, -630, 36, "#f1d28a") + R(-22, -606, 44, 12, "#ff7fb0", 'rx="6"'),
    hairFront: P("M-80 -520 Q-78 -600 0 -600 Q78 -600 80 -520 Q60 -578 6 -584 Q-20 -540 -80 -520 Z", "#f1d28a") + L("M6 -584 Q30 -560 78 -530", "#d8b46a", 3),
    eyeX: L("M-46 -520 l-9 -7 M-44 -526 l-6 -9 M46 -520 l9 -7 M44 -526 l6 -9", "#1a1218", 3),
    headX: C(-84, -470, 11, "none", 'stroke="#e2b25a" stroke-width="4"') + C(84, -470, 11, "none", 'stroke="#e2b25a" stroke-width="4"'),
    propR: G("rotate(0)", R(-24, -92, 48, 92, "#1d1f27", 'rx="9"') + R(-24, -92, 48, 92, "none", 'rx="9" stroke="#c9a0e8" stroke-width="5"') + C(-10, -78, 6, "#3a3a44") + C(6, -78, 6, "#3a3a44") + C(-2, -64, 5, "#3a3a44")),
  }),
  G: () => person("G", {
    skin: "#efc8a8", sh: 80, hip: 76, top: "#3a3f4d", eye: "#4a3a2a", browC: "#2a2019", browW: 8,
    legs: R(-62, -110, 42, 104, "#efc8a8", 'rx="18"') + R(20, -110, 42, 104, "#efc8a8", 'rx="18"') + R(-70, -190, 62, 100, "#5a6b4a", 'rx="14"') + R(8, -190, 62, 100, "#5a6b4a", 'rx="14"'),
    shoes: R(-62, -62, 42, 50, "#fff", 'rx="8"') + R(20, -62, 42, 50, "#fff", 'rx="8"') + L("M-62 -50 h42 M-62 -40 h42 M20 -50 h42 M20 -40 h42", "#e3262f", 3) + E(-42, -6, 36, 12, "#222") + E(42, -6, 36, 12, "#222") + R(-60, -22, 36, 12, "#3a6fb8", 'rx="6"') + R(24, -22, 36, 12, "#3a6fb8", 'rx="6"'),
    body: P("M-46 -260 h92 l-10 70 h-72 Z", "#2e323e") + L("M-14 -384 v70 M14 -384 v60", "#d8d8de", 4) + C(-14, -310, 5, "#d8d8de") + C(14, -320, 5, "#d8d8de"),
    front: P("M-70 -398 Q0 -360 70 -398 L60 -420 Q0 -386 -60 -420 Z", "#2e323e") + `<g id="hp">${L("M-66 -408 Q0 -340 66 -408", "#1d1f27", 12)}${R(-90, -430, 36, 56, "#1d1f27", 'rx="12"')}${R(54, -430, 36, 56, "#1d1f27", 'rx="12"')}<rect class="rgbf" x="-84" y="-420" width="24" height="36" rx="8" fill="#ff3fa8"/><rect class="rgbf" x="60" y="-420" width="24" height="36" rx="8" fill="#ff3fa8"/></g>`,
    hairBack: P("M-92 -500 Q-104 -620 -10 -626 Q104 -622 92 -500 Q86 -540 60 -560 Q0 -590 -60 -560 Q-86 -540 -92 -500 Z", "#2a2019"),
    face: P("M-76 -490 Q-70 -410 0 -404 Q70 -410 76 -490 Q50 -436 0 -434 Q-50 -436 -76 -490 Z", "#2a2019") + P("M-30 -462 Q0 -474 30 -462 Q0 -456 -30 -462 Z", "#2a2019"),
    hairFront: P("M-84 -530 Q-80 -606 -10 -612 Q76 -610 84 -530 Q70 -570 40 -574 L30 -552 L14 -578 L-4 -550 L-20 -580 L-40 -554 L-52 -576 Q-76 -560 -84 -530 Z", "#2a2019"),
    headX: R(-52, -530, 44, 34, "none", 'rx="8" stroke="#111" stroke-width="5"') + R(8, -530, 44, 34, "none", 'rx="8" stroke="#111" stroke-width="5"') + L("M-8 -516 h16", "#111", 5) + R(-48, -526, 14, 8, "#9fd0ff", 'opacity="0.5" rx="3"'),
    propR: G("rotate(0)", R(-26, -70, 52, 62, "#f4f4f4", 'rx="8"') + L("M26 -56 q24 4 20 26 q-4 16 -20 12", "#f4f4f4", 8) + T(0, -30, "sudo", 15, "#222", 'text-anchor="middle" font-weight="900"') + `<path class="steam" data-i="5" d="M-6 -84 q-10 -18 0 -36 q10 -18 0 -36" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/>`),
  }),
  P: () => person("P", {
    skin: "#f6d3bd", sh: 66, hip: 62, top: "#3b6bd6", bottom: "#3b6bd6", eye: "#5a8a4a", eyeR: 15, head: 1.16, browC: "#7a4a2a", browW: 5, blush: 0.7,
    shoes: R(-58, -30, 46, 26, "#ffd84a", 'rx="12"') + R(12, -30, 46, 26, "#ffd84a", 'rx="12"') + L("M-58 -22 h46 M12 -22 h46", "#e3262f", 5),
    torso: P("M-66 -392 Q0 -412 66 -392 L62 -168 Q0 -150 -62 -168 Z", "#3b6bd6") + P("M-66 -392 Q0 -412 66 -392 L62 -168 Q0 -150 -62 -168 Z", "url(#h-stars)"),
    body: P("M-30 -400 Q0 -376 30 -400 L24 -384 Q0 -366 -24 -384 Z", "#fff") + R(-58, -180, 116, 14, "#2a52b0", 'rx="6"'),
    hairBack: P("M-90 -500 Q-100 -616 0 -618 Q100 -616 90 -500 Q84 -540 0 -560 Q-84 -540 -90 -500 Z", "#8a5a34"),
    face: times(6, (i) => C((i < 3 ? -58 : 34) + (i % 3) * 12, -486 + (i % 2) * 8, 2.5, "#c98a6a")),
    hairFront: P("M-84 -528 Q-84 -606 0 -608 Q84 -606 84 -528 Q60 -566 20 -560 Q-10 -530 -84 -528 Z", "#8a5a34") + P("M-10 -606 q6 -40 40 -34 q-26 6 -20 36 Z", "#8a5a34"),
    brows: "M-50 -546 Q-30 -556 -14 -548 M14 -548 Q30 -556 50 -546",
    propR: G("rotate(0)", P("M0 -120 q30 36 22 96 h-44 q-8 -60 22 -96 Z", "#f4f4f4") + C(0, -70, 10, "#4fa8ff") + P("M-22 -40 l-18 26 h18 Z M22 -40 l18 26 h-18 Z", "#e3262f") + P("M-10 -24 q10 34 20 0 Z", "#ffb03a")),
  }),
};

// Барсик: рыжий кот на крыше (тот самый, чья лежанка пустует на первом этаже)
const CAT = `<g id="res-B" class="res"><ellipse cx="0" cy="2" rx="110" ry="12" fill="#000" opacity="0.3"/>
  <path id="catTail" d="M70 -20 q90 -10 80 -110 q-6 -40 -34 -30" stroke="#e88a2e" stroke-width="30" fill="none" stroke-linecap="round"/>
  <g class="rBody"><path d="M-74 0 q-10 -150 30 -190 h50 q52 40 44 190 Z" fill="#e88a2e"/><path d="M-30 0 q-4 -90 14 -120 q22 30 18 120 Z" fill="#fff3e0"/>
  <path d="M-62 -90 q20 -8 30 0 M-58 -130 q18 -8 30 0 M40 -90 q-16 -8 -26 0 M38 -130 q-16 -8 -26 0" stroke="#c46a1a" stroke-width="7" fill="none" stroke-linecap="round"/>
  <ellipse cx="-34" cy="-6" rx="24" ry="12" fill="#fff3e0"/><ellipse cx="18" cy="-6" rx="24" ry="12" fill="#fff3e0"/>
  <g class="rHead"><path d="M-78 -252 l-6 -84 l58 44 Z M62 -252 l6 -84 l-58 44 Z" fill="#e88a2e"/><path d="M-66 -268 l-4 -44 l32 26 Z M50 -268 l4 -44 l-32 26 Z" fill="#f6a9c0"/>
    <ellipse cx="-8" cy="-232" rx="88" ry="74" fill="#e88a2e"/><path d="M-8 -306 v34 M-36 -302 l6 28 M20 -302 l-6 28" stroke="#c46a1a" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="-8" cy="-204" rx="46" ry="34" fill="#fff3e0"/>
    <g class="rEyes"><ellipse cx="-42" cy="-244" rx="17" ry="19" fill="#d8ff6a"/><ellipse cx="26" cy="-244" rx="17" ry="19" fill="#d8ff6a"/><g class="rIris"><ellipse cx="-42" cy="-244" rx="6" ry="16" fill="#111"/><ellipse cx="26" cy="-244" rx="6" ry="16" fill="#111"/></g></g>
    <path class="rBrows" d="M-60 -272 l34 8 M44 -272 l-34 8" stroke="#c46a1a" stroke-width="0" fill="none"/>
    <path d="M-16 -216 h16 l-8 10 Z" fill="#f08a9a"/><ellipse class="rMouth" cx="-8" cy="-192" rx="12" ry="2" fill="#7e222b"/><path d="M-8 -206 q-12 14 -24 4 M-8 -206 q12 14 24 4" stroke="#8a5a34" stroke-width="3" fill="none"/>
    <path d="M-50 -206 l-70 -12 M-50 -196 l-70 6 M34 -206 l70 -12 M34 -196 l70 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g></g></g>`;

const RES_X = { 1: 2290, 2: 2310, 3: 2330, 4: 2290, 5: 2360, roof: 2380 };
const RES_S = { Z: 0.95, T: 1.04, K: 1, G: 1.02, P: 0.72, B: 1 };

// ---------- the house itself ----------
function building() {
  let s = "";
  const GRAF = ["Здесь был Вася", "ЦОЙ ЖИВ", "Оля + Дима = ♡", "кв. 8, не сверли!", "Барсик, вернись"];
  // roof: slab, parapet, lift machine room, aerials, vent with smoke, pigeons
  s += R(BX - 30, ROOF - 60, BW + 60, 60, "url(#h-cut)") + R(BX - 30, ROOF - 76, BW + 60, 18, "#eef3fb") + R(BX - 30, ROOF - 150, 26, 90, "#6f6a62") + R(BX + BW + 4, ROOF - 150, 26, 90, "#6f6a62");
  s += G(`translate(${SH0 - 20} ${ROOF - 60})`, R(0, -330, 420, 330, "#7d776c") + R(-14, -352, 448, 26, "#5a554c") + R(-14, -366, 448, 16, "#eef3fb") + R(40, -280, 340, 250, "#22242e") + `<g id="mwheel" transform="translate(210 -160)">${C(0, 0, 84, "#3a3d46", 'stroke="#8d95a3" stroke-width="10"')}${L("M-84 0 H84 M0 -84 V84 M-60 -60 L60 60 M-60 60 L60 -60", "#8d95a3", 6)}${C(0, 0, 18, "#e3262f")}</g>` + R(60, -70, 110, 40, "#e8a02e") + T(115, -42, "380 В", 20, "#222", 'text-anchor="middle" font-weight="900"'));
  s += G(`translate(${BX + 720} ${ROOF - 60})`, R(-6, -420, 12, 420, "#3a3d46") + L("M-110 -400 H110 M-90 -360 H90 M-70 -320 H70 M-50 -280 H50", "#3a3d46", 8) + L("M-6 -200 L-80 0 M6 -200 L80 0", "#3a3d46", 4));
  s += G(`translate(${BX + 1010} ${ROOF - 60})`, R(-8, -150, 16, 150, "#3a3d46") + E(10, -170, 96, 70, "#d8dde6", 'transform="rotate(-24 10 -170)"') + E(18, -172, 70, 50, "#b8bfcc", 'transform="rotate(-24 18 -172)"') + L("M10 -170 L74 -226", "#3a3d46", 6) + C(76, -228, 10, "#e3262f"));
  s += G(`translate(${BX + 1290} ${ROOF - 60})`, R(-44, -200, 88, 200, "#8a4a3a") + R(-54, -220, 108, 26, "#6a3428") + R(-54, -232, 108, 14, "#eef3fb") + times(4, (i) => `<circle class="smoke" data-i="${i}" cx="0" cy="-250" r="34" fill="#cfd5e6" opacity="0.5"/>`));
  s += times(2, (i) => `<g class="pigeon" data-i="${i}" transform="translate(${BX + 470 + i * 96} ${ROOF - 76})">${E(0, -22, 34, 22, "#8d95a3")}${P("M20 -26 l40 10 l-36 12 Z", "#6f7786")}<g class="pHead">${C(-26, -48, 16, "#6f7786")}${P("M-40 -48 l-16 4 l16 4 Z", "#e8a02e")}${C(-30, -52, 3.5, "#ff8a2a")}</g>${L("M-8 0 v-6 M8 0 v-6", "#e8a02e", 4)}</g>`);
  // shell + floors
  s += R(BX, ROOF, BW, F1 - ROOF + 90, "url(#h-cut)");
  const flats = [flat1, flat2, flat3, flat4, flat5];
  for (let n = 1; n <= 5; n++) {
    const y = fy(n);
    s += R(SH0, y - 1200, 380, 1200, "url(#h-brick)") + R(SH0 + 30, y - 1200, 14, 1200, "#3d414f") + R(SH1 - 44, y - 1200, 14, 1200, "#3d414f");
    s += times(4, (i) => R(SH0 + 26, y - 1100 + i * 300, 22, 14, "#555a6b") + R(SH1 - 48, y - 1100 + i * 300, 22, 14, "#555a6b"));
    s += T(SH0 + 190, y - 520, n, 300, "#fff", 'text-anchor="middle" font-weight="900" opacity="0.07"') + T(SH0 + 190, y - 930, GRAF[n - 1], 24, "#8d95a3", `text-anchor="middle" opacity="0.55" transform="rotate(${n % 2 ? -6 : 5} ${SH0 + 190} ${y - 930})"`);
    s += R(SH0 + 170, y - 1090, 40, 16, "#3d414f") + C(SH0 + 190, y - 1066, 14, "#ffe9b0") + lampGlow(SH0 + 190, y - 1040, 240, "h-warm", 0.35);
    s += flats[n - 1](y);
    s += R(SH1, y - 1120, 30, 1120, "url(#h-cut)") + R(SH1 + 4, y - 836, 22, 836, "#1a1c26") + `<rect class="door" data-n="${n}" x="${SH1 + 5}" y="${y - 834}" width="20" height="834" fill="url(#h-steel)"/>` + R(SH1 - 4, y - 850, 38, 16, "#e8a02e");
    s += `<g class="call" data-n="${n}">${R(SH1 + 44, y - 520, 34, 60, "#d5dae3", 'rx="6"')}<circle class="callLed" cx="${SH1 + 61}" cy="${y - 490}" r="9" fill="#5a6072"/></g>` + T(SH1 + 61, y - 540, n, 30, "#3a3a44", 'text-anchor="middle" font-weight="900" opacity="0.7"');
    // slab under the room: concrete, pipes, lost things
    s += R(SH1, y, RX1 - SH1 + 40, 80, "url(#h-cut)") + R(SH1, y, RX1 - SH1, 6, "#000", 'opacity="0.25"') + L(`M${RX0 + 40} ${y + 30} H${RX1 - 40}`, "#b86a3a", 12) + L(`M${RX0 + 40} ${y + 54} H${RX1 - 40}`, "#5b8aa8", 9) + times(5, (i) => R(RX0 + 120 + i * 190, y + 20, 14, 44, "#6f6a62"));
  }
  s += `<g id="mouse" transform="translate(${RX0 + 520} ${fy(3) + 46})">${E(0, 0, 26, 15, "#8d95a3")}${C(-22, -8, 12, "#8d95a3")}${C(-28, -18, 8, "#f6a9c0")}${C(-18, -20, 8, "#f6a9c0")}${C(-27, -8, 2.5, "#111")}${L("M24 2 q26 6 34 -10", "#f6a9c0", 4)}</g>`;
  s += G(`translate(${RX0 + 760} ${fy(2) + 44})`, P("M0 0 h40 q14 0 14 14 v6 h-30 q-6 -12 -24 -12 Z", "#e3262f") + L("M4 3 h30", "#fff", 4)) + C(RX0 + 300, fy(4) + 44, 12, "#e2b25a") + T(RX0 + 300, fy(4) + 50, "5", 14, "#8a6a2a", 'text-anchor="middle" font-weight="900"');
  s += `<g id="spider" transform="translate(${SH0 + 80} ${fy(3) - 1120})"><path id="spThread" d="M0 0 V120" stroke="#cfd5e2" stroke-width="2"/><g id="spBody">${C(0, 0, 13, "#111")}${L("M-12 -4 l-16 -10 M-12 4 l-16 10 M12 -4 l16 -10 M12 4 l16 10 M-13 0 h-18 M13 0 h18", "#111", 3)}${C(-4, -2, 2.5, "#fff")}${C(4, -2, 2.5, "#fff")}</g></g>`;
  // entrance and foundation
  s += R(BX - 30, F1, BW + 60, 90, "#5a554c") + R(BX - 50, F1 - 6, BW + 100, 18, "#eef3fb");
  // outer walls (left with entrance canopy, right)
  s += R(BX, ROOF, 40, F1 - ROOF, "url(#h-cut)") + R(RX1, ROOF, 40, F1 - ROOF, "url(#h-cut)") + R(BX - 8, ROOF, 10, F1 - ROOF, "#6f6a62") + R(BX + BW - 2, ROOF, 10, F1 - ROOF, "#6f6a62");
  s += G(`translate(${BX - 8} ${F1})`, R(-150, -470, 150, 20, "#5a554c") + R(-150, -484, 150, 16, "#eef3fb") + R(-140, -450, 10, 450, "#3a3d46") + C(-70, -430, 14, "#ffe9b0") + lampGlow(-70, -410, 200, "h-warm", 0.6) + R(-110, -330, 90, 100, "#e9eef6") + T(-65, -296, "дом 1", 22, "#3a6fb8", 'text-anchor="middle" font-weight="900"') + T(-65, -262, "ул. Новостей", 13, "#3a6fb8", 'text-anchor="middle"'));
  // lift: cables, counterweight, cabin (the host is put inside by dom.html)
  s += `<path id="cables" d="" stroke="#8d95a3" stroke-width="5" fill="none"/><g id="cweight">${R(SH0 + 8, 0, 20, 240, "#555a6b")}${times(5, (i) => R(SH0 + 4, 14 + i * 44, 28, 30, "#3d414f"))}</g>`;
  s += `<g id="lift"><rect x="${SH0 + 48}" y="-858" width="284" height="20" fill="#3a3d46"/>${C(SH0 + 110, -850, 14, "#8d95a3")}${C(SH0 + 270, -850, 14, "#8d95a3")}
    <rect x="${SH0 + 46}" y="-838" width="288" height="844" rx="10" fill="#c9ced8"/><rect x="${SH0 + 56}" y="-828" width="268" height="820" fill="#e3e6ec"/>
    ${R(SH0 + 56, -828, 268, 820, "url(#h-side)")}${R(SH0 + 56, -300, 268, 292, "#a8763e")}${times(5, (i) => R(SH0 + 56 + i * 54, -300, 3, 292, "#8a5a2a"))}${R(SH0 + 56, -318, 268, 18, "#8d95a3")}
    ${R(SH0 + 70, -700, 96, 330, "#bcd4e6", 'rx="6" opacity="0.8"')}${L(`M${SH0 + 84} -680 l40 -10 M${SH0 + 84} -650 l66 -18`, "#fff", 6, 'opacity="0.7"')}
    ${R(SH0 + 264, -640, 46, 230, "#8d95a3", 'rx="6"')}${times(5, (i) => `<circle class="btn" data-n="${5 - i}" cx="${SH0 + 287}" cy="${-612 + i * 40}" r="13" fill="#3a3d46"/><text x="${SH0 + 287}" y="${-605 + i * 40}" font-size="17" font-weight="900" text-anchor="middle" fill="#fff" font-family="DejaVu Sans, Arial">${5 - i}</text>`)}
    ${R(SH0 + 150, -812, 80, 46, "#111", 'rx="6"')}<text id="liftDisp" x="${SH0 + 190}" y="-776" font-size="36" font-weight="900" text-anchor="middle" fill="#ff4f3a" font-family="DejaVu Sans Mono, monospace">1</text>
    ${R(SH0 + 80, -350, 150, 9, "#6f7786", 'rx="4"')}
    ${G(`translate(${SH0 + 96} -240) rotate(-8)`, T(0, 0, "♡ лифт", 22, "#6b4226", 'opacity="0.7" font-style="italic"'))}
    ${R(SH0 + 180, -520, 70, 46, "#fff", 'transform="rotate(4)"')}${T(SH0 + 215, -500, "НЕ", 14, "#e3262f", 'text-anchor="middle" font-weight="900" transform="rotate(4)"')}${T(SH0 + 215, -484, "ПРЫГАТЬ", 12, "#e3262f", 'text-anchor="middle" font-weight="900" transform="rotate(4)"')}
    <rect id="liftLamp" x="${SH0 + 110}" y="-826" width="160" height="12" rx="6" fill="#fff8d8"/><ellipse id="liftGlow" cx="${SH0 + 190}" cy="-700" rx="200" ry="300" fill="url(#h-warm)" opacity="0.5"/>
    <svg id="tim" x="${SH0 + 10}" y="-772" width="360" height="794" viewBox="-40 -20 680 1500" overflow="visible"></svg>
    <rect x="${SH0 + 46}" y="-8" width="288" height="16" fill="#6f7786"/><rect x="${SH0 + 46}" y="-838" width="14" height="844" fill="#8d95a3"/><rect x="${SH0 + 320}" y="-838" width="14" height="120" fill="#8d95a3"/>
  </g>`;
  // the residents (in front of everything in their rooms) and the cat on the roof
  for (let n = 1; n <= 5; n++) {
    const who = "ZTKGP"[n - 1];
    s += G(`translate(${RES_X[n]} ${fy(n) - 22}) scale(${RES_S[who]})`, PEOPLE[who]());
  }
  s += G(`translate(${RES_X.roof} ${ROOF - 76})`, CAT);
  return s;
}

const houseSVG = () => `<svg id="worldsvg" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}">${DEFS}${exterior()}${building()}</svg>`;
