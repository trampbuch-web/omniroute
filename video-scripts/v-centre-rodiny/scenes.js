// Drawn evening Moscow locations for «В центре Родины». Each returns SVG markup for a
// 2400×1920 background strip (panned behind the host) and optional foreground markup.
// rnd() is seeded per episode so windows/lights differ between episodes.
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const W = 2400;

const sky = (a, b) =>
  `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="#ffd98a" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>
  <rect width="${W}" height="1920" fill="url(#sky)"/>` +
  Array.from({ length: 60 }, () => `<circle cx="${rnd() * W}" cy="${rnd() * 600}" r="${1 + rnd() * 2}" fill="#fff" opacity="${0.3 + rnd() * 0.6}"/>`).join("");

const windows = (x, y, w, h, cols, rows, lit = 0.6) => {
  let s = "";
  const cw = w / cols, rh = h / rows;
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) {
      const on = rnd() < lit;
      s += `<rect x="${x + c * cw + cw * 0.22}" y="${y + r * rh + rh * 0.18}" width="${cw * 0.56}" height="${rh * 0.62}" rx="4" fill="${on ? (rnd() < 0.5 ? "#ffd27a" : "#ffe9b0") : "#1d2333"}" opacity="${on ? 0.95 : 1}"/>`;
    }
  return s;
};

const facade = (x, w, top, col) =>
  `<rect x="${x}" y="${top}" width="${w}" height="${1250 - top}" fill="${col}"/>` +
  `<rect x="${x - 6}" y="${top - 18}" width="${w + 12}" height="22" fill="#00000033"/>` +
  windows(x + 10, top + 30, w - 20, 1250 - top - 200, Math.max(2, Math.round(w / 90)), Math.max(3, Math.round((1250 - top - 200) / 120)));

const paving = (y0, col) => {
  let s = `<rect y="${y0}" width="${W}" height="${1920 - y0}" fill="${col}"/>`;
  for (let i = 0; i < 14; i++) s += `<path d="M0 ${y0 + i * i * 4.2} H${W}" stroke="#ffffff" stroke-opacity="0.06" stroke-width="2"/>`;
  for (let x = -2400; x < 4800; x += 160) s += `<path d="M${W / 2 + (x - W / 2) * 0.25} ${y0} L${x} 1920" stroke="#ffffff" stroke-opacity="0.05" stroke-width="2"/>`;
  return s;
};

const lamp = (x, y0 = 1250, h = 520) =>
  `<g><rect x="${x - 6}" y="${y0 - h}" width="12" height="${h}" fill="#1a1d26"/><rect x="${x - 22}" y="${y0 - 14}" width="44" height="14" fill="#1a1d26"/>
   <circle cx="${x}" cy="${y0 - h}" r="70" fill="url(#glow)"/><rect x="${x - 18}" y="${y0 - h - 30}" width="36" height="40" rx="8" fill="#ffe7a8"/></g>`;

const onion = (cx, by, r, c1, c2) =>
  `<path d="M${cx - r} ${by} Q${cx - r * 1.25} ${by - r * 1.1} ${cx} ${by - r * 2.2} Q${cx + r * 1.25} ${by - r * 1.1} ${cx + r} ${by} Z" fill="${c1}"/>` +
  `<path d="M${cx - r * 0.45} ${by} Q${cx - r * 0.6} ${by - r} ${cx} ${by - r * 2.2} Q${cx + r * 0.6} ${by - r} ${cx + r * 0.45} ${by} Z" fill="${c2}" opacity="0.85"/>` +
  `<rect x="${cx - 3}" y="${by - r * 2.2 - 50}" width="6" height="52" fill="#d9b25a"/><path d="M${cx - 18} ${by - r * 2.2 - 34} H${cx + 18}" stroke="#d9b25a" stroke-width="5"/>`;

