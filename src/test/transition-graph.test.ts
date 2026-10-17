import { describe, expect, it } from "vitest";
import { allStrings, matcher, parseRe } from "@/lib/regular";
import { eliminationFrames, tgAccepts, tgToRe, type Tg } from "@/lib/transitionGraph";

const ab = ["a", "b"];

// Words ending in "bb", with a word-labelled edge.
const endsBb: Tg = {
  states: ["1", "2"],
  start: ["1"],
  final: ["2"],
  edges: [
    { from: "1", to: "1", label: "a" },
    { from: "1", to: "1", label: "b" },
    { from: "1", to: "2", label: "bb" },
  ],
};

// Two start states and a Λ-edge.
const twoStarts: Tg = {
  states: ["x", "y", "z"],
  start: ["x", "y"],
  final: ["z"],
  edges: [
    { from: "x", to: "z", label: "ab" },
    { from: "y", to: "y", label: "b" },
    { from: "y", to: "z", label: "Λ" },
    { from: "z", to: "z", label: "aa" },
  ],
};

function randomTg(seed: number): Tg {
  let s = seed;
  const rnd = (n: number) => ((s = (s * 1103515245 + 12345) % 2 ** 31), s % n);
  const states = ["p", "q", "r"].slice(0, 2 + rnd(2));
  const labels = ["a", "b", "ab", "ba", "Λ", "aa"];
  const edges = Array.from({ length: 3 + rnd(4) }, () => ({ from: states[rnd(states.length)], to: states[rnd(states.length)], label: labels[rnd(labels.length)] }));
  return { states, start: [states[0]], final: [states[states.length - 1]], edges };
}

describe("tgAccepts", () => {
  it("cuts the word along word-labelled edges", () => {
    expect(tgAccepts(endsBb, "abb")!.map((e) => e.label)).toEqual(["a", "bb"]);
    expect(tgAccepts(endsBb, "ab")).toBeNull();
  });

  it("starts from any start state and follows Λ-edges for free", () => {
    expect(tgAccepts(twoStarts, "")).not.toBeNull();
    expect(tgAccepts(twoStarts, "abaa")).not.toBeNull();
    expect(tgAccepts(twoStarts, "bbaa")).not.toBeNull();
    expect(tgAccepts(twoStarts, "ba")).toBeNull();
  });
});

describe("state elimination", () => {
  it("produces an expression for the same language as the TG", () => {
    for (const tg of [endsBb, twoStarts]) {
      const m = matcher(parseRe(tgToRe(tg)!));
      for (const w of allStrings(ab, 7)) expect(m(w)).toBe(tgAccepts(tg, w) !== null);
    }
  });

  it("agrees with the TG on 200 random graphs and any elimination order", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const tg = randomTg(seed);
      const order = seed % 2 ? [...tg.states].reverse() : tg.states;
      const re = tgToRe(tg, order);
      const m = re ? matcher(parseRe(re)) : () => false;
      for (const w of allStrings(ab, 6)) expect(m(w), `seed ${seed}, ${re}, "${w}"`).toBe(tgAccepts(tg, w) !== null);
    }
  });

  it("walks through the standard steps and ends with the answer", () => {
    const frames = eliminationFrames(endsBb);
    expect(frames[0].line).toBe(0);
    expect(frames.some((f) => f.line === 1)).toBe(true); // the two loops on 1 merge into a+b
    expect(frames.at(-1)!.line).toBe(4);
    expect(frames.at(-1)!.state.result).toBe("(a+b)*bb");
  });

  it("reports an empty language when no path reaches a final state", () => {
    expect(tgToRe({ states: ["1", "2"], start: ["1"], final: ["2"], edges: [{ from: "2", to: "1", label: "a" }] })).toBeNull();
  });
});
