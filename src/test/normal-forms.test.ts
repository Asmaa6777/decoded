import { describe, expect, it } from "vitest";
import { findDerivation, parseGrammar } from "@/lib/grammar";
import { cnfFrames, cyk, fromGrammar, isCnf, isGnf, nullable, removeNull, removeUnits, showRule, toCnf } from "@/lib/normalForms";
import { allStrings } from "@/lib/regular";

const cfg = (text: string) => fromGrammar(parseGrammar(text));
const rules = (g: ReturnType<typeof cfg>) => g.rules.map(showRule).sort();

describe("simplification (Lecture 7 examples)", () => {
  it("removes Λ-productions: S → aMb, M → aMb | Λ", () => {
    const g = cfg("S -> aMb\nM -> aMb | ε");
    expect([...nullable(g)]).toEqual(["M"]);
    expect(rules(removeNull(g))).toEqual(["M → ab", "M → aMb", "S → ab", "S → aMb"].sort());
  });

  it("removes unit productions: S → aA, A → a | B, B → A | bb", () => {
    const g = removeUnits(cfg("S -> aA\nA -> a | B\nB -> A | bb"));
    expect(rules(g)).toEqual(["A → a", "A → bb", "B → a", "B → bb", "S → aA"].sort());
  });
});

describe("Chomsky Normal Form", () => {
  it("converts the lecture's example exactly as the slides do", () => {
    const g = toCnf(cfg("S -> ABa\nA -> aab\nB -> Ac"));
    expect(rules(g)).toEqual(["S → AV₁", "V₁ → BT₁", "A → T₁V₂", "V₂ → T₁T₂", "B → AT₃", "T₁ → a", "T₂ → b", "T₃ → c"].sort());
    expect(isCnf(g)).toBe(true);
  });

  it("keeps the language (minus Λ) for a range of grammars, checked with CYK", () => {
    const grammars = [
      "S -> aSb | ε",
      "S -> (S)S | ε",
      "S -> aSa | bSb | a | b | ε",
      "S -> AbA | BaB\nA -> aA | a\nB -> bB | b",
      "S -> XaXaX\nX -> aX | bX | ε",
      "E -> E+E | E*E | (E) | a",
      "S -> aA\nA -> a | B\nB -> A | bb",
    ];
    for (const text of grammars) {
      const g = parseGrammar(text);
      const c = toCnf(fromGrammar(g));
      expect(isCnf(c), text).toBe(true);
      const terminals = [...new Set(g.productions.flatMap((p) => [...p.rhs].filter((ch) => !(ch >= "A" && ch <= "Z"))))];
      for (const w of allStrings(terminals, terminals.length > 3 ? 4 : 6)) {
        if (w === "") continue;
        expect(cyk(c, w), `${text} / "${w}"`).toBe(findDerivation(g, w) !== null);
      }
    }
  });

  it("notes when Λ is lost and ends with a CNF frame", () => {
    const frames = cnfFrames(cfg("S -> aSb | ε"));
    expect(frames.some((f) => f.state.note?.includes("Λ"))).toBe(true);
    expect(frames.at(-1)!.message).toMatch(/Chomsky Normal Form/);
  });
});

describe("Greibach Normal Form", () => {
  it("recognizes the lecture's examples", () => {
    expect(isGnf(cfg("S -> cAB\nA -> aA | bB | b\nB -> b"))).toBe(true);
    expect(isGnf(cfg("S -> abSb | aa"))).toBe(false);
  });
});
