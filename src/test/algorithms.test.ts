import { describe, it, expect } from "vitest";
import {
  sortFrames,
  searchFrames,
  gcdFrames,
  traversalFrames,
  mstFrames,
  knapsackFrames,
  JAVA_SORT,
  JAVA_SEARCH,
  JAVA_GCD,
  JAVA_TRAVERSAL,
  JAVA_MST,
  JAVA_KNAPSACK,
  humanTime,
  type SortAlgorithm,
} from "@/lib/algorithms";

const ALGOS: SortAlgorithm[] = ["selection", "bubble", "insertion", "merge", "quick"];

function randomArray(len: number, max = 50) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * max));
}

describe("sortFrames", () => {
  for (const algo of ALGOS) {
    it(`${algo} sort ends sorted for 200 random arrays (incl. duplicates and edge sizes)`, () => {
      for (let t = 0; t < 200; t++) {
        const input = randomArray(t % 13, t % 2 ? 5 : 100);
        const frames = sortFrames(algo, input);
        const last = frames[frames.length - 1].state.array;
        expect(last).toEqual([...input].sort((a, b) => a - b));
        // every frame points at a real line of the Java source
        for (const f of frames) {
          expect(f.line).toBeGreaterThanOrEqual(0);
          expect(f.line).toBeLessThan(JAVA_SORT[algo].length);
        }
      }
    });

    it(`${algo} sort never mutates its input`, () => {
      const input = [5, 1, 4, 2, 3];
      sortFrames(algo, input);
      expect(input).toEqual([5, 1, 4, 2, 3]);
    });
  }

  it("bubble sort stops after one pass on already-sorted input (best case O(n))", () => {
    const frames = sortFrames("bubble", [1, 2, 3, 4, 5, 6]);
    expect(frames[frames.length - 1].stats.comparisons).toBe(5);
  });

  it("selection sort always makes n(n-1)/2 comparisons", () => {
    const frames = sortFrames("selection", [1, 2, 3, 4, 5, 6]);
    expect(frames[frames.length - 1].stats.comparisons).toBe(15);
  });
});

describe("searchFrames", () => {
  it("linear search finds the first match or reports -1", () => {
    const f = searchFrames("linear", [4, 8, 15, 16, 23, 42], 16);
    expect(f[f.length - 1].state.found).toBe(3);
    const miss = searchFrames("linear", [4, 8, 15], 99);
    expect(miss[miss.length - 1].state.found).toBeUndefined();
    expect(miss[miss.length - 1].line).toBeLessThan(JAVA_SEARCH.linear.length);
  });

  it("binary search finds every element of a sorted array in ≤ ⌈log2(n+1)⌉ comparisons", () => {
    const a = Array.from({ length: 31 }, (_, i) => i * 3);
    for (const x of a) {
      const f = searchFrames("binary", a, x);
      const last = f[f.length - 1];
      expect(last.state.array[last.state.found!]).toBe(x);
      expect(last.stats.comparisons).toBeLessThanOrEqual(5);
    }
    const miss = searchFrames("binary", a, 1);
    expect(miss[miss.length - 1].state.found).toBeUndefined();
  });

  it("binary search sorts unsorted input before searching", () => {
    const f = searchFrames("binary", [9, 1, 5], 5);
    expect(f[0].state.array).toEqual([1, 5, 9]);
  });
});

describe("gcdFrames", () => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  it("matches the textbook examples", () => {
    for (const [m, n, g] of [[24, 54, 6], [18, 42, 6], [97, 20, 1], [45, 210, 15], [60, 24, 12]]) {
      const f = gcdFrames(m, n);
      expect(f[f.length - 1].state.result).toBe(g);
    }
  });
  it("agrees with a reference implementation and stays on valid lines", () => {
    for (let t = 0; t < 100; t++) {
      const m = 1 + Math.floor(Math.random() * 500);
      const n = Math.floor(Math.random() * 500);
      const f = gcdFrames(m, n);
      expect(f[f.length - 1].state.result).toBe(gcd(m, n));
      f.forEach((fr) => expect(fr.line).toBeLessThan(JAVA_GCD.length));
    }
  });
});

describe("traversalFrames", () => {
  // 0 - 1 - 3
  // |   |
  // 2 - 4    5 (5 hangs off 2)
  const edges = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 1, to: 4 },
    { from: 2, to: 4 },
    { from: 2, to: 5 },
  ];
  it("BFS visits level by level", () => {
    const f = traversalFrames("bfs", 6, edges);
    expect(f[f.length - 1].state.order).toEqual([0, 1, 2, 3, 4, 5]);
    f.forEach((fr) => expect(fr.line).toBeLessThan(JAVA_TRAVERSAL.bfs.length));
  });
  it("DFS goes deep first", () => {
    const f = traversalFrames("dfs", 6, edges);
    expect(f[f.length - 1].state.order).toEqual([0, 1, 3, 4, 2, 5]);
    expect(f[f.length - 1].state.frontier).toEqual([]);
    f.forEach((fr) => expect(fr.line).toBeLessThan(JAVA_TRAVERSAL.dfs.length));
  });
  it("both build a spanning tree with n-1 edges on a connected graph", () => {
    for (const k of ["bfs", "dfs"] as const) {
      const f = traversalFrames(k, 6, edges);
      expect(f[f.length - 1].state.treeEdges).toHaveLength(5);
    }
  });
});

describe("mstFrames", () => {
  const edges = [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 3 },
    { from: 1, to: 2, weight: 1 },
    { from: 1, to: 3, weight: 2 },
    { from: 2, to: 3, weight: 4 },
    { from: 3, to: 4, weight: 2 },
    { from: 4, to: 5, weight: 6 },
    { from: 3, to: 5, weight: 5 },
  ];
  it("Prim and Kruskal agree on the minimum total weight", () => {
    const p = mstFrames("prim", 6, edges);
    const k = mstFrames("kruskal", 6, edges);
    expect(p[p.length - 1].state.total).toBe(13);
    expect(k[k.length - 1].state.total).toBe(13);
    expect(p[p.length - 1].state.accepted).toHaveLength(5);
    expect(k[k.length - 1].state.accepted).toHaveLength(5);
    p.forEach((fr) => expect(fr.line).toBeLessThan(JAVA_MST.prim.length));
    k.forEach((fr) => expect(fr.line).toBeLessThan(JAVA_MST.kruskal.length));
  });
  it("Kruskal rejects the edge that would close a cycle", () => {
    const k = mstFrames("kruskal", 6, edges);
    expect(k[k.length - 1].state.rejected.length).toBeGreaterThan(0);
  });
});

describe("knapsackFrames", () => {
  it("solves the classic capacity-5 example (answer 37: items 1, 2, 4)", () => {
    const items = [
      { name: "item 1", weight: 2, value: 12 },
      { name: "item 2", weight: 1, value: 10 },
      { name: "item 3", weight: 3, value: 20 },
      { name: "item 4", weight: 2, value: 15 },
    ];
    const f = knapsackFrames(items, 5);
    const last = f[f.length - 1].state;
    expect(last.table[4][5]).toBe(37);
    expect([...last.chosen].sort()).toEqual([0, 1, 3]);
    f.forEach((fr) => expect(fr.line).toBeLessThan(JAVA_KNAPSACK.length));
  });
});

describe("humanTime", () => {
  it("formats small and astronomically large durations", () => {
    expect(humanTime(10)).toBe("under a microsecond");
    expect(humanTime(Math.pow(2, 1000))).toBe("longer than the age of the universe");
  });
});
