import { describe, expect, it } from "vitest";
import { maturity } from "@/lib/maturity";
import { courses } from "@/content/registry";

describe("course maturity", () => {
  it("only reaches a level once every round it describes is finished", () => {
    expect([1, 2, 3, 5, 6, 7, 8, 9].map((r) => maturity(r).level)).toEqual([1, 1, 2, 2, 3, 3, 4, 5]);
  });

  it("treats a course with no rounds recorded as a first draft", () => {
    expect(maturity().label).toBe("First draft");
  });

  it("keeps every course's rounds a whole number from 1 to 9", () => {
    for (const c of courses) {
      if (c.rounds === undefined) continue;
      expect(Number.isInteger(c.rounds) && c.rounds >= 1 && c.rounds <= 9, c.slug).toBe(true);
    }
  });
});
