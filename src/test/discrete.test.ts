import { describe, expect, it } from "vitest";
import {
  adjacency,
  assignments,
  binom,
  birthdayCollision,
  birthdayHalf,
  cartesian,
  classify,
  completeTree,
  degrees,
  disagreements,
  equivalenceClasses,
  equivalent,
  evalProp,
  exists,
  forAll,
  functionKind,
  inductionFrames,
  invariantFrames,
  isEquivalence,
  isPartialOrder,
  parseProp,
  parseSetExpr,
  pascalRows,
  permutations,
  pigeonFrames,
  powerSet,
  relationFrom,
  relationProps,
  showProp,
  subformulas,
  subsetsOfSize,
  topoFrames,
  transitiveClosure,
  treeHeight,
  TWO_DICE,
  vennRegions,
  isPrimeSmall,
  humanDuration,
} from "@/lib/discrete";

const P = parseProp;

describe("propositional logic", () => {
  it("parses with the usual precedence", () => {
    expect(showProp(P("p & q | r"))).toBe("p ∧ q ∨ r");
    expect(showProp(P("p & (q | r)"))).toBe("p ∧ (q ∨ r)");
    expect(showProp(P("!p -> q"))).toBe("¬p → q");
    expect(showProp(P("not (p and q)"))).toBe("¬(p ∧ q)");
    expect(showProp(P("p -> q -> r"))).toBe("p → q → r");
    expect(showProp(P("(p -> q) -> r"))).toBe("(p → q) → r");
    expect(showProp(P("p <-> q"))).toBe("p ↔ q");
    expect(showProp(P("P ∧ Q"))).toBe("p ∧ q");
  });

  it("rejects malformed input with a message", () => {
    expect(() => P("")).toThrow();
    expect(() => P("p &")).toThrow();
    expect(() => P("(p")).toThrow();
    expect(() => P("p q")).toThrow();
    expect(() => P("rain")).toThrow(/one-letter/);
  });

  it("evaluates implication by its truth table", () => {
    const imp = P("p -> q");
    expect(evalProp(imp, { p: true, q: true })).toBe(true);
    expect(evalProp(imp, { p: true, q: false })).toBe(false);
    expect(evalProp(imp, { p: false, q: true })).toBe(true);
    expect(evalProp(imp, { p: false, q: false })).toBe(true);
  });

  it("lists rows from all-true down to all-false", () => {
    expect(assignments(["p", "q"])).toEqual([
      { p: true, q: true },
      { p: true, q: false },
      { p: false, q: true },
      { p: false, q: false },
    ]);
  });

  it("classifies tautologies and contradictions", () => {
    expect(classify(P("p | !p"))).toBe("tautology");
    expect(classify(P("p & !p"))).toBe("contradiction");
    expect(classify(P("p -> q"))).toBe("contingency");
    expect(classify(P("((p -> q) & p) -> q"))).toBe("tautology");
  });

  it("checks the laws in the lessons", () => {
    expect(equivalent(P("!(p & q)"), P("!p | !q"))).toBe(true);
    expect(equivalent(P("!(p | q)"), P("!p & !q"))).toBe(true);
    expect(equivalent(P("p -> q"), P("!q -> !p"))).toBe(true);
    expect(equivalent(P("p -> q"), P("!p | q"))).toBe(true);
    expect(equivalent(P("p & (q | r)"), P("p & q | p & r"))).toBe(true);
    expect(equivalent(P("p -> q"), P("q -> p"))).toBe(false);
    expect(disagreements(P("p -> q"), P("q -> p"))).toEqual([
      { p: true, q: false },
      { p: false, q: true },
    ]);
  });

  it("lists subformulas innermost first", () => {
    expect(subformulas(P("!(p & q) <-> !p | !q")).map(showProp)).toEqual(["p ∧ q", "¬(p ∧ q)", "¬p", "¬q", "¬p ∨ ¬q", "¬(p ∧ q) ↔ ¬p ∨ ¬q"]);
  });
});

describe("quantifiers", () => {
  const d = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  it("finds counterexamples and witnesses", () => {
    expect(forAll(d, (x) => x > 0)).toEqual({ holds: true, witness: null });
    expect(forAll(d, (x) => x % 2 === 0)).toEqual({ holds: false, witness: 1 });
    expect(exists(d, isPrimeSmall)).toEqual({ holds: true, witness: 2 });
    expect(exists(d, (x) => x > 10)).toEqual({ holds: false, witness: null });
  });
  it("agrees that ¬∀ is ∃¬", () => {
    const p = (x: number) => x < 8;
    expect(!forAll(d, p).holds).toBe(exists(d, (x) => !p(x)).holds);
  });
});

describe("sets", () => {
  it("translates set notation into membership logic", () => {
    // rows: ab = 11, 10, 01, 00
    expect(vennRegions(parseSetExpr("A ∪ B"), ["a", "b"])).toEqual([true, true, true, false]);
    expect(vennRegions(parseSetExpr("A ∩ B"), ["a", "b"])).toEqual([true, false, false, false]);
    expect(vennRegions(parseSetExpr("A − B"), ["a", "b"])).toEqual([false, true, false, false]);
    expect(vennRegions(parseSetExpr("A Δ B"), ["a", "b"])).toEqual([false, true, true, false]);
    expect(vennRegions(parseSetExpr("A'"), ["a", "b"])).toEqual([false, false, true, true]);
    expect(vennRegions(parseSetExpr("(A ∪ B)'"), ["a", "b"])).toEqual(vennRegions(parseSetExpr("A' ∩ B'"), ["a", "b"]));
  });
  it("builds power sets and products of the right size", () => {
    expect(powerSet([1, 2, 3])).toHaveLength(8);
    expect(powerSet([])).toEqual([[]]);
    expect(cartesian(["a", "b"], [1, 2, 3])).toHaveLength(6);
  });
});

