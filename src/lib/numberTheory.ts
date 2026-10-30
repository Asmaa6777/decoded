import type { Frame } from "@/lib/algorithms";

/* ============================================================
   Number theory for the Computational Mathematics course. Moduli
   stay small enough that products fit safely in a double.
   ============================================================ */

/** Always in 0..n-1, like MATLAB's mod and unlike JavaScript's %. */
export const mod = (a: number, n: number) => ((a % n) + n) % n;

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

export type EuclidStep = { a: number; b: number; q: number; r: number };

export function euclidSteps(a: number, b: number): EuclidStep[] {
  const steps: EuclidStep[] = [];
  while (b !== 0) {
    const q = Math.floor(a / b);
    steps.push({ a, b, q, r: a - q * b });
    [a, b] = [b, a - q * b];
  }
  return steps;
}

export type Tile = { x: number; y: number; size: number; step: number };

/** Cut a rectangle into squares: each Euclid step lays down q squares of side b. */
export function euclidTiles(a: number, b: number): Tile[] {
  const tiles: Tile[] = [];
  let [x, y, w, h] = [0, 0, a, b];
  let step = 0;
  while (w > 0 && h > 0) {
    const s = Math.min(w, h);
    const count = Math.floor(Math.max(w, h) / s);
    for (let i = 0; i < count; i++) {
      tiles.push({ x: w >= h ? x + i * s : x, y: w >= h ? y : y + i * s, size: s, step });
    }
    if (w >= h) {
      x += count * s;
      w -= count * s;
    } else {
      y += count * s;
      h -= count * s;
    }
    step++;
  }
  return tiles;
}

export type TileState = { a: number; b: number; steps: EuclidStep[]; upto: number };

export const MATLAB_EUCLID = ["r = a - b * floor(a / b);", "while r ~= 0", "  a = b;", "  b = r;", "  r = a - b * floor(a / b);", "end", "GCD = b"];

export function tileFrames(a: number, b: number): Frame<TileState>[] {
  const steps = euclidSteps(a, b);
  const g = steps[steps.length - 1].b;
  const frames: Frame<TileState>[] = [{ state: { a, b, steps, upto: -1 }, line: 0, message: `A ${a}-by-${b} rectangle. Any square that tiles it exactly has a side dividing both ${a} and ${b}, so we want the largest such square.`, stats: {} }];
  steps.forEach((s, i) => {
    const last = i === steps.length - 1;
    frames.push({
      state: { a, b, steps, upto: i },
      line: last ? 6 : i === 0 ? 0 : 4,
      message: last
        ? `${s.a} = ${s.q} × ${s.b}. Nothing is left over, so the side ${s.b} fills the last piece exactly: gcd(${a}, ${b}) = ${g}.`
        : `${s.a} = ${s.q} × ${s.b} + ${s.r}. Lay down ${s.q} ${s.q === 1 ? "square" : "squares"} of side ${s.b}. A ${s.b}-by-${s.r} piece remains, and it has the same gcd.`,
      stats: { gcd: last ? g : 0 },
    });
  });
  return frames;
}
