import { describe, expect, it } from "vitest";
import { allStrings, firstDifference, firstWords, parseRe, ReError, showRe, wordsUpTo } from "@/lib/regular";

const ab = ["a", "b"];

describe("parseRe", () => {
  it("treats + as union and binds * tighter than concatenation", () => {
    expect(showRe(parseRe("(a + b)* abb"))).toBe("(a+b)*abb");
    expect(showRe(parseRe("ab*"))).toBe("ab*");
    expect(showRe(parseRe("(ab)*"))).toBe("(ab)*");
    expect(showRe(parseRe("a+bc"))).toBe("a+bc");
  });

  it("accepts ε, λ and Λ for the empty string", () => {
    for (const e of ["ε", "λ", "Λ"]) expect([...wordsUpTo(parseRe(`a+${e}`), 3)].sort()).toEqual(["", "a"]);
  });

  it("explains bad input", () => {
    expect(() => parseRe("")).toThrow(ReError);
    expect(() => parseRe("(ab")).toThrow(/never closed/);
    expect(() => parseRe("ab)")).toThrow(/never opened/);
    expect(() => parseRe("a+")).toThrow(/ends too early/);
    expect(() => parseRe("a+*b")).toThrow(/Unexpected "\*"/);
  });
});

describe("firstWords", () => {
  it("lists words shortest first, then alphabetically", () => {
    expect(firstWords(parseRe("ab*ab*a"), 5)).toEqual(["aaa", "aaba", "abaa", "aabba", "ababa"]);
    expect(firstWords(parseRe("a*+b*"), 7)).toEqual(["", "a", "b", "aa", "bb", "aaa", "bbb"]);
  });

  it("matches a brute-force check of (ab+ba)*aa", () => {
    const re = parseRe("(ab+ba)*aa");
    const js = /^(?:ab|ba)*aa$/;
    const brute = allStrings(ab, 8).filter((w) => js.test(w));
    expect(firstWords(re, brute.length, 8)).toEqual(brute);
  });

  it("stops at the length limit for finite languages", () => {
    expect(firstWords(parseRe("a+b"), 10)).toEqual(["a", "b"]);
  });
});

describe("firstDifference", () => {
  it("returns null for equivalent expressions", () => {
    expect(firstDifference(parseRe("(a+b)*"), parseRe("(a*b*)*"), ab)).toBeNull();
    expect(firstDifference(parseRe("b*ab*ab*"), parseRe("b*ab*ab*"), ab)).toBeNull();
  });

  it("finds the shortest counterexample and which side has it", () => {
    // "exactly two a's": dropping the trailing b* loses every word that ends in b
    expect(firstDifference(parseRe("b*ab*a"), parseRe("b*ab*ab*"), ab)).toEqual({ word: "aab", inAnswer: false });
    expect(firstDifference(parseRe("(a+b)*"), parseRe("(a+b)*bbb"), ab)).toEqual({ word: "", inAnswer: true });
  });
});
