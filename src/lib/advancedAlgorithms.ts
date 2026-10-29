/* ============================================================
   Logic behind the Advanced Algorithms & Analysis visualizers.

   Same idea as src/lib/algorithms.ts: everything that can be
   computed lives here as plain functions and frame generators,
   and the components in AdvancedVisualizers.tsx only draw it.
   ============================================================ */

import type { ArrayState, Frame } from "@/lib/algorithms";

/* ------------------------ bit manipulation ------------------------ */

export type BitOp = "and" | "or" | "xor" | "not" | "shl" | "shr" | "rotr" | "rotl";

/** n as a string of `width` binary digits, most significant first. */
export function toBits(n: number, width = 8): string {
  const mask = width >= 32 ? 0xffffffff : (1 << width) - 1;
  return ((n & mask) >>> 0).toString(2).padStart(width, "0");
}

/** Apply a bitwise operation, keeping only the low `width` bits (like a fixed-size register). */
export function bitOp(op: BitOp, a: number, b: number, width = 8): number {
  const mask = (1 << width) - 1;
  const x = a & mask;
  switch (op) {
    case "and": return x & b & mask;
    case "or": return (x | b) & mask;
    case "xor": return (x ^ b) & mask;
    case "not": return ~x & mask;
    case "shl": return (x << b) & mask;
    case "shr": return x >>> b;
    case "rotr": {
      const d = ((b % width) + width) % width;
      return ((x >>> d) | (x << (width - d))) & mask;
    }
    case "rotl": {
      const d = ((b % width) + width) % width;
      return ((x << d) | (x >>> (width - d))) & mask;
    }
  }
}

export const isPowerOfTwo = (x: number) => x > 0 && (x & (x - 1)) === 0;

export type PopState = { n: number; prev?: number; count: number; cleared?: number };

export const CPP_COUNT_ONES = [
  "int count_one(int n) {",
  "    int count = 0;",
  "    while (n) {",
  "        n = n & (n - 1);   // clears the rightmost 1",
  "        count++;",
  "    }",
  "    return count;",
  "}",
];

/** Brian Kernighan's trick: each n & (n-1) removes exactly one 1-bit. */
export function popcountFrames(start: number): Frame<PopState>[] {
  const frames: Frame<PopState>[] = [];
  let n = start;
  let count = 0;
  frames.push({ state: { n, count }, line: 1, message: `Start with n = ${n}. Count how many 1-bits it has.`, stats: { count } });
  while (n) {
    frames.push({ state: { n, count }, line: 2, message: `n = ${n} is not 0, so there is at least one 1-bit left.`, stats: { count } });
    const prev = n;
    n = n & (n - 1);
    const cleared = Math.log2(prev ^ n);
    frames.push({
      state: { n, prev, count, cleared },
      line: 3,
      message: `n − 1 = ${prev - 1} flips the rightmost 1 (bit ${cleared}) and every 0 to its right. ANDing with n clears that bit: n is now ${n}.`,
      stats: { count },
    });
    count++;
    frames.push({ state: { n, count }, line: 4, message: `One bit removed, so count = ${count}.`, stats: { count } });
  }
  frames.push({ state: { n, count }, line: 6, message: `n is 0. ${start} has ${count} one-bit${count === 1 ? "" : "s"}. The loop ran once per 1-bit, not once per bit.`, stats: { count } });
  return frames;
}

/* --------------------------- fast power --------------------------- */

export type PowerCall = { a: bigint; b: number; result?: bigint };
export type PowerState = { calls: PowerCall[]; active: number };

export const CPP_FAST_POWER = [
  "long long fastPower(long long a, int b) {",
  "    if (b == 1)",
  "        return a;",
  "    long long c = a * a;",
  "    long long ans = fastPower(c, b / 2);",
  "    if (b % 2 == 1)",
  "        return a * ans;           // odd b: one extra a",
  "    return ans;",
  "}",
];

