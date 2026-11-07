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

// Facades on a strict floor grid: plinth with shop front, cornices between floors, framed windows.
const SIGNS = ["КАФЕ", "КНИГИ", "ЦВЕТЫ", "АПТЕКА", "ПЕКАРНЯ", "ЧАЙ", "СУВЕНИРЫ", "ОПТИКА"];
const shade = (hex, k) => "#" + hex.slice(1).match(/../g).map((h) => Math.max(0, Math.min(255, Math.round(parseInt(h, 16) * k))).toString(16).padStart(2, "0")).join("");
const facade = (x, w, floors, col, base = 1250) => {
  const fh = 118, gh = 190, top = base - gh - floors * fh;
  const cols = Math.max(2, Math.round(w / 110)), cw = w / cols;
  let s = `<rect x="${x}" y="${top}" width="${w}" height="${base - top}" fill="${col}"/>`;
  s += `<rect x="${x}" y="${top}" width="10" height="${base - top}" fill="${shade(col, 0.8)}"/><rect x="${x + w - 10}" y="${top}" width="10" height="${base - top}" fill="${shade(col, 0.8)}"/>`;
  s += `<rect x="${x - 10}" y="${top - 26}" width="${w + 20}" height="26" fill="${shade(col, 0.72)}"/><rect x="${x - 4}" y="${top - 34}" width="${w + 8}" height="10" fill="${shade(col, 1.15)}"/>`;
  for (let f = 0; f < floors; f++) {
    const fy = top + f * fh;
    if (f) s += `<rect x="${x}" y="${fy - 4}" width="${w}" height="8" fill="${shade(col, 1.12)}"/>`;
    for (let c = 0; c < cols; c++) {
      const wx = x + c * cw + cw * 0.27, ww = cw * 0.46, wy = fy + 22, wh = fh * 0.62;
      const on = rnd() < 0.62;
      s += `<rect x="${wx - 5}" y="${wy - 5}" width="${ww + 10}" height="${wh + 10}" rx="3" fill="${shade(col, 1.25)}"/>`;
      s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="2" fill="${on ? (rnd() < 0.5 ? "#ffd27a" : "#ffe6a6") : "#1b2131"}"/>`;
      s += `<path d="M${wx + ww / 2} ${wy} V${wy + wh} M${wx} ${wy + wh * 0.38} H${wx + ww}" stroke="${shade(col, 1.25)}" stroke-width="3"/>`;
      s += `<rect x="${wx - 8}" y="${wy + wh + 4}" width="${ww + 16}" height="6" fill="${shade(col, 0.8)}"/>`;
    }
  }
  // ground floor: shop windows, door, awning, sign
  const gy = base - gh;
  s += `<rect x="${x}" y="${gy}" width="${w}" height="${gh}" fill="${shade(col, 0.78)}"/>`;
  const sign = SIGNS[Math.floor(rnd() * SIGNS.length)];
  s += `<rect x="${x + w / 2 - 90}" y="${gy + 8}" width="180" height="34" rx="4" fill="#1d1f27"/><text x="${x + w / 2}" y="${gy + 34}" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="22" font-weight="700" fill="#ffd27a" letter-spacing="2">${sign}</text>`;
  const sw = (w - 140) / 2;
  for (const sx of [x + 30, x + w - 30 - sw]) s += `<rect x="${sx}" y="${gy + 60}" width="${sw}" height="${gh - 70}" rx="3" fill="#ffd994" opacity="0.85"/><rect x="${sx}" y="${gy + 60}" width="${sw}" height="${gh - 70}" rx="3" fill="none" stroke="${shade(col, 0.55)}" stroke-width="6"/>`;
  s += `<rect x="${x + w / 2 - 30}" y="${gy + 70}" width="60" height="${gh - 70}" fill="#2a2116"/>`;
  const aw = rnd() < 0.5 ? "#7a1f24" : "#1f4a3a";
  s += `<path d="M${x + 22} ${gy + 52} H${x + w - 22} L${x + w - 38} ${gy + 82} H${x + 38} Z" fill="${aw}"/>`;
  return s;
};
// a row of buildings: widths and heights on the grid, no gaps
const row = (x0, x1, palette, minF = 3, maxF = 5, base = 1250) => {
  let s = "", x = x0;
  while (x < x1) {
    const w = 330 + Math.floor(rnd() * 3) * 60;
    s += facade(x, w, minF + Math.floor(rnd() * (maxF - minF + 1)), palette[Math.floor(rnd() * palette.length)], base);
    x += w;
  }
  return s;
};

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
    s += row(0, W, ["#8a6d5a", "#6f7d8c", "#9a7b6b", "#7d6a86", "#8c8070", "#a0806a"], 4, 6);
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
    const pal = ["#c9a27a", "#b9c2a3", "#d0b3a1", "#a7b6c9", "#c7a8b8"];
    s += row(-120, 1000, pal, 3, 4) + row(1420, W, pal, 3, 4);
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
  studio() {
    let s = `<defs><radialGradient id="sbg" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#26396a"/><stop offset="0.6" stop-color="#121a33"/><stop offset="1" stop-color="#080b16"/></radialGradient>
      <radialGradient id="glow"><stop offset="0" stop-color="#ffd98a" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>
      <rect width="${W}" height="1920" fill="url(#sbg)"/>`;
    for (let x = 0; x < W; x += 60) s += `<path d="M${x} 0 V1250" stroke="#fff" stroke-opacity="0.035" stroke-width="2"/>`;
    for (let y = 0; y < 1250; y += 60) s += `<path d="M0 ${y} H${W}" stroke="#fff" stroke-opacity="0.035" stroke-width="2"/>`;
    // video wall panels with a big question mark and red accents
    for (const [x, w] of [[300, 520], [1580, 520]]) s += `<rect x="${x}" y="300" width="${w}" height="700" rx="18" fill="#0d1428" stroke="#e3262f" stroke-width="6"/><text x="${x + w / 2}" y="800" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="460" font-weight="900" fill="#e3262f" opacity="0.85">?</text>`;
    s += `<rect x="900" y="260" width="600" height="780" rx="18" fill="#0d1428" stroke="#ffd36b" stroke-width="6"/>` +
      `<text x="1200" y="560" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="96" font-weight="900" fill="#ffd36b">ФАКТ</text>` +
      `<text x="1200" y="760" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="160" font-weight="900" fill="#fff">!</text>`;
    for (const x of [500, 1200, 1900]) s += `<path d="M${x - 40} 0 L${x - 260} 1250 L${x + 260} 1250 L${x + 40} 0 Z" fill="url(#beam)"/><circle cx="${x}" cy="40" r="60" fill="url(#glow)"/>`;
    s += `<rect y="1250" width="${W}" height="670" fill="#0c1020"/><path d="M0 1250 H${W}" stroke="#e3262f" stroke-width="8"/>`;
    // anchor desk in front: hides the legs so he sits at it
    const fg = `<path d="M60 1290 Q540 1250 1020 1290 L1000 1340 Q540 1300 80 1340 Z" fill="#3a4256"/>
      <path d="M80 1340 Q540 1300 1000 1340 L960 1920 L120 1920 Z" fill="#141a2a"/>
      <path d="M100 1660 Q540 1625 980 1660" stroke="#e3262f" stroke-width="10" fill="none"/>
      <text x="540" y="1760" text-anchor="middle" font-family="DejaVu Sans, Arial" font-size="58" font-weight="900" fill="#f4f4f4" letter-spacing="5">ИНТЕРЕСНЫЙ <tspan fill="#ffd36b">ФАКТ</tspan></text>
      <rect x="790" y="1222" width="52" height="60" rx="7" fill="#f4f4f4"/><rect x="790" y="1238" width="52" height="12" fill="#e3262f"/>
      <path d="M842 1232 Q866 1238 864 1252 Q862 1266 842 1266" stroke="#f4f4f4" stroke-width="7" fill="none"/>
      <path d="M200 1282 L330 1274 L340 1290 L208 1298 Z" fill="#f1f1f1"/>`;
    return { bg: s, fg };
  },
  car() {
    let s = sky("#081024", "#1e2442");
    s += row(0, W, ["#4a5468", "#55485e", "#3f5260", "#5a4c50"], 5, 7);
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

// passer-by for interviews: a young woman in a coat and red scarf (viewBox 0 0 300 900).
// Groups pBody / pHead / pArmR / pHair are animated by the page.
const PASSERBY = `<g class="pBody">
  <ellipse cx="150" cy="876" rx="110" ry="14" fill="#000" opacity="0.25"/>
  <g class="pLegs"><rect x="104" y="610" width="38" height="250" rx="16" fill="#2b2f3a"/><rect x="158" y="610" width="38" height="250" rx="16" fill="#2b2f3a"/>
  <path d="M96 856 Q120 846 146 856 L146 872 L92 872 Z" fill="#3b2418"/><path d="M154 856 Q180 846 204 856 L208 872 L154 872 Z" fill="#3b2418"/></g>
  <path d="M68 330 Q150 296 232 330 L250 650 Q150 668 50 650 Z" fill="#cba77c"/>
  <path d="M150 336 V650" stroke="#a88a60" stroke-width="3"/><circle cx="162" cy="420" r="5" fill="#8a6d48"/><circle cx="162" cy="490" r="5" fill="#8a6d48"/><circle cx="162" cy="560" r="5" fill="#8a6d48"/>
  <rect x="70" y="520" width="56" height="10" rx="4" fill="#a88a60"/><rect x="176" y="520" width="56" height="10" rx="4" fill="#a88a60"/>
  <g class="pArmL"><rect x="40" y="345" width="36" height="240" rx="18" fill="#cba77c"/><ellipse cx="58" cy="594" rx="17" ry="20" fill="#f0c9ad"/>
    <rect x="18" y="520" width="58" height="80" rx="10" fill="#6b2d3a"/><path d="M28 520 Q47 488 66 520" stroke="#6b2d3a" stroke-width="6" fill="none"/></g>
  <g class="pArmR"><rect x="224" y="345" width="36" height="240" rx="18" fill="#cba77c"/><ellipse cx="242" cy="594" rx="17" ry="20" fill="#f0c9ad"/></g>
  <g class="pHead">
    <path class="pHair" d="M48 130 Q44 40 150 38 Q256 40 252 130 L262 330 Q214 304 150 304 Q86 304 38 330 Z" fill="#5a3522"/>
    <rect x="130" y="250" width="40" height="60" fill="#e8bea0"/>
    <ellipse cx="150" cy="190" rx="76" ry="90" fill="#f2cdb2"/>
    <path d="M74 172 Q86 92 150 92 Q216 92 226 172 Q206 124 164 120 Q120 150 74 172 Z" fill="#5a3522"/>
    <g class="pEyes"><ellipse cx="122" cy="194" rx="11" ry="12" fill="#fff"/><ellipse cx="178" cy="194" rx="11" ry="12" fill="#fff"/>
      <g class="pIris"><circle cx="122" cy="195" r="7" fill="#4a3a2a"/><circle cx="178" cy="195" r="7" fill="#4a3a2a"/><circle cx="124" cy="192" r="2" fill="#fff"/><circle cx="180" cy="192" r="2" fill="#fff"/></g>
      <path d="M110 186 Q122 178 134 186 M166 186 Q178 178 190 186" stroke="#3a2418" stroke-width="3" fill="none"/></g>
    <path class="pBrows" d="M106 168 Q122 160 138 166 M162 166 Q178 160 194 168" stroke="#5a3522" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M150 200 Q144 222 152 226" stroke="#d9a58a" stroke-width="3" fill="none"/>
    <ellipse cx="102" cy="226" rx="13" ry="7" fill="#f2a0a0" opacity="0.6"/><ellipse cx="198" cy="226" rx="13" ry="7" fill="#f2a0a0" opacity="0.6"/>
    <ellipse class="pMouth" cx="150" cy="246" rx="16" ry="3" fill="#8e2a33"/><path d="M134 244 Q150 238 166 244" stroke="#c45a63" stroke-width="3" fill="none"/>
    <circle cx="76" cy="206" r="5" fill="#ffd27a"/><circle cx="224" cy="206" r="5" fill="#ffd27a"/>
  </g>
  <path d="M72 300 Q150 344 228 300 L236 352 Q150 386 64 352 Z" fill="#e3262f"/><rect x="176" y="334" width="34" height="120" rx="10" fill="#e3262f"/>
  <path d="M182 444 V462 M194 444 V462 M206 444 V462" stroke="#b81d25" stroke-width="3"/>
</g>`;

// background passers-by: coat, scarf, head with hair, swinging arms and legs (origin at the feet)
const walker = (coat, hair, scarf, bag) => `<g>
  <ellipse cx="0" cy="0" rx="60" ry="10" fill="#000" opacity="0.25"/>
  <g class="lg1"><rect x="-30" y="-150" width="26" height="150" rx="11" fill="#22252e"/><ellipse cx="-17" cy="-4" rx="20" ry="8" fill="#111"/></g>
  <g class="lg2"><rect x="4" y="-150" width="26" height="150" rx="11" fill="#22252e"/><ellipse cx="17" cy="-4" rx="20" ry="8" fill="#111"/></g>
  <g class="ar1"><rect x="-58" y="-330" width="22" height="150" rx="11" fill="${shade(coat, 0.85)}"/>${bag ? `<rect x="-70" y="-190" width="44" height="54" rx="8" fill="${bag}"/>` : ""}</g>
  <path d="M-44 -340 Q0 -356 44 -340 L54 -140 L-54 -140 Z" fill="${coat}"/>
  <path d="M0 -340 V-140" stroke="${shade(coat, 0.75)}" stroke-width="3"/>
  <g class="ar2"><rect x="36" y="-330" width="22" height="150" rx="11" fill="${shade(coat, 0.85)}"/></g>
  <path d="M-34 -346 Q0 -326 34 -346 L32 -326 Q0 -310 -32 -326 Z" fill="${scarf}"/>
  <rect x="-9" y="-366" width="18" height="22" fill="#e2b896"/>
  <ellipse cx="0" cy="-394" rx="30" ry="34" fill="#f0c9ad"/>
  <path d="M-32 -390 Q-34 -434 0 -434 Q28 -434 30 -404 Q10 -416 -4 -412 Q-14 -400 -32 -390 Z" fill="${hair}"/>
  <circle cx="4" cy="-392" r="3" fill="#2a2a33"/><circle cx="20" cy="-392" r="3" fill="#2a2a33"/>
  <path d="M28 -390 L36 -380 L27 -377" stroke="#d9a58a" stroke-width="3" fill="#f0c9ad"/>
</g>`;
