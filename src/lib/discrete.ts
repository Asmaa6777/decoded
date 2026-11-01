/* Logic for the Discrete Mathematics course: propositional formulas, sets as
   logic, functions, relations, counting, graphs and probability. Pure functions
   only; the visualizers in src/components/mdx/DiscreteVisualizers.tsx draw them. */

import type { Frame } from "@/lib/algorithms";

/* =============================== propositional logic =============================== */

export type Prop =
  | { kind: "var"; name: string }
  | { kind: "const"; value: boolean }
  | { kind: "not"; arg: Prop }
  | { kind: "and" | "or" | "implies" | "iff" | "xor"; left: Prop; right: Prop };

type Tok = { t: "var"; v: string } | { t: "const"; v: boolean } | { t: "op"; v: string } | { t: "(" } | { t: ")" };

const OPS: [string, string][] = [
  ["<->", "iff"], ["↔", "iff"], ["<=>", "iff"],
  ["->", "implies"], ["→", "implies"], ["=>", "implies"],
  ["&&", "and"], ["&", "and"], ["∧", "and"], ["^", "and"],
  ["||", "or"], ["|", "or"], ["∨", "or"],
  ["⊕", "xor"],
  ["!", "not"], ["~", "not"], ["¬", "not"],
];

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "(") { out.push({ t: "(" }); i++; continue; }
    if (c === ")") { out.push({ t: ")" }); i++; continue; }
    const op = OPS.find(([s]) => src.startsWith(s, i));
    if (op) { out.push({ t: "op", v: op[1] }); i += op[0].length; continue; }
    const word = /^[A-Za-z]+/.exec(src.slice(i))?.[0];
    if (word) {
      const w = word.toLowerCase();
      if (w === "and" || w === "or" || w === "not" || w === "implies" || w === "iff" || w === "xor") out.push({ t: "op", v: w });
      else if (w === "true" || w === "t") out.push({ t: "const", v: true });
      else if (w === "false" || w === "f") out.push({ t: "const", v: false });
      else if (word.length === 1) out.push({ t: "var", v: w });
      else throw new Error(`Use one-letter variables: "${word}"`);
      i += word.length;
      continue;
    }
    if (c === "1" || c === "0") { out.push({ t: "const", v: c === "1" }); i++; continue; }
    throw new Error(`Unexpected "${c}"`);
  }
  return out;
}

/** Parses a formula. Binding, tightest first: not, and, or/xor, implies (right-associative), iff. */
export function parseProp(src: string): Prop {
  const toks = tokenize(src);
  let p = 0;
  const peekOp = (...names: string[]) => {
    const t = toks[p];
    return t && t.t === "op" && names.includes(t.v) ? t.v : null;
  };
  const iff = (): Prop => {
    let left = implies();
    while (peekOp("iff")) { p++; left = { kind: "iff", left, right: implies() }; }
    return left;
  };
  const implies = (): Prop => {
    const left = or();
    if (peekOp("implies")) { p++; return { kind: "implies", left, right: implies() }; }
    return left;
  };
  const or = (): Prop => {
    let left = and();
    for (let op = peekOp("or", "xor"); op; op = peekOp("or", "xor")) { p++; left = { kind: op as "or" | "xor", left, right: and() }; }
    return left;
  };
  const and = (): Prop => {
    let left = not();
    while (peekOp("and")) { p++; left = { kind: "and", left, right: not() }; }
    return left;
  };
  const not = (): Prop => {
    if (peekOp("not")) { p++; return { kind: "not", arg: not() }; }
    return atom();
  };
  const atom = (): Prop => {
    const t = toks[p++];
    if (!t) throw new Error("The formula ends too early");
    if (t.t === "var") return { kind: "var", name: t.v };
    if (t.t === "const") return { kind: "const", value: t.v };
    if (t.t === "(") {
      const e = iff();
      if (toks[p]?.t !== ")") throw new Error("Missing )");
      p++;
      return e;
    }
    throw new Error(t.t === ")" ? "Unexpected )" : "An operator is missing an operand");
  };
  if (toks.length === 0) throw new Error("Type a formula");
  const e = iff();
  if (p < toks.length) throw new Error("Unexpected text after the formula");
  return e;
}