const SCENES = {
  redsquare() {
    let s = sky("#0a1030", "#2c2456");
    // Kremlin wall with swallowtail merlons
    s += `<rect x="0" y="900" width="1600" height="350" fill="#7d241e"/>`;
    for (let x = 0; x < 1600; x += 56) s += `<path d="M${x + 6} 900 V860 L${x + 20} 878 L${x + 34} 860 V900 Z" fill="#8f2b23"/>`;
    s += `<rect x="0" y="900" width="1600" height="350" fill="#000" opacity="0.15"/>`;
    // Spasskaya tower
    const tx = 620;
    s += `<rect x="${tx - 110}" y="640" width="220" height="610" fill="#9b2f26"/>` +
      `<rect x="${tx - 85}" y="470" width="170" height="180" fill="#a8352b"/>` +
      `<rect x="${tx - 62}" y="360" width="124" height="120" fill="#b33b2f"/>` +
      `<path d="M${tx - 62} 360 L${tx} 130 L${tx + 62} 360 Z" fill="#2e6b45"/>` +
      `<circle cx="${tx}" cy="560" r="62" fill="#f6f1df" stroke="#d9b25a" stroke-width="8"/>` +
      `<path d="M${tx} 560 L${tx} 515 M${tx} 560 L${tx + 34} 574" stroke="#222" stroke-width="7" stroke-linecap="round"/>` +
      `<circle cx="${tx}" cy="110" r="70" fill="#ff3b3b" opacity="0.25"/>` +
      `<path d="M${tx} 70 L${tx + 12} 100 L${tx + 44} 100 L${tx + 18} 118 L${tx + 28} 150 L${tx} 130 L${tx - 28} 150 L${tx - 18} 118 L${tx - 44} 100 L${tx - 12} 100 Z" fill="#ff2a2a"/>` +
      windows(tx - 90, 700, 180, 300, 2, 2, 0.9);
    // Saint Basil's
    const bx = 1950;
    s += `<rect x="${bx - 300}" y="880" width="600" height="370" fill="#b2492f"/>` + windows(bx - 280, 940, 560, 240, 7, 2, 0.8) +
      `<rect x="${bx - 70}" y="560" width="140" height="330" fill="#c8583a"/>` + `<path d="M${bx - 70} 560 L${bx} 300 L${bx + 70} 560 Z" fill="#2f7a52"/>` +
      onion(bx - 230, 880, 70, "#2f7aa8", "#f2d36b") + onion(bx + 230, 880, 70, "#3c9a5c", "#e8583a") +
      onion(bx - 120, 760, 62, "#e8b23a", "#3c9a5c") + onion(bx + 120, 760, 62, "#d9483a", "#f6f1df") +
      `<rect x="${bx - 150}" y="760" width="60" height="130" fill="#d26a42"/><rect x="${bx + 90}" y="760" width="60" height="130" fill="#d26a42"/>`;
    s += paving(1250, "#3a3a46") + lamp(1450) + lamp(250);
    return { bg: s };
  },
  street() {
    let s = sky("#0c1430", "#252848");
    const cols = ["#5b4a6b", "#6e5442", "#4b5a6e", "#7a5d4a", "#56606b", "#6b4a4a"];
    let x = 0;
    while (x < W) { const w = 280 + rnd() * 200; s += facade(x, w, 520 + rnd() * 260, cols[Math.floor(rnd() * cols.length)]); x += w; }
    // Nikolskaya-style garlands over the street
    for (let g = 0; g < 4; g++) {
      const y = 220 + g * 120;
      s += `<path d="M0 ${y} Q${W / 4} ${y + 90} ${W / 2} ${y} T${W} ${y}" stroke="#2a2f3d" stroke-width="3" fill="none"/>`;
      for (let i = 0; i < 40; i++) { const px = (i / 40) * W; const py = y + Math.sin((px / W) * Math.PI * 4) * 45 + 45; s += `<circle cx="${px}" cy="${py}" r="9" fill="${["#ffd27a", "#ff7a7a", "#9ad1ff"][i % 3]}"/><circle cx="${px}" cy="${py}" r="22" fill="#ffd27a" opacity="0.18"/>`; }
    }
    s += paving(1250, "#353844") + lamp(400) + lamp(1300) + lamp(2100);
    return { bg: s };
  },
  arbat() {
    let s = sky("#101a3c", "#3a2c4e");
    // Foreign Ministry skyscraper at the end of the street
    s += `<g fill="#1c2236"><rect x="1050" y="420" width="300" height="830"/><rect x="1120" y="250" width="160" height="180"/><rect x="1165" y="150" width="70" height="110"/><path d="M1180 150 L1200 30 L1220 150 Z"/></g>` + windows(1070, 460, 260, 700, 6, 9, 0.5);
    const cols = ["#c9a27a", "#b9c2a3", "#d0b3a1", "#a7b6c9", "#c7a8b8"];
    let x = 0;
    while (x < W) { const w = 300 + rnd() * 160; if (x + w < 1000 || x > 1400) s += facade(x, w, 640 + rnd() * 180, cols[Math.floor(rnd() * cols.length)]); x += w; }
    s += paving(1250, "#4a4250");
    for (let lx = 150; lx < W; lx += 520) s += lamp(lx, 1250, 460);
    return { bg: s };
  },
  cafe() {
    let s = `<defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a22"/><stop offset="1" stop-color="#5a3f2e"/></linearGradient>
      <radialGradient id="glow"><stop offset="0" stop-color="#ffd98a" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>
      <rect width="${W}" height="1920" fill="url(#wall)"/>`;
    // big window onto the night street
    s += `<rect x="1500" y="380" width="760" height="760" rx="10" fill="#0e1630" stroke="#2a1d16" stroke-width="24"/>` + windows(1530, 640, 700, 380, 6, 3, 0.55) + `<path d="M1880 380 V1140" stroke="#2a1d16" stroke-width="16"/>`;
    // chalk menu board
    s += `<rect x="260" y="360" width="620" height="460" rx="12" fill="#1f2a24" stroke="#7a5a3a" stroke-width="18"/>
      <g font-family="DejaVu Sans, Arial" fill="#f3efe2" font-weight="700">
      <text x="300" y="440" font-size="44">МЕНЮ</text>
      <text x="300" y="520" font-size="36">Капучино ........ 400 ₽</text>
      <text x="300" y="590" font-size="36">Латте .............. 420 ₽</text>
      <text x="300" y="660" font-size="36">Раф ................. 450 ₽</text>
      <text x="300" y="730" font-size="36">Сырники ........... 390 ₽</text></g>`;
    // shelves with cups
    for (let sy = 900; sy <= 1060; sy += 160) { s += `<rect x="980" y="${sy}" width="420" height="14" fill="#2a1d16"/>`; for (let cx = 1000; cx < 1380; cx += 70) s += `<rect x="${cx}" y="${sy - 50}" width="44" height="50" rx="6" fill="${rnd() < 0.5 ? "#f4f4f4" : "#e3262f"}"/>`; }
    for (let lx = 400; lx < W; lx += 600) s += `<path d="M${lx} 0 V180" stroke="#111" stroke-width="4"/><circle cx="${lx}" cy="200" r="90" fill="url(#glow)"/><path d="M${lx - 40} 200 Q${lx} 140 ${lx + 40} 200 Z" fill="#d9a441"/>`;
    s += `<rect y="1250" width="${W}" height="670" fill="#6b4a33"/>`;
    // counter in front hides the legs; coffee machine on it
    const fg = `<rect x="-20" y="1170" width="1120" height="780" fill="#3b2a20"/><rect x="-20" y="1150" width="1120" height="40" rx="8" fill="#8a6446"/>
      <path d="M-20 1300 H1100" stroke="#2a1d16" stroke-width="6"/>
      <g transform="translate(790 940)"><rect width="220" height="210" rx="16" fill="#9aa3b5"/><rect x="20" y="20" width="180" height="70" rx="8" fill="#2b3040"/><circle cx="60" cy="55" r="16" fill="#e3262f"/><circle cx="120" cy="55" r="16" fill="#3ccf6e"/><rect x="70" y="110" width="80" height="20" fill="#2b3040"/><rect x="95" y="130" width="30" height="40" fill="#2b3040"/></g>`;
    return { bg: s, fg };
  },
  restaurant() {
    let s = `<defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2a3a"/><stop offset="1" stop-color="#3a3a4a"/></linearGradient>
      <radialGradient id="glow"><stop offset="0" stop-color="#ffe2a0" stop-opacity="0.9"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient></defs>
      <rect width="${W}" height="1920" fill="url(#wall)"/>`;
    // GUM-style glass roof arches
    for (let ax = -200; ax < W; ax += 600) {
      s += `<path d="M${ax} 700 Q${ax + 300} 80 ${ax + 600} 700" stroke="#c9d3e0" stroke-width="10" fill="#22324a"/>`;
      for (let k = 1; k < 6; k++) s += `<path d="M${ax + k * 100} ${700 - Math.sin((k / 6) * Math.PI) * 560} V700" stroke="#c9d3e0" stroke-opacity="0.5" stroke-width="4"/>`;
    }
    s += `<rect y="700" width="${W}" height="550" fill="#d8c9a8"/>`;
    for (let ax = 0; ax < W; ax += 300) s += `<rect x="${ax + 40}" y="760" width="220" height="400" rx="110" fill="#8a6f4a" opacity="0.6"/>` + windows(ax + 70, 860, 160, 240, 2, 2, 0.8);
    for (let lx = 300; lx < W; lx += 700) s += `<circle cx="${lx}" cy="560" r="150" fill="url(#glow)"/><path d="M${lx - 70} 540 Q${lx} 470 ${lx + 70} 540 L${lx + 50} 600 L${lx - 50} 600 Z" fill="#f2d36b"/>`;
    s += `<rect y="1250" width="${W}" height="670" fill="#6e5a4a"/>`;
    // table with pelmeni and a glass of mors
    const fg = `<path d="M-20 1190 L1100 1190 L1100 1940 L-20 1940 Z" fill="#f4f1ea"/><path d="M-20 1190 H1100" stroke="#d8d2c4" stroke-width="10"/>
      <path d="M-20 1290 Q540 1330 1100 1290" stroke="#e4ddcf" stroke-width="6" fill="none"/>
      <ellipse cx="300" cy="1250" rx="200" ry="52" fill="#ffffff" stroke="#d8d2c4" stroke-width="6"/>
      ${Array.from({ length: 7 }, (_, i) => `<ellipse cx="${215 + (i % 4) * 52 + (i > 3 ? 26 : 0)}" cy="${1236 + (i > 3 ? 24 : 0)}" rx="28" ry="17" fill="#f3e3c3" stroke="#d9c49a" stroke-width="3"/>`).join("")}
      <rect x="800" y="1110" width="80" height="130" rx="10" fill="#c2273a" opacity="0.85"/><rect x="800" y="1110" width="80" height="20" fill="#fff" opacity="0.5"/>`;
    return { bg: s, fg };
  },
  car() {
    let s = sky("#081024", "#1e2442");
    const cols = ["#2b3247", "#33293f", "#26343f", "#3a3040"];
    let x = 0;
    while (x < W) { const w = 220 + rnd() * 240; s += facade(x, w, 420 + rnd() * 400, cols[Math.floor(rnd() * cols.length)]); x += w; }
    s += `<rect y="1250" width="${W}" height="670" fill="#22252e"/>`;
    for (let dx = 0; dx < W; dx += 240) s += `<rect x="${dx}" y="1560" width="130" height="16" fill="#e8e8e8" opacity="0.8"/>`;
    for (let lx = 100; lx < W; lx += 480) s += lamp(lx, 1250, 560);
    // the car is drawn over the host, who shows through the side window
    const fg = `<g id="car">
      <path d="M40 1330 Q60 1180 260 1150 L320 900 Q350 850 420 850 L770 850 Q840 850 880 910 L960 1150 Q1060 1170 1070 1330 L1070 1520 L40 1520 Z M340 1150 L395 915 Q410 885 440 885 L560 885 L560 1150 Z M590 885 L745 885 Q790 885 815 920 L905 1150 L590 1150 Z" fill="#c42a2f" fill-rule="evenodd"/>
      <path d="M340 1150 L395 915 Q410 885 440 885 L560 885 L560 1150 Z" fill="#9fc3e6" opacity="0.12"/>
      <path d="M590 885 L745 885 Q790 885 815 920 L905 1150 L590 1150 Z" fill="#9fc3e6" opacity="0.3"/>
      <rect x="40" y="1300" width="1030" height="30" fill="#a32025"/><rect x="980" y="1220" width="80" height="40" rx="10" fill="#ffe7a8"/>
      <circle cx="1060" cy="1240" r="90" fill="url(#glow)" opacity="0.6"/>
      <rect x="560" y="880" width="30" height="440" fill="#a32025"/><rect x="300" y="1240" width="70" height="14" rx="6" fill="#7a1518"/><rect x="640" y="1240" width="70" height="14" rx="6" fill="#7a1518"/>
      <g class="wheel" transform="translate(250 1520)"><circle r="110" fill="#141418"/><circle r="55" fill="#9aa3b5"/><path d="M-50 0 H50 M0 -50 V50" stroke="#555" stroke-width="10"/></g>
      <g class="wheel" transform="translate(860 1520)"><circle r="110" fill="#141418"/><circle r="55" fill="#9aa3b5"/><path d="M-50 0 H50 M0 -50 V50" stroke="#555" stroke-width="10"/></g>
      <circle cx="385" cy="1140" r="46" fill="none" stroke="#111" stroke-width="13"/></g>`;
    return { bg: s, fg };
  },
};