/** FastPower(a, b) from the lab: square the base, halve the exponent. */
export function fastPowerFrames(a0: number, b0: number): Frame<PowerState>[] {
  const frames: Frame<PowerState>[] = [];
  const calls: PowerCall[] = [];
  let mults = 0;
  const snap = (active: number, line: number, message: string) =>
    frames.push({ state: { calls: calls.map((c) => ({ ...c })), active }, line, message, stats: { calls: calls.length, multiplications: mults } });

  const go = (a: bigint, b: number): bigint => {
    calls.push({ a, b });
    const me = calls.length - 1;
    snap(me, 0, `fastPower(${a}, ${b}) is called.`);
    if (b === 1) {
      calls[me].result = a;
      snap(me, 2, `b = 1, so the answer is just a = ${a}. This is the base case.`);
      return a;
    }
    const c = a * a;
    mults++;
    snap(me, 3, `Square the base: c = ${a} × ${a} = ${c}. Now the exponent can be halved.`);
    const ans = go(c, Math.floor(b / 2));
    let r = ans;
    if (b % 2 === 1) {
      r = a * ans;
      mults++;
      calls[me].result = r;
      snap(me, 6, `b = ${b} is odd, so halving lost one factor of a. Multiply it back: ${a} × ${ans} = ${r}.`);
    } else {
      calls[me].result = r;
      snap(me, 7, `b = ${b} is even, so (a²)^(b/2) is already the answer: ${r}.`);
    }
    return r;
  };

  const r = go(BigInt(a0), b0);
  frames.push({
    state: { calls: calls.map((c) => ({ ...c })), active: -1 },
    line: 8,
    message: `${a0}^${b0} = ${r}. That took ${mults} multiplications; the simple a · power(a, b − 1) needs ${b0 - 1}.`,
    stats: { calls: calls.length, multiplications: mults },
  });
  return frames;
}

/* ------------------------- min and max ------------------------- */

export type MinMaxState = ArrayState & { min?: number; max?: number; phase: string };

export const CPP_MIN_MAX = [
  "void minMax(int x[], int n, int& lo, int& hi) {",
  "    for (int i = 0; i + 1 < n; i += 2)   // n/2 comparisons",
  "        if (x[i] > x[i + 1]) swap(x[i], x[i + 1]);",
  "    lo = x[0]; hi = x[1];",
  "    for (int i = 2; i < n; i += 2) {",
  "        if (x[i] < lo) lo = x[i];          // smaller of each pair",
  "        if (x[i + 1] > hi) hi = x[i + 1];  // larger of each pair",
  "    }",
  "}",
];

/** The lab's 1.5n − 2 min-and-max: order each pair, then race the small ones and the big ones separately. n must be even. */
export function minMaxFrames(input: number[]): Frame<MinMaxState>[] {
  const x = input.length % 2 === 0 ? [...input] : [...input, input[input.length - 1]];
  const n = x.length;
  const frames: Frame<MinMaxState>[] = [];
  let comparisons = 0;
  const push = (s: Partial<MinMaxState>, line: number, message: string) =>
    frames.push({ state: { array: [...x], phase: "pairs", ...s }, line, message, stats: { comparisons, "naive 2n": 2 * n } });

  push({}, 0, `Find the smallest and the largest of ${n} numbers. Comparing each number with both the current min and max would take about 2n = ${2 * n} comparisons.`);
  for (let i = 0; i + 1 < n; i += 2) {
    comparisons++;
    const swap = x[i] > x[i + 1];
    push({ compare: [i, i + 1] }, 2, `Pair (${x[i]}, ${x[i + 1]}): ${swap ? "out of order, swap them" : "already small-then-big"}.`);
    if (swap) {
      [x[i], x[i + 1]] = [x[i + 1], x[i]];
      push({ write: [i, i + 1] }, 2, `Now ${x[i]} is the small one and ${x[i + 1]} the big one.`);
    }
  }
  let lo = x[0];
  let hi = x[1];
  let loAt = 0;
  let hiAt = 1;
  const marks = () => ({ pointers: { min: loAt, max: hiAt } });
  push({ phase: "race", min: lo, max: hi, ...marks() }, 3, `After ${n / 2} comparisons every pair is ordered. The min must be a small (even) slot and the max a big (odd) slot. Start with the first pair.`);
  for (let i = 2; i < n; i += 2) {
    comparisons++;
    const newLo = x[i] < lo;
    if (newLo) {
      lo = x[i];
      loAt = i;
    }
    push({ phase: "race", compare: [i], min: lo, max: hi, ...marks() }, 5, `Small side: ${x[i]} vs min. ${newLo ? `New min ${lo}.` : `Min stays ${lo}.`}`);
    comparisons++;
    const newHi = x[i + 1] > hi;
    if (newHi) {
      hi = x[i + 1];
      hiAt = i + 1;
    }
    push({ phase: "race", compare: [i + 1], min: lo, max: hi, ...marks() }, 6, `Big side: ${x[i + 1]} vs max. ${newHi ? `New max ${hi}.` : `Max stays ${hi}.`}`);
  }
  push({ phase: "done", found: loAt, sorted: [hiAt], min: lo, max: hi, ...marks() }, 8, `min = ${lo}, max = ${hi} after ${comparisons} comparisons. That's 1.5n − 2 = ${1.5 * n - 2}, instead of about 2n = ${2 * n}.`);
  return frames;
}

