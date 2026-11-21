// «Тень власти»: cinematic 2D scenes drawn in code, 1080×1920. Each scene type returns
// { svg, update(root, p, lt, seg) } where p = 0..1 progress through the scene and lt = seconds into it.
// Layers marked class="ly" data-d="k" get parallax from the scene camera (dom in shadow.html).
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const R = (x, y, w, h, f, e = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${e}/>`;
const C = (x, y, r, f, e = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${e}/>`;
const E = (x, y, rx, ry, f, e = "") => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${e}/>`;
const P = (d, f, e = "") => `<path d="${d}" fill="${f}" ${e}/>`;
const L = (d, s, w, e = "") => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" ${e}/>`;
const T = (x, y, s, size, f, e = "") => `<text x="${x}" y="${y}" font-size="${size}" fill="${f}" font-family="DejaVu Sans, Arial" ${e}>${s}</text>`;
const G = (tr, s, e = "") => `<g transform="${tr}" ${e}>${s}</g>`;
const LY = (d, s, e = "") => `<g class="ly" data-d="${d}" ${e}>${s}</g>`;
const times = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const io = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, p) => a + (b - a) * p;
// scene texts follow the episode language (EP is defined by the page before scenes are built)
const shade = (hex, k) => "#" + hex.slice(1).match(/../g).map((h) => Math.max(0, Math.min(255, Math.round(parseInt(h, 16) * k))).toString(16).padStart(2, "0")).join("");
const tr = (ru, en) => (typeof EP !== "undefined" && EP.lang === "en" ? en : ru);
const GOLD = "#e2b25a", RED = "#e3262f", INK = "#05070d";

const DEFS = `<defs>
  <linearGradient id="t-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a0" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0.02"/></linearGradient>
  <linearGradient id="t-coneb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc4ff" stop-opacity="0.55"/><stop offset="1" stop-color="#9fc4ff" stop-opacity="0.02"/></linearGradient>
  <radialGradient id="t-pool"><stop offset="0" stop-color="#ffd98a" stop-opacity="0.5"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
  <radialGradient id="t-poolb"><stop offset="0" stop-color="#8fb6ff" stop-opacity="0.5"/><stop offset="1" stop-color="#8fb6ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="t-red"><stop offset="0" stop-color="#ff3b45" stop-opacity="0.7"/><stop offset="1" stop-color="#ff3b45" stop-opacity="0"/></radialGradient>
  <radialGradient id="t-gold"><stop offset="0" stop-color="#ffd98a" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
  <linearGradient id="t-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141927"/><stop offset="1" stop-color="#05070d"/></linearGradient>
  <linearGradient id="t-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070d"/><stop offset="1" stop-color="#101522"/></linearGradient>
  <linearGradient id="t-sepia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdb893"/><stop offset="1" stop-color="#8a744f"/></linearGradient>
  <linearGradient id="t-ray" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="t-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1c14"/><stop offset="1" stop-color="#120c09"/></linearGradient>
  <filter id="t-blur"><feGaussianBlur stdDeviation="14"/></filter><filter id="t-blur2"><feGaussianBlur stdDeviation="5"/></filter>
</defs>`;

// a high-backed chair, rim-lit on the side facing the light
const chair = (x, y, k, rim, side = 1) => G(`translate(${x} ${y}) scale(${k})`,
  P("M-92 -520 Q0 -560 92 -520 L84 -130 H-84 Z", "#0d1220") + R(-104, -140, 208, 46, "#0d111b", 'rx="12"') + R(-96, -96, 22, 100, "#080a10") + R(74, -96, 22, 100, "#080a10") +
  L(side > 0 ? "M-92 -520 Q0 -560 92 -520" : "M92 -520 Q0 -560 -92 -520", rim, 5, 'opacity="0.75"') + L(`M${side * -92} -516 L${side * -84} -134`, rim, 5, 'opacity="0.5"') + times(4, (i) => C(-48 + i * 32, -330, 5, rim, 'opacity="0.35"')));

// Timofey as a backlit silhouette: fringe, glasses' corners, long coat with the collar up
const timShape = "M0 -900 q-120 0 -128 110 q-6 60 14 104 q-30 6 -24 40 q6 26 30 26 q18 44 56 60 v36 l-70 30 q-90 30 -106 130 l-44 420 q-8 90 22 150 l70 -6 v-170 l26 180 h308 l26 -180 v170 l70 6 q30 -60 22 -150 l-44 -420 q-16 -100 -106 -130 l-70 -30 v-36 q38 -16 56 -60 q24 0 30 -26 q6 -34 -24 -40 q20 -44 14 -104 q-8 -110 -128 -110 Z";
const timSil = (x, y, k, rim) => G(`translate(${x} ${y}) scale(${k})`, P(timShape, "none", `stroke="${rim}" stroke-width="16" filter="url(#t-blur2)" opacity="0.9"`) + P(timShape, "#030408") + L("M-120 -800 q60 -90 124 -96", rim, 7, 'opacity="0.8"') + P("M-70 -470 l70 60 l70 -60 l-26 -30 l-44 40 l-44 -40 Z", "#0b0e15"));

const dust = (n, x0, x1, y0, y1, col) => times(n, () => `<circle class="dust" r="${1.5 + rnd() * 3}" fill="${col}" data-x="${x0 + rnd() * (x1 - x0)}" data-y="${y0 + rnd() * (y1 - y0)}" data-p="${rnd() * 6.3}" data-v="${8 + rnd() * 22}"/>`);
const moveDust = (root, lt) => root.querySelectorAll(".dust").forEach((e) => {
  const d = e.dataset;
  e.setAttribute("cx", +d.x + Math.sin(lt * 0.5 + +d.p) * 26);
  e.setAttribute("cy", +d.y - ((lt * +d.v + +d.p * 40) % 240));
  e.setAttribute("opacity", 0.25 + 0.45 * Math.abs(Math.sin(lt * 0.9 + +d.p)));
});
const hall = (wall = "url(#t-wall)") => R(0, 0, 1080, 1920, INK) + LY(0.2, R(-100, 0, 1280, 1400, wall) + times(8, (i) => R(-60 + i * 170, 0, 4, 1400, "#000", 'opacity="0.5"')) + R(-100, 1180, 1280, 14, "#1b2233")) + LY(0.5, R(-100, 1390, 1280, 600, "url(#t-floor)"));

const BODY = `M0 -880 q-62 0 -66 70 q-2 44 14 72 q8 30 30 42 v30 l-58 22 q-70 26 -84 110 l-26 330 q-4 60 16 110 l44 -4 v-140 l16 150 l-10 560 h110 l14 -420 l14 420 h110 l-10 -560 l16 -150 v140 l44 4 q20 -50 16 -110 l-26 -330 q-14 -84 -84 -110 l-58 -22 v-30 q22 -12 30 -42 q16 -28 14 -72 q-4 -70 -66 -70 Z`;
// a generic suited figure, backlit
const suit = (x, y, k, tint, tie = "#3a1418") => G(`translate(${x} ${y}) scale(${k})`, P(BODY, "none", `stroke="${tint}" stroke-width="14" filter="url(#t-blur2)" opacity="0.85"`) + P(BODY, "#04050a") + P("M-10 -640 h20 l8 150 l-18 26 l-18 -26 Z", tie) + P("M-34 -664 L0 -620 L34 -664 L20 -690 L0 -660 L-20 -690 Z", "#cfd5e2", 'opacity="0.55"'));

