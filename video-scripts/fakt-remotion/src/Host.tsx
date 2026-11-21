import { useLayoutEffect, useRef } from "react";
import { HOST } from "./hostMarkup";

// Arm angles: [shoulder°, elbow°] for the left arm and the (mirrored) right arm
export const POSE: Record<string, [[number, number], [number, number]]> = {
  rest: [[15, -112], [15, -112]],
  wave: [[15, -112], [62, 70]],
  open: [[34, 96], [34, 96]],
  explain: [[20, -150], [15, -112]],
  point: [[15, -112], [78, 12]],
  count: [[15, -112], [18, -158]],
  both: [[22, -128], [22, -128]],
  drink: [[15, -112], [-75, -111]],
  reach: [[15, -112], [86, -98]], // right hand on the desk mug
};

export type HostState = {
  arms: [[number, number], [number, number]];
  wiggleL: number;
  wiggleR: number;
  finger: [number, number];
  mouth: [number, number];
  brows: number;
  lid: number;
  look: [number, number];
  head: number;
  headY: number;
  fringe: number;
  glint: number;
  cup: boolean;
  sip: number;
};

const set = (el: Element | null, k: string, v: string | number) => el && el.setAttribute(k, String(v));

export const Host: React.FC<{ s: HostState; style: React.CSSProperties }> = ({ s, style }) => {
  const ref = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const svg = ref.current!;
    const q = (sel: string) => svg.querySelector(sel);
    const arm = (id: string, [a1, a2]: [number, number], wig: number, fin: number) => {
      const el = q(`#${id}`)!;
      const base = id === "armL" ? "translate(158 600)" : "translate(442 600) scale(-1 1)";
      set(el, "transform", `${base} rotate(${a1})`);
      set(el.querySelector(".fore"), "transform", `translate(0 185) rotate(${a2 + wig})`);
      set(el.querySelector(".finger"), "opacity", fin);
      return a1 + a2 + wig;
    };
    arm("armL", s.arms[0], s.wiggleL, s.finger[0]);
    const aR = arm("armR", s.arms[1], s.wiggleR, s.finger[1]);
    const cup = q("#armR .cup");
    set(cup, "opacity", s.cup ? 1 : 0);
    set(q("#armR .cupR"), "transform", `rotate(${-aR + s.sip * 35})`); // keep the mug upright, tip it to sip
    set(q("#armL .cup"), "opacity", 0);

    const [open, width] = s.mouth;
    set(q("#mouthOpen"), "ry", open * 15);
    set(q("#mouthOpen"), "rx", 27 * width);
    set(q("#teeth"), "height", open * 5);
    set(q("#lowLip"), "transform", `translate(0 ${open * 12})`);
    set(q("#brows"), "transform", `translate(0 ${-s.brows * 8})`);
    for (const [id, cx] of [["eyeL", 248], ["eyeR", 352]] as const) {
      set(q(`#${id}`), "transform", `translate(${cx} 360) scale(1 ${s.lid}) translate(${-cx} -360)`);
      set(q(`#${id} .iris`), "transform", `translate(${s.look[0]} ${s.look[1]})`);
    }
    set(q("#head"), "transform", `rotate(${s.head} 300 480) translate(0 ${s.headY})`);
    set(q("#fringe"), "transform", `translate(0 ${s.fringe})`);
    set(q("#glint"), "x", -60 + s.glint * 560);
  });
  return <svg ref={ref} viewBox="0 0 600 900" style={{ overflow: "visible", ...style }} dangerouslySetInnerHTML={{ __html: HOST }} />;
};
