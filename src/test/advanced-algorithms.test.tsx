import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import { getCourse, flattenLessons } from "@/content/registry";
import { fibCalls, masterMethod, recursionLevels, powN, firstViolation, termShares, bitOp, isPowerOfTwo, popcountFrames, toBits, fastPowerFrames, minMaxFrames, strassen, fibByMatrix, gaussFrames, unevenLevels, fracLabel, quicksortFrames, decisionPath, minComparisons, countingSortFrames, radixSortFrames, selectFrames, medianOfMedians, hashFrames, hashMultiplication, hashFolding, hashMidSquare, doublingCosts, DELETED, type HashConfig } from "@/lib/advancedAlgorithms";
import { FibonacciCalls, RecurrenceExplorer, TermContribution, BigOWitness } from "@/components/mdx/AdvancedVisualizers";

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
      const bad = [...container.querySelectorAll(".katex-error")].map((e) => e.getAttribute("title") ?? e.textContent);
      expect(bad, "math that KaTeX could not render").toEqual([]);
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
      "leiserson", "demaine", "luebke", "copyright", "©", "cs214", "fall 2026", "dr.", "prof.", "phd",
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

  it("checks Big-O witnesses the way the slides prove them", () => {
    const f = (n: number) => 3 * n * n + 20;
    const g = (n: number) => n * n;
    expect(firstViolation(f, g, 4, 5, "O")).toBeNull();
    expect(firstViolation(f, g, 4, 1, "O")).toBe(1);
    expect(firstViolation((n) => n * n, (n) => n, 1, 1, "Ω")).toBeNull();
    expect(termShares([300, 80, 10]).map((x) => +(x * 100).toFixed(2))).toEqual([76.92, 20.51, 2.56]);
  });

  it("does the lab's bit tricks", () => {
    expect([bitOp("and", 5, 3), bitOp("or", 5, 3), bitOp("xor", 5, 3)]).toEqual([1, 7, 6]);
    expect(toBits(bitOp("rotr", 0b101001, 2, 6), 6)).toBe("011010");
    expect(toBits(bitOp("rotl", 0b101001, 2, 6), 6)).toBe("100110");
    expect(bitOp("not", 5, 0, 3)).toBe(2);
    expect([1, 2, 4, 64].every(isPowerOfTwo)).toBe(true);
    expect([0, 6, 12].some(isPowerOfTwo)).toBe(false);
    expect(popcountFrames(13).at(-1)!.state.count).toBe(3);
    expect(popcountFrames(0).at(-1)!.state.count).toBe(0);
  });

  it("fast power gets the right answer in about log b multiplications", () => {
    const last = fastPowerFrames(3, 13).at(-1)!;
    expect(last.state.calls[0].result).toBe(1594323n);
    expect(last.stats.multiplications).toBe(5); // 13 → 6 → 3 → 1: three squarings, two odd steps
    expect(fastPowerFrames(2, 1).at(-1)!.state.calls[0].result).toBe(2n);
  });

  it("finds min and max in 1.5n - 2 comparisons", () => {
    const last = minMaxFrames([11, 3, 5, 7, 1, 9, 5, 2, 0, 8, 10, 13, 21, 5, 4, 1]).at(-1)!;
    expect([last.state.min, last.state.max]).toEqual([0, 21]);
    expect(last.stats.comparisons).toBe(22);
  });

  it("Strassen's 7 products match the usual 8", () => {
    for (const m of [[1, 3, 7, 5, 6, 8, 4, 2], [2, -1, 0, 4, -3, 5, 7, 1]]) {
      const r = strassen(...(m as [number, number, number, number, number, number, number, number]));
      expect({ r: r.r, s: r.s, t: r.t, u: r.u }).toEqual(r.standard);
    }
  });

  it("computes Fibonacci exactly by matrix squaring", () => {
    expect(fibByMatrix(13).result[0][1]).toBe(233n);
    expect(fibByMatrix(100).result[0][1]).toBe(354224848179261915075n);
    expect(fibByMatrix(1).result[0][1]).toBe(1n);
  });

  it("multiplies with Gauss's trick and builds uneven recursion trees", () => {
    const last = gaussFrames(1234n, 5678n).at(-1)!;
    expect(last.state.calls[0].result).toBe(7006652n);
    expect(gaussFrames(99999999n, 99999999n).at(-1)!.state.calls[0].result).toBe(99999999n * 99999999n);
    const lv = unevenLevels([[1, 3], [2, 3]], 1, 2);
    expect(lv.map((l) => l.cost)).toEqual([1, 1, 1]);
    expect(lv[2].sizes.map(fracLabel)).toEqual(["n/9", "2n/9", "2n/9", "4n/9"]);
    expect(unevenLevels([[1, 4], [1, 2]], 2, 1)[1].cost).toBeCloseTo(5 / 16);
  });

  it("quicksort partitions like the lecture and randomization flattens the worst case", () => {
    const ex = quicksortFrames([6, 10, 13, 5, 8, 3, 2, 11]);
    expect(ex.at(-1)!.state.array).toEqual([2, 3, 5, 6, 8, 10, 11, 13]);
    // the first PARTITION around 6 leaves 2 5 3 | 6 | 8 13 10 11, as on the slide
    const firstDone = ex.find((f) => f.line === 8)!;
    expect(firstDone.state.array).toEqual([2, 5, 3, 6, 8, 13, 10, 11]);
    const sorted = Array.from({ length: 30 }, (_, i) => i);
    const worst = quicksortFrames(sorted).at(-1)!;
    const rand = quicksortFrames(sorted, true).at(-1)!;
    expect(worst.stats.comparisons).toBe((30 * 29) / 2);
    expect(rand.state.array).toEqual(sorted);
    expect(rand.stats["max depth"]).toBeLessThan(worst.stats["max depth"]);
  });

  it("decision tree, counting sort and radix sort follow the lecture", () => {
    expect(decisionPath([9, 4, 6])).toEqual(["r", "R", "Rr", "Rrl"]); // leaf ⟨2,3,1⟩
    for (const p of [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]] as [number, number, number][]) {
      expect(decisionPath(p).length).toBeLessThanOrEqual(4);
    }
    expect([minComparisons(3), minComparisons(10)]).toEqual([3, 22]);
    const cs = countingSortFrames([4, 1, 3, 4, 3], 4);
    expect(cs.at(-1)!.state.B).toEqual([1, 3, 3, 4, 4]);
    expect(cs.find((f) => f.state.loop === 3 && f.state.cAt === 3)!.state.C).toEqual([1, 1, 3, 5]);
    const rs = radixSortFrames([329, 457, 657, 839, 436, 720, 355]);
    expect(rs[1].state.rows).toEqual([720, 355, 436, 457, 657, 329, 839]);
    expect(rs.at(-1)!.state.rows).toEqual([329, 355, 436, 457, 657, 720, 839]);
  });

  it("selects every rank correctly, and the median of medians splits well", () => {
    const a = [6, 10, 13, 5, 8, 3, 2, 11];
    const sorted = [...a].sort((x, y) => x - y);
    for (let i = 1; i <= a.length; i++) {
      for (const r of [false, true]) {
        const last = selectFrames(a, i, r).at(-1)!;
        expect(last.state.array[last.state.found!]).toBe(sorted[i - 1]);
      }
    }
    const nums = Array.from({ length: 35 }, (_, i) => (i * 17) % 101);
    const { x, guaranteedEach } = medianOfMedians(nums);
    expect(nums.filter((v) => v <= x).length).toBeGreaterThanOrEqual(guaranteedEach);
    expect(nums.filter((v) => v >= x).length).toBeGreaterThanOrEqual(guaranteedEach);
  });

  it("hash tables reproduce the lecture and lab examples", () => {
    const keys = [10, 22, 31, 4, 15, 28, 17, 88, 59].map((key) => ({ op: "insert" as const, key }));
    const final = (cfg: HashConfig, ops = keys, init?: Record<number, number>) => hashFrames(cfg, ops, init).at(-1)!.state.slots;
    expect(final({ m: 11, mode: "linear" })).toEqual([22, 88, null, null, 4, 15, 28, 17, 59, 31, 10]);
    expect(final({ m: 11, mode: "quadratic", c1: 1, c2: 3 })).toEqual([22, null, 88, 17, 4, null, 28, 59, 15, 31, 10]);
    expect(final({ m: 11, mode: "double", second: { kind: "mod", mp: 10 } })).toEqual([22, null, 59, 17, 4, 15, 28, 88, null, 31, 10]);
    // lab 5.1 example 2 and its task
    const t = final({ m: 13, mode: "double", second: { kind: "mod", mp: 11 } }, [14, 22, 27].map((key) => ({ op: "insert", key })), { 1: 79, 4: 69, 5: 98, 7: 72, 11: 50 });
    expect([t[9], t[10], t[0]]).toEqual([14, 22, 27]);
    // lecture: deleting 18 leaves a marker, so 62 is still found and 51 reuses the slot
    const lin = hashFrames({ m: 11, mode: "linear" }, [
      ...[7, 36, 18, 62].map((key) => ({ op: "insert" as const, key })),
      { op: "delete", key: 18 }, { op: "search", key: 62 },
    ]);
    expect(lin.at(-2)!.state.hit).toBe(9);
    expect(lin.at(-1)!.state.slots[8]).toBe(DELETED);
    // quadratic with mod 10 gets stuck on 62
    const stuck = hashFrames({ m: 10, mode: "quadratic" }, [2, 12, 22, 32, 42, 52, 62].map((key) => ({ op: "insert", key })));
    expect(stuck.some((f) => /Unable to insert 62/.test(f.message))).toBe(true);
    const dbl = final({ m: 10, mode: "double", second: { kind: "prime", R: 7 } }, [37, 90, 45, 22, 17, 49, 55].map((key) => ({ op: "insert", key })));
    expect([dbl[1], dbl[6]]).toEqual([17, 55]);
  });

  it("hash functions and doubling costs match the slides", () => {
    expect([hashMultiplication(123, 100), hashMultiplication(150, 100)]).toEqual([1, 70]);
    const f = hashFolding(12345678, 2);
    expect([f.shiftHash, f.boundaryHash]).toEqual([80, 98]);
    expect(hashMidSquare(1234, 2).digits).toBe("22"); // 1522756
    const c = doublingCosts(10).map((x) => x.cost);
    expect(c).toEqual([1, 2, 3, 1, 5, 1, 1, 1, 9, 1]);
    for (const n of [1, 5, 17, 64, 1000]) expect(doublingCosts(n).reduce((t, x) => t + x.cost, 0)).toBeLessThanOrEqual(3 * n);
  });

  it("renders the analysis widgets", () => {
    render(<TermContribution initialN={100} />);
    expect(screen.getByText("97.37%")).toBeDefined();
    render(<BigOWitness />);
    expect(screen.getByText(/It holds/)).toBeDefined();
    render(<FibonacciCalls initialN={6} />);
    expect(screen.getByText("25 calls")).toBeDefined();
    render(<RecurrenceExplorer />);
    expect(screen.getByText(/Case 2/)).toBeDefined();
  });
});
