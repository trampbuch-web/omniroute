import json, os, re, subprocess, sys
# studio template from the midterms episode; run from the episode folder
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../midterms-animation.html")).read()
lines = [l.rstrip("\n").split("\t") for l in open("script.tsv")]
dur = lambda f: float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
# extra pause before segments that open a new block
PAUSE = {1: 0.4, 2: 0.4, 3: 0.4, 4: 0.4, 5: 0.4, 6: 0.4, 7: 0.4, 8: 1.6, 9: 0.4, 10: 0.4}
t = 0.5; S = []
for i, (who, txt) in enumerate(lines):
    t += PAUSE.get(i, 0) if i else 0
    d = dur(f"seg/{i}.wav"); S.append((round(t, 2), round(t + d, 2), who, txt)); t += d + 0.35
D = round(S[-1][1] + 1.6, 2)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
import lipsync  # noqa: E402
mouth = None
for i, (a, b, who, _) in enumerate(S):
    if who == "H":
        mouth = lipsync.frames(f"seg/{i}.wav", D, a, mouth)
json.dump({"D": D, "starts": [[s[0], s[2]] for s in S]}, open("starts.json", "w"))
st = [s[0] for s in S]
def ends(i): return S[i+1][0] if i + 1 < len(S) else D
# subtitles: hold until next line starts
subs = [[s[0], ends(i), ("Трамп: «" + s[3] + "»") if s[2] == "T" else s[3], 0 if s[2] == "T" else 1] for i, s in enumerate(S)]

def sc(a, b, body, cls="scene"):
    return f'<div class="{cls}" data-s="{st[a]-0.2:.2f}" data-e="{(ends(b)):.2f}">\n{body}\n</div>'
cap = '''<svg class="el" data-d="0.6" width="460" height="260" viewBox="0 0 460 260">
  <path d="M70 170 Q70 40 230 40 Q390 40 390 170 Z" fill="#e3262f"/>
  <path d="M60 170 Q230 150 440 190 Q420 215 230 200 Q90 192 60 170 Z" fill="#b81d25"/>
  <circle cx="230" cy="42" r="10" fill="#b81d25"/>
  <text x="230" y="140" text-anchor="middle" font-size="64" font-weight="900" fill="#fff" letter-spacing="4">VETO</text>
</svg>'''
scenes = "\n".join([
 sc(0,0,'<h1 class="el" data-d="0.3">УДАР<br /><b>В МОЗГ</b></h1>\n<div class="big muted el" data-d="1.4" style="margin-top: 30px">Партии России: «Единая Россия»</div>'),
 sc(1,1,'<div class="tag el" data-d="0">ПАРТИИ РОССИИ · ВЫПУСК 1</div>\n<h2 class="el" data-d="0.4">«Единая Россия»</h2>\n<div class="big el" data-d="2.0" style="margin-top: 30px">Партия власти <b>с 2001 года</b></div>'),
 sc(2,2,'<div class="tag el" data-d="0">КАК ПОЯВИЛАСЬ</div>\n<div class="item el" data-d="0.8"><span class="n">01</span>1999 — блок «Единство»</div>\n<div class="item el" data-d="2.6"><span class="n">02</span>1999 — «Отечество — Вся Россия» Лужкова и Примакова</div>\n<div class="item el" data-d="4.4"><span class="n">03</span>1 декабря 2001 — объединение</div>'),
 sc(3,3,'<div class="tag el" data-d="0">ЛИДЕРЫ</div>\n<h2 class="el" data-d="0.4">Путин и Медведев</h2>\n<div class="big el" data-d="2.0" style="margin-top: 30px">Председатель — <b>Дмитрий Медведев</b> с 2012 года</div>'),
 sc(4,4,'<div class="tag el" data-d="0">ИДЕОЛОГИЯ</div>\n<div class="item el" data-d="0.8"><span class="n">01</span>Центризм и консерватизм</div>\n<div class="item el" data-d="2.6"><span class="n">02</span>Сильное государство и традиционные ценности</div>\n<div class="item el" data-d="4.4"><span class="n">03</span>Поддержка курса президента</div>'),
 sc(5,5,'<div class="tag el" data-d="0">ГОСДУМА</div>\n<div class="stats">\n<div class="stat el" data-d="0.4"><div class="v">64%</div><div class="k">2007 — конституционное большинство</div></div>\n<div class="stat el" data-d="2.8"><div class="v">49,8%</div><div class="k">2021 — 324 мандата из 450</div></div>\n</div>'),
 sc(6,6,'<div class="tag el" data-d="0">ВЫБОРЫ-2026 · ПРЕДВАРИТЕЛЬНО</div>\n<div class="stats">\n<div class="stat el" data-d="0.4"><div class="v">≈58%</div><div class="k">федеральный список</div></div>\n<div class="stat el" data-d="2.8"><div class="v">2/3</div><div class="k">мест — снова конституционное большинство</div></div>\n</div>'),
 sc(7,7,'<div class="tag el" data-d="0">ЧТО ДЕЛАЕТ</div>\n<h2 class="el" data-d="0.4">Законы и бюджет</h2>\n<div class="big el" data-d="2.0" style="margin-top: 30px">Нацпроекты, бюджеты, поправки в Конституцию 2020</div>'),
 sc(8,8,'<div class="tag el" data-d="0">КРИТИКА</div>\n<h2 class="el" data-d="0.4">Что говорят оппоненты</h2>\n<div class="big el" data-d="2.0" style="margin-top: 30px">Пенсионная реформа <b>2018 года</b></div>'),
 sc(9,9,'<div class="tag el" data-d="0" style="background: var(--gold); color: #111">ЧТО ЭТО ЗНАЧИТ ДЛЯ НАС</div>\n<div class="item el" data-d="0.8"><span class="n">01</span>Большинство в Думе — законы проходят быстро</div>\n<div class="item el" data-d="2.6"><span class="n">02</span>Ответственность за результат — тоже на ней</div>', "scene ru"),
 sc(10,10,'<div class="big el" data-d="0.3" style="font-size: 50px; font-weight: 900">Берегите голову!</div>\n<h1 class="el" data-d="1.2" style="margin-top: 44px; font-size: 90px">УДАР <b>В МОЗГ</b></h1>')
])
html = re.sub(r'(<div class="panel">\n).*?(\n        </div>\n      </div>\n\n      <div class="neon">)', lambda m: m.group(1) + scenes + m.group(2), src, count=1, flags=re.S)
assert html != src

