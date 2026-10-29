/* ============================================================
   Logic behind the Advanced Algorithms & Analysis visualizers.

   Same idea as src/lib/algorithms.ts: everything that can be
   computed lives here as plain functions and frame generators,
   and the components in AdvancedVisualizers.tsx only draw it.
   ============================================================ */

/* --------------------------- Fibonacci --------------------------- */

/** Calls the naive recursive fib(n) makes: T(n) = T(n-1) + T(n-2) + 1, T(0) = T(1) = 1. */
export function fibCalls(n: number): number {
  let a = 1; // T(0)
  let b = 1; // T(1)
  if (n <= 1) return 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b + 1];
  return b;
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