/* ---------------------------- quicksort ---------------------------- */

/** Small seeded RNG (mulberry32), so a "random" run replays the same way every time. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type QuickState = ArrayState & { calls: [number, number][]; low?: [number, number]; high?: [number, number] };

export const CPP_QUICKSORT = [
  "int partition(int A[], int p, int q) {   // A[p..q]",
  "    int x = A[p];                         // pivot = first element",
  "    int i = p;",
  "    for (int j = p + 1; j <= q; j++)",
  "        if (A[j] <= x) {",
  "            i++;",
  "            swap(A[i], A[j]);",
  "        }",
  "    swap(A[p], A[i]);                     // pivot between the two parts",
  "    return i;",
  "}",
  "",
  "void quicksort(int A[], int p, int r) {",
  "    if (p < r) {",
  "        // randomized: swap(A[p], A[random(p, r)]);",
  "        int q = partition(A, p, r);",
  "        quicksort(A, p, q - 1);",
  "        quicksort(A, q + 1, r);",
  "    }",
  "}",
];

/** The lecture's quicksort: PARTITION around A[p], optionally after swapping a random element into A[p]. */
export function quicksortFrames(input: number[], randomized = false, seed = 7): Frame<QuickState>[] {
  const A = [...input];
  const frames: Frame<QuickState>[] = [];
  const done = new Set<number>();
  const calls: [number, number][] = [];
  const rand = rng(seed);
  let comparisons = 0;
  let swaps = 0;
  let maxDepth = 0;
  const push = (s: Partial<QuickState>, line: number, message: string) =>
    frames.push({
      state: { array: [...A], sorted: [...done], calls: calls.map((c) => [...c] as [number, number]), ...s },
      line,
      message,
      stats: { comparisons, swaps, "max depth": maxDepth },
    });

  const partition = (p: number, q: number) => {
    const x = A[p];
    let i = p;
    const regions = (j: number) => ({ low: [p + 1, i] as [number, number], high: [i + 1, j - 1] as [number, number] });
    push({ range: [p, q], pivot: p, pointers: { i, j: p + 1 }, ...regions(p + 1) }, 1, `PARTITION(A, ${p}, ${q}): the pivot is x = A[${p}] = ${x}. Grow a "≤ x" part and a "≥ x" part to its right.`);
    for (let j = p + 1; j <= q; j++) {
      comparisons++;
      const small = A[j] <= x;
      push({ range: [p, q], pivot: p, compare: [j], pointers: { i, j }, ...regions(j) }, 4, `Is A[${j}] = ${A[j]} ≤ ${x}? ${small ? "Yes, so it belongs in the ≤ x part." : "No, so it stays in the ≥ x part."}`);
      if (small) {
        i++;
        if (i !== j) swaps++;
        [A[i], A[j]] = [A[j], A[i]];
        push({ range: [p, q], pivot: p, write: [i, j], pointers: { i, j }, ...regions(j + 1) }, 6, `i moves to ${i}, and A[${i}] ↔ A[${j}]. The ≤ x part grows by one.`);
      }
    }
    if (i !== p) swaps++;
    [A[p], A[i]] = [A[i], A[p]];
    done.add(i);
    push({ range: [p, q], write: [p, i], pointers: { i }, low: [p, i - 1], high: [i + 1, q] }, 8, `Swap the pivot into A[${i}]. Everything left of it is ≤ ${x} and everything right is ≥ ${x}: ${x} is now in its final place.`);
    return i;
  };

  const sort = (p: number, r: number) => {
    calls.push([p, r]);
    maxDepth = Math.max(maxDepth, calls.length);
    if (p < r) {
      if (randomized) {
        const k = p + Math.floor(rand() * (r - p + 1));
        if (k !== p) {
          [A[p], A[k]] = [A[k], A[p]];
          swaps++;
        }
        push({ range: [p, r], pivot: p, write: k !== p ? [p, k] : undefined }, 14, `Randomized: picked A[${k}] at random and swapped it to the front, so ${A[p]} is the pivot.`);
      }
      const q = partition(p, r);
      sort(p, q - 1);
      sort(q + 1, r);
    } else if (p === r) {
      done.add(p);
      push({ range: [p, r] }, 13, `quicksort(A, ${p}, ${r}): one element, already sorted.`);
    }
    calls.pop();
  };

  push({}, 12, `Quicksort ${A.length} numbers${randomized ? ", picking each pivot at random" : ", always using the first element as the pivot"}.`);
  sort(0, A.length - 1);
  push({ sorted: A.map((_, i) => i) }, 19, `Sorted. ${comparisons} comparisons, recursion ${maxDepth} calls deep.`);
  return frames;
}

