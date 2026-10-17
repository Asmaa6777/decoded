import { describe, expect, it } from "vitest";
import { pdaFrames, runPda, type Pda } from "@/lib/pda";
import { allStrings } from "@/lib/regular";

const ab = ["a", "b"];

// a^n b^n, deterministic, in the textbook's flowchart style.
const anbn: Pda = {
  nodes: [
    { id: "start", kind: "start" },
    { id: "read1", kind: "read" },
    { id: "pushA", kind: "push", push: "a" },
    { id: "pop1", kind: "pop" },
    { id: "read2", kind: "read" },
    { id: "pop2", kind: "pop" },
    { id: "accept", kind: "accept" },
  ],
  edges: [
    { from: "start", to: "read1" },
    { from: "read1", to: "pushA", label: "a" },
    { from: "pushA", to: "read1" },
    { from: "read1", to: "pop1", label: "b" },
    { from: "read1", to: "pop2", label: "Δ" },
    { from: "pop1", to: "read2", label: "a" },
    { from: "read2", to: "pop1", label: "b" },
    { from: "read2", to: "pop2", label: "Δ" },
    { from: "pop2", to: "accept", label: "Δ" },
  ],
};

// Even-length palindromes: nondeterministically guess where the middle is.
const evenPal: Pda = {
  nodes: [
    { id: "start", kind: "start" },
    { id: "read1", kind: "read" },
    { id: "pushA", kind: "push", push: "a" },
    { id: "pushB", kind: "push", push: "b" },
    { id: "popA", kind: "pop" },
    { id: "popB", kind: "pop" },
    { id: "read2", kind: "read" },
    { id: "popEnd", kind: "pop" },
    { id: "accept", kind: "accept" },
  ],
  edges: [
    { from: "start", to: "read1" },
    { from: "read1", to: "pushA", label: "a" },
    { from: "read1", to: "pushB", label: "b" },
    { from: "pushA", to: "read1" },
    { from: "pushB", to: "read1" },
    { from: "read1", to: "popA", label: "a" },
    { from: "read1", to: "popB", label: "b" },
    { from: "read1", to: "popEnd", label: "Δ" },
    { from: "popA", to: "read2", label: "a" },
    { from: "popB", to: "read2", label: "b" },
    { from: "read2", to: "popA", label: "a" },
    { from: "read2", to: "popB", label: "b" },
    { from: "read2", to: "popEnd", label: "Δ" },
    { from: "popEnd", to: "accept", label: "Δ" },
  ],
};

describe("runPda", () => {
  it("accepts exactly a^n b^n", () => {
    for (const w of allStrings(ab, 8)) expect(runPda(anbn, w) !== null, w).toBe(/^(a*)(b*)$/.test(w) && w.split("a").length - 1 === w.split("b").length - 1);
  });

  it("accepts exactly the even palindromes, nondeterministically", () => {
    for (const w of allStrings(ab, 8)) expect(runPda(evenPal, w) !== null, w).toBe(w.length % 2 === 0 && w === [...w].reverse().join(""));
  });

  it("records a run that ends on ACCEPT with an empty stack", () => {
    const run = runPda(anbn, "aabb")!;
    expect(run[0].did).toBe("start");
    expect(run.at(-1)!.node).toBe("accept");
    expect(run.map((c) => c.stack.join(""))).toContain("aa");
    expect(run.at(-1)!.stack).toEqual([]);
  });
});

describe("pdaFrames", () => {
  it("captions each move and explains a rejection", () => {
    const frames = pdaFrames(anbn, "ab");
    expect(frames.some((f) => f.message.startsWith("PUSH puts a"))).toBe(true);
    expect(frames.at(-1)!.state.accepted).toBe(true);
    const no = pdaFrames(anbn, "aab");
    expect(no).toHaveLength(1);
    expect(no[0].state.accepted).toBe(false);
  });
});