# cup in hand template (drawn under the fingers)
html = html.replace('<g class="hand" transform="translate(0 178)">',
 '''<g class="hand" transform="translate(0 178)">
                <g class="cup" opacity="0"><g class="cupR">
                  <rect x="-24" y="-46" width="48" height="56" rx="7" fill="#f4f4f4" />
                  <rect x="-24" y="-30" width="48" height="11" fill="#e3262f" />
                  <path d="M-24 -36 Q-46 -32 -44 -18 Q-42 -6 -24 -8" stroke="#f4f4f4" stroke-width="7" fill="none" />
                </g></g>''', 1)
# desk mug gets an id so it can disappear while in hand
html = html.replace('<!-- кружка с паром -->', '<!-- кружка с паром -->\n        <g id="deskMug">', 1)
html = html.replace('''        </g>
      </svg>
    </div>''', '''        </g>
        </g>
      </svg>
    </div>''', 1)
# branding
for a, b in [('ХУК\n          <tspan fill="#e3262f">СЛЕВА</tspan>', 'УДАР\n          <tspan fill="#e3262f">В МОЗГ</tspan>'),
             ('<div class="bug">ХУК <b>СЛЕВА</b></div>', '<div class="bug">УДАР <b>В МОЗГ</b></div>'),
             ('ВЕДУЩИЙ · «ХУК СЛЕВА»', 'ВЕДУЩИЙ · «УДАР В МОЗГ»')]:
    assert a in html, a; html = html.replace(a, b)
html = re.sub(r'<title>.*?</title>', '<title>Удар в мозг</title>', html)
# ticker
html = re.sub(r'(<div class="run" id="run">).*?(</div>)', r'''\1
        <span>Партии России: «Единая Россия»</span>
        <span>Основана 1 декабря 2001 года</span>
        <span>Председатель — Дмитрий Медведев</span>
        <span>Выборы-2026: около 58% по предварительным данным ЦИК</span>
        <span>Партии России: «Единая Россия»</span>
        <span>Основана 1 декабря 2001 года</span>
        <span>Председатель — Дмитрий Медведев</span>
        <span>Выборы-2026: около 58% по предварительным данным ЦИК</span>
      \2''', html, count=1, flags=re.S)