export function evalProp(e: Prop, env: Record<string, boolean>): boolean {
  switch (e.kind) {
    case "var": return !!env[e.name];
    case "const": return e.value;
    case "not": return !evalProp(e.arg, env);
    case "and": return evalProp(e.left, env) && evalProp(e.right, env);
    case "or": return evalProp(e.left, env) || evalProp(e.right, env);
    case "xor": return evalProp(e.left, env) !== evalProp(e.right, env);
    case "implies": return !evalProp(e.left, env) || evalProp(e.right, env);
    case "iff": return evalProp(e.left, env) === evalProp(e.right, env);
  }
}

export function varsOf(e: Prop, acc = new Set<string>()): string[] {
  if (e.kind === "var") acc.add(e.name);
  else if (e.kind === "not") varsOf(e.arg, acc);
  else if (e.kind !== "const") { varsOf(e.left, acc); varsOf(e.right, acc); }
  return [...acc].sort();
}

const SYM = { and: "∧", or: "∨", xor: "⊕", implies: "→", iff: "↔" } as const;
const RANK = { iff: 1, implies: 2, or: 3, xor: 3, and: 4, not: 5, var: 6, const: 6 } as const;

/** Prints a formula with the fewest brackets that keep its meaning. */
export function showProp(e: Prop): string {
  if (e.kind === "var") return e.name;
  if (e.kind === "const") return e.value ? "T" : "F";
  const wrap = (x: Prop, min: number) => (RANK[x.kind] < min ? `(${showProp(x)})` : showProp(x));
  if (e.kind === "not") return `¬${wrap(e.arg, 5)}`;
  const r = RANK[e.kind];
  // implies groups to the right, the rest to the left
  const leftMin = e.kind === "implies" ? r + 1 : r;
  const rightMin = e.kind === "implies" ? r : r + 1;
  return `${wrap(e.left, leftMin)} ${SYM[e.kind]} ${wrap(e.right, rightMin)}`;
}

/** Every compound piece of the formula, innermost first, ending with the formula itself. */
export function subformulas(e: Prop): Prop[] {
  const out: Prop[] = [];
  const seen = new Set<string>();
  const walk = (x: Prop) => {
    if (x.kind === "var" || x.kind === "const") return;
    if (x.kind === "not") walk(x.arg);
    else { walk(x.left); walk(x.right); }
    const k = showProp(x);
    if (!seen.has(k)) { seen.add(k); out.push(x); }
  };
  walk(e);
  return out;
}

/** Rows in the usual order: all true first, counting down like binary 11…1 to 00…0. */
export function assignments(vars: string[]): Record<string, boolean>[] {
  const n = vars.length;
  return Array.from({ length: 2 ** n }, (_, r) => Object.fromEntries(vars.map((v, i) => [v, ((2 ** n - 1 - r) >> (n - 1 - i)) % 2 === 1])));
}

export type Verdict = "tautology" | "contradiction" | "contingency";

export function classify(e: Prop): Verdict {
  const vals = assignments(varsOf(e)).map((env) => evalProp(e, env));
  if (vals.every(Boolean)) return "tautology";
  if (!vals.some(Boolean)) return "contradiction";
  return "contingency";
}

/** Rows (over the union of both formulas' variables) where the two disagree. Empty means equivalent. */
export function disagreements(a: Prop, b: Prop): Record<string, boolean>[] {
  const vars = [...new Set([...varsOf(a), ...varsOf(b)])].sort();
  return assignments(vars).filter((env) => evalProp(a, env) !== evalProp(b, env));
}

export const equivalent = (a: Prop, b: Prop) => disagreements(a, b).length === 0;

/* ==================================== quantifiers ==================================== */

export type QuantResult = { holds: boolean; witness: number | null };

/** ∀x P(x): the witness is the first counterexample, if any. */
export function forAll(domain: number[], p: (x: number) => boolean): QuantResult {
  const bad = domain.find((x) => !p(x));
  return { holds: bad === undefined, witness: bad ?? null };
}

/** ∃x P(x): the witness is the first example, if any. */
export function exists(domain: number[], p: (x: number) => boolean): QuantResult {
  const good = domain.find(p);
  return { holds: good !== undefined, witness: good ?? null };
}

export const isPrimeSmall = (n: number) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};

/* ======================================== sets ======================================== */

/** Which Venn regions satisfy a set expression written with a, b, c as membership tests. */
export function vennRegions(expr: Prop, names: string[]): boolean[] {
  return assignments(names).map((env) => evalProp(expr, env));
}

