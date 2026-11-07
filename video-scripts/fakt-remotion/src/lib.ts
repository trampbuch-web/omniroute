import { Easing, interpolate } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// 0→1 with a soft spring overshoot, starting at frame `at`, lasting `len` frames
export const pop = (frame: number, at: number, len = 18) =>
  interpolate(frame, [at, at + len], [0, 1], { ...clamp, easing: Easing.spring({ damping: 12 }) });

export const ease = (frame: number, at: number, len = 15) =>
  interpolate(frame, [at, at + len], [0, 1], { ...clamp, easing: easeOut });

// deterministic pseudo-random, so every render of a frame is identical
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type Word = [number, number, string];
export type Seg = {
  kind: "hook" | "fact" | "cta";
  n?: number;
  tag?: string;
  title: string;
  viz: any;
  drink?: boolean;
  start: number;
  end: number;
  voice: { src: string; from: number };
  words: Word[];
};
export type Data = { fps: number; durationInFrames: number; segs: Seg[]; mouth: [number, number][]; brand: string };

// timing shared by the visuals and the sound effects so clicks land on what appears
export const T = { head: 6, viz: 22, item: 14, count: 40 };

export const ACCENT: Record<string, string> = {
  kprf: "#e0262f",
  ldpr: "#2f6bff",
  "novye-lyudi": "#18c6a8",
  "edinaya-rossiya": "#2f8cff",
};