# timeline data
G = lambda i, d=0: round(st[i] + d, 2)
gest = [[0,"wave"], [G(0,2.6),"rest"], [G(1),"point"], [G(2),"explain"], [G(3),"explain"], [G(4),"explain"], [G(5),"count"], [G(6),"count"], [G(7),"explain"], [G(8,-1.5),"drink"], [G(8,-0.1),"rest"], [G(8),"open"], [G(9),"explain"], [G(10),"wave"], [G(10,2.6),"rest"], [round(D-1.1-1.0,2),"windup"], [round(D-1.1-0.4,2),"strike"], [round(D-1.1+0.8,2),"rest"]]
stand = [[0,0], [G(5,-0.4),0], [G(5,0.4),1], [ends(5)-0.4,1], [ends(5)+0.4,0]]
cam = [[0,1.28,470,420], [4,1,960,540], [G(5),1.04,1360,400], [ends(5),1,960,540], [G(6),1.04,1360,400], [ends(6),1,960,540], [D,0.98,960,540]]
js = f'''      const SUBS = {json.dumps(subs, ensure_ascii=False)};
      const DURATION = {D},
        FADE = 0.4,
        IN = 0.6;
      const MOUTH = {json.dumps(mouth)};
      const GONG_T = {round(D-1.1,2)};
      const CAM = {json.dumps(cam)};
      const STAND = {json.dumps(stand)};
      const POSE = {{
        rest: [[15, -112], [15, -112]],
        wave: [[15, -112], [62, 70]],
        open: [[34, 96], [34, 96]],
        explain: [[20, -150], [15, -112]],
        point: [[15, -112], [78, 12]],
        count: [[15, -112], [18, -158]],
        both: [[22, -128], [22, -128]],
        drink: [[15, -112], [-75, -111]],
        windup: [[120, 60], [15, -112]],
        strike: [[120, -142], [15, -112]],
      }};
      const FINGER = {{ point: [0, 1], count: [0, 1] }};
      const GEST = {json.dumps(gest, ensure_ascii=False)};
'''
html = re.sub(r'      const SUBS = \[.*?const GEST = \[.*?\];\n', lambda m: js, html, count=1, flags=re.S)
assert "STAND" in html

# render(): stand up / sit down, cup in hand, head back while sipping
html = html.replace('      function render(t) {', '''      function standAt(t) {
        let i = STAND.findIndex(([k]) => k > t);
        if (i === -1) return STAND[STAND.length - 1][1];
        if (i === 0) return STAND[0][1];
        const a = STAND[i - 1], b = STAND[i];
        return lerp(a[1], b[1], smooth((t - a[0]) / (b[0] - a[0])));
      }

      function render(t) {''', 1)
old_host = re.search(r'        \$\("host"\)\.style\.transform =\n.*?;\n', html, re.S).group(0)
html = html.replace(old_host, '''        const up = standAt(t);
        $("host").style.transform =
          `translate(${sway + up * 70}px, ${-up * 120 + Math.sin(t * 1.6) * 2}px) rotate(${lean + Math.sin(t * 0.6) * 0.6 - up * 1.5}deg)`;

        // глоток из кружки: кружка переезжает со стола в правую руку
        const dr = pose.name === "drink" ? ease(pose.since / 0.55) : 0;
        const armR = $("armR");
        const [ra1, ra2] = pose.arms[1];
        const sip = pose.name === "drink" ? clamp((pose.since - 0.6) / 0.5) * clamp((3.2 - pose.since) / 0.4) : 0;
        armR.querySelector(".cup").setAttribute("opacity", pose.name === "drink" ? 1 : 0);
        armR.querySelector(".cupR").setAttribute("transform", `rotate(${-(ra1 + ra2) + sip * 35}) scale(1.45)`);
        $("deskMug").setAttribute("opacity", pose.name === "drink" ? 0 : 1);
        $("steam").style.visibility = pose.name === "drink" ? "hidden" : "visible";
''', 1)
# head tips back when sipping, mouth closed
html = html.replace('const tilt = listening ? 5 : pose.name === "point" ? 3 : 0;',
                    'const tilt = pose.name === "drink" ? -7 * ease((pose.since - 0.5) / 0.5) : listening ? 5 : pose.name === "point" ? 3 : 0;', 1)

