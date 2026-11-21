import json, os, re, subprocess, sys
# studio template from the midterms episode; run from the episode folder
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../midterms-animation.html")).read()
lines = [l.rstrip("\n").split("\t") for l in open("script.tsv")]
dur = lambda f: float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
# extra pause before segments that open a new block
PAUSE = {1: .5, 2: .4, 3: .3, 4: .4, 6: .5, 8: .4, 9: .6, 10: .7, 11: .4, 12: .6, 13: .6}
t = 0.5; S = []
for i, (who, txt) in enumerate(lines):
    t += PAUSE.get(i, 0) if i else 0
    d = dur(f"seg/{i}.wav"); S.append((round(t, 2), round(t + d, 2), who, txt)); t += d + 0.35
D = round(S[-1][1] + 1.6, 2)
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
funnel = re.search(r'<svg class="funnel.*?</svg>', src, re.S).group(0)
funnel = funnel.replace('data-d="9.0"', f'data-d="{st[11]-st[10]+0.2:.2f}"').replace("окно сужается", "окно захлопывается")
scenes = "\n".join([
 sc(0,0,'<h1 class="el" data-d="0.3">УДАР<br /><b>В МОЗГ</b></h1>\n<div class="big muted el" data-d="1.4" style="margin-top: 30px">Демократы забрали Конгресс</div>'),
 sc(1,1,'<div class="tag el" data-d="0">США · ИТОГИ ВЫБОРОВ · 4 НОЯБРЯ</div>\n<h2 class="el" data-d="0.4">Синяя волна накрыла Капитолий</h2>\n<div class="big el" data-d="2.6" style="margin-top: 30px">«Хромая утка» — <b>уже прихрамывает</b></div>'),
 sc(2,2,'<div class="tag el" data-d="0">ПРОГНОЗ CBS NEWS</div>\n<div class="stats">\n<div class="stat el" data-d="0.4"><div class="v"><span data-count="245" data-d="0.5">0</span>+</div><div class="k">мест у демократов в Палате представителей (нужно 218)</div></div>\n<div class="stat el" data-d="3.6"><div class="v"><span data-count="53" data-d="3.7">0</span></div><div class="k">из 100 мест в Сенате</div></div>\n</div>'),
 sc(3,3,'<div class="tag el" data-d="0">ПАЛИ ДАЖЕ КРЕПОСТИ</div>\n<div class="item el" data-d="0.6"><span class="n">TX</span>Техас — первая победа демократа в Сенат за 30+ лет</div>\n<div class="item el" data-d="2.6"><span class="n">OH</span>Огайо — бывшее кресло вице-президента Вэнса</div>\n<div class="item el" data-d="4.0"><span class="n">ME</span>Мэн — Сьюзан Коллинз признала поражение</div>'),
 sc(4,5,'<div class="quote el" data-d="0.4">«Меня не было в бюллетене. Если бы я участвовал, мы бы одержали <span class="hl">убедительную победу</span>!»</div>\n<div class="src el" data-d="1.4">Дональд Трамп, Truth Social</div>'),
 sc(6,7,'<div class="quote el" data-d="0.4">«Мы будем рады сотрудничать с ними. Вероятно, нам удастся <span class="hl">о чём-нибудь договориться</span>»</div>\n<div class="src el" data-d="1.4">Дональд Трамп, The New York Times</div>'),
 sc(8,8,'<div class="tag el" data-d="0">СОТРУДНИЧЕСТВО ПО-ТРАМПОВСКИ</div>\n' + cap + '\n<div class="big el" data-d="2.2" style="margin-top: 10px">Пост в Truth Social сразу после слов о сотрудничестве</div>'),
 sc(9,9,'<div class="tag el" data-d="0">ИМПИЧМЕНТ: АРИФМЕТИКА</div>\n<div class="big el" data-d="0.4">Отстранить — <b>67 голосов</b> Сената</div>\n<div class="senate el" data-d="1.4" style="margin-top: 60px"><span class="grow" data-w="590" data-d="1.6"></span><span class="mark"></span><span class="mk">67 из 100</span></div>\n<div class="big muted el" data-d="4.6" style="margin-top: 50px">Пугать будут, выгонять — нет</div>'),
 sc(10,11,'<div class="tag el" data-d="0" style="background: var(--gold); color: #111">ЧТО ЭТО ЗНАЧИТ ДЛЯ РОССИИ</div>\n<div class="item el" data-d="1.0"><span class="n">01</span>Санкции: без Конгресса их не снять</div>\n<div class="item el" data-d="2.6"><span class="n">02</span>Помощь Украине: деньги утверждает Конгресс</div>\n<div class="item el" data-d="4.2"><span class="n">03</span>Сделки Трампа с Москвой — через демократов</div>\n' + funnel, "scene ru"),
 sc(12,12,'<div class="tag el" data-d="0">ДЕДЛАЙН</div>\n<h1 class="el" data-d="0.4" style="font-size: 110px">ЯНВАРЬ <b>2027</b></h1>\n<div class="big el" data-d="3.0" style="margin-top: 30px">Новый Конгресс приступает к работе — <b>у Белого дома два месяца</b></div>'),
 sc(13,13,'<div class="big el" data-d="0.3" style="font-size: 50px; font-weight: 900">Берегите голову!</div>\n<h1 class="el" data-d="1.2" style="margin-top: 44px; font-size: 90px">УДАР <b>В МОЗГ</b></h1>'),
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
        <span>Демократы получают контроль над обеими палатами Конгресса США</span>
        <span>Сенат: у демократов не менее 53 мест из 100</span>
        <span>Трамп: «Если бы я участвовал, мы бы победили»</span>
        <span>Новый Конгресс приступит к работе в январе 2027 года</span>
        <span>Демократы получают контроль над обеими палатами Конгресса США</span>
        <span>Сенат: у демократов не менее 53 мест из 100</span>
      \2''', html, count=1, flags=re.S)

# timeline data
G = lambda i, d=0: round(st[i] + d, 2)
gest = [[0,"wave"],[G(0,2.6),"rest"],[G(1),"open"],[G(2),"count"],[G(3),"point"],[G(4),"explain"],[G(5,-0.3),"drink"],
        [G(5,3.8),"rest"],[G(6),"explain"],[G(7,-0.2),"rest"],[G(8),"point"],[G(9),"count"],[G(10),"both"],[G(11),"open"],
        [G(12),"explain"],[G(13),"wave"],[G(13,2.6),"rest"],[round(D-1.1-1.0,2),"windup"],[round(D-1.1-0.4,2),"strike"],[round(D-1.1+0.8,2),"rest"]]
stand = [[0,0],[G(1,0.3),0],[G(1,1.1),1],[G(3,3.0),1],[G(3,3.8),0],[G(10,-0.4),0],[G(10,0.4),1],[ends(11)-0.2,1],[ends(11)+0.6,0]]
cam = [[0,1.28,470,420],[4,1,960,540],[G(2),1.04,1360,400],[G(3,5),1,960,540],[G(5),1.1,560,430],[ends(5),1,960,540],
       [G(8),1.05,1300,460],[G(9),1,960,540],[G(10),1.06,700,480],[G(12),1,960,540],[D,0.98,960,540]]
js = f'''      const SUBS = {json.dumps(subs, ensure_ascii=False)};
      const DURATION = {D},
        FADE = 0.4,
        IN = 0.6;
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
open("udar-animation.html", "w").write(html)
print("D", D, "starts", st)