/** Translates set notation (∪ ∩ − ' ᶜ Δ ⊕) into a formula over membership in a, b, c. */
export function parseSetExpr(src: string): Prop {
  const s = src
    .replace(/∪|\bunion\b|\+/gi, " | ")
    .replace(/∩|\bintersect\b/gi, " & ")
    .replace(/Δ|△/g, " ⊕ ")
    .replace(/([A-Za-z)])\s*['ᶜ]/g, "$1 '")
    .replace(/\\|−/g, " - ");
  // A - B means A and not B; a postfix ' means complement
  const withMinus = s.replace(/-/g, "& ~");
  // move postfix complements in front: (x)' or a' → ~(x) / ~a
  let out = withMinus;
  for (let guard = 0; guard < 20 && out.includes("'"); guard++) {
    out = out.replace(/([A-Za-z])\s*'/, "~$1").replace(/(\([^()]*\))\s*'/, "~$1");
  }
  if (out.includes("'")) throw new Error("Could not read a complement");
  return parseProp(out);
}

export function powerSet<T>(xs: T[]): T[][] {
  return xs.reduce<T[][]>((acc, x) => [...acc, ...acc.map((s) => [...s, x])], [[]]);
}

export function cartesian<A, B>(as: A[], bs: B[]): [A, B][] {
  return as.flatMap((a) => bs.map((b) => [a, b] as [A, B]));
}

/* ===================================== functions ===================================== */

export type FunctionKind = { injective: boolean; surjective: boolean; bijective: boolean; collisions: number[][]; missed: number[] };

/** f[i] is the codomain index that domain element i maps to. */
export function functionKind(f: number[], codomainSize: number): FunctionKind {
  const hits: number[][] = Array.from({ length: codomainSize }, () => []);
  f.forEach((y, x) => hits[y].push(x));
  const collisions = hits.filter((h) => h.length > 1);
  const missed = hits.map((h, y) => (h.length === 0 ? y : -1)).filter((y) => y >= 0);
  const injective = collisions.length === 0;
  const surjective = missed.length === 0;
  return { injective, surjective, bijective: injective && surjective, collisions, missed };
}

/* ===================================== relations ===================================== */

export type Matrix = boolean[][];

export type RelationProps = {
  reflexive: boolean;
  symmetric: boolean;
  antisymmetric: boolean;
  transitive: boolean;
  /** a pair that breaks the property, as [i, j] (or [i, j, k] for transitivity) */
  why: { reflexive?: number[]; symmetric?: number[]; antisymmetric?: number[]; transitive?: number[] };
};

export function relationProps(r: Matrix): RelationProps {
  const n = r.length;
  const why: RelationProps["why"] = {};
  for (let i = 0; i < n && !why.reflexive; i++) if (!r[i][i]) why.reflexive = [i, i];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (!why.symmetric && r[i][j] && !r[j][i]) why.symmetric = [i, j];
    if (!why.antisymmetric && i !== j && r[i][j] && r[j][i]) why.antisymmetric = [i, j];
    for (let k = 0; k < n && !why.transitive; k++) if (r[i][j] && r[j][k] && !r[i][k]) why.transitive = [i, j, k];
  }
  return { reflexive: !why.reflexive, symmetric: !why.symmetric, antisymmetric: !why.antisymmetric, transitive: !why.transitive, why };
}

export const isEquivalence = (p: RelationProps) => p.reflexive && p.symmetric && p.transitive;
export const isPartialOrder = (p: RelationProps) => p.reflexive && p.antisymmetric && p.transitive;

/** The blocks of an equivalence relation, as lists of element indexes. */
export function equivalenceClasses(r: Matrix): number[][] {
  const seen = new Set<number>();
  const out: number[][] = [];
  for (let i = 0; i < r.length; i++) {
    if (seen.has(i)) continue;
    const block = r[i].map((v, j) => (v ? j : -1)).filter((j) => j >= 0);
    block.forEach((j) => seen.add(j));
    out.push(block.length ? block : [i]);
  }
  return out;
}

/** Warshall's algorithm: the smallest transitive relation containing r. */
export function transitiveClosure(r: Matrix): Matrix {
  const c = r.map((row) => [...row]);
  const n = c.length;
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (c[i][k] && c[k][j]) c[i][j] = true;
  return c;
}