describe("functions", () => {
  it("names each kind", () => {
    expect(functionKind([0, 1, 2], 3)).toMatchObject({ injective: true, surjective: true, bijective: true });
    expect(functionKind([0, 0, 1], 3)).toMatchObject({ injective: false, surjective: false, collisions: [[0, 1]], missed: [2] });
    expect(functionKind([0, 1, 2], 4)).toMatchObject({ injective: true, surjective: false });
    expect(functionKind([0, 1, 1, 0], 2)).toMatchObject({ injective: false, surjective: true });
  });
});

describe("relations", () => {
  it("recognises congruence mod 3 as an equivalence", () => {
    const r = relationFrom(6, (a, b) => (a - b) % 3 === 0);
    const p = relationProps(r);
    expect(isEquivalence(p)).toBe(true);
    expect(equivalenceClasses(r)).toEqual([[0, 3], [1, 4], [2, 5]]);
  });
  it("recognises divisibility and ≤ as partial orders", () => {
    expect(isPartialOrder(relationProps(relationFrom(6, (a, b) => b % a === 0)))).toBe(true);
    expect(isPartialOrder(relationProps(relationFrom(4, (a, b) => a <= b)))).toBe(true);
    expect(relationProps(relationFrom(4, (a, b) => a < b)).reflexive).toBe(false);
  });
  it("explains a failure", () => {
    const r = relationFrom(3, (a, b) => b === a + 1);
    const p = relationProps(r);
    expect(p.transitive).toBe(false);
    expect(p.why.transitive).toEqual([0, 1, 2]);
    expect(relationProps(transitiveClosure(r)).transitive).toBe(true);
  });
});

describe("proof stepping", () => {
  it("climbs the staircase with both sides equal", () => {
    const f = inductionFrames(5);
    expect(f.every((x) => x.state.lhs === x.state.rhs)).toBe(true);
    expect(f.at(-1)!.state.lhs).toBe(15);
  });
  it("keeps the binary-search invariant at every step", () => {
    const a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
    for (const t of [23, 2, 91, 7, 100]) {
      const f = invariantFrames(a, t);
      expect(f.every((x) => x.state.invariant)).toBe(true);
      const last = f.at(-1)!.state;
      expect(last.found === null ? -1 : a[last.found]).toBe(a.includes(t) ? t : -1);
    }
  });
});

describe("counting", () => {
  it("computes binomials and permutations", () => {
    expect(binom(5, 2)).toBe(10);
    expect(binom(52, 5)).toBe(2598960);
    expect(binom(4, 7)).toBe(0);
    expect(permutations(5, 3)).toBe(60);
    expect(pascalRows(4).at(-1)).toEqual([1, 4, 6, 4, 1]);
    expect(subsetsOfSize(["a", "b", "c", "d"], 2)).toHaveLength(6);
  });
  it("forces a collision once keys outnumber buckets", () => {
    const f = pigeonFrames([3, 10, 17, 4, 8, 15], 5);
    expect(f.some((x) => x.state.clash !== null)).toBe(true);
    const noClash = pigeonFrames([0, 1, 2], 5);
    expect(noClash.every((x) => x.state.clash === null)).toBe(true);
  });
  it("prints durations", () => {
    expect(humanDuration(0.5)).toBe("under a second");
    expect(humanDuration(7200)).toBe("2 hours");
  });
});

describe("graphs", () => {
  const nodes = ["A", "B", "C", "D"].map((id, i) => ({ id, x: i * 10, y: 0 }));
  const edges: [string, string][] = [["A", "B"], ["A", "C"], ["B", "C"], ["C", "D"]];
  it("obeys the handshake lemma", () => {
    const d = degrees(nodes, edges);
    expect(Object.values(d).reduce((a, b) => a + b, 0)).toBe(2 * edges.length);
    expect(adjacency(nodes, edges, false).C).toEqual(["A", "B", "D"]);
    expect(adjacency(nodes, edges, true).C).toEqual(["D"]);
  });
  it("orders a DAG and reports a cycle", () => {
    const ok = topoFrames(["A", "B", "C", "D"], edges).at(-1)!.state;
    expect(ok.order).toEqual(["A", "B", "C", "D"]);
    expect(ok.cycle).toEqual([]);
    const bad = topoFrames(["A", "B", "C"], [["A", "B"], ["B", "C"], ["C", "B"]]).at(-1)!.state;
    expect(bad.cycle).toEqual(["B", "C"]);
  });
  it("lays out complete trees", () => {
    expect(treeHeight(1)).toBe(0);
    expect(treeHeight(7)).toBe(2);
    expect(treeHeight(8)).toBe(3);
    const t = completeTree(7);
    expect(t.filter((n) => n.parent !== null)).toHaveLength(6);
  });
});

describe("probability", () => {
  it("matches the known birthday numbers", () => {
    expect(birthdayHalf()).toBe(23);
    expect(birthdayCollision(23)).toBeCloseTo(0.5073, 4);
    expect(birthdayCollision(366)).toBe(1);
  });
  it("has 36 equally likely dice outcomes", () => {
    expect(TWO_DICE).toHaveLength(36);
    expect(TWO_DICE.filter(([a, b]) => a + b === 7)).toHaveLength(6);
  });
});
