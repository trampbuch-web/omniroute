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
    const CITY = { w: [-77, 38.9, "ВАШИНГТОН"], m: [37.6, 55.75, "МОСКВА"], b: [116.4, 39.9, "ПЕКИН"], s: [114.06, 22.54, "ШЭНЬЧЖЭНЬ"] };
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
      T(0, 334, "ЯЛТА · ФЕВРАЛЬ 1945", 30, "#3b2f20", 'text-anchor="middle" font-weight="900" letter-spacing="4"') +
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
        LY(0.55, G("translate(210 1470) scale(0.9)", R(-190, -150, 380, 150, "#1a1410") + R(-206, -168, 412, 24, "#2a2118") + times(3, (i) => G(`translate(${-116 + i * 116} -168)`, E(0, -196, 30, 36, "#6b5230") + P("M-50 -156 Q0 -176 50 -156 L58 0 H-58 Z", "#5b4526") + L("M-50 -156 Q0 -176 50 -156", "#c9a15a", 4, 'opacity="0.7"'))) + T(0, -70, "ЯЛТА · 1945", 26, "#c9a15a", 'text-anchor="middle" font-weight="900" letter-spacing="3"'))) +
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
      `<g id="f-hostslot"></g>` + LY(1, R(-100, 1080, 1280, 900, "url(#t-wood)") + R(-100, 1080, 1280, 10, "#4a3020") + C(540, 1330, 620, "url(#t-pool)", 'opacity="0.55"') +
        G("translate(540 1300) rotate(-3)", R(-390, -190, 780, 400, "#7a1016", 'rx="10"') + R(-372, -174, 744, 368, "#efe6d2") + times(2, (i) => R(-340, -128 + i * 170, 680, 130, "#fff", 'opacity="0.5"')) +
          seg.items.map(([st, txt], i) => T(-320, -22 + i * 170, txt, 31, "#1a1410", 'font-weight="700"') + `<g class="stamp" data-i="${i}" opacity="0">${R(-322, -116 + i * 170, 300, 46, "none", `rx="6" stroke="${i ? "#c8862e" : "#2e8a4a"}" stroke-width="5"`)}${T(-172, -82 + i * 170, st, 28, i ? "#c8862e" : "#2e8a4a", 'text-anchor="middle" font-weight="900" letter-spacing="2"')}</g>`).join("") +
          `<g id="f-cover">${R(-390, -190, 780, 400, "#b3141c", 'rx="10"')}${R(-390, -190, 780, 400, "url(#t-ray)", 'rx="10" opacity="0.25"')}${T(0, 0, "ТЕНЬ ВЛАСТИ", 54, "#f0d9a0", 'text-anchor="middle" font-weight="900" letter-spacing="8"')}${T(0, 56, "ДОСЬЕ", 26, "#f0d9a0", 'text-anchor="middle" letter-spacing="10" opacity="0.8"')}</g>`)),
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
      T(540, 640, seg.big || "", 64, GOLD, 'text-anchor="middle" font-weight="900" letter-spacing="6" id="pl-big"'),
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
        G("translate(170 360) rotate(-10)", R(-130, -36, 260, 72, "none", `rx="8" stroke="${RED}" stroke-width="6" opacity="0.8"`) + T(0, 14, "БЕЗ ПОДПИСИ", 34, RED, 'text-anchor="middle" font-weight="900" letter-spacing="4" opacity="0.8"')))) +
      LY(1.1, G("translate(860 260)", L("M0 0 L-120 -260 L-40 -420", "#1d1f27", 22) + P("M-90 -440 l140 -40 l40 120 Z", "#1d1f27") + E(-10, -390, 40, 18, "#fff3c4") + C(-10, -380, 300, "url(#t-pool)", 'opacity="0.6"'))) + LY(0.6, dust(22, 200, 900, 400, 1500, "#ffe2a0")),
    update(root, p, lt) {
      moveDust(root, lt);
      root.querySelector("#pp-circle").setAttribute("stroke-dashoffset", 1 - io((p - 0.35) / 0.3));
    },
  }),
};