export const relationFrom = (n: number, rule: (a: number, b: number) => boolean, base = 1): Matrix =>
  Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => rule(i + base, j + base)));

/* =================================== proof stepping =================================== */

export type InductionState = { n: number; k: number; phase: "base" | "assume" | "add" | "done"; lhs: number; rhs: number };

export const PY_INDUCTION = [
  "def P(n):",
  "    return sum(range(1, n + 1)) == n * (n + 1) // 2",
  "",
  "assert P(1)                 # base case",
  "for k in range(1, N):",
  "    # assume P(k), add k + 1 to both sides",
  "    assert P(k + 1)          # P(k) -> P(k+1)",
];

/** Climbs the claim 1 + 2 + … + n = n(n + 1)/2 one step at a time, up to N. */
export function inductionFrames(N: number): Frame<InductionState>[] {
  const tri = (n: number) => (n * (n + 1)) / 2;
  const frames: Frame<InductionState>[] = [
    { state: { n: N, k: 1, phase: "base", lhs: 1, rhs: tri(1) }, line: 3, message: "Base case: for n = 1 the left side is 1 and the formula gives 1·2/2 = 1. P(1) holds.", stats: { proved: 1 } },
  ];
  for (let k = 1; k < N; k++) {
    frames.push({ state: { n: N, k, phase: "assume", lhs: tri(k), rhs: tri(k) }, line: 5, message: `Assume P(${k}): the first ${k} steps hold ${tri(k)} blocks, which is ${k}·${k + 1}/2.`, stats: { proved: k } });
    frames.push({ state: { n: N, k: k + 1, phase: "add", lhs: tri(k) + k + 1, rhs: tri(k + 1) }, line: 6, message: `Add a column of ${k + 1}: ${tri(k)} + ${k + 1} = ${tri(k + 1)}, and ${k + 1}·${k + 2}/2 = ${tri(k + 1)}. P(${k + 1}) holds.`, stats: { proved: k + 1 } });
  }
  frames.push({ state: { n: N, k: N, phase: "done", lhs: tri(N), rhs: tri(N) }, line: 4, message: `Every domino knocked over the next one, so the formula holds up to ${N}, and the same argument works for any n.`, stats: { proved: N } });
  return frames;
}

export type InvariantState = { arr: number[]; target: number; lo: number; hi: number; mid: number | null; found: number | null; invariant: boolean; done: boolean };

export const PY_BINARY_SEARCH = [
  "def search(a, target):",
  "    lo, hi = 0, len(a) - 1",
  "    # invariant: if target is in a, it is in a[lo..hi]",
  "    while lo <= hi:",
  "        mid = (lo + hi) // 2",
  "        if a[mid] == target:",
  "            return mid",
  "        elif a[mid] < target:",
  "            lo = mid + 1",
  "        else:",
  "            hi = mid - 1",
  "    return -1   # a[lo..hi] is empty, so target is not in a",
];

/** Binary search with the loop invariant checked at every step. */
export function invariantFrames(arr: number[], target: number): Frame<InvariantState>[] {
  const frames: Frame<InvariantState>[] = [];
  const inv = (lo: number, hi: number) => !arr.includes(target) || arr.slice(lo, hi + 1).includes(target);
  let lo = 0;
  let hi = arr.length - 1;
  const push = (line: number, message: string, mid: number | null, found: number | null = null, done = false) =>
    frames.push({ state: { arr, target, lo, hi, mid, found, invariant: inv(lo, hi), done }, line, message, stats: { window: Math.max(0, hi - lo + 1) } });
  push(1, `Initialisation: the window is the whole array, a[${lo}..${hi}]. If ${target} is anywhere, it is in here, so the invariant holds before the first pass.`, null);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    push(4, `mid = (${lo} + ${hi}) // 2 = ${mid}, and a[${mid}] = ${arr[mid]}.`, mid);
    if (arr[mid] === target) {
      push(6, `a[${mid}] is the target. Return ${mid}.`, mid, mid, true);
      return frames;
    }
    if (arr[mid] < target) {
      lo = mid + 1;
      push(8, `${arr[mid]} < ${target}. The array is sorted, so everything at or left of ${mid} is too small. Dropping it keeps the invariant: lo = ${lo}.`, mid);
    } else {
      hi = mid - 1;
      push(10, `${arr[mid]} > ${target}. Everything at or right of ${mid} is too big. Dropping it keeps the invariant: hi = ${hi}.`, mid);
    }
  }
  push(11, `The window is empty (lo = ${lo} > hi = ${hi}). The invariant says the target would be inside it, so it isn't in the array. Return -1.`, null, null, true);
  return frames;
}