# lower body: shown when he stands up (hidden by the desk while seated)
html = html.replace('<ellipse cx="300" cy="680" rx="290" ry="90" fill="#000" opacity="0.25" />', """<ellipse cx="300" cy="680" rx="290" ry="90" fill="#000" opacity="0.25" />
            <path d="M172 880 L165 1190 L288 1190 L296 880 Z" fill="#15161b" />
            <path d="M304 880 L312 1190 L435 1190 L428 880 Z" fill="#15161b" />
            <path d="M298 960 L300 1190" stroke="#0a0a0d" stroke-width="3" />
            <path d="M40 895 L560 895 L568 975 L330 982 L300 950 L270 982 L32 975 Z" fill="url(#blazer)" />
            <path d="M150 895 L250 895 L270 982 L140 978 Z" fill="#1c1d23" />
            <path d="M350 895 L450 895 L460 978 L330 982 Z" fill="#1c1d23" />
            <circle cx="300" cy="905" r="5" fill="#f4f4f4" stroke="#b9bec8" stroke-width="2" />""", 1)
# mallet in the hand (left arm uses it at the end)
html = html.replace('<g class="cup" opacity="0">', """<g class="mallet" opacity="0">
                  <rect x="-4" y="0" width="8" height="66" rx="3" fill="#8a5a2b" />
                  <circle cx="0" cy="66" r="13" fill="#e3262f" stroke="#7a1015" stroke-width="3" />
                </g>
                <g class="cup" opacity="0">""", 1)
# small gong on the desk, left side
html = html.replace('<!-- бумаги -->', """<!-- гонг -->
        <g id="gongStand" transform="translate(-28 0)">
          <rect x="62" y="-100" width="8" height="140" rx="3" fill="#8a6a3a" />
          <rect x="140" y="-100" width="8" height="140" rx="3" fill="#8a6a3a" />
          <rect x="54" y="-108" width="102" height="10" rx="4" fill="#a37c43" />
          <rect x="56" y="34" width="98" height="8" rx="3" fill="#5d4626" />
          <g id="gong">
            <path d="M92 -98 L98 -72 M118 -98 L112 -72" stroke="#ccc" stroke-width="2" />
            <circle cx="105" cy="-40" r="32" fill="#d9a441" stroke="#9c6f1f" stroke-width="4" />
            <circle cx="105" cy="-40" r="20" fill="none" stroke="#f3cf7a" stroke-width="3" opacity="0.7" />
            <circle cx="105" cy="-40" r="7" fill="#b88528" />
          </g>
        </g>
        <!-- бумаги -->""", 1)
html = html.replace('<path d="M150 36 L260 30 L270 46 L158 52 Z"', '<path d="M190 36 L300 30 L310 46 L198 52 Z"', 1)
html = html.replace("""      #desk {
        position: absolute;""", """      #desk {
        overflow: visible;
        position: absolute;""", 1)
html = html.replace('$("deskMug").setAttribute', """const strk = pose.name === "windup" || pose.name === "strike";
        $("armL").querySelector(".mallet").setAttribute("opacity", strk ? 1 : 0);
        const gg = t - GONG_T;
        $("gong").setAttribute("transform", gg > 0 ? `rotate(${Math.sin(gg * 14) * 14 * Math.exp(-gg * 2.2)} 105 -98)` : "");
        $("deskMug").setAttribute""", 1)
html = html.replace("const open = speaking ? Math.abs(Math.sin(t * 13) * Math.sin(t * 4.7)) : 0;",
  "const mo = MOUTH[Math.min(MOUTH.length - 1, Math.floor(t * 25))] || [0, 1];\n        const open = mo[0];\n        $(\"mouthOpen\").setAttribute(\"rx\", 27 * mo[1]);", 1)
assert "MOUTH[Math.min" in html
open("udar-animation.html", "w").write(html)
print("D", D, "starts", st)