// passer-by for interviews: a young woman in a coat and red scarf (viewBox 0 0 300 900)
const PASSERBY = `<g>
  <rect x="95" y="610" width="44" height="250" rx="18" fill="#2b2f3a"/><rect x="160" y="610" width="44" height="250" rx="18" fill="#2b2f3a"/>
  <ellipse cx="112" cy="868" rx="34" ry="14" fill="#111"/><ellipse cx="186" cy="868" rx="34" ry="14" fill="#111"/>
  <path d="M60 330 Q150 290 240 330 L262 640 L38 640 Z" fill="#c9a77a"/>
  <path d="M150 340 V640" stroke="#a88a60" stroke-width="3"/>
  <rect x="30" y="345" width="40" height="230" rx="20" fill="#c9a77a"/><rect x="230" y="345" width="40" height="230" rx="20" fill="#c9a77a"/>
  <path d="M40 120 Q40 40 150 40 Q260 40 260 120 L268 330 Q220 300 150 300 Q80 300 32 330 Z" fill="#5a3522"/>
  <rect x="128" y="250" width="44" height="60" fill="#efc7aa"/>
  <ellipse cx="150" cy="190" rx="78" ry="92" fill="#f2cdb2"/>
  <path d="M72 170 Q90 90 150 92 Q215 92 228 170 Q200 120 150 118 Q100 120 72 170 Z" fill="#5a3522"/>
  <g class="pEyes"><ellipse cx="122" cy="190" rx="9" ry="11" fill="#2a2a33"/><ellipse cx="178" cy="190" rx="9" ry="11" fill="#2a2a33"/></g>
  <path d="M108 168 Q122 160 136 168 M164 168 Q178 160 192 168" stroke="#5a3522" stroke-width="4" fill="none"/>
  <ellipse cx="102" cy="222" rx="13" ry="7" fill="#f2a0a0" opacity="0.6"/><ellipse cx="198" cy="222" rx="13" ry="7" fill="#f2a0a0" opacity="0.6"/>
  <ellipse class="pMouth" cx="150" cy="242" rx="16" ry="3" fill="#a3343c"/>
  <path d="M70 300 Q150 340 230 300 L236 350 Q150 380 64 350 Z" fill="#e3262f"/><rect x="180" y="330" width="34" height="110" rx="10" fill="#e3262f"/>
</g>`;

// background walkers for street scenes
const walker = (col) => `<g><ellipse cx="0" cy="-330" rx="34" ry="40" fill="${col}"/><path d="M-50 -290 Q0 -305 50 -290 L60 -110 L-60 -110 Z" fill="${col}"/>
  <rect class="lg1" x="-38" y="-115" width="30" height="115" rx="12" fill="${col}"/><rect class="lg2" x="8" y="-115" width="30" height="115" rx="12" fill="${col}"/></g>`;