/* ===================================== counting ===================================== */

export function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

export const factorial = (n: number) => (n <= 1 ? 1 : Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1));
export const permutations = (n: number, k: number) => (k < 0 || k > n ? 0 : factorial(n) / factorial(n - k));

export function pascalRows(n: number): number[][] {
  return Array.from({ length: n + 1 }, (_, r) => Array.from({ length: r + 1 }, (_, k) => binom(r, k)));
}

export function subsetsOfSize<T>(xs: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (xs.length < k) return [];
  const [head, ...rest] = xs;
  return [...subsetsOfSize(rest, k - 1).map((s) => [head, ...s]), ...subsetsOfSize(rest, k)];
}

export const CHARSETS = [
  { id: "lower", label: "a–z", size: 26 },
  { id: "upper", label: "A–Z", size: 26 },
  { id: "digits", label: "0–9", size: 10 },
  { id: "symbols", label: "symbols", size: 33 },
] as const;

/** Number of passwords of exactly `length` characters from an alphabet of `size`. */
export const passwordCount = (size: number, length: number) => size ** length;

export function humanDuration(seconds: number): string {
  if (!isFinite(seconds)) return "forever";
  const units: [number, string][] = [[31557600 * 1e9, "billion years"], [31557600 * 1e6, "million years"], [31557600, "years"], [86400, "days"], [3600, "hours"], [60, "minutes"], [1, "seconds"]];
  for (const [u, name] of units) if (seconds >= u) return `${(seconds / u).toLocaleString("en-US", { maximumSignificantDigits: 3 })} ${name}`;
  return "under a second";
}

export type PigeonState = { keys: number[]; m: number; placed: number; buckets: number[][]; clash: number | null };

export const PY_PIGEON = [
  "buckets = [[] for _ in range(m)]",
  "for key in keys:",
  "    b = key % m",
  "    if buckets[b]:",
  "        print('collision in bucket', b)",
  "    buckets[b].append(key)",
];

/** Drops keys into m buckets by key mod m, flagging each collision. */
export function pigeonFrames(keys: number[], m: number): Frame<PigeonState>[] {
  const buckets: number[][] = Array.from({ length: m }, () => []);
  const frames: Frame<PigeonState>[] = [
    { state: { keys, m, placed: 0, buckets: buckets.map((b) => [...b]), clash: null }, line: 0, message: `${keys.length} keys, ${m} buckets.${keys.length > m ? " More keys than buckets, so a collision is certain before we start." : " There is room for every key, so a collision is possible but not forced."}`, stats: { placed: 0, collisions: 0 } },
  ];
  let collisions = 0;
  keys.forEach((key, i) => {
    const b = ((key % m) + m) % m;
    const clash = buckets[b].length > 0 ? b : null;
    buckets[b].push(key);
    if (clash !== null) collisions++;
    const left = m - buckets.filter((x) => x.length > 0).length;
    frames.push({
      state: { keys, m, placed: i + 1, buckets: buckets.map((x) => [...x]), clash },
      line: clash === null ? 5 : 4,
      message: clash === null ? `${key} mod ${m} = ${b}. Bucket ${b} was empty. ${left} empty bucket${left === 1 ? "" : "s"} left.` : `${key} mod ${m} = ${b}. Bucket ${b} already holds ${buckets[b].slice(0, -1).join(", ")}: a collision.`,
      stats: { placed: i + 1, collisions },
    });
  });
  return frames;
}

/* ====================================== graphs ====================================== */

export type GNode = { id: string; x: number; y: number };
export type GEdge = [string, string];

export function adjacency(nodes: GNode[], edges: GEdge[], directed: boolean): Record<string, string[]> {
  const adj: Record<string, string[]> = Object.fromEntries(nodes.map((n) => [n.id, [] as string[]]));
  for (const [a, b] of edges) {
    adj[a].push(b);
    if (!directed && a !== b) adj[b].push(a);
  }
  for (const k of Object.keys(adj)) adj[k].sort();
  return adj;
}