/* --------------------------- Fibonacci --------------------------- */

/** Calls the naive recursive fib(n) makes: T(n) = T(n-1) + T(n-2) + 1, T(0) = T(1) = 1. */
export function fibCalls(n: number): number {
  let a = 1; // T(0)
  let b = 1; // T(1)
  if (n <= 1) return 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b + 1];
  return b;
}

/* ---------------------- asymptotic notation ---------------------- */

/** Share of each term in a sum of terms, as fractions that add up to 1. */
export function termShares(values: number[]): number[] {
  const total = values.reduce((s, v) => s + v, 0);
  return values.map((v) => (total === 0 ? 0 : v / total));
}

export type BoundKind = "O" | "Ω";

/**
 * Does c·g(n) bound f(n) from above (O) or below (Ω) for every integer n from n0 up to `upTo`?
 * Returns the first n that breaks it, or null when the bound holds on the whole range.
 */
export function firstViolation(f: (n: number) => number, g: (n: number) => number, c: number, n0: number, kind: BoundKind, upTo = 10_000): number | null {
  for (let n = Math.max(1, Math.ceil(n0)); n <= upTo; n++) {
    const ok = kind === "O" ? f(n) <= c * g(n) + 1e-9 : f(n) >= c * g(n) - 1e-9;
    if (!ok) return n;
  }
  return null;
}

/* ---------------------- matrices and Strassen ---------------------- */

export type M2 = [[bigint, bigint], [bigint, bigint]];

export function mul2(x: M2, y: M2): M2 {
  return [
    [x[0][0] * y[0][0] + x[0][1] * y[1][0], x[0][0] * y[0][1] + x[0][1] * y[1][1]],
    [x[1][0] * y[0][0] + x[1][1] * y[1][0], x[1][0] * y[0][1] + x[1][1] * y[1][1]],
  ];
}

/** Strassen's seven products for [[a b] [c d]] · [[e f] [g h]], named as in the lecture. */
export function strassen(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) {
  const P = [a * (f - h), (a + b) * h, (c + d) * e, d * (g - e), (a + d) * (e + h), (b - d) * (g + h), (a - c) * (e + f)];
  const [p1, p2, p3, p4, p5, p6, p7] = P;
  return {
    P,
    r: p5 + p4 - p2 + p6,
    s: p1 + p2,
    t: p3 + p4,
    u: p5 + p1 - p3 - p7,
    standard: { r: a * e + b * g, s: a * f + b * h, t: c * e + d * g, u: c * f + d * h },
  };
}

export type FibSquareStep = { power: number; matrix: M2; used: boolean };

/** [[1 1] [1 0]]^n by repeated squaring: the matrices for powers 1, 2, 4, 8, … and which ones n uses. */
export function fibByMatrix(n: number): { steps: FibSquareStep[]; result: M2; multiplications: number } {
  let base: M2 = [[1n, 1n], [1n, 0n]];
  let result: M2 = [[1n, 0n], [0n, 1n]];
  let k = n;
  let power = 1;
  let mults = 0;
  const steps: FibSquareStep[] = [];
  while (k > 0) {
    const used = (k & 1) === 1;
    steps.push({ power, matrix: base, used });
    if (used) {
      result = mul2(result, base);
      mults++;
    }
    k >>= 1;
    if (k > 0) {
      base = mul2(base, base);
      mults++;
      power *= 2;
    }
  }
  return { steps, result, multiplications: mults };
}

/* --------------------- Gauss (Karatsuba) multiply --------------------- */

export type GaussCall = { a: bigint; b: bigint; depth: number; parts?: { aL: bigint; aR: bigint; bL: bigint; bR: bigint; half: number }; result?: bigint };
export type GaussState = { calls: GaussCall[]; active: number };

