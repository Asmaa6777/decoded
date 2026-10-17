import { describe, expect, it } from "vitest";
import { cfgToPda } from "@/lib/cfgPda";
import { findDerivation, parseGrammar } from "@/lib/grammar";
import { runPda } from "@/lib/pda";
import { allStrings } from "@/lib/regular";

describe("CFG to PDA", () => {
  const grammars = [
    "S -> aSb | ε",
    "S -> (S)S | ε",
    "S -> aSa | bSb | a | b | ε",
    "S -> AbA | BaB\nA -> aA | a\nB -> bB | b",
    "S -> ABa\nA -> aab\nB -> Ac",
    "E -> E+T | T\nT -> T*F | F\nF -> (E) | a",
  ];

  for (const text of grammars) {
    it(`accepts exactly the grammar's words: ${text.replace(/\n/g, "; ")}`, () => {
      const g = parseGrammar(text);
      const { pda } = cfgToPda(g);
      const terminals = [...new Set(g.productions.flatMap((p) => [...p.rhs].filter((c) => !(c >= "A" && c <= "Z"))))];
      for (const w of allStrings(terminals, terminals.length > 3 ? 3 : 6)) {
        expect(runPda(pda, w) !== null, `"${w}"`).toBe(findDerivation(g, w) !== null);
      }
    });
  }

  it("pops one variable per rule of a CNF derivation: 2n - 1 for a word of length n", () => {
    const { pda } = cfgToPda(parseGrammar("S -> aSb | ε"));
    for (const w of ["ab", "aabb", "aaabbb"]) {
      const run = runPda(pda, w)!;
      const variablePops = run.filter((c) => c.did.startsWith("pop ") && c.did !== "pop Δ").length;
      expect(variablePops, w).toBe(2 * w.length - 1);
      expect(run.at(-1)!.stack).toEqual([]);
    }
  });

  it("lays out every node", () => {
    const { pda, layout } = cfgToPda(parseGrammar("S -> AbA | BaB\nA -> aA | a\nB -> bB | b"));
    const placed = new Set(layout.map((n) => n.id));
    for (const n of pda.nodes) expect(placed.has(n.id), n.id).toBe(true);
  });
});
