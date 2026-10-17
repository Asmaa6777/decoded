import { describe, expect, it } from "vitest";
import { derivationFrames, findDerivation, leftmostDerivation, leftmostDerivations, parseGrammar, parseTree, shortestStrings, showRule } from "@/lib/grammar";

const anbn = parseGrammar("S -> aSb | ε");
const balanced = parseGrammar("S -> (S)S | ε");
const astarb = parseGrammar("S → aS | b");

/** Applies each step's rule to the previous form and checks it yields the next. */
function replay(g: ReturnType<typeof parseGrammar>, target: string) {
  const steps = leftmostDerivation(g, target)!;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].form;
    const p = g.productions[steps[i].rule];
    const leftmost = [...prev].findIndex((c) => c >= "A" && c <= "Z");
    expect(steps[i].at).toBe(leftmost);
    expect(prev[leftmost]).toBe(p.lhs);
    expect(prev.slice(0, leftmost) + p.rhs + prev.slice(leftmost + 1)).toBe(steps[i].form);
  }
  return steps;
}

describe("parseGrammar", () => {
  it("reads alternatives, both arrow styles, and ε", () => {
    expect(anbn.start).toBe("S");
    expect(anbn.productions).toEqual([
      { lhs: "S", rhs: "aSb" },
      { lhs: "S", rhs: "" },
    ]);
    expect(astarb.productions.map(showRule)).toEqual(["S → aS", "S → b"]);
  });

  it("rejects rules it can't read", () => {
    expect(() => parseGrammar("s -> a")).toThrow(/Can't read rule/);
    expect(() => parseGrammar("   ")).toThrow(/no rules/);
  });
});

describe("leftmostDerivation", () => {
  it("derives a^n b^n with valid leftmost steps", () => {
    const steps = replay(anbn, "aaabbb");
    expect(steps.map((s) => s.form)).toEqual(["S", "aSb", "aaSbb", "aaaSbbb", "aaabbb"]);
  });

  it("derives the empty string", () => {
    expect(replay(anbn, "").map((s) => s.form)).toEqual(["S", ""]);
  });

  it("derives every balanced string up to length 8 and nothing unbalanced", () => {
    const strings = (n: number): string[] => (n === 0 ? [""] : strings(n - 1).flatMap((s) => [s + "(", s + ")"]));
    const isBalanced = (s: string) => {
      let d = 0;
      for (const c of s) if ((d += c === "(" ? 1 : -1) < 0) return false;
      return d === 0;
    };
    for (let n = 0; n <= 8; n++) {
      for (const s of strings(n)) {
        expect(leftmostDerivation(balanced, s) !== null).toBe(isBalanced(s));
        if (isBalanced(s)) replay(balanced, s);
      }
    }
  });

  it("returns null for strings outside the language", () => {
    expect(leftmostDerivation(anbn, "aab")).toBeNull();
    expect(leftmostDerivation(astarb, "ba")).toBeNull();
  });
});

describe("derivationFrames", () => {
  it("highlights the rule used at each step and ends done", () => {
    const frames = derivationFrames(anbn, "ab");
    expect(frames.map((f) => f.line)).toEqual([-1, 0, 1]);
    expect(frames[1].state.inserted).toEqual([0, 3]);
    expect(frames.at(-1)!.state.done).toBe(true);
    expect(frames.at(-1)!.message).toMatch(/is in the language/);
  });

  it("explains a failed search in one frame", () => {
    const frames = derivationFrames(anbn, "ba");
    expect(frames).toHaveLength(1);
    expect(frames[0].state.failed).toBe(true);
  });
});

describe("shortestStrings", () => {
  it("lists a language's first members in length order", () => {
    expect(shortestStrings(anbn, 4)).toEqual(["", "ab", "aabb", "aaabbb"]);
    expect(shortestStrings(astarb, 3)).toEqual(["b", "ab", "aab"]);
  });
});

describe("rightmost derivations, parse trees and ambiguity", () => {
  // Exercise sheet: S → AbA | BaB, A → aA | a, B → bB | b, word "aaaabaaa"
  const sheet = parseGrammar("S -> AbA | BaB\nA -> aA | a\nB -> bB | b");
  const expr = parseGrammar("E -> E+E | E*E | (E) | a");

  const yieldOf = (t: ReturnType<typeof parseTree>): string =>
    t.children.length === 0 ? (t.label === "ε" ? "" : t.label) : t.children.map(yieldOf).join("");

  it("finds a rightmost derivation that always replaces the last variable", () => {
    const steps = findDerivation(sheet, "aaaabaaa", "rightmost")!;
    expect(steps.at(-1)!.form).toBe("aaaabaaa");
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1].form;
      const last = Math.max(...[...prev].map((c, j) => (c >= "A" && c <= "Z" ? j : -1)));
      expect(steps[i].at).toBe(last);
    }
    expect(steps[1].form).toBe("AbA");
    expect(steps[2].form).toMatch(/^AbaA$/);
  });

  it("builds a parse tree whose leaves spell the word", () => {
    const steps = findDerivation(sheet, "aaaabaaa", "leftmost")!;
    const tree = parseTree(sheet, steps);
    expect(tree.label).toBe("S");
    expect(yieldOf(tree)).toBe("aaaabaaa");
    expect(yieldOf(parseTree(anbn, findDerivation(anbn, "ab")!))).toBe("ab");
  });

  it("finds two parse trees for a+a*a, so the expression grammar is ambiguous", () => {
    const two = leftmostDerivations(expr, "a+a*a", 2);
    expect(two).toHaveLength(2);
    const [t1, t2] = two.map((d) => parseTree(expr, d));
    expect(JSON.stringify(t1)).not.toBe(JSON.stringify(t2));
    expect(two.map((d) => d[1].form).sort()).toEqual(["E*E", "E+E"]);
    for (const t of [t1, t2]) expect(yieldOf(t)).toBe("a+a*a");
  });

  it("finds only one parse tree for an unambiguous grammar", () => {
    expect(leftmostDerivations(anbn, "aaabbb", 2)).toHaveLength(1);
    expect(leftmostDerivations(expr, "a+a", 2)).toHaveLength(1);
  });
});