export const CPP_GAUSS = [
  "long long gauss(long long a, long long b) {",
  "    if (a < 10 || b < 10) return a * b;          // one digit: multiply directly",
  "    int half = digits(max(a, b)) / 2;",
  "    long long p = powerOf10(half);",
  "    long long aL = a / p, aR = a % p;           // split each number in two",
  "    long long bL = b / p, bR = b % p;",
  "    long long x1 = gauss(aL, bL);",
  "    long long x2 = gauss(aR, bR);",
  "    long long x3 = gauss(aL + aR, bL + bR);",
  "    return x1 * p * p + (x3 - x1 - x2) * p + x2;",
  "}",
];

const digitCount = (x: bigint) => (x < 0n ? -x : x).toString().length;

/** Gauss's three-multiplication trick, recursing until one of the numbers has a single digit. */
export function gaussFrames(a0: bigint, b0: bigint): Frame<GaussState>[] {
  const frames: Frame<GaussState>[] = [];
  const calls: GaussCall[] = [];
  let base = 0;
  const snap = (active: number, line: number, message: string) =>
    frames.push({ state: { calls: calls.map((c) => ({ ...c, parts: c.parts && { ...c.parts } })), active }, line, message, stats: { calls: calls.length, "1-digit mults": base } });

  const go = (a: bigint, b: bigint, depth: number): bigint => {
    calls.push({ a, b, depth });
    const me = calls.length - 1;
    if (a < 10n || b < 10n) {
      base++;
      calls[me].result = a * b;
      snap(me, 1, `${a} × ${b}: a one-digit number, so multiply directly. = ${a * b}.`);
      return a * b;
    }
    const half = Math.floor(Math.max(digitCount(a), digitCount(b)) / 2);
    const p = 10n ** BigInt(half);
    const parts = { aL: a / p, aR: a % p, bL: b / p, bR: b % p, half };
    calls[me].parts = parts;
    snap(me, 4, `Split at ${half} digit${half === 1 ? "" : "s"}: ${a} → ${parts.aL} | ${parts.aR}, and ${b} → ${parts.bL} | ${parts.bR}.`);
    const x1 = go(parts.aL, parts.bL, depth + 1);
    snap(me, 6, `x1 = aL·bL = ${x1}.`);
    const x2 = go(parts.aR, parts.bR, depth + 1);
    snap(me, 7, `x2 = aR·bR = ${x2}.`);
    const x3 = go(parts.aL + parts.aR, parts.bL + parts.bR, depth + 1);
    snap(me, 8, `x3 = (aL + aR)(bL + bR) = ${parts.aL + parts.aR} × ${parts.bL + parts.bR} = ${x3}. That's the only other multiplication we need.`);
    const r = x1 * p * p + (x3 - x1 - x2) * p + x2;
    calls[me].result = r;
    snap(me, 9, `Combine: x1·10^${2 * half} + (x3 − x1 − x2)·10^${half} + x2 = ${x1}·10^${2 * half} + ${x3 - x1 - x2}·10^${half} + ${x2} = ${r}.`);
    return r;
  };

  const r = go(a0, b0, 0);
  const n = Math.max(digitCount(a0), digitCount(b0));
  frames.push({
    state: { calls: calls.map((c) => ({ ...c })), active: -1 },
    line: 10,
    message: `${a0} × ${b0} = ${r}, using ${base} one-digit multiplications. Grade-school multiplication of two ${n}-digit numbers needs ${n * n}.`,
    stats: { calls: calls.length, "1-digit mults": base },
  });
  return frames;
}

export type Frac = [number, number]; // numerator, denominator

const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));

/** "n", "n/3", "2n/9" */
export function fracLabel([p, q]: Frac): string {
  const g = gcd(p, q);
  const [a, b] = [p / g, q / g];
  return `${a === 1 ? "" : a}n${b === 1 ? "" : `/${b}`}`;
}

/**
 * Recursion tree for T(n) = Σ T(fᵢ·n) + n^k: the subproblem sizes on each level, and each level's
 * total cost as a multiple of n^k.
 */
