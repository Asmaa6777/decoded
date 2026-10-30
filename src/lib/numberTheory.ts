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

/* ------------------------------- primes ------------------------------- */

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** Prime factors with their powers, smallest first. */
export function factorize(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let d = 2; d * d <= n; d++) {
    let e = 0;
    while (n % d === 0) {
      n /= d;
      e++;
    }
    if (e) out.push([d, e]);
  }
  if (n > 1) out.push([n, 1]);
  return out;
}

export const phi = (n: number) => factorize(n).reduce((acc, [p]) => (acc / p) * (p - 1), n);

export type SieveState = { n: number; crossed: Record<number, number>; prime: number | null; done: boolean };

export const MATLAB_SIEVE = ["isP = true(1, n);  isP(1) = false;", "for p = 2:floor(sqrt(n))", "  if isP(p)", "    isP(p*p:p:n) = false;", "  end", "end", "primes = find(isP)"];

export function sieveFrames(n: number): Frame<SieveState>[] {
  const crossed: Record<number, number> = {};
  const limit = Math.floor(Math.sqrt(n));
  const frames: Frame<SieveState>[] = [{ state: { n, crossed: {}, prime: null, done: false }, line: 0, message: `List the integers from 2 to ${n}. Since √${n} is about ${Number(Math.sqrt(n).toFixed(2))}, only primes up to ${limit} need to strike anything.`, stats: { struck: 0 } }];
  let struck = 0;
  for (let p = 2; p <= limit; p++) {
    if (crossed[p]) continue;
    const before = struck;
    for (let m = p * p; m <= n; m += p) {
      if (!crossed[m]) {
        crossed[m] = p;
        struck++;
      }
    }
    frames.push({ state: { n, crossed: { ...crossed }, prime: p, done: false }, line: 3, message: `${p} survived, so it's prime. Strike its multiples from ${p * p} on, since smaller ones are already gone: ${struck - before} new numbers struck.`, stats: { struck } });
  }
  const count = n - 1 - struck;
  frames.push({ state: { n, crossed: { ...crossed }, prime: null, done: true }, line: 6, message: `The next survivor is larger than √${n}, so we can stop. Everything left is prime: ${count} primes up to ${n}.`, stats: { struck, primes: count } });
  return frames;
}

/* ------------------------------- Wilson -------------------------------- */

export function inverseMod(a: number, n: number): number | null {
  for (let x = 1; x < n; x++) if ((a * x) % n === 1) return x;
  return null;
}

export type WilsonState = { p: number; pairs: [number, number][]; active: [number, number] | null; product: number };

export const MATLAB_WILSON = ["p = 13;", "mod(factorial(p - 1), p) - p    % returns -1 when p is prime"];

export function wilsonFrames(p: number): Frame<WilsonState>[] {
  const pairs: [number, number][] = [];
  const seen = new Set([1, p - 1]);
  const frames: Frame<WilsonState>[] = [{ state: { p, pairs: [], active: null, product: 1 }, line: 1, message: `Write out (${p} - 1)! = 1 × 2 × … × ${p - 1}. Every number here has an inverse modulo ${p}, and we can pair them up.`, stats: {} }];
  for (let a = 2; a < p - 1; a++) {
    if (seen.has(a)) continue;
    const b = inverseMod(a, p)!;
    seen.add(a);
    seen.add(b);
    pairs.push([a, b]);
    frames.push({ state: { p, pairs: [...pairs], active: [a, b], product: 1 }, line: 1, message: `${a} × ${b} = ${a * b} ≡ 1 (mod ${p}). This pair cancels to 1.`, stats: {} });
  }
  frames.push({ state: { p, pairs: [...pairs], active: null, product: p - 1 }, line: 1, message: `Only 1 and ${p - 1} are their own inverses, so they stay single. The product is 1 × ${p - 1} ≡ -1 (mod ${p}).`, stats: {} });
  return frames;
}
