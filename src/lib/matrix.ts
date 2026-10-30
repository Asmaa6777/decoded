import type { Frame } from "@/lib/algorithms";

/* ============================================================
   Matrix maths for the Computational Mathematics course. Every
   visualizer replays frames built here, so the numbers on screen
   are computed, and tests can check them.
   ============================================================ */

export type Mat = number[][];

export const shape = (a: Mat): [number, number] => [a.length, a[0]?.length ?? 0];
export const zeros = (m: number, n: number): Mat => Array.from({ length: m }, () => Array(n).fill(0));
export const identity = (n: number): Mat => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));

/** MATLAB's pascal(n): symmetric, built from binomial coefficients. */
export function pascal(n: number): Mat {
  const a = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 1; i < n; i++) for (let j = 1; j < n; j++) a[i][j] = a[i - 1][j] + a[i][j - 1];
  return a;
}

/** MATLAB's magic(3) and magic(4), the two sizes the lessons use. */
export const MAGIC3: Mat = [[8, 1, 6], [3, 5, 7], [4, 9, 2]];
export const MAGIC4: Mat = [[16, 2, 3, 13], [5, 11, 10, 8], [9, 7, 6, 12], [4, 14, 15, 1]];

export const add = (a: Mat, b: Mat): Mat => a.map((r, i) => r.map((v, j) => v + b[i][j]));
export const sub = (a: Mat, b: Mat): Mat => a.map((r, i) => r.map((v, j) => v - b[i][j]));
export const scale = (k: number, a: Mat): Mat => a.map((r) => r.map((v) => k * v));
export const transpose = (a: Mat): Mat => (a[0] ?? []).map((_, j) => a.map((r) => r[j]));
export const dot = (u: number[], v: number[]) => u.reduce((s, x, i) => s + x * v[i], 0);

export function mul(a: Mat, b: Mat): Mat {
  const [m, p] = shape(a);
  const [q, n] = shape(b);
  if (p !== q) throw new Error(`Inner dimensions must agree: ${m}x${p} times ${q}x${n}`);
  return a.map((r) => Array.from({ length: n }, (_, j) => r.reduce((s, x, k) => s + x * b[k][j], 0)));
}

const signed = (x: number) => (x < 0 ? `(${x})` : String(x));

/* ------------------------- element by element ------------------------- */

export type ElementwiseOp = "add" | "subtract" | "scalar";

export type ElementwiseState = {
  op: ElementwiseOp;
  a: Mat;
  b: Mat | null;
  k: number;
  c: (number | null)[][];
  at: [number, number] | null;
};

export const MATLAB_ELEMENTWISE: Record<ElementwiseOp, string[]> = {
  add: ["A = pascal(3);", "B = magic(3);", "C = A + B"],
  subtract: ["A = pascal(3);", "B = magic(3);", "C = B - A"],
  scalar: ["A = pascal(3);", "k = -2;", "C = k * A"],
};

export function elementwiseFrames(op: ElementwiseOp, a: Mat, b: Mat, k: number): Frame<ElementwiseState>[] {
  const [m, n] = shape(a);
  const c: (number | null)[][] = zeros(m, n).map((r) => r.map(() => null));
  const frames: Frame<ElementwiseState>[] = [];
  const push = (at: [number, number] | null, message: string, line: number) =>
    frames.push({ state: { op, a, b: op === "scalar" ? null : b, k, c: c.map((r) => [...r]), at }, line, message, stats: {} });
  push(null, op === "scalar" ? `Multiply every entry of A by ${k}.` : "Both matrices are 3-by-3, so each entry has exactly one partner.", 2);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const v = op === "add" ? a[i][j] + b[i][j] : op === "subtract" ? b[i][j] - a[i][j] : k * a[i][j];
      c[i][j] = v;
      const sum =
        op === "add" ? `${a[i][j]} + ${signed(b[i][j])}` : op === "subtract" ? `${b[i][j]} - ${signed(a[i][j])}` : `${signed(k)} × ${signed(a[i][j])}`;
      push([i, j], `Row ${i + 1}, column ${j + 1}: ${sum} = ${v}.`, 2);
    }
  }
  push(null, "Done. No entry ever needed to look at its neighbours.", 2);
  return frames;
}

/* ------------------------ inner and outer products ----------------------- */

export type VectorProductKind = "inner" | "outer";

export type VectorProductState = {
  kind: VectorProductKind;
  u: number[];
  v: number[];
  at: [number, number] | null;
  outer: (number | null)[][];
  terms: number[];
};

export const MATLAB_VECTOR_PRODUCT: Record<VectorProductKind, string[]> = {
  inner: ["u = [3; 1; 4];", "v = [2 0 -1];", "x = v * u    % 1-by-3 times 3-by-1"],
  outer: ["u = [3; 1; 4];", "v = [2 0 -1];", "X = u * v    % 3-by-1 times 1-by-3"],
};

export function vectorProductFrames(kind: VectorProductKind, u: number[], v: number[]): Frame<VectorProductState>[] {
  const frames: Frame<VectorProductState>[] = [];
  const outer: (number | null)[][] = u.map(() => v.map(() => null));
  const terms: number[] = [];
  const push = (at: [number, number] | null, message: string) =>
    frames.push({ state: { kind, u, v, at, outer: outer.map((r) => [...r]), terms: [...terms] }, line: 2, message, stats: kind === "inner" ? { total: terms.reduce((s, x) => s + x, 0) } : {} });
  if (kind === "inner") {
    push(null, "1-by-3 times 3-by-1: the inner dimensions match, and the answer is 1-by-1, a single number.");
    u.forEach((x, i) => {
      terms.push(v[i] * x);
      push([i, i], `Pair number ${i + 1}: ${signed(v[i])} × ${signed(x)} = ${v[i] * x}.`);
    });
    push(null, `Add the products and you get ${dot(u, v)}. Three numbers went in, one came out.`);
  } else {
    push(null, "3-by-1 times 1-by-3: the outer dimensions set the size, so the answer is a 3-by-3 matrix.");
    u.forEach((x, i) =>
      v.forEach((y, j) => {
        outer[i][j] = x * y;
        push([i, j], `Entry (${i + 1}, ${j + 1}) is u(${i + 1}) × v(${j + 1}) = ${signed(x)} × ${signed(y)} = ${x * y}.`);
      }),
    );
    push(null, "Every row is a multiple of v, and every column is a multiple of u. All nine numbers come from just six.");
  }
  return frames;
}