export function unevenLevels(fracs: Frac[], k: number, depth: number): { sizes: Frac[]; cost: number }[] {
  let level: Frac[] = [[1, 1]];
  const out: { sizes: Frac[]; cost: number }[] = [];
  for (let d = 0; d <= depth; d++) {
    out.push({ sizes: level, cost: level.reduce((s, [p, q]) => s + Math.pow(p / q, k), 0) });
    level = level.flatMap(([p, q]) => fracs.map(([fp, fq]) => [p * fp, q * fq] as Frac));
  }
  return out;
}

/* ------------------------- Master method ------------------------- */

export type MasterCase = 1 | 2 | 3 | "gap";

export type MasterResult = {
  /** log_b(a), the exponent of the "leaves" term n^(log_b a) */
  critical: number;
  case: MasterCase;
  /** the answer as text, e.g. "Θ(n² log n)" */
  answer: string;
  /** one plain-English sentence explaining which side won */
  why: string;
};

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", ".": "·" };

/** Round to 2 decimals and drop trailing zeros: 1.5849 → "1.58", 2 → "2". */
export function fmtExp(x: number): string {
  return String(Math.round(x * 100) / 100);
}

/** n raised to an exponent, written the way the slides write it: 1, n, n², n^1.58. */
export function powN(k: number): string {
  if (Math.abs(k) < 1e-9) return "1";
  if (Math.abs(k - 1) < 1e-9) return "n";
  const s = fmtExp(k);
  return Number.isInteger(Number(s)) ? `n${s.split("").map((c) => SUP[c] ?? c).join("")}` : `n^${s}`;
}

/** n^k · (log n)^p as text. */
export function fText(k: number, p: number): string {
  const poly = powN(k);
  const log = p === 0 ? "" : p === 1 ? "log n" : `log${SUP[String(p)] ?? `^${p}`} n`;
  if (!log) return poly;
  return poly === "1" ? log : `${poly} ${log}`;
}

/**
 * Solve T(n) = a·T(n/b) + f(n) with f(n) = n^k (log n)^p, using the basic master
 * method from the lecture. Its case 2 needs f(n) = Θ(n^(log_b a)) exactly, so a
 * log factor on the critical exponent falls into the "gap" between the cases.
 */
export function masterMethod(a: number, b: number, k: number, p = 0): MasterResult {
  const critical = Math.log(a) / Math.log(b);
  const eq = Math.abs(k - critical) < 1e-9;
  const leaves = powN(critical);
  if (!eq && k < critical) {
    return {
      critical,
      case: 1,
      answer: `Θ(${leaves})`,
      why: `f(n) = ${fText(k, p)} grows polynomially slower than n^(log_b a) = ${leaves}, so the leaves of the tree do most of the work.`,
    };
  }
  if (eq && p === 0) {
    return {
      critical,
      case: 2,
      answer: `Θ(${fText(k, 1)})`,
      why: `f(n) = ${fText(k, p)} grows at the same rate as n^(log_b a) = ${leaves}: every level costs the same, and there are log n levels.`,
    };
  }
  if (eq) {
    return {
      critical,
      case: "gap",
      answer: `not covered (extended rule gives Θ(${fText(k, p + 1)}))`,
      why: `f(n) = ${fText(k, p)} is bigger than ${leaves}, but only by a log factor, not by a polynomial factor n^ε. The basic master method can't decide it.`,
    };
  }
  return {
    critical,
    case: 3,
    answer: `Θ(${fText(k, p)})`,
    why: `f(n) = ${fText(k, p)} grows polynomially faster than n^(log_b a) = ${leaves}, so the root does most of the work. (The regularity check a·f(n/b) ≤ c·f(n) holds with c = ${fmtExp(a / Math.pow(b, k))}.)`,
  };
}

export type TreeLevel = {
  depth: number;
  /** subproblems on this level: a^depth */
  nodes: number;
  /** size of each subproblem, as a fraction of n: 1 / b^depth */
  size: number;
  /** total cost of the level relative to the root's cost: (a / b^k)^depth */
  cost: number;
};

/** Levels of the recursion tree for T(n) = a·T(n/b) + n^k, from the root down to size-1 pieces. */
export function recursionLevels(a: number, b: number, k: number, n: number): TreeLevel[] {
  const depth = Math.max(1, Math.round(Math.log(n) / Math.log(b)));
  const ratio = a / Math.pow(b, k);
  return Array.from({ length: depth + 1 }, (_, d) => ({
    depth: d,
    nodes: Math.pow(a, d),
    size: 1 / Math.pow(b, d),
    cost: Math.pow(ratio, d),
  }));
}
