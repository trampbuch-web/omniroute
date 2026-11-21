# Timofey's full-body SVG markup (slim build, legs, mic/cup/fork in the hands) shared by the vertical shows.
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))


def host_svg():
    host_src = open(os.path.join(HERE, "..", "midterms-animation.html")).read()
    host = re.search(r'<svg id="host" viewBox="0 0 600 900">(.*?)\n      </svg>', host_src, re.S).group(1)
    LEGS = """
      <g id="legs">
        <g id="legL"><rect x="212" y="930" width="74" height="250" rx="30" fill="#15161b"/>
          <g class="shin"><rect x="216" y="1150" width="66" height="250" rx="28" fill="#15161b"/><ellipse cx="246" cy="1408" rx="52" ry="24" fill="#0b0b0d"/></g></g>
        <g id="legR"><rect x="314" y="930" width="74" height="250" rx="30" fill="#15161b"/>
          <g class="shin"><rect x="318" y="1150" width="66" height="250" rx="28" fill="#15161b"/><ellipse cx="354" cy="1408" rx="52" ry="24" fill="#0b0b0d"/></g></g>
      </g>
      <g transform="translate(300 0) scale(0.72 1) translate(-300 0)">
      <path d="M40 850 L560 850 L568 975 L330 982 L300 950 L270 982 L32 975 Z" fill="url(#blazer)"/>
      <path d="M150 850 L250 850 L270 982 L140 978 Z" fill="#1c1d23"/><path d="M350 850 L450 850 L460 978 L330 982 Z" fill="#1c1d23"/>
      </g>
    """
    assert '<g id="torso">' in host
    host = host.replace('<g id="torso">', LEGS + '<g id="torso">', 1)
    # slimmer build: narrow the blazer around the centre line, thinner sleeves (head untouched)
    assert host.count('<g transform="translate(0 -45)">') == 1
    host = host.replace('<g transform="translate(0 -45)">', '<g transform="translate(300 0) scale(0.72 1) translate(-300 -45)">', 1)
    host = host.replace('<rect x="-36" y="-10" width="72" height="200" rx="34" fill="url(#sleeve)" />', '<rect x="-27" y="-10" width="54" height="200" rx="26" fill="url(#sleeve)" />', 1)
    host = host.replace('<rect x="-30" y="-12" width="60" height="165" rx="28" fill="url(#sleeve)" />', '<rect x="-23" y="-12" width="46" height="165" rx="22" fill="url(#sleeve)" />', 1)
    host = host.replace('<rect x="-29" y="138" width="58" height="18" rx="6" fill="#f2f4f8" />', '<rect x="-23" y="138" width="46" height="18" rx="6" fill="#f2f4f8" />', 1)
    HAND_ITEMS = """<g class="hand" transform="translate(0 178)">
                    <g class="mic" opacity="0"><g transform="translate(-16 58)"><rect x="-10" y="-72" width="20" height="112" rx="8" fill="#1b1b1f"/>
                      <rect x="-24" y="-66" width="48" height="34" rx="5" fill="#e3262f"/><text x="0" y="-42" font-size="17" font-weight="900" text-anchor="middle" fill="#fff" font-family="DejaVu Sans, Arial">ВЦР</text>
                      <circle cx="0" cy="-92" r="27" fill="#3a3d46"/><path d="M-20 -100 H20 M-24 -90 H24 M-20 -80 H20" stroke="#5c606b" stroke-width="3"/></g></g>
                    <g class="cup" opacity="0"><g transform="scale(1.4)"><rect x="-24" y="-46" width="48" height="56" rx="7" fill="#f4f4f4"/>
                      <rect x="-24" y="-30" width="48" height="11" fill="#e3262f"/><path d="M-24 -36 Q-46 -32 -44 -18 Q-42 -6 -24 -8" stroke="#f4f4f4" stroke-width="7" fill="none"/></g></g>
                    <g class="fork" opacity="0"><rect x="-4" y="-110" width="8" height="125" rx="3" fill="#cfd5e2"/>
                      <path d="M-14 -110 V-150 M-5 -110 V-150 M5 -110 V-150 M14 -110 V-150" stroke="#cfd5e2" stroke-width="4"/>
                      <ellipse cx="0" cy="-158" rx="22" ry="14" fill="#f3e3c3" stroke="#d9c49a" stroke-width="3"/></g>"""
    assert host.count('<g class="hand" transform="translate(0 178)">') == 1
    host = host.replace('<g class="hand" transform="translate(0 178)">', HAND_ITEMS, 1)
    return host
