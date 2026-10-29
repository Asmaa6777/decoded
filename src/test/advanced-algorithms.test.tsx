import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import { getCourse, flattenLessons } from "@/content/registry";
import { fibCalls, masterMethod, recursionLevels, powN } from "@/lib/advancedAlgorithms";
import { FibonacciCalls, RecurrenceExplorer } from "@/components/mdx/AdvancedVisualizers";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Advanced Algorithms & Analysis course", () => {
  const course = getCourse("advanced-algorithms")!;

  it("is registered and available", () => {
    expect(course).toBeDefined();
    expect(course.status).toBe("available");
  });

  for (const lesson of flattenLessons(getCourse("advanced-algorithms")!)) {
    it(`renders lesson "${lesson.slug}" without throwing`, () => {
      const Lesson = lesson.Component;
      const { container, unmount } = render(<Lesson />);
      expect(container.querySelector("h1")?.textContent).toBe(lesson.title);
      unmount();
    });
  }

  it("keeps people, institutions and slide footers out of the lessons", () => {
    const dir = path.resolve(__dirname, "../content/advanced-algorithms");
    const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    const all = files.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n").toLowerCase();
    expect(files.length).toBe(flattenLessons(course).length);
    for (const banned of [
      "cairo", "university", "faculty", "lecturer", "instructor", "basheer", "youssef", "kamal", "ramly",
      "leiserson", "demaine", "copyright", "©", "cs214", "fall 2026", "dr.", "prof.", "phd",
    ]) {
      expect(all, `found "${banned}"`).not.toContain(banned);
    }
  });
});

describe("analysis helpers", () => {
  it("counts naive Fibonacci calls like the lecture table", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(fibCalls)).toEqual([1, 1, 3, 5, 9, 15, 25]);
  });

  it("solves the lecture's master-method examples", () => {
    expect(masterMethod(2, 2, 1)).toMatchObject({ case: 2, answer: "Θ(n log n)" });
    expect(masterMethod(2, 2, 2)).toMatchObject({ case: 3, answer: "Θ(n²)" });
    expect(masterMethod(2, 2, 0.5)).toMatchObject({ case: 1, answer: "Θ(n)" });
    expect(masterMethod(3, 4, 1, 1)).toMatchObject({ case: 3, answer: "Θ(n log n)" });
    expect(masterMethod(2, 2, 1, 1).case).toBe("gap");
    expect(masterMethod(1, 2, 0)).toMatchObject({ case: 2, answer: "Θ(log n)" });
    expect(masterMethod(3, 2, 1)).toMatchObject({ case: 1, answer: "Θ(n^1.58)" });
  });

  it("builds recursion-tree levels whose cost ratio is a / b^k", () => {
    const lv = recursionLevels(3, 4, 2, 256);
    expect(lv).toHaveLength(5);
    expect(lv[1].nodes).toBe(3);
    expect(lv[2].cost).toBeCloseTo((3 / 16) ** 2);
    expect(powN(3)).toBe("n³");
  });

  it("renders the analysis widgets", () => {
    render(<FibonacciCalls initialN={6} />);
    expect(screen.getByText("25 calls")).toBeDefined();
    render(<RecurrenceExplorer />);
    expect(screen.getByText(/Case 2/)).toBeDefined();
  });
});