export function degrees(nodes: GNode[], edges: GEdge[]): Record<string, number> {
  const d: Record<string, number> = Object.fromEntries(nodes.map((n) => [n.id, 0]));
  for (const [a, b] of edges) { d[a]++; d[b]++; }
  return d;
}

export type TopoState = { order: string[]; indegree: Record<string, number>; queue: string[]; current: string | null; removed: string[]; cycle: string[] };

export const PY_KAHN = [
  "indegree = {v: 0 for v in graph}",
  "for v in graph:",
  "    for w in graph[v]: indegree[w] += 1",
  "ready = [v for v in graph if indegree[v] == 0]",
  "order = []",
  "while ready:",
  "    v = ready.pop(0)",
  "    order.append(v)",
  "    for w in graph[v]:",
  "        indegree[w] -= 1",
  "        if indegree[w] == 0: ready.append(w)",
  "# nodes left out of order sit on a cycle",
];

/** Kahn's algorithm. Edges point from a prerequisite to what depends on it. */
export function topoFrames(nodes: string[], edges: GEdge[]): Frame<TopoState>[] {
  const indegree: Record<string, number> = Object.fromEntries(nodes.map((n) => [n, 0]));
  for (const [, b] of edges) indegree[b]++;
  const queue = nodes.filter((n) => indegree[n] === 0);
  const order: string[] = [];
  const snap = (current: string | null, cycle: string[] = []): TopoState => ({ order: [...order], indegree: { ...indegree }, queue: [...queue], current, removed: [...order], cycle });
  const frames: Frame<TopoState>[] = [
    { state: snap(null), line: 3, message: `Count the arrows coming into each node. Nodes with none (${queue.join(", ") || "none"}) have nothing they wait on, so they are ready.`, stats: { ordered: 0 } },
  ];
  while (queue.length) {
    const v = queue.shift()!;
    order.push(v);
    const freed: string[] = [];
    for (const [a, b] of edges) {
      if (a !== v) continue;
      indegree[b]--;
      if (indegree[b] === 0) { queue.push(b); freed.push(b); }
    }
    frames.push({ state: snap(v), line: freed.length ? 10 : 7, message: `Take ${v} and put it next in the order. Remove its outgoing arrows.${freed.length ? ` That leaves ${freed.join(" and ")} with nothing to wait on.` : ""}`, stats: { ordered: order.length } });
  }
  const stuck = nodes.filter((n) => !order.includes(n));
  frames.push({
    state: snap(null, stuck),
    line: stuck.length ? 11 : 5,
    message: stuck.length ? `Nothing is ready, but ${stuck.join(", ")} remain, each waiting on another of them. Following those waits backwards must repeat a node, so there's a cycle and no valid order exists.` : `Done. ${order.join(" → ")} is a valid order: every node comes after everything it depends on.`,
    stats: { ordered: order.length },
  });
  return frames;
}

/** Positions for a complete binary tree with n nodes, in level order. */
export function completeTree(n: number, width = 520, levelGap = 56): { x: number; y: number; parent: number | null }[] {
  return Array.from({ length: n }, (_, i) => {
    const depth = Math.floor(Math.log2(i + 1));
    const first = 2 ** depth - 1;
    const slots = 2 ** depth;
    const x = ((i - first + 0.5) / slots) * width;
    return { x, y: 24 + depth * levelGap, parent: i === 0 ? null : Math.floor((i - 1) / 2) };
  });
}

export const treeHeight = (n: number) => (n <= 0 ? -1 : Math.floor(Math.log2(n)));

/* ==================================== probability ==================================== */

/** Chance that at least two of k people share a birthday among m equally likely days. */
export function birthdayCollision(k: number, m = 365): number {
  if (k > m) return 1;
  let none = 1;
  for (let i = 0; i < k; i++) none *= (m - i) / m;
  return 1 - none;
}

/** The smallest group with at least a 50% chance of a shared value. */
export function birthdayHalf(m = 365): number {
  let k = 1;
  while (birthdayCollision(k, m) < 0.5) k++;
  return k;
}

/** All outcomes of two six-sided dice, as [first, second]. */
export const TWO_DICE: [number, number][] = cartesian([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]);

/** A small deterministic generator so simulations replay the same way in tests. */
export function lcg(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
