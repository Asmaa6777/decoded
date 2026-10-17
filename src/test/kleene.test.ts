import { describe, expect, it } from "vitest";
import { allStrings } from "@/lib/regular";
import { kleeneBuild, runDfa, type Dfa } from "@/lib/kleene";

const ab = ["a", "b"];

// r1 = (a+b)*a : words ending in a
const endsA: Dfa = {
  states: ["x1", "x2"],
  alphabet: ab,
  start: "x1",
  finals: ["x2"],
  delta: { x1: { a: "x2", b: "x1" }, x2: { a: "x2", b: "x1" } },
};

// r2 = ((a+b)(a+b))* : words of even length
const evenLen: Dfa = {
  states: ["y1", "y2"],
  alphabet: ab,
  start: "y1",
  finals: ["y1"],
  delta: { y1: { a: "y2", b: "y2" }, y2: { a: "y1", b: "y1" } },
};

function randomDfa(seed: number, prefix: string): Dfa {
  let s = seed;
  const rnd = (n: number) => ((s = (s * 1103515245 + 12345) % 2 ** 31), s % n);
  const n = 1 + rnd(3);
  const states = Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
  const delta = Object.fromEntries(states.map((q) => [q, { a: states[rnd(n)], b: states[rnd(n)] }]));
  const finals = states.filter(() => rnd(2) === 1);
  return { states, alphabet: ab, start: states[0], finals, delta };
}

const inConcat = (A: Dfa, B: Dfa, w: string) => [...Array(w.length + 1).keys()].some((i) => runDfa(A, w.slice(0, i)) && runDfa(B, w.slice(i)));

function inStar(A: Dfa, w: string): boolean {
  const ok = [true];
  for (let j = 1; j <= w.length; j++) ok[j] = [...Array(j).keys()].some((i) => ok[i] && runDfa(A, w.slice(i, j)));
  return ok[w.length];
}

describe("Kleene constructions", () => {
  it("builds the union, concatenation and star of the lesson's machines", () => {
    const words = allStrings(ab, 7);
    const u = kleeneBuild("union", endsA, evenLen).dfa;
    const c = kleeneBuild("concat", endsA, evenLen).dfa;
    const s = kleeneBuild("star", endsA).dfa;
    for (const w of words) {
      expect(runDfa(u, w)).toBe(runDfa(endsA, w) || runDfa(evenLen, w));
      expect(runDfa(c, w)).toBe(inConcat(endsA, evenLen, w));
      expect(runDfa(s, w)).toBe(inStar(endsA, w));
    }
  });

  it("agrees with brute force on 150 random pairs of machines", () => {
    const words = allStrings(ab, 6);
    for (let seed = 1; seed <= 150; seed++) {
      const A = randomDfa(seed, "x");
      const B = randomDfa(seed * 7 + 3, "y");
      const u = kleeneBuild("union", A, B).dfa;
      const c = kleeneBuild("concat", A, B).dfa;
      const s = kleeneBuild("star", A).dfa;
      for (const w of words) {
        expect(runDfa(u, w), `union seed ${seed} "${w}"`).toBe(runDfa(A, w) || runDfa(B, w));
        expect(runDfa(c, w), `concat seed ${seed} "${w}"`).toBe(inConcat(A, B, w));
        expect(runDfa(s, w), `star seed ${seed} "${w}"`).toBe(inStar(A, w));
      }
    }
  });

  it("produces complete machines and steps that end done", () => {
    const { dfa, frames } = kleeneBuild("union", endsA, evenLen);
    for (const q of dfa.states) for (const c of ab) expect(dfa.delta[q][c]).toBeDefined();
    expect(dfa.states.length).toBe(4);
    expect(frames.at(-1)!.state.done).toBe(true);
    expect(frames[0].state.rows[0]).toMatchObject({ name: "z1", meaning: "x1 or y1", final: true });
  });

  it("makes the star's new start state final, so Λ is accepted", () => {
    const s = kleeneBuild("star", endsA).dfa;
    expect(runDfa(s, "")).toBe(true);
    expect(runDfa(s, "b")).toBe(false);
    expect(runDfa(s, "ba")).toBe(true);
  });
});