const SCENES = {
  // three empty chairs in a shaft of light; the host's shadow falls across the floor
  chairs: () => ({
    svg: hall() + LY(0.45, chair(540, 1300, 0.82, GOLD)) + LY(0.6, P("M470 -40 H610 L980 1560 H100 Z", "url(#t-cone)", 'style="mix-blend-mode:screen"') + E(540, 1500, 520, 120, "url(#t-pool)")) +
      LY(0.7, E(540, 1392, 330, 66, "#161b28", `stroke="${GOLD}" stroke-opacity="0.45" stroke-width="3"`) + E(540, 1384, 300, 54, "#1d2434") + E(470, 1372, 120, 16, "#fff", 'opacity="0.07"') + R(520, 1440, 40, 150, "#0a0d15") + E(540, 1594, 130, 22, "#0a0d15")) +
      LY(0.85, chair(236, 1610, 1.06, GOLD, 1) + chair(844, 1610, 1.06, GOLD, -1)) + LY(0.6, dust(46, 250, 830, 300, 1500, "#ffe2a0")) +
      LY(1.1, `<g id="c-shadow" opacity="0">${G("translate(900 1960) skewX(-38) scale(1.5 0.9)", P(timShape, "#000", 'opacity="0.82" filter="url(#t-blur2)"'))}</g>`),
    update(root, p, lt) {
      moveDust(root, lt);
      const s = ease((p - 0.5) / 0.4);
      const g = root.querySelector("#c-shadow");
      g.setAttribute("opacity", s);
      g.setAttribute("transform", `translate(${(1 - s) * 420} ${(1 - s) * 160})`);
    },
  }),

  // the fourth chair: empty, in cold light, under a ring of stars
  empty: () => ({
    svg: hall() + LY(0.25, times(12, (i) => `<path class="eu" transform="translate(${540 + Math.cos(i * 0.5236) * 250} ${640 + Math.sin(i * 0.5236) * 250})" d="M0 -22 l6 15 16 1 -12 11 4 16 -14 -9 -14 9 4 -16 -12 -11 16 -1z" fill="#ffd84a" opacity="0.5"/>`)) +
      LY(0.6, P("M480 -40 H600 L900 1640 H180 Z", "url(#t-coneb)", 'style="mix-blend-mode:screen"') + E(540, 1560, 440, 100, "url(#t-poolb)")) + LY(0.8, E(540, 1646, 250, 26, "#000", 'opacity="0.6"') + chair(540, 1640, 1.25, "#cfe0ff")) + LY(0.6, dust(34, 300, 780, 400, 1500, "#cfe0ff")),
    update(root, p, lt) {
      moveDust(root, lt);
      root.querySelectorAll(".eu").forEach((e, i) => e.setAttribute("opacity", 0.25 + 0.4 * Math.abs(Math.sin(lt * 1.2 + i * 0.5))));
    },
  }),

  // dotted world map; gold threads run from three capitals to Shenzhen and the camera follows them
  map: (seg) => {
    const W = 3600, H = 1450, px = (lon) => ((lon + 180) / 360) * W, py = (lat) => ((85 - lat) / 145) * H;
    const POLY = [
      [[-168, 66], [-140, 70], [-95, 72], [-80, 62], [-60, 50], [-66, 44], [-80, 25], [-97, 18], [-105, 22], [-118, 33], [-125, 48], [-150, 60]],
      [[-80, 10], [-60, 10], [-35, -6], [-40, -22], [-58, -38], [-70, -54], [-75, -20]],
      [[-10, 36], [-9, 44], [0, 50], [-5, 58], [8, 62], [20, 70], [30, 70], [40, 66], [40, 48], [28, 41], [22, 36], [10, 44], [3, 43]],
      [[-17, 15], [-10, 34], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [32, -28], [20, -35], [12, -18], [9, 4], [-8, 5]],
      [[40, 48], [40, 66], [60, 72], [100, 77], [140, 73], [170, 66], [160, 58], [140, 50], [130, 42], [122, 38], [121, 30], [110, 20], [105, 10], [100, 14], [92, 22], [80, 8], [72, 20], [60, 25], [50, 30], [36, 36], [28, 41]],
      [[114, -22], [130, -12], [145, -15], [153, -28], [140, -38], [116, -34]],
    ];
    const inside = (x, y, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    let dots = "";
    for (let lon = -170; lon < 175; lon += 2.3) for (let lat = -52; lat < 76; lat += 2.3) if (POLY.some((pl) => inside(lon, lat, pl))) dots += C(px(lon), py(lat), 5.2, "#2c3d63");
    const CITY = { w: [-77, 38.9, tr("ВАШИНГТОН", "WASHINGTON")], m: [37.6, 55.75, tr("МОСКВА", "MOSCOW")], b: [116.4, 39.9, tr("ПЕКИН", "BEIJING")], s: [114.06, 22.54, tr("ШЭНЬЧЖЭНЬ", "SHENZHEN")] };
    const S = [px(CITY.s[0]), py(CITY.s[1])];
    const arc = (k, lift) => { const a = [px(CITY[k][0]), py(CITY[k][1])]; return `<path class="arc" data-k="${k}" d="M${a[0]} ${a[1]} Q${(a[0] + S[0]) / 2} ${Math.min(a[1], S[1]) - lift} ${S[0]} ${S[1]}" fill="none" stroke="${GOLD}" stroke-width="7" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`; };
    const node = (k) => { const [lon, lat, name] = CITY[k], red = k === "s"; return `<g class="node" data-k="${k}" opacity="0">${C(px(lon), py(lat), 90, red ? "url(#t-red)" : "url(#t-gold)")}${C(px(lon), py(lat), red ? 17 : 13, red ? RED : GOLD)}${C(px(lon), py(lat), red ? 30 : 24, "none", `stroke="${red ? RED : GOLD}" stroke-width="3" class="ring"`)}${T(px(lon), py(lat) + (k === "b" ? -44 : 72), name, red ? 46 : 36, "#fff", 'text-anchor="middle" font-weight="900" letter-spacing="3"')}</g>`; };
    return {
      svg: R(0, 0, 1080, 1920, INK) + `<g id="m-world">${dots}${arc("w", 520)}${arc("m", 260)}${arc("b", 90)}${["w", "m", "b", "s"].map(node).join("")}</g>` +
        `<text id="m-big" x="540" y="640" font-size="200" font-weight="900" text-anchor="middle" fill="${GOLD}" font-family="DejaVu Sans, Arial" opacity="0">${seg.big || ""}</text>`,
      update(root, p, lt) {
        const fx = lerp(px(-77), S[0], io((p - 0.04) / 0.72)), fy = lerp(py(40), py(30), io(p)), z = lerp(1.0, 1.35, io((p - 0.6) / 0.4));
        root.querySelector("#m-world").setAttribute("transform", `translate(${540 - fx * z} ${1000 - fy * z}) scale(${z})`);
        const prog = { w: io((p - 0.04) / 0.72), m: io((p - 0.3) / 0.42), b: io((p - 0.6) / 0.2) };
        root.querySelectorAll(".arc").forEach((a) => a.setAttribute("stroke-dashoffset", 1 - prog[a.dataset.k]));
        const on = { w: clamp(p / 0.05 + 0.4), m: ease((p - 0.26) / 0.1), b: ease((p - 0.56) / 0.1), s: ease((p - 0.7) / 0.12) };
        root.querySelectorAll(".node").forEach((n) => { n.setAttribute("opacity", on[n.dataset.k]); n.querySelector(".ring").setAttribute("r", 24 + ((lt * 30) % 40)); n.querySelector(".ring").setAttribute("opacity", 1 - ((lt * 30) % 40) / 40); });
        const b = ease((p - 0.78) / 0.14);
        root.querySelector("#m-big").setAttribute("opacity", b);
        root.querySelector("#m-big").setAttribute("transform", `translate(540 640) scale(${1.5 - 0.5 * b}) translate(-540 -640)`);
      },
    };
  },

  // an archive photograph: three seated figures; a red line is drawn across it
  yalta: () => {
    const fig = (x, k, hat) => G(`translate(${x} 0) scale(${k})`, E(0, -250, 44, 52, "#3b2f20") + (hat ? P("M-52 -286 h104 l-10 -28 h-84 Z", "#2a2015") + R(-62, -290, 124, 10, "#2a2015") : "") + P("M-78 -196 Q0 -230 78 -196 L96 20 H-96 Z", "#33281b") + R(-104, 10, 208, 40, "#2a2015") + R(-90, 44, 30, 120, "#2a2015") + R(60, 44, 30, 120, "#2a2015"));
    const photo = R(-430, -340, 860, 700, "#efe6d2") + R(-400, -310, 800, 600, "url(#t-sepia)") + times(5, (i) => R(-380 + i * 190, -310, 34, 420, "#7a6644", 'opacity="0.6"')) +
      times(7, (i) => G(`translate(${-330 + i * 110} -60)`, E(0, -150, 26, 32, "#5b4a32") + P("M-40 -116 Q0 -134 40 -116 L46 60 H-46 Z", "#5b4a32"), 'opacity="0.7"')) +
      G("translate(0 110)", fig(-250, 1, false) + fig(0, 1.04, false) + fig(250, 1, true)) + R(-400, 250, 800, 40, "#6b5a3c") +
      times(6, (i) => `<path class="scr" d="M${-360 + i * 140} -310 v600" stroke="#fff" stroke-width="2" opacity="0.2"/>`) +
      T(0, 334, tr("ЯЛТА · ФЕВРАЛЬ 1945", "YALTA · FEBRUARY 1945"), 30, "#3b2f20", 'text-anchor="middle" font-weight="900" letter-spacing="4"') +
      `<path id="y-line" d="M-400 -250 L-120 -40 L60 60 L400 250" fill="none" stroke="${RED}" stroke-width="14" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`;
    return {
      svg: R(0, 0, 1080, 1920, INK) + LY(0.3, R(0, 0, 1080, 1920, "url(#t-wood)") + C(540, 820, 760, "url(#t-pool)", 'opacity="0.5"')) + LY(0.9, `<g id="y-photo">${photo}</g>`) + LY(0.5, dust(20, 100, 980, 300, 1400, "#ffe2a0")),
      update(root, p, lt) {
        moveDust(root, lt);
        root.querySelector("#y-photo").setAttribute("transform", `translate(540 ${880 + (1 - ease(p / 0.12)) * 500}) rotate(${-4 + p * 2}) scale(${1.08 + p * 0.1})`);
        root.querySelectorAll(".scr").forEach((e, i) => e.setAttribute("opacity", Math.sin(lt * 23 + i * 9) > 0.7 ? 0.3 : 0));
        root.querySelector("#y-line").setAttribute("stroke-dashoffset", 1 - io((p - 0.5) / 0.3));
      },
    };
  },

  // a leader as a backlit figure in their own hall (silhouette, never a likeness with invented words)
  leader: (seg) => {
    const V = {
      putin: { tint: "#9fc4ff", flag: ["#f4f4f4", "#2b4ac8", "#d52b1e"], body: 1, hair: "M-42 -826 q42 -30 84 0 q-10 -16 -42 -18 q-32 2 -42 18 Z" },
      trump: { tint: "#ffd98a", flag: null, body: 1.14, hair: "M-66 -806 q-6 -70 60 -76 q70 -4 76 50 q-30 -34 -76 -22 q-30 8 -60 48 Z" },
      xi: { tint: "#ff8a7a", flag: null, body: 1.12, hair: "M-58 -806 q4 -62 58 -64 q54 2 58 64 q-20 -34 -58 -34 q-38 0 -58 34 Z" },
    }[seg.who];
    const body = BODY;
    const fig = G(`translate(540 1560) scale(${V.body} 1)`, P(body, "none", `stroke="${V.tint}" stroke-width="14" filter="url(#t-blur2)" opacity="0.85"`) + P(body, "#04050a") + P(V.hair, seg.who === "trump" ? "#caa24a" : "#0a0c12", `stroke="${V.tint}" stroke-opacity="0.6" stroke-width="3"`) +
      (seg.who === "trump" ? P("M-12 -640 h24 l14 250 l-26 40 l-26 -40 Z", RED) : P("M-10 -640 h20 l8 150 l-18 26 l-18 -26 Z", "#3a1418")) + P("M-34 -664 L0 -620 L34 -664 L20 -690 L0 -660 L-20 -690 Z", "#cfd5e2", 'opacity="0.55"'));
    let bg = "";
    if (seg.who === "putin") {
      // exhibition hall: arched windows, the bronze group of three on a pedestal, schoolchildren looking on
      bg = LY(0.2, R(-100, 0, 1280, 1500, "#0a1020") + times(4, (i) => P(`M${-20 + i * 300} 1100 V520 q110 -150 220 0 V1100 Z`, "#16223f") + P(`M${10 + i * 300} 1100 V540 q80 -110 160 0 V1100 Z`, "#2b4a7a", 'opacity="0.55"') + R(86 + i * 300, 430, 8, 670, "#0a1020"))) +
        LY(0.4, times(3, (i) => P(`M${120 + i * 300} 440 l520 1100 h-260 Z`, "url(#t-ray)", 'opacity="0.35" style="mix-blend-mode:screen"'))) + LY(0.5, R(-100, 1440, 1280, 520, "url(#t-floor)")) +
        LY(0.55, G("translate(210 1470) scale(0.9)", R(-190, -150, 380, 150, "#1a1410") + R(-206, -168, 412, 24, "#2a2118") + times(3, (i) => G(`translate(${-116 + i * 116} -168)`, E(0, -196, 30, 36, "#6b5230") + P("M-50 -156 Q0 -176 50 -156 L58 0 H-58 Z", "#5b4526") + L("M-50 -156 Q0 -176 50 -156", "#c9a15a", 4, 'opacity="0.7"'))) + T(0, -70, tr("ЯЛТА · 1945", "YALTA · 1945"), 26, "#c9a15a", 'text-anchor="middle" font-weight="900" letter-spacing="3"'))) +
        LY(0.7, times(3, (i) => G(`translate(${800 + i * 86} ${1620 + (i % 2) * 20}) scale(0.5)`, P(body, "#060810", `stroke="#9fc4ff" stroke-opacity="0.35" stroke-width="8"`) + R(-70, -560, 140, 150, "#0b1020", 'rx="26"'))));
    } else if (seg.who === "trump") {
      // oval room: three tall windows with drapes, two flags, the desk
      bg = LY(0.2, R(-100, 0, 1280, 1500, "#14100a") + times(3, (i) => R(170 + i * 270, 380, 200, 760, "#f3dca6", 'opacity="0.8"') + R(266 + i * 270, 380, 8, 760, "#14100a") + R(170 + i * 270, 620, 200, 8, "#14100a") + R(170 + i * 270, 860, 200, 8, "#14100a") + P(`M${150 + i * 270} 340 h90 q-20 400 -70 820 h-20 Z`, "#7a5a1e") + P(`M${390 + i * 270} 340 h-90 q20 400 70 820 h20 Z`, "#7a5a1e")) + R(100, 320, 880, 36, "#9a7428")) +
        LY(0.4, times(3, (i) => P(`M${170 + i * 270} 380 h200 l260 1240 h-620 Z`, "url(#t-ray)", 'opacity="0.3" style="mix-blend-mode:screen"'))) + LY(0.5, R(-100, 1440, 1280, 520, "url(#t-floor)") + E(540, 1640, 520, 110, "#3a2c12", 'opacity="0.6"')) +
        LY(0.6, G("translate(150 1500)", R(-6, -820, 12, 820, "#8a6a2a") + C(0, -830, 16, GOLD) + P("M6 -800 q110 30 90 330 q-50 60 -90 20 Z", "#7a1a20") + times(5, (i) => L(`M12 ${-770 + i * 62} q60 14 78 60`, "#f4f4f4", 9, 'opacity="0.75"')) + R(8, -800, 60, 120, "#1d2f6b")) +
          G("translate(930 1500)", R(-6, -820, 12, 820, "#8a6a2a") + C(0, -830, 16, GOLD) + P("M-6 -800 q-110 30 -90 330 q50 60 90 20 Z", "#1d2f6b") + C(-52, -640, 34, "none", `stroke="${GOLD}" stroke-width="5"`)));
    } else {
      // great hall: red columns, lanterns, a huge banner
      bg = LY(0.2, R(-100, 0, 1280, 1500, "#1a0708") + R(300, 260, 480, 900, "#b3141c") + times(5, (i) => `<path transform="translate(${540 + (i ? Math.cos(i * 1.57 + 0.4) * 120 : 0)} ${520 + (i ? Math.sin(i * 1.57 + 0.4) * 120 : 0)}) scale(${i ? 1 : 2.6})" d="M0 -26 l7 18 19 1 -15 13 5 19 -16 -11 -16 11 5 -19 -15 -13 19 -1z" fill="#ffd84a"/>`)) +
        LY(0.35, times(4, (i) => R([-20, 170, 820, 1010][i], 200, 90, 1300, "#8a1016") + R([-30, 160, 810, 1000][i], 1380, 110, 70, "#c9a15a") + R([-30, 160, 810, 1000][i], 190, 110, 40, "#c9a15a"))) +
        LY(0.45, times(4, (i) => G(`translate(${[110, 330, 750, 970][i]} ${300 + (i % 2) * 60})`, L("M0 -300 V0", "#3a0c0e", 4) + E(0, 50, 46, 60, "#e3262f") + E(0, 50, 46, 60, "url(#t-gold)", 'opacity="0.6"') + R(-22, -6, 44, 12, "#c9a15a") + R(-22, 100, 44, 12, "#c9a15a") + C(0, 50, 150, "url(#t-red)", 'opacity="0.5"')))) + LY(0.5, R(-100, 1440, 1280, 520, "url(#t-floor)") + R(380, 1440, 320, 520, "#7a1016", 'opacity="0.55"'));
    }
    return {
      svg: R(0, 0, 1080, 1920, INK) + bg + LY(0.85, E(540, 1568, 280, 30, "#000", 'opacity="0.6"') + `<g id="l-fig">${fig}</g>`) + LY(0.6, dust(26, 150, 930, 400, 1400, V.tint)),
      update(root, p, lt) {
        moveDust(root, lt);
        root.querySelector("#l-fig").setAttribute("transform", `translate(0 ${Math.sin(lt * 1.3) * 3}) rotate(${Math.sin(lt * 0.7) * 0.5} 540 1560)`);
      },
    };
  },

  // the red folder on the desk: stamps land on the facts; the host stands over it
  folder: (seg) => ({
    host: { x: 150, y: 150, w: 780 },
    svg: R(0, 0, 1080, 1920, INK) + LY(0.2, R(-100, 0, 1280, 1200, "url(#t-wall)") + times(6, (i) => R(40 + i * 180, 120, 120, 900, "#0c111c") + times(9, (k) => R(48 + i * 180, 140 + k * 98, 104, 70, ["#141b2b", "#1b2233", "#10151f"][(i + k) % 3]))) + C(540, 500, 700, "url(#t-pool)", 'opacity="0.35"')) +
      `<g class="hostslot"></g>` + LY(1, R(-100, 1080, 1280, 900, "url(#t-wood)") + R(-100, 1080, 1280, 10, "#4a3020") + C(540, 1330, 620, "url(#t-pool)", 'opacity="0.55"') +
        G("translate(540 1300) rotate(-3)", R(-390, -190, 780, 400, "#7a1016", 'rx="10"') + R(-372, -174, 744, 368, "#efe6d2") + times(2, (i) => R(-340, -128 + i * 170, 680, 130, "#fff", 'opacity="0.5"')) +
          seg.items.map(([st, txt], i) => T(-320, -22 + i * 170, txt, 31, "#1a1410", 'font-weight="700"') + `<g class="stamp" data-i="${i}" opacity="0">${R(-322, -116 + i * 170, 300, 46, "none", `rx="6" stroke="${i ? "#c8862e" : "#2e8a4a"}" stroke-width="5"`)}${T(-172, -82 + i * 170, st, 28, i ? "#c8862e" : "#2e8a4a", 'text-anchor="middle" font-weight="900" letter-spacing="2"')}</g>`).join("") +
          `<g id="f-cover">${R(-390, -190, 780, 400, "#b3141c", 'rx="10"')}${R(-390, -190, 780, 400, "url(#t-ray)", 'rx="10" opacity="0.25"')}${T(0, 0, tr("ТЕНЬ ВЛАСТИ", "SHADOW OF POWER"), 54, "#f0d9a0", 'text-anchor="middle" font-weight="900" letter-spacing="8"')}${T(0, 56, tr("ДОСЬЕ", "DOSSIER"), 26, "#f0d9a0", 'text-anchor="middle" letter-spacing="10" opacity="0.8"')}</g>`)),
    update(root, p) {
      const o = ease(p / 0.1);
      root.querySelector("#f-cover").setAttribute("transform", `translate(-390 0) scale(${1 - o} 1) translate(390 0)`);
      root.querySelectorAll(".stamp").forEach((s) => {
        const i = +s.dataset.i, k = ease((p - (i ? 0.52 : 0.12)) / 0.07);
        s.setAttribute("opacity", k);
        s.setAttribute("transform", `translate(-172 ${-93 + i * 170}) rotate(${-7 + i * 3}) scale(${2.6 - 1.6 * k}) translate(172 ${93 - i * 170})`);
      });
    },
  }),

  // the door closes on a seam of light; the host stands before it
  door: (seg) => ({
    svg: R(0, 0, 1080, 1920, INK) + LY(0.3, P("M0 0 L330 430 V1480 L0 1920 Z", "#0a0e18") + P("M1080 0 L750 430 V1480 L1080 1920 Z", "#0a0e18") + P("M330 430 H750 L1080 0 H0 Z", "#070a12") + times(4, (i) => L(`M${i * 82} ${i * 108} V${1920 - i * 110}`, "#141b2b", 4) + L(`M${1080 - i * 82} ${i * 108} V${1920 - i * 110}`, "#141b2b", 4))) +
      LY(0.5, P("M330 1480 H750 L1080 1920 H0 Z", "url(#t-floor)") + `<path id="d-fan" d="" fill="url(#t-cone)" style="mix-blend-mode:screen"/>`) +
      LY(0.45, R(318, 418, 444, 1074, "#1b2233") + `<rect id="d-light" x="340" y="440" width="400" height="1040" fill="#ffe9b8"/><circle id="d-glow" cx="540" cy="960" r="700" fill="url(#t-gold)" opacity="0.5"/>` +
        `<g id="d-l">${R(340, 440, 200, 1040, "#0d111b")}${R(360, 470, 160, 440, "none", 'stroke="#1b2233" stroke-width="6"')}${R(360, 960, 160, 480, "none", 'stroke="#1b2233" stroke-width="6"')}${C(516, 960, 12, GOLD)}</g><g id="d-r">${R(540, 440, 200, 1040, "#0d111b")}${R(560, 470, 160, 440, "none", 'stroke="#1b2233" stroke-width="6"')}${R(560, 960, 160, 480, "none", 'stroke="#1b2233" stroke-width="6"')}${C(564, 960, 12, GOLD)}</g>`) +
      `<text id="d-big" x="540" y="400" font-size="150" font-weight="900" text-anchor="middle" fill="${GOLD}" font-family="DejaVu Sans, Arial">${seg.big || ""}</text>` + LY(0.6, dust(24, 380, 700, 600, 1500, "#ffe2a0")) + LY(1.15, `<g id="d-tim">${timSil(540, 2140, 1.12, "#ffd98a")}</g>`),
    update(root, p, lt) {
      moveDust(root, lt);
      const gap = lerp(150, 0, io((p - 0.1) / 0.8));
      root.querySelector("#d-l").setAttribute("transform", `translate(${-gap} 0)`);
      root.querySelector("#d-r").setAttribute("transform", `translate(${gap} 0)`);
      root.querySelector("#d-fan").setAttribute("d", `M${540 - gap} 1480 H${540 + gap} L${540 + gap * 4 + 30} 1920 H${540 - gap * 4 - 30} Z`);
      root.querySelector("#d-glow").setAttribute("opacity", 0.12 + (gap / 150) * 0.45);
      root.querySelector("#d-big").setAttribute("opacity", 0.35 + 0.65 * ease(p / 0.2));
      root.querySelector("#d-tim").setAttribute("transform", `translate(0 ${Math.sin(lt * 1.1) * 3})`);
    },
  }),

  // press approach: a lectern with a bundle of microphones, flashes from the press pack in the foreground
  press: (seg) => {
    const C2 = { washington: ["#1a2442", "#ffd98a", "#2b4ac8"], moscow: ["#2a0e12", "#9fc4ff", "#8a1016"], kyiv: ["#0e2236", "#ffe27a", "#1f5fae"] }[seg.city || "washington"];
    const mics = times(7, (i) => { const a = -0.6 + i * 0.2; return L(`M540 1160 L${540 + Math.sin(a) * 120} ${1010 - Math.cos(a) * 30}`, "#1d1f27", 7) + E(540 + Math.sin(a) * 124, 1004 - Math.cos(a) * 30, 18, 24, ["#e3262f", "#1d1f27", "#2b4ac8", "#e2b25a", "#1d1f27", "#f4f4f4", "#3a6fb8"][i]) + R(526 + Math.sin(a) * 124, 1024 - Math.cos(a) * 30, 28, 18, ["#e3262f", "#2b4ac8", "#1d1f27", "#f4f4f4", "#e3262f", "#1d1f27", "#e2b25a"][i], 'rx="3"'); });
    const pack = times(9, (i) => { const x = 40 + i * 125 + (i % 2) * 20, y = 1830 - (i % 3) * 40; return G(`translate(${x} ${y})`, E(0, -150, 70, 84, "#020306") + P("M-120 0 q0 -120 120 -120 q120 0 120 120 Z", "#020306") + (i % 3 !== 1 ? G(`translate(${(i % 2 ? 40 : -50)} -250)`, R(-46, -34, 92, 62, "#0b0d14", 'rx="8"') + C(0, -2, 22, "#1b2233") + `<circle class="flash" data-i="${i}" cx="${i % 2 ? 30 : -30}" cy="-30" r="22" fill="#fff" opacity="0"/>`) : "")); });
    return {
      svg: R(0, 0, 1080, 1920, INK) + LY(0.2, R(-100, 0, 1280, 1400, C2[0]) + times(5, (i) => times(8, (k) => C(-40 + i * 300 + (k % 2) * 150, 120 + k * 150, 46, "none", `stroke="${C2[1]}" stroke-opacity="0.08" stroke-width="4"`))) + C(540, 560, 230, "none", `stroke="${C2[1]}" stroke-opacity="0.35" stroke-width="10"`) + C(540, 560, 190, C2[2], 'opacity="0.35"') + T(540, 590, "★", 120, C2[1], 'text-anchor="middle" opacity="0.5"')) +
        LY(0.4, P("M540 0 L240 1500 H840 Z", "url(#t-cone)", 'opacity="0.55" style="mix-blend-mode:screen"')) + LY(0.55, R(-100, 1400, 1280, 520, "url(#t-floor)")) +
        LY(0.7, suit(540, 1500, 0.95, C2[1]) + P("M380 1160 h320 l-30 340 h-260 Z", "#141927") + L("M380 1160 h320", C2[1], 4, 'opacity="0.7"') + C(540, 1300, 46, "none", `stroke="${C2[1]}" stroke-width="5" opacity="0.6"`) + mics) +
        LY(1.15, pack) + `<rect id="p-flash" width="1080" height="1920" fill="#fff" opacity="0"/>`,
      update(root, p, lt) {
        let f = 0;
        root.querySelectorAll(".flash").forEach((e) => {
          const i = +e.dataset.i, ph = (lt * (1.3 + (i % 4) * 0.37) + i * 0.71) % 1, on = ph < 0.06 ? 1 - ph / 0.06 : 0;
          e.setAttribute("opacity", on);
          e.setAttribute("r", 22 + on * 30);
          f = Math.max(f, on);
        });
        root.querySelector("#p-flash").setAttribute("opacity", f * 0.13);
      },
    };
  },

  // night tarmac: the envoys' jet taxis past runway lights and lifts off
  plane: (seg) => ({
    svg: R(0, 0, 1080, 1920, INK) + LY(0.1, R(-100, 0, 1280, 1300, "#060a18") + times(70, () => C(rnd() * 1280 - 100, rnd() * 900, 1 + rnd() * 2.5, "#fff", `opacity="${0.2 + rnd() * 0.6}"`)) + C(860, 260, 70, "#e8e2cf", 'opacity="0.85"') + C(860, 260, 260, "url(#t-pool)", 'opacity="0.4"')) +
      LY(0.25, times(26, (i) => R(-100 + i * 52, 1120 - (i * 37) % 140, 40, 200 + (i * 37) % 140, "#0b1022") + times(4, (k) => (((i + k) * 7) % 5 < 2 ? R(-92 + i * 52, 1140 - ((i * 37) % 140) + k * 40, 8, 10, "#ffd98a", 'opacity="0.7"') : "")))) +
      LY(0.5, P("M-100 1300 H1180 V1920 H-100 Z", "#0a0d16") + times(9, (i) => { const y = 1330 + i * i * 9, w = 6 + i * 3; return R(540 - w / 2, y, w, 4 + i * 2, "#e9e4c8", 'opacity="0.5"') + `<circle class="rwl" data-i="${i}" cx="${540 - 80 - i * i * 7}" cy="${y}" r="${3 + i}" fill="#4fa8ff"/><circle class="rwl" data-i="${i}" cx="${540 + 80 + i * i * 7}" cy="${y}" r="${3 + i}" fill="#4fa8ff"/>`; })) +
      `<g id="pl-jet">` + G("translate(0 0)", P("M-420 0 q20 -70 120 -76 h520 q120 6 190 50 l60 16 q-40 30 -120 34 h-650 q-100 -4 -120 -24 Z", "#d5dae3") + P("M-420 0 q20 -70 120 -76 h520 q120 6 190 50 l60 16 q-40 30 -120 34 h-650 q-100 -4 -120 -24 Z", "url(#t-ray)", 'opacity="0.4"') + P("M-360 -64 l-90 -150 h70 l130 150 Z", "#b0b8c6") + P("M-60 10 l-170 120 h80 l210 -120 Z", "#9aa3b5") + times(12, (i) => R(-240 + i * 46, -52, 22, 20, "#ffe9b8", 'rx="6"')) + P("M380 -50 q40 4 70 28 h-70 Z", "#1b2233") + R(-300, -14, 600, 8, "#2b4ac8", 'opacity="0.8"') + `<circle id="pl-beacon" cx="-400" cy="-120" r="10" fill="#e3262f"/>` + C(480, 10, 6, "#fff") + E(560, 20, 220, 30, "url(#t-gold)", 'opacity="0.35"')) + `</g>` +
      T(540, EP.land ? 760 : 640, seg.big || "", 64, GOLD, 'text-anchor="middle" font-weight="900" letter-spacing="6" id="pl-big"'),
    update(root, p, lt) {
      const x = lerp(-700, 1500, io(p)), lift = Math.max(0, p - 0.55) * 900, ang = -Math.min(12, Math.max(0, p - 0.55) * 40);
      root.querySelector("#pl-jet").setAttribute("transform", `translate(${x} ${1290 - lift}) rotate(${ang}) scale(0.9)`);
      root.querySelector("#pl-beacon").setAttribute("opacity", Math.sin(lt * 9) > 0.6 ? 1 : 0.1);
      root.querySelectorAll(".rwl").forEach((e) => e.setAttribute("opacity", 0.35 + 0.65 * (((lt * 3 - +e.dataset.i * 0.25) % 1 + 1) % 1 < 0.2 ? 1 : 0)));
      root.querySelector("#pl-big").setAttribute("opacity", ease(p / 0.2));
    },
  }),

  // the conference table: name plates of the European delegation light up one after another
  plates: (seg) => {
    const F = { de: ["#000", "#dd0000", "#ffce00"], fr: ["#0055a4", "#fff", "#ef4135"], it: ["#009246", "#fff", "#ce2b37"], pl: ["#fff", "#dc143c"], gb: ["#012169", "#fff", "#c8102e"], eu: ["#003399", "#ffcc00"] };
    const flag = (k) => { const c = F[k]; if (k === "eu") return R(-48, -32, 96, 64, c[0]) + times(12, (i) => C(Math.cos(i * 0.5236) * 20, Math.sin(i * 0.5236) * 20, 3.5, c[1])); if (k === "pl") return R(-48, -32, 96, 32, c[0]) + R(-48, 0, 96, 32, c[1]); if (k === "gb") return R(-48, -32, 96, 64, c[0]) + L("M-48 -32 L48 32 M48 -32 L-48 32", c[1], 12) + L("M-48 -32 L48 32 M48 -32 L-48 32", c[2], 4) + L("M0 -32 V32 M-48 0 H48", c[1], 18) + L("M0 -32 V32 M-48 0 H48", c[2], 10); return k === "de" ? times(3, (i) => R(-48, -32 + i * 21.3, 96, 21.4, c[i])) : times(3, (i) => R(-48 + i * 32, -32, 32, 64, c[i])); };
    const items = seg.items || [];
    const plates = items.map(([k, name], i) => { const row = i % 2, col = Math.floor(i / 2), x = 540 + (row ? 1 : -1) * (165 + col * 75), y = 1010 + col * 240, sc = 0.72 + col * 0.2; return `<g class="plate" data-i="${i}" transform="translate(${x} ${y}) scale(${sc})" opacity="0.15">${E(0, 60, 120, 18, "#000", 'opacity="0.5"')}${P("M-160 40 L-136 -40 H136 L160 40 Z", "#efe6d2")}${G("translate(-100 0) scale(0.5)", flag(k))}${T(28, 10, name, 25, "#1a1410", 'text-anchor="middle" font-weight="900"')}${C(0, -40, 120, "url(#t-pool)", 'class="pglow" opacity="0"')}</g>`; }).join("");
    return {
      svg: R(0, 0, 1080, 1920, INK) + LY(0.2, R(-100, 0, 1280, 1300, "url(#t-wall)") + times(5, (i) => R(40 + i * 220, 180, 120, 820, "#0d1322") + R(52 + i * 220, 200, 96, 780, "#132036", 'opacity="0.7"'))) +
        LY(0.45, P("M540 820 L-60 1920 H1140 Z", "#1a120c") + P("M540 820 L-60 1920 H1140 Z", "url(#t-ray)", 'opacity="0.12"') + L("M540 820 L-60 1920 M540 820 L1140 1920", GOLD, 4, 'opacity="0.45"')) +
        LY(0.6, plates) + LY(0.3, P("M540 0 L300 1100 H780 Z", "url(#t-cone)", 'opacity="0.4" style="mix-blend-mode:screen"')),
      update(root, p) {
        root.querySelectorAll(".plate").forEach((e) => {
          const k = ease((p - 0.15 - +e.dataset.i * 0.11) / 0.12);
          e.setAttribute("opacity", 0.15 + 0.85 * k);
          e.querySelector(".pglow").setAttribute("opacity", k * 0.6);
        });
      },
    };
  },

  // an unsigned document under a desk lamp; one line is circled in red
  papers: (seg) => ({
    svg: R(0, 0, 1080, 1920, INK) + LY(0.3, R(-100, 0, 1280, 1920, "url(#t-wood)") + C(560, 900, 760, "url(#t-pool)", 'opacity="0.55"')) +
      LY(0.8, G("translate(540 960) rotate(-4)", R(-330, -470, 660, 900, "#000", 'opacity="0.35" transform="translate(16 20)"') + R(-330, -470, 660, 900, "#f1ebdc") +
        T(-280, -390, seg.head || "", 30, "#1a1410", 'font-weight="900" letter-spacing="3"') + T(-280, -350, seg.sub || "", 22, "#5a5040", 'letter-spacing="2"') + L("M-280 -326 H280", "#1a1410", 3) +
        times(16, (i) => (i === 7 ? "" : R(-280, -290 + i * 42, 300 + ((i * 97) % 260), 16, i % 5 === 3 ? "#111" : "#8a8070", 'opacity="0.8"'))) +
        T(-280, -290 + 7 * 42 + 12, seg.mark || "", 30, "#1a1410", 'font-weight="900"') +
        `<ellipse id="pp-circle" cx="-60" cy="${-290 + 7 * 42 + 2}" rx="250" ry="44" fill="none" stroke="${RED}" stroke-width="8" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-3 -150 ${-290 + 7 * 42})"/>` +
        G("translate(170 360) rotate(-10)", R(-130, -36, 260, 72, "none", `rx="8" stroke="${RED}" stroke-width="6" opacity="0.8"`) + T(0, 14, seg.seal || tr("БЕЗ ПОДПИСИ", "UNSIGNED"), 34, RED, 'text-anchor="middle" font-weight="900" letter-spacing="4" opacity="0.8"')))) +
      LY(1.1, G("translate(860 260)", L("M0 0 L-120 -260 L-40 -420", "#1d1f27", 22) + P("M-90 -440 l140 -40 l40 120 Z", "#1d1f27") + E(-10, -390, 40, 18, "#fff3c4") + C(-10, -380, 300, "url(#t-pool)", 'opacity="0.6"'))) + LY(0.6, dust(22, 200, 900, 400, 1500, "#ffe2a0")),
    update(root, p, lt) {
      moveDust(root, lt);
      root.querySelector("#pp-circle").setAttribute("stroke-dashoffset", 1 - io((p - 0.35) / 0.3));
    },
  }),

  // a huge clock face counting down an hour; the minute hand sweeps, a red sector fills
  clock: (seg) => ({
    svg: R(0, 0, 1080, 1920, INK) + LY(0.2, R(-100, 0, 1280, 1920, "url(#t-wall)") + C(540, 900, 720, "url(#t-pool)", 'opacity="0.35"')) +
      LY(0.7, G("translate(540 900)", C(0, 0, 420, "#0d111b", `stroke="${GOLD}" stroke-width="10"`) + C(0, 0, 392, "none", 'stroke="#1b2233" stroke-width="4"') +
        times(60, (i) => `<rect x="-3" y="-388" width="6" height="${i % 5 ? 18 : 44}" fill="${i % 5 ? "#3a4160" : GOLD}" transform="rotate(${i * 6})"/>`) +
        `<path id="ck-sector" d="" fill="${RED}" opacity="0.35"/>` +
        `<g id="ck-min">${P("M-8 30 L-4 -360 L4 -360 L8 30 Z", "#e8e2cf")}</g><g id="ck-hour">${P("M-12 26 L-7 -230 L7 -230 L12 26 Z", GOLD)}</g>` + C(0, 0, 22, GOLD) + C(0, 0, 8, INK))) +
      `<text id="ck-big" x="540" y="1520" font-size="150" font-weight="900" text-anchor="middle" fill="${GOLD}" font-family="DejaVu Sans Mono, monospace">${seg.big || ""}</text>` + LY(0.6, dust(24, 150, 930, 400, 1500, "#ffe2a0")),
    update(root, p, lt, seg) {
      moveDust(root, lt);
      const m = io(p) * 0.35; // the hand sweeps a third of the hour during the scene
      root.querySelector("#ck-min").setAttribute("transform", `rotate(${m * 360})`);
      root.querySelector("#ck-hour").setAttribute("transform", `rotate(${300 + m * 30})`);
      const a = m * Math.PI * 2;
      root.querySelector("#ck-sector").setAttribute("d", m > 0.001 ? `M0 0 L0 -380 A380 380 0 ${m > 0.5 ? 1 : 0} 1 ${Math.sin(a) * 380} ${-Math.cos(a) * 380} Z` : "");
      // "MM:00" counts down from MM; any other label (e.g. a treaty name) stays as written
      const mm = /^(\d+):00$/.exec(seg.big || "");
      root.querySelector("#ck-big").textContent = mm ? `${String(Math.max(0, Math.round(+mm[1] - m * 60))).padStart(2, "0")}:00` : seg.big || "";
    },
  }),

  // airport apron: a red carpet runs to the jet's stairs, an honour guard lines it, flags ripple
  airport: (seg) => {
    const guard = (x, y, k) => G(`translate(${x} ${y}) scale(${k})`, E(0, 0, 40, 8, "#000", 'opacity="0.5"') + R(-22, -150, 18, 150, "#0b0d14") + R(4, -150, 18, 150, "#0b0d14") + P("M-32 -300 h64 l6 150 h-76 Z", "#1a2f5a") + L("M-32 -300 h64", GOLD, 4) + E(0, -326, 22, 26, "#e0b896") + R(-26, -366, 52, 26, "#1a2f5a", 'rx="6"') + R(-30, -348, 60, 8, "#0b0d14") + L("M30 -290 L44 -420", "#c9ced8", 4) + C(44, -426, 6, GOLD));
    // the guest's flag (USA: stripes with a blue canton) and the host's (China)
    const flag = (x, cols, i) => G(`translate(${x} 1060)`, R(-4, 0, 8, 420, "#8d95a3") + `<g class="fl" data-i="${i}">${cols.map((c, k) => R(4, k * (120 / cols.length), 190, 120 / cols.length, c)).join("")}${i ? T(40, 44, "★", 40, "#ffde00") : R(4, 0, 80, 64, "#3c3b6e")}</g>`);
    return {
      svg: R(0, 0, 1080, 1920, INK) + LY(0.1, R(-100, 0, 1280, 1300, "#0a1022") + times(50, () => C(rnd() * 1280 - 100, rnd() * 800, 1 + rnd() * 2, "#fff", `opacity="${0.2 + rnd() * 0.5}"`)) + times(6, (i) => C(80 + i * 190, 1060, 160, "url(#t-pool)", 'opacity="0.35"')) + times(6, (i) => R(70 + i * 190, 640, 20, 420, "#141b2b") + E(80 + i * 190, 640, 60, 16, "#fff3c4"))) +
        LY(0.3, P("M640 1100 q140 -80 400 -84 h140 v200 h-560 Z", "#c9ced8") + P("M720 1060 h320", "none", 'stroke="#2b4ac8" stroke-width="12"') + times(6, (i) => R(780 + i * 52, 1050, 26, 22, "#ffe9b8", 'rx="6"')) + P("M700 1160 l-90 230 h40 l100 -230 Z", "#8d95a3") + times(8, (i) => R(616 + i * 11, 1380 - i * 28, 54, 6, "#5a6072"))) +
        LY(0.5, P("M-100 1300 H1180 V1920 H-100 Z", "#0d111b") + P("M600 1390 L860 1920 H320 Z", "#9a111a") + P("M600 1390 L860 1920 H320 Z", "url(#t-ray)", 'opacity="0.25"') + L("M600 1390 L320 1920 M600 1390 L860 1920", GOLD, 5, 'opacity="0.7"')) +
        LY(0.65, flag(120, ["#b22234", "#fff", "#b22234", "#fff", "#b22234", "#fff", "#b22234"], 0) + flag(960, ["#de2910", "#de2910", "#de2910"], 1) + times(4, (i) => guard(470 - i * 70, 1480 + i * 110, 0.8 + i * 0.25) + guard(760 + i * 70, 1480 + i * 110, 0.8 + i * 0.25))) +
        LY(1.1, `<rect id="ap-flash" width="1080" height="1920" fill="#fff" opacity="0"/>`),
      update(root, p, lt) {
        root.querySelectorAll(".fl").forEach((e, i) => e.setAttribute("transform", `skewY(${Math.sin(lt * 3 + i) * 5}) scale(${1 - 0.06 * Math.abs(Math.sin(lt * 2.4 + i))} 1)`));
        root.querySelector("#ap-flash").setAttribute("opacity", ((lt * 1.7) % 1 < 0.05 ? 0.12 : 0) + ((lt * 1.13 + 0.4) % 1 < 0.04 ? 0.08 : 0));
      },
    };
  },

  // the family photo: a long row of leaders on a stage; three in the centre light up
  photo: (seg) => {
    const n = 11, mid = 5;
    const row = times(n, (i) => { const x = 540 + (i - mid) * 150, c = Math.abs(i - mid) <= 1, k = c ? 0.62 : 0.5; return `<g class="ph" data-i="${i}" transform="translate(${x} ${c ? 1400 : 1380})">${suit(0, 0, k, c ? (i === mid ? "#ff8a7a" : i < mid ? "#9fc4ff" : "#ffd98a") : "#3a4160", i === mid + 1 ? RED : "#3a1418")}</g>`; });
    return {
      svg: R(0, 0, 1080, 1920, INK) + LY(0.15, R(-100, 0, 1280, 1500, "#0b1424") + times(9, (i) => R(-100 + i * 160, 160, 120, 1040, "#0f1c33")) + R(40, 380, 1000, 220, "#0f2a4a", 'rx="12"') + T(540, 470, "APEC · CHINA 2026", 64, "#9fc4ff", 'text-anchor="middle" font-weight="900" letter-spacing="8" opacity="0.55"') + T(540, 540, tr("ШЭНЬЧЖЭНЬ", "SHENZHEN"), 40, "#9fc4ff", 'text-anchor="middle" letter-spacing="14" opacity="0.4"')) +
        LY(0.4, P("M540 0 L240 1450 H840 Z", "url(#t-cone)", 'opacity="0.5" style="mix-blend-mode:screen"')) + LY(0.55, R(-100, 1400, 1280, 520, "url(#t-floor)") + R(-100, 1400, 1280, 30, "#1b2233")) + LY(0.7, row) +
        LY(1.15, times(8, (i) => G(`translate(${70 + i * 135} ${1900 - (i % 2) * 40})`, E(0, -120, 64, 76, "#020306") + P("M-110 0 q0 -110 110 -110 q110 0 110 110 Z", "#020306") + G(`translate(${i % 2 ? 36 : -40} -220)`, R(-44, -32, 88, 58, "#0b0d14", 'rx="8"') + `<circle class="flash" data-i="${i}" cx="0" cy="-28" r="20" fill="#fff" opacity="0"/>`))) + `<rect id="ph-flash" width="1080" height="1920" fill="#fff" opacity="0"/>`),
      update(root, p, lt) {
        root.querySelectorAll(".ph").forEach((e) => { const i = +e.dataset.i, c = Math.abs(i - 5) <= 1; e.setAttribute("opacity", c ? 0.5 + 0.5 * ease((p - 0.2) / 0.3) : 0.55 - 0.3 * ease((p - 0.2) / 0.3)); });
        let f = 0;
        root.querySelectorAll(".flash").forEach((e) => { const i = +e.dataset.i, ph = (lt * (1.1 + (i % 3) * 0.4) + i * 0.37) % 1, on = ph < 0.06 ? 1 - ph / 0.06 : 0; e.setAttribute("opacity", on); f = Math.max(f, on); });
        root.querySelector("#ph-flash").setAttribute("opacity", f * 0.15);
      },
    };
  },

  // a vertical timeline: dated nodes light up one after another, the newest glows red
  timeline: (seg) => {
    const it = seg.items || [], n = it.length, gap = 1500 / Math.max(1, n - 1 || 1);
    const nodes = it.map(([d, txt], i) => { const y = 260 + i * Math.min(300, gap), last = i === n - 1; return `<g class="tl" data-i="${i}" opacity="0.2">${C(300, y, last ? 30 : 22, last ? RED : GOLD)}${C(300, y, 60, last ? "url(#t-red)" : "url(#t-gold)", 'opacity="0.6"')}${T(250, y + 16, d, 46, last ? RED : GOLD, 'text-anchor="end" font-weight="900"')}${T(350, y + 14, txt, 40, "#e8e2cf", 'font-weight="700"')}</g>`; }).join("");
    return {
      svg: R(0, 0, 1080, 1920, INK) + LY(0.2, R(-100, 0, 1280, 1920, "url(#t-wall)") + times(14, (i) => L(`M-100 ${140 * i} H1180`, "#0f1524", 2))) +
        LY(0.6, `<g id="tl-all">${L(`M300 200 V${260 + (n - 1) * Math.min(300, gap) + 60}`, "#2a3350", 6)}<path id="tl-line" d="M300 200 V200" stroke="${GOLD}" stroke-width="6"/>${nodes}</g>`) + LY(0.5, dust(20, 100, 980, 300, 1700, "#ffe2a0")),
      update(root, p, lt) {
        moveDust(root, lt);
        const step = Math.min(300, gap), k = io(p / 0.85) * (n - 1);
        root.querySelector("#tl-line").setAttribute("d", `M300 200 V${260 + k * step}`);
        root.querySelectorAll(".tl").forEach((e) => { const i = +e.dataset.i; e.setAttribute("opacity", 0.2 + 0.8 * ease((k - i + 0.6) / 0.6)); });
        const h = 260 + (n - 1) * step;
        root.querySelector("#tl-all").setAttribute("transform", `translate(0 ${h > 1500 ? -(h - 1500) * io(p) : 0})`);
      },
    };
  },

  // the narrator on location: Timofey stands behind a desk / parapet, the background tells where we are
  host: (seg) => {
    const bg = seg.bg || "newsroom";
    let back = "", front = "";
    if (bg === "newsroom") {
      const scr = (x, y, w, h, i) => G(`translate(${x} ${y})`, R(0, 0, w, h, "#06101f", 'rx="10" stroke="#1f3a5f" stroke-width="6"') +
        (i % 3 === 0 ? times(18, (k) => C(20 + (k * 53) % (w - 40), 20 + ((k * 37) % (h - 40)), 4, "#4fa8ff", 'class="nr-dot" opacity="0.6"')) :
         i % 3 === 1 ? times(6, (k) => `<rect class="nr-bar" data-i="${k + i}" x="${24 + k * ((w - 48) / 6)}" y="${h - 20}" width="${(w - 48) / 6 - 10}" height="0" fill="${k % 2 ? "#e2b25a" : "#4fa8ff"}"/>`) :
         `<path class="nr-line" data-i="${i}" d="" fill="none" stroke="#4fd38a" stroke-width="5"/>`) + R(0, h - 4, w, 4, "#1f3a5f"));
      back = R(-100, 0, 1280, 1300, "#050b16") + times(9, (i) => scr(30 + (i % 3) * 350, 140 + Math.floor(i / 3) * 280, 320, 250, i)) + C(540, 560, 700, "url(#t-poolb)", 'opacity="0.35"') +
        `<g id="nr-tick"><rect x="-100" y="1000" width="1280" height="56" fill="#e3262f"/>${T(0, 1040, tr("ШЭНЬЧЖЭНЬ · АТЭС · РОССИЯ · КИТАЙ · США · ДЕКЛАРАЦИЯ О МИРЕ · ", "SHENZHEN · APEC · RUSSIA · CHINA · USA · DECLARATION ON PEACE · ").repeat(3), 30, "#fff", 'font-weight="900" letter-spacing="4" class="nr-tt"')}</g>`;
    } else if (bg === "skyline") {
      back = R(-100, 0, 1280, 1300, "#070b1e") + times(60, () => C(rnd() * 1280 - 100, rnd() * 400, 1 + rnd() * 2, "#fff", `opacity="${0.2 + rnd() * 0.5}"`)) +
        times(14, (i) => { const x = -100 + i * 95, h = 300 + ((i * 173) % 600), w = 80; return R(x, 1100 - h, w, h, i % 2 ? "#101a3a" : "#0c1430") + times(Math.floor(h / 40), (k) => times(3, (q) => (((i + k + q) * 7) % 5 < 2 ? R(x + 8 + q * 24, 1110 - h + k * 40, 14, 18, ["#ffd98a", "#9fc4ff", "#ff7fb0"][(i + q) % 3], 'class="sk-w" opacity="0.8"') : ""))) + C(x + w / 2, 1094 - h, 6, RED, 'class="sk-red"'); }) +
        R(-100, 0, 1280, 1300, "#9fc4ff", 'opacity="0.05"') + times(3, (i) => R(-100 + i * 460, 0, 18, 1300, "#05070d")) + times(40, () => `<path class="sk-rain" data-x="${rnd() * 1180}" data-p="${rnd()}" d="" stroke="#cfe0ff" stroke-width="2" opacity="0.35"/>`);
    } else if (bg === "kremlin") {
      back = R(-100, 0, 1280, 1300, "#0a0f24") + C(860, 220, 60, "#e8e2cf", 'opacity="0.85"') + C(860, 220, 240, "url(#t-pool)", 'opacity="0.35"') +
        P("M380 1100 V560 h40 v-60 h20 v-80 l40 -120 l40 120 v80 h20 v60 h40 V1100 Z", "#5a1a16") + C(480, 640, 46, "#e8e2cf", 'stroke="#c9a15a" stroke-width="6"') + `<g id="kr-hand"><path d="M480 640 V604" stroke="#222" stroke-width="5"/></g>` + P("M480 270 l14 30 32 3 -24 21 8 32 -30 -17 -30 17 8 -32 -24 -21 32 -3z", RED, 'transform="translate(0 -24)"') + C(480, 290, 90, "url(#t-red)", 'opacity="0.6"') +
        R(-100, 860, 1280, 240, "#6b1f18") + times(28, (i) => P(`M${-100 + i * 48} 860 v-34 l12 -14 l12 14 v34 Z`, "#6b1f18")) + times(30, () => `<circle class="kr-snow" r="${2 + rnd() * 4}" fill="#fff" data-x="${rnd() * 1180 - 50}" data-p="${rnd()}" opacity="0.7"/>`);
    } else {
      back = R(-100, 0, 1280, 1300, "url(#t-wall)") + times(6, (i) => R(40 + i * 180, 120, 120, 900, "#0c111c")) + C(540, 500, 700, "url(#t-pool)", 'opacity="0.35"');
    }
    front = bg === "kremlin" ? R(-100, 1080, 1280, 900, "#2a2622") + R(-100, 1080, 1280, 20, "#4a443c") + times(10, (i) => R(-100 + i * 140, 1100, 4, 820, "#1f1c19"))
      : R(-100, 1080, 1280, 900, bg === "newsroom" ? "#0b1424" : "url(#t-wood)") + R(-100, 1080, 1280, 12, bg === "newsroom" ? "#4fa8ff" : "#4a3020") + T(540, 1240, tr("ТЕНЬ ВЛАСТИ", "SHADOW OF POWER"), 56, GOLD, 'text-anchor="middle" font-weight="900" letter-spacing="12" opacity="0.8"');
    return {
      host: { x: 150, y: 150, w: 780 },
      svg: R(0, 0, 1080, 1920, INK) + LY(0.2, back) + `<g class="hostslot"></g>` + LY(1, front + C(540, 1330, 620, "url(#t-pool)", 'opacity="0.35"')) + LY(0.6, dust(16, 150, 930, 400, 1500, "#ffe2a0")),
      update(root, p, lt) {
        moveDust(root, lt);
        root.querySelectorAll(".nr-bar").forEach((e) => { const i = +e.dataset.i, h = 60 + 120 * (0.5 + 0.5 * Math.sin(lt * 1.3 + i)); e.setAttribute("height", h); e.setAttribute("y", 230 - h); });
        root.querySelectorAll(".nr-line").forEach((e) => { const i = +e.dataset.i; e.setAttribute("d", "M20 200 " + times(8, (k) => `L${20 + k * 40} ${120 + Math.sin(lt * 1.5 + k * 0.8 + i) * 60}`)); });
        root.querySelectorAll(".nr-dot").forEach((e, i) => e.setAttribute("opacity", 0.3 + 0.6 * Math.abs(Math.sin(lt * 2 + i))));
        const tt = root.querySelector("#nr-tick"); if (tt) tt.setAttribute("transform", `translate(${-((lt * 140) % 1400)} 0)`);
        root.querySelectorAll(".sk-red").forEach((e, i) => e.setAttribute("opacity", Math.sin(lt * 3 + i) > 0.3 ? 1 : 0.15));
        root.querySelectorAll(".sk-rain").forEach((e) => { const x = +e.dataset.x, y = ((lt * 0.9 + +e.dataset.p) % 1) * 1300; e.setAttribute("d", `M${x} ${y} l-6 60`); });
        root.querySelectorAll(".kr-snow").forEach((e) => { e.setAttribute("cx", +e.dataset.x + Math.sin(lt + +e.dataset.p * 6) * 20); e.setAttribute("cy", ((lt * 0.12 + +e.dataset.p) % 1) * 1100); });
        const kh = root.querySelector("#kr-hand"); if (kh) kh.setAttribute("transform", `rotate(${lt * 6} 480 640)`);
      },
    };
  },

  // a street in the city of the story: skyline with a landmark, neon, traffic, pedestrians, rain or snow
  street: (seg) => {
    const city = seg.city || "shenzhen";
    const PAL = { shenzhen: ["#1a0b2e", "#3a1650", ["#ff3fa8", "#4fd3ff", "#ffd84a", "#a8ff6a"]], moscow: ["#0a1030", "#1d2a55", ["#ffd98a", "#e3262f", "#9fc4ff"]],
      berlin: ["#10161f", "#2a3444", ["#ffd98a", "#9fc4ff", "#ffffff"]], washington: ["#0b1430", "#22305a", ["#ffd98a", "#ffffff", "#e3262f"]] }[city];
    const mark = { shenzhen: P("M520 1000 V260 l20 -160 l20 160 V1000 Z", "#24133a") + P("M500 1000 V420 h80 V1000 Z", "#2a1844") + C(540, 100, 8, RED, 'class="st-blink"'),
      moscow: P("M480 1000 V560 h30 v-60 h16 v-80 l34 -110 l34 110 v80 h16 v60 h30 V1000 Z", "#3a1414") + C(560, 610, 34, "#e8e2cf") + P("M560 300 l10 22 24 2 -18 16 6 24 -22 -13 -22 13 6 -24 -18 -16 24 -2z", RED, 'transform="translate(0 -40)"'),
      berlin: R(552, 300, 16, 700, "#2a3444") + C(560, 360, 60, "#3a4560") + R(554, 120, 12, 190, "#2a3444") + C(560, 120, 6, RED, 'class="st-blink"'),
      washington: P("M340 1000 V820 h440 V1000 Z", "#e8e2cf", 'opacity="0.9"') + P("M420 820 q140 -260 280 0 Z", "#e8e2cf") + R(548, 520, 24, 60, "#e8e2cf") + C(560, 510, 14, "#e8e2cf") + times(9, (i) => R(360 + i * 48, 840, 14, 160, "#cfc8b8")) }[city];
    const neon = city !== "shenzhen" ? "" : times(6, (i) => { const x = 40 + i * 175, y = 700 + (i % 2) * 90, c = PAL[2][i % PAL[2].length]; return `<g class="st-neon" data-i="${i}">${R(x, y, 46, 220, "none", `rx="10" stroke="${c}" stroke-width="7"`)}${C(x + 23, y + 110, 120, c, 'opacity="0.12"')}${times(3, (k) => R(x + 12, y + 30 + k * 60, 22, 30, c, 'opacity="0.8" rx="4"'))}</g>`; });
    const cars = times(7, (i) => { const lane = i % 3, y = 1360 + lane * 90, dir = lane === 1 ? -1 : 1, motor = seg.motorcade && i < 3; return `<g class="st-car" data-i="${i}" data-y="${y}" data-d="${dir}" data-v="${motor ? 180 : 420 + (i * 97) % 300}">${R(-90, -46, 180, 46, motor ? "#05060a" : ["#2a3444", "#4a1a1a", "#1a3a4a", "#3a3a3a"][i % 4], 'rx="16"')}${R(-60, -76, 110, 34, motor ? "#0b0d14" : "#1b2233", 'rx="12"')}${C(-56, 2, 18, "#05060a")}${C(56, 2, 18, "#05060a")}${C(dir > 0 ? 88 : -88, -26, 10, "#fff3c4")}${P(dir > 0 ? "M90 -26 l260 -40 v80 Z" : "M-90 -26 l-260 -40 v80 Z", "#fff3c4", 'opacity="0.15"')}${C(dir > 0 ? -88 : 88, -26, 8, RED)}${motor ? `<rect class="st-siren" x="-20" y="-88" width="40" height="12" rx="4" fill="#4fa8ff"/>` + R(-30, -110, 4, 40, "#8d95a3") + R(-26, -110, 30, 18, i ? "#fff" : RED) : ""}</g>`; });
    const peds = times(6, (i) => `<g class="st-ped" data-i="${i}" data-v="${(i % 2 ? -1 : 1) * (70 + i * 13)}" data-p="${i * 260}">${G("scale(1)", E(0, 0, 50, 10, "#000", 'opacity="0.4"') + `<g class="lg1"><rect x="-26" y="-180" width="22" height="180" rx="10" fill="#020306"/></g><g class="lg2"><rect x="4" y="-180" width="22" height="180" rx="10" fill="#020306"/></g>` + P("M-46 -420 q46 -20 92 0 l10 250 h-112 Z", "#020306") + C(0, -460, 40, "#020306") + (i % 2 ? L("M30 -420 V-560", "#020306", 6) + P("M-70 -560 q100 -90 200 0 Z", ["#2a1844", "#1a2a44", "#3a1a1a"][i % 3]) : ""))}</g>`);
    const fall = city === "moscow" ? times(50, () => `<circle class="st-snow" r="${2 + rnd() * 4}" fill="#fff" data-x="${rnd() * 1180 - 50}" data-p="${rnd()}" opacity="0.75"/>`) : times(60, () => `<path class="st-rain" data-x="${rnd() * 1280 - 100}" data-p="${rnd()}" d="" stroke="#cfe0ff" stroke-width="2" opacity="0.3"/>`);
    return {
      svg: `<defs><linearGradient id="st-sky-${city}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL[0]}"/><stop offset="1" stop-color="${PAL[1]}"/></linearGradient></defs>` +
        R(0, 0, 1080, 1920, `url(#st-sky-${city})`) + LY(0.1, times(50, () => C(rnd() * 1280 - 100, rnd() * 500, 1 + rnd() * 2, "#fff", `opacity="${0.2 + rnd() * 0.5}"`))) +
        LY(0.2, times(16, (i) => { const x = -100 + i * 85, h = 200 + ((i * 131) % 420); return R(x, 1000 - h, 76, h, shade(PAL[1], 0.6)) + times(Math.floor(h / 50), (k) => (((i + k) * 7) % 4 < 2 ? R(x + 14 + (k % 2) * 30, 1010 - h + k * 50, 14, 20, PAL[2][(i + k) % PAL[2].length], 'opacity="0.55" class="st-w"') : "")); }) + mark) +
        (seg.big ? T(540, 380, seg.big, 110, "#fff", 'text-anchor="middle" font-weight="900" letter-spacing="6" opacity="0.9"') : "") +
        LY(0.4, R(-100, 980, 1280, 330, shade(PAL[1], 0.45)) + neon) +
        LY(0.6, R(-100, 1300, 1280, 620, "#0a0c14") + times(12, (i) => R(-100 + i * 120, 1406, 60, 8, "#e9e4c8", 'opacity="0.4"')) + times(6, (i) => R(-100 + i * 230, 1300, 140, 620, PAL[2][i % PAL[2].length], 'opacity="0.05"')) + cars) +
        LY(1.1, R(-100, 1640, 1280, 300, "#2a2d3c") + R(-100, 1640, 1280, 8, "#4a4f66") + peds) + LY(0.8, fall),
      update(root, p, lt) {
        root.querySelectorAll(".st-neon").forEach((e) => { const i = +e.dataset.i; e.setAttribute("opacity", Math.sin(lt * (7 + i) + i) > 0.92 ? 0.35 : 1); });
        root.querySelectorAll(".st-w").forEach((e, i) => { if (i % 7 === 3) e.setAttribute("opacity", Math.sin(lt * 0.6 + i) > 0.8 ? 0.1 : 0.55); });
        root.querySelectorAll(".st-blink").forEach((e) => e.setAttribute("opacity", Math.sin(lt * 4) > 0 ? 1 : 0.2));
        root.querySelectorAll(".st-car").forEach((e) => { const i = +e.dataset.i, d = +e.dataset.d, v = +e.dataset.v, x = (((i * 337 + lt * v) % 1700) + 1700) % 1700 - 300; e.setAttribute("transform", `translate(${d > 0 ? x : 1080 - x} ${+e.dataset.y}) scale(${0.8 + (+e.dataset.y - 1360) / 450})`); });
        root.querySelectorAll(".st-siren").forEach((e) => e.setAttribute("fill", Math.floor(lt * 6) % 2 ? "#4fa8ff" : RED));
        root.querySelectorAll(".st-ped").forEach((e) => { const v = +e.dataset.v, x = ((((+e.dataset.p + lt * v) % 1400) + 1400) % 1400) - 160, st = Math.sin(lt * 6 + +e.dataset.i); e.setAttribute("transform", `translate(${x} 1880) scale(${v < 0 ? -1 : 1} 1)`); e.querySelector(".lg1").setAttribute("transform", `rotate(${st * 14} -15 -180)`); e.querySelector(".lg2").setAttribute("transform", `rotate(${-st * 14} 15 -180)`); });
        root.querySelectorAll(".st-rain").forEach((e) => { const x = +e.dataset.x, y = ((lt * 1.1 + +e.dataset.p) % 1) * 1920; e.setAttribute("d", `M${x} ${y} l-8 70`); });
        root.querySelectorAll(".st-snow").forEach((e) => { e.setAttribute("cx", +e.dataset.x + Math.sin(lt + +e.dataset.p * 6) * 24); e.setAttribute("cy", ((lt * 0.1 + +e.dataset.p) % 1) * 1920); });
      },
    };
  },

  // the round table in Shenzhen with the three leaders as animated figures (artistic reconstruction)
  summit: (seg) => {
    const LEAD = {
      putin: { x: 250, skin: "#e9c6aa", suit: "#1f2a44", tie: "#6b1f2e", rx: 66, ry: 84, flag: "ru",
        hair: P("M-68 -505 Q-74 -578 -30 -596 Q0 -604 30 -596 Q74 -578 68 -505 Q62 -548 44 -566 Q0 -582 -44 -566 Q-62 -548 -68 -505 Z", "#b39a7c") + P("M-36 -584 Q0 -594 36 -584", "none", 'stroke="#d2bc9c" stroke-width="5" stroke-linecap="round"'), brow: "#9a8064", eye: "#6f8aa8" },
      xi: { x: 540, skin: "#f0ccab", suit: "#1d1f27", tie: "#9a1a22", rx: 80, ry: 84, flag: "cn",
        hair: P("M-82 -505 Q-92 -598 -10 -606 Q72 -610 88 -540 Q87 -522 82 -505 Q74 -556 30 -568 Q-24 -576 -52 -556 Q-74 -538 -82 -505 Z", "#141414") + P("M-30 -598 Q20 -604 60 -586", "none", 'stroke="#3a3a44" stroke-width="5" stroke-linecap="round"'), brow: "#141414", eye: "#2a1a10" },
      trump: { x: 830, skin: "#f0c39c", suit: "#1d2f6b", tie: "#c8102e", rx: 84, ry: 92, flag: "us",
        hair: P("M-90 -520 Q-100 -600 -40 -616 Q20 -630 70 -610 Q104 -594 92 -520 Q80 -566 40 -580 Q-30 -596 -70 -566 Q-84 -548 -90 -520 Z", "#e6c36a") + P("M-60 -572 Q0 -600 70 -584", "none", 'stroke="#f3d98a" stroke-width="6" stroke-linecap="round"'), brow: "#d9b45a", eye: "#4a6a8a" },
    };
    const fig = (k) => {
      const L0 = LEAD[k];
      return `<g class="sm-lead" data-k="${k}" transform="translate(${L0.x} 1180) scale(0.78)">` +
        P("M-150 0 Q-150 -300 -100 -330 L-40 -360 h80 L100 -330 Q150 -300 150 0 Z", L0.suit) + P("M-40 -360 L0 -280 L40 -360 Z", "#f4f4f4") + P("M-12 -350 h24 l10 200 l-22 30 l-22 -30 Z", L0.tie) + L("M-40 -360 L-12 -230 M40 -360 L12 -230", shade(L0.suit, 0.7), 6) +
        `<g class="sm-arm">${R(90, -300, 60, 220, L0.suit, 'rx="28"')}${E(120, -70, 30, 26, L0.skin)}</g>` +
        `<g class="sm-head">${R(-26, -420, 52, 70, shade(L0.skin, 0.9))}${E(0, -500, L0.rx, L0.ry, L0.skin)}${L0.hair}` +
        `<g class="sm-eyes">${E(-28, -510, 11, 8, "#fff")}${E(28, -510, 11, 8, "#fff")}${C(-28, -510, 5, L0.eye)}${C(28, -510, 5, L0.eye)}</g>` +
        L("M-44 -530 q16 -8 30 0 M14 -530 q16 -8 30 0", L0.brow, 6) + L("M0 -500 q-8 22 4 26", shade(L0.skin, 0.8), 4) + `<ellipse class="sm-mouth" cx="0" cy="-450" rx="20" ry="3" fill="#7e2a30"/>` + E(-L0.rx, -500, 12, 18, shade(L0.skin, 0.94)) + E(L0.rx, -500, 12, 18, shade(L0.skin, 0.94)) + `</g></g>`;
    };
    const STAR = (x, y, r) => P("M" + times(10, (k) => { const a = -Math.PI / 2 + (k * Math.PI) / 5, q = k % 2 ? r * 0.4 : r; return `${x + q * Math.cos(a)} ${y + q * Math.sin(a)} `; }) + "Z", "#ffde00");
    const FL = { ru: R(3, 10, 150, 40, "#fff") + R(3, 50, 150, 40, "#0039a6") + R(3, 90, 150, 40, "#d52b1e"),
      cn: R(3, 10, 150, 100, "#de2910") + STAR(28, 36, 15) + STAR(52, 20, 5) + STAR(60, 32, 5) + STAR(60, 46, 5) + STAR(52, 58, 5),
      us: times(13, (i) => R(3, 10 + i * 8, 150, 8, i % 2 ? "#fff" : "#b22234")) + R(3, 10, 64, 56, "#3c3b6e") + times(12, (i) => C(12 + (i % 4) * 15, 18 + Math.floor(i / 4) * 17, 2.4, "#fff")) };
    const flag = (x, c) => G(`translate(${x} 520)`, R(-3, 0, 6, 560, "#c9a15a") + C(0, -6, 9, GOLD) + `<g class="sm-fl">${c}</g>`);
    return {
      svg: R(0, 0, 1080, 1920, INK) +
        `<g id="sm-cam">` + LY(0.2, R(-100, 0, 1280, 1200, "#2a0a0c") + times(6, (i) => R(-60 + i * 220, 120, 160, 1000, "#3a1012", 'rx="6"') + R(-48 + i * 220, 140, 136, 960, "none", 'stroke="#c9a15a" stroke-width="3" opacity="0.6"')) + times(3, (i) => G(`translate(${240 + i * 300} 150)`, L("M0 -150 V0", "#c9a15a", 3) + E(0, 30, 70, 36, "#ffe2a0", 'opacity="0.85"') + C(0, 40, 220, "url(#t-gold)", 'opacity="0.35"'))) +
          flag(170, FL[LEAD.putin.flag]) + flag(460, FL[LEAD.xi.flag]) + flag(760, FL[LEAD.trump.flag]) + R(-100, 1100, 1280, 120, "#1a0607")) +
        LY(0.5, fig("putin") + fig("xi") + fig("trump")) +
        LY(0.6, E(540, 1330, 640, 210, "#f4efe4") + E(540, 1320, 600, 180, "#fffaf0") + P("M-100 1330 Q540 1640 1180 1330 V1920 H-100 Z", "#e9e2d2") + times(3, (i) => G(`translate(${250 + i * 290} 1300)`, R(-34, -60, 8, 60, "#3a3d46") + C(-30, -64, 9, "#3a3d46") + R(-80, -10, 160, 70, "#fff", 'rx="4" stroke="#c9a15a" stroke-width="3"') + T(0, 36, [tr("РОССИЯ", "RUSSIA"), tr("КИТАЙ", "CHINA"), tr("США", "USA")][i], 24, "#1a1410", 'text-anchor="middle" font-weight="900"') + R(50, -36, 22, 40, "#cfe8f2", 'opacity="0.8" rx="4"'))) + C(540, 1330, 520, "url(#t-pool)", 'opacity="0.4"')) + `</g>`,
      update(root, p, lt, s, line) {
        const who = line && line.label ? (/ПУТИН|PUTIN/.test(line.label) ? "putin" : /ТРАМП|TRUMP/.test(line.label) ? "trump" : /СИ |XI /.test(line.label + " ") ? "xi" : null) : null;
        const act = who || seg.active || null;
        root.querySelectorAll(".sm-lead").forEach((e) => {
          const k = e.dataset.k, me = k === act, x = LEAD[k].x, look = act && !me ? (LEAD[act].x > x ? 8 : -8) : Math.sin(lt * 0.5 + x) * 4;
          e.querySelector(".sm-head").setAttribute("transform", `rotate(${look + Math.sin(lt * 0.9 + x) * 1.5} 0 -420)`);
          e.querySelector(".sm-arm").setAttribute("transform", me ? `rotate(${-30 - 12 * Math.abs(Math.sin(lt * 3))} 120 -300)` : `rotate(${Math.sin(lt * 0.7 + x) * 3} 120 -300)`);
          e.querySelector(".sm-mouth").setAttribute("ry", me && who ? 3 + 9 * Math.abs(Math.sin(lt * 11)) : 3);
          e.querySelector(".sm-eyes").setAttribute("transform", `translate(0 -510) scale(1 ${(lt + x / 100) % 3.7 < 0.14 ? 0.1 : 1}) translate(0 510)`);
                  });
        root.querySelectorAll(".sm-fl").forEach((e, i) => e.setAttribute("transform", `skewY(${Math.sin(lt * 2 + i) * 3})`));
        const f = seg.focus ? LEAD[seg.focus] : null, z = f ? 1.75 + 0.1 * io(p) : 1 + 0.06 * io(p), fx = f ? f.x : 540, fy = f ? 860 : 1000;
        root.querySelector("#sm-cam").setAttribute("transform", `translate(${540 - fx * z} ${960 - fy * z}) scale(${z})`);
      },
    };
  },
  // a land border crossing at night: floodlit booth, a barrier that lowers, snow (seg.sign, seg.big)
  border: (seg) => ({
    svg: `<defs><linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1230"/><stop offset="1" stop-color="#2a3a66"/></linearGradient></defs>` +
      R(0, 0, 1080, 1920, "url(#bd-sky)") + LY(0.1, times(40, () => C(rnd() * 1280 - 100, rnd() * 700, 1 + rnd() * 2, "#fff", `opacity="${0.2 + rnd() * 0.5}"`))) +
      LY(0.2, P("M-100 1000 L140 820 L260 900 L380 760 L520 880 L700 740 L860 860 L1180 780 V1000 Z", "#141c36") + P("M640 1000 V620 h50 v-70 l40 -60 40 60 v70 h50 V1000 Z", "#1c2442") + C(730, 520, 6, RED, 'class="bd-blink"')) +
      (seg.big ? T(540, 440, seg.big, 120, "#fff", 'text-anchor="middle" font-weight="900" letter-spacing="6" opacity="0.92"') : "") +
      LY(0.45, R(-100, 990, 1280, 40, "#3a4566") + times(14, (i) => R(-100 + i * 95, 960, 12, 40, "#4a5578")) + R(-100, 968, 1280, 6, "#4a5578")) +
      LY(0.6, R(-100, 1020, 1280, 900, "#1a2034") + P("M380 1020 L-100 1920 H1180 L700 1020 Z", "#252c42") + times(8, (i) => R(532, 1060 + i * 110 + i * i * 6, 16, 50 + i * 8, "#e9e4c8", 'opacity="0.5"')) +
        P("M200 1040 L880 1040 L920 1120 L160 1120 Z", "#3a4566") + R(180, 1120, 720, 24, "#e9e4c8", 'opacity="0.85"') + times(5, (i) => R(200 + i * 160, 1144, 22, 180, "#2e3652")) +
        P("M330 1144 L20 1500 H620 L520 1144 Z", "#fff3c4", 'opacity="0.10"') + P("M760 1144 L560 1500 H1080 L860 1144 Z", "#fff3c4", 'opacity="0.10"') + C(420, 1132, 14, "#fff3c4") + C(800, 1132, 14, "#fff3c4") +
        R(690, 1180, 150, 220, "#2e3652", 'rx="6"') + R(706, 1200, 118, 90, "#ffe2a0", 'opacity="0.75"') + R(690, 1170, 150, 14, "#e3262f", 'opacity="0.8"') +
        R(300, 1080, 480, 70, "#0f1428", `stroke="#cfe0ff" stroke-width="3" stroke-opacity="0.5"`) + T(540, 1128, seg.sign || tr("НАРВА · ЭСТОНИЯ", "NARVA · ESTONIA"), 40, "#cfe0ff", 'text-anchor="middle" font-weight="700" letter-spacing="3"')) +
      LY(0.85, R(250, 1380, 50, 200, "#1a1f30") + `<g id="bd-bar">${times(10, (i) => R(300 + i * 60, 1400, 60, 26, i % 2 ? "#fff" : RED))}${C(300, 1413, 22, "#0f1428")}</g>` + C(275, 1370, 16, RED, 'class="bd-lamp"') +
        `<g id="bd-sign" opacity="0">${R(560, 1470, 420, 120, RED, 'rx="10"')}${T(770, 1548, tr("ЗАКРЫТО", "CLOSED"), 64, "#fff", 'text-anchor="middle" font-weight="900" letter-spacing="6"')}</g>`) +
      LY(1.1, R(-100, 1700, 1280, 220, "#2a2d3c") + times(4, (i) => R(40 + i * 280, 1640, 160, 70, "#c8ccd8", 'rx="10" opacity="0.9"')) + times(4, (i) => R(40 + i * 280, 1620, 160, 24, "#e3262f", 'opacity="0.5"'))) +
      LY(0.9, times(60, () => `<circle class="bd-snow" r="${2 + rnd() * 4}" fill="#fff" data-x="${rnd() * 1180 - 50}" data-p="${rnd()}" opacity="0.8"/>`)),
    update(root, p, lt) {
      const a = -80 * (1 - ease((p - 0.25) / 0.35));
      root.querySelector("#bd-bar").setAttribute("transform", `rotate(${a} 300 1413)`);
      root.querySelector("#bd-sign").setAttribute("opacity", ease((p - 0.55) / 0.2));
      root.querySelectorAll(".bd-blink,.bd-lamp").forEach((e) => e.setAttribute("opacity", Math.sin(lt * 5) > 0 ? 1 : 0.25));
      root.querySelectorAll(".bd-snow").forEach((e) => { e.setAttribute("cx", +e.dataset.x + Math.sin(lt + +e.dataset.p * 6) * 24); e.setAttribute("cy", ((lt * 0.09 + +e.dataset.p) % 1) * 1920); });
    },
  }),

  // an embassy at night: columns, a flag on the roof, a black car leaving through the gate (seg.big, seg.sign)
  embassy: (seg) => ({
    svg: `<defs><linearGradient id="em-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1028"/><stop offset="1" stop-color="#26355e"/></linearGradient></defs>` +
      R(0, 0, 1080, 1920, "url(#em-sky)") + LY(0.1, C(860, 260, 70, "#e9e4c8", 'opacity="0.85"') + C(890, 240, 64, "#1a2448", 'opacity="0.9"') + times(30, () => C(rnd() * 1280 - 100, rnd() * 700, 1 + rnd() * 2, "#fff", `opacity="${0.2 + rnd() * 0.5}"`))) +
      (seg.big ? T(540, 470, seg.big, 120, "#fff", 'text-anchor="middle" font-weight="900" letter-spacing="6" opacity="0.92"') : "") +
      LY(0.35, R(536, 560, 8, 220, "#8d95a3") + `<g id="em-flag">${R(544, 566, 150, 34, "#fff")}${R(544, 600, 150, 34, "#1c4fd8")}${R(544, 634, 150, 34, RED)}</g>` +
        P("M120 860 L540 720 L960 860 Z", "#d8d2c0") + R(140, 860, 800, 40, "#cfc8b4") + times(6, (i) => R(190 + i * 136, 900, 50, 420, "#e4dece") + R(180 + i * 136, 900, 70, 20, "#cfc8b4")) +
        R(140, 900, 800, 420, "#8a8676", 'opacity="0.35"') + times(5, (i) => R(256 + i * 136, 960, 54, 110, "#ffe2a0", `class="em-w" opacity="0.7"`)) + R(470, 1120, 140, 200, "#3a2c1c") + R(100, 1320, 880, 40, "#b8b2a0")) +
      LY(0.55, R(-100, 1360, 1280, 560, "#141826") + times(22, (i) => R(-80 + i * 60, 1380, 8, 200, "#05070d")) + R(-100, 1380, 1280, 10, "#05070d") + R(-100, 1480, 1280, 8, "#05070d") +
        R(-60, 1300, 30, 290, "#1a1f30") + C(-45, 1290, 22, "#fff3c4") + E(-45, 1560, 200, 30, "#fff3c4", 'opacity="0.12"') + R(1110, 1300, 30, 290, "#1a1f30")) +
      LY(0.8, `<g id="em-car">${R(-160, -70, 320, 70, "#05060a", 'rx="22"')}${R(-100, -116, 190, 52, "#0b0d14", 'rx="16"')}${C(-96, 4, 28, "#000")}${C(96, 4, 28, "#000")}${C(-154, -40, 12, RED)}${P("M160 -40 l420 -60 v120 Z", "#fff3c4", 'opacity="0.13"')}${C(156, -40, 12, "#fff3c4")}</g>`) +
      LY(1.1, R(-100, 1720, 1280, 200, "#2a2d3c") + R(-100, 1720, 1280, 8, "#4a4f66") + R(80, 1250, 420, 90, "#0f1428", `stroke="#cfe0ff" stroke-width="3" stroke-opacity="0.5" rx="8"`) + T(290, 1310, seg.sign || tr("КОПЕНГАГЕН", "COPENHAGEN"), 42, "#cfe0ff", 'text-anchor="middle" font-weight="700" letter-spacing="3"')) +
      LY(0.9, times(50, () => `<path class="em-rain" data-x="${rnd() * 1280 - 100}" data-p="${rnd()}" d="" stroke="#cfe0ff" stroke-width="2" opacity="0.3"/>`)),
    update(root, p, lt) {
      root.querySelector("#em-flag").setAttribute("transform", `skewY(${Math.sin(lt * 2.2) * 4})`);
      root.querySelector("#em-car").setAttribute("transform", `translate(${lerp(300, 1500, io((p - 0.3) / 0.7))} 1640)`);
      root.querySelectorAll(".em-w").forEach((e, i) => e.setAttribute("opacity", Math.sin(lt * 0.7 + i * 1.7) > 0.85 ? 0.15 : 0.7));
      root.querySelectorAll(".em-rain").forEach((e) => { const x = +e.dataset.x, y = ((lt * 1.1 + +e.dataset.p) % 1) * 1920; e.setAttribute("d", `M${x} ${y} l-8 70`); });
    },
  }),
};
