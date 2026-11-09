import { describe, it, expect } from "vitest";
import {
  sortFrames,
  equalTags,
  keptEqualOrder,
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
  findMaxFrames,
  JAVA_FIND_MAX,
  loopGridInfo,
  swapFrames,
  JAVA_SWAP,
  bubbleEarlyExitFrames,
  JAVA_BUBBLE_EARLY_EXIT,
  insertionShiftFrames,
  JAVA_INSERTION_SHIFT,
  twoWayMergeFrames,
  JAVA_TWO_WAY_MERGE,
  partitionFrames,
  JAVA_PARTITION,
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

  it("quick sort partitions around the first element like the lab", () => {
    const frames = sortFrames("quick", [25, 10, 30, 15, 20, 28]);
    const placed = frames.find((f) => f.line === 15)!;
    expect(placed.state.array).toEqual([15, 10, 20, 25, 30, 28]);
    expect(placed.state.pointers).toEqual({ p: 3 });
  });

  it("selection sort always makes n(n-1)/2 comparisons", () => {
    const frames = sortFrames("selection", [1, 2, 3, 4, 5, 6]);
    expect(frames[frames.length - 1].stats.comparisons).toBe(15);
  });
});

describe("equal values (stability)", () => {
  const last = (algo: "selection" | "bubble" | "insertion" | "merge") => {
    const f = sortFrames(algo, [3, 7, 8, 5, 2, 1, 9, 5, 4]);
    return f[f.length - 1].state;
  };

  it("letters equal values by where they started", () => {
    expect(equalTags(sortFrames("bubble", [5, 1, 5])[0].state)).toEqual(["a", "", "b"]);
  });

  it("selection sort scrambles the two 5s; the stable sorts keep them", () => {
    expect(keptEqualOrder(last("selection"))).toBe(false);
    expect(equalTags(last("selection")).filter(Boolean)).toEqual(["b", "a"]);
    for (const algo of ["bubble", "insertion", "merge"] as const) expect(keptEqualOrder(last(algo))).toBe(true);
  });

  it("returns null when no values repeat", () => {
    expect(keptEqualOrder(sortFrames("selection", [3, 1, 2])[0].state)).toBeNull();
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
  it("runs the shortest-paths lecture's directed BFS example in its order", () => {
    // a b c d e f g h i = 0..8, directed edges as drawn on the slide
    const lecture = [
      [0, 3], [0, 1], [3, 1], [3, 4], [1, 4], [1, 2], [4, 2], [4, 6], [4, 8],
      [5, 3], [5, 7], [6, 5], [6, 8], [7, 6], [8, 7],
    ].map(([from, to]) => ({ from, to }));
    const order = traversalFrames("bfs", 9, lecture, 0, true).at(-1)!.state.order;
    expect(order.map((i) => "abcdefghi"[i]).join(" ")).toBe("a b d c e g i f h");
    // with names, the step messages use the letters too
    const named = traversalFrames("bfs", 9, lecture, 0, true, [..."abcdefghi"]);
    expect(named.at(-1)!.message).toContain("a → b → d → c → e → g → i → f → h");
    expect(named[0].message).toBe("Mark a as seen and put it in the queue.");
  });

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

  it("solves the Advanced Algorithms lecture's Prim example (total 53)", () => {
    // f a b c d e g h = 0..7, as in m3-03; Prim starts at f
    const lecture = [
      { from: 1, to: 2, weight: 6 }, { from: 1, to: 3, weight: 12 }, { from: 2, to: 3, weight: 5 },
      { from: 3, to: 4, weight: 9 }, { from: 2, to: 5, weight: 14 }, { from: 2, to: 7, weight: 8 },
      { from: 5, to: 7, weight: 3 }, { from: 3, to: 0, weight: 7 }, { from: 0, to: 6, weight: 15 },
      { from: 0, to: 7, weight: 10 },
    ];
    const p = mstFrames("prim", 8, lecture).at(-1)!.state;
    const k = mstFrames("kruskal", 8, lecture).at(-1)!.state;
    expect(p.total).toBe(53);
    expect(k.total).toBe(53);
    // Prim's order from f: f–c, c–b, b–a, b–h, h–e, c–d, f–g
    expect(p.accepted.map((i) => lecture[i].weight)).toEqual([7, 5, 6, 8, 3, 9, 15]);
    expect(k.accepted.map((i) => lecture[i].weight)).toEqual([3, 5, 6, 7, 8, 9, 15]);
  });

  it("follows the notes' a to f example in their order, with letter names", () => {
    // a b c d e f = 0..5; ties are listed in the order the notes break them
    const notes = [
      { from: 0, to: 1, weight: 3 }, { from: 1, to: 2, weight: 1 }, { from: 1, to: 5, weight: 4 },
      { from: 2, to: 5, weight: 4 }, { from: 0, to: 5, weight: 5 }, { from: 5, to: 3, weight: 5 },
      { from: 0, to: 4, weight: 6 }, { from: 2, to: 3, weight: 6 }, { from: 5, to: 4, weight: 2 },
      { from: 4, to: 3, weight: 8 },
    ];
    const names = ["a", "b", "c", "d", "e", "f"];
    const p = mstFrames("prim", 6, notes, names);
    const k = mstFrames("kruskal", 6, notes, names);
    expect(p.at(-1)!.state.total).toBe(15);
    expect(p.at(-1)!.state.accepted).toEqual([0, 1, 2, 8, 5]); // ab, bc, bf, fe, fd
    expect(k.at(-1)!.state.accepted).toEqual([1, 8, 0, 2, 5]); // bc, ef, ab, bf, df
    expect(k.at(-1)!.state.rejected).toEqual([3, 4]); // cf, af
    expect(p[0].message).toBe("Start the tree at node a.");
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

  it("solves the notes' example (answer 140: items 1 and 4)", () => {
    const items = [
      { name: "item 1", weight: 3, value: 100 },
      { name: "item 2", weight: 2, value: 20 },
      { name: "item 3", weight: 4, value: 60 },
      { name: "item 4", weight: 1, value: 40 },
    ];
    const last = knapsackFrames(items, 5).at(-1)!.state;
    expect(last.table[3]).toEqual([0, 0, 20, 100, 100, 120]);
    expect(last.table[4][5]).toBe(140);
    expect([...last.chosen].sort()).toEqual([0, 3]);
  });
});

describe("humanTime", () => {
  it("formats small and astronomically large durations", () => {
    expect(humanTime(10)).toBe("under a microsecond");
    expect(humanTime(Math.pow(2, 1000))).toBe("longer than the age of the universe");
  });
});

describe("findMaxFrames", () => {
  it("finds the maximum in the lesson instance [8, 1, 4, 9, 3, 7]", () => {
    const input = [8, 1, 4, 9, 3, 7];
    const frames = findMaxFrames(input);
    const last = frames[frames.length - 1];
    expect(last.state.found).toBe(3);
    expect(last.state.array[last.state.found!]).toBe(9);
    expect(last.stats.comparisons).toBe(5);
    expect(last.stats.updates).toBe(1);
    for (const f of frames) {
      expect(f.line).toBeGreaterThanOrEqual(0);
      expect(f.line).toBeLessThan(JAVA_FIND_MAX.length);
    }
  });

  it("handles negative numbers correctly without 0 bug", () => {
    const input = [-5, -2, -9, -1, -8];
    const frames = findMaxFrames(input);
    const last = frames[frames.length - 1];
    expect(last.state.found).toBe(3);
    expect(last.state.array[last.state.found!]).toBe(-1);
    expect(last.stats.comparisons).toBe(4);
  });

  it("handles empty array gracefully", () => {
    const frames = findMaxFrames([]);
    expect(frames.length).toBe(1);
    expect(frames[0].message).toContain("Empty array");
  });

  it("never mutates input array", () => {
    const input = [10, 5, 20];
    findMaxFrames(input);
    expect(input).toEqual([10, 5, 20]);
  });
});

describe("loopGridInfo", () => {
  it("dependent mode forms triangular numbers n(n+1)/2", () => {
    const info = loopGridInfo(4, "dependent");
    expect(info.totalOps).toBe(10);
    expect(info.maxOps).toBe(16);
    expect(info.rowCounts).toEqual([1, 2, 3, 4]);
    expect(info.bigO).toBe("O(n²)");
  });

  it("independent mode forms n*n square", () => {
    const info = loopGridInfo(4, "independent");
    expect(info.totalOps).toBe(16);
    expect(info.maxOps).toBe(16);
    expect(info.rowCounts).toEqual([4, 4, 4, 4]);
    expect(info.bigO).toBe("O(n²)");
  });

  it("fixed mode forms 3*n linear strip", () => {
    const info = loopGridInfo(4, "fixed");
    expect(info.totalOps).toBe(12);
    expect(info.rowCounts).toEqual([3, 3, 3, 3]);
    expect(info.bigO).toBe("O(n)");
  });
});

describe("swapFrames", () => {
  it("correct swap exchanges elements using temp", () => {
    const arr = [5, 9, 14, 2];
    const frames = swapFrames(arr, 0, 1, "correct");
    const last = frames[frames.length - 1];
    expect(last.state.array).toEqual([9, 5, 14, 2]);
    expect(last.state.temp).toBe(5);
    for (const f of frames) {
      expect(f.line).toBeGreaterThanOrEqual(0);
      expect(f.line).toBeLessThan(JAVA_SWAP.correct.length);
    }
  });

  it("buggy swap overwrites first element", () => {
    const arr = [5, 9, 14, 2];
    const frames = swapFrames(arr, 0, 1, "buggy");
    const last = frames[frames.length - 1];
    expect(last.state.array).toEqual([9, 9, 14, 2]);
    for (const f of frames) {
      expect(f.line).toBeGreaterThanOrEqual(0);
      expect(f.line).toBeLessThan(JAVA_SWAP.buggy.length);
    }
  });
});

describe("bubbleEarlyExitFrames", () => {
  it("stops after pass 1 on already sorted input with flag (O(n))", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const frames = bubbleEarlyExitFrames(input, "with_flag");
    const last = frames[frames.length - 1];
    expect(last.state.stoppedEarly).toBe(true);
    expect(last.state.passCount).toBe(1);
    expect(last.stats.comparisons).toBe(5);
    expect(last.stats.swaps).toBe(0);
    expect(last.state.array).toEqual([1, 2, 3, 4, 5, 6]);
    for (const f of frames) {
      expect(f.line).toBeGreaterThanOrEqual(0);
      expect(f.line).toBeLessThan(JAVA_BUBBLE_EARLY_EXIT.with_flag.length);
    }
  });

  it("runs all n-1 passes on sorted input without flag (O(n²))", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const frames = bubbleEarlyExitFrames(input, "without_flag");
    const last = frames[frames.length - 1];
    expect(last.state.stoppedEarly).toBe(false);
    expect(last.state.passCount).toBe(5);
    expect(last.stats.comparisons).toBe(15);
    expect(last.stats.swaps).toBe(0);
    for (const f of frames) {
      expect(f.line).toBeGreaterThanOrEqual(0);
      expect(f.line).toBeLessThan(JAVA_BUBBLE_EARLY_EXIT.without_flag.length);
    }
  });

  it("sorts reverse-ordered input completely", () => {
    const input = [6, 5, 4, 3, 2, 1];
    const frames = bubbleEarlyExitFrames(input, "with_flag");
    const last = frames[frames.length - 1];
    expect(last.state.array).toEqual([1, 2, 3, 4, 5, 6]);
    expect(last.stats.swaps).toBe(15);
  });
});

describe("insertionShiftFrames", () => {
  it("shift mode ends sorted and has valid line pointers", () => {
    const input = [12, 11, 13, 5, 6, 3, 9];
    const frames = insertionShiftFrames(input, "shift");
    const last = frames[frames.length - 1];
    expect(last.state.array).toEqual([3, 5, 6, 9, 11, 12, 13]);
    for (const f of frames) {
      expect(f.line).toBeGreaterThanOrEqual(0);
      expect(f.line).toBeLessThan(JAVA_INSERTION_SHIFT.shift.length);
    }
  });

  it("swap mode ends sorted and uses ~3x more writes than shift mode on reverse input", () => {
    const input = [5, 4, 3, 2, 1];
    const shiftFrames = insertionShiftFrames(input, "shift");
    const swapFramesList = insertionShiftFrames(input, "swap");

    const shiftLast = shiftFrames[shiftFrames.length - 1];
    const swapLast = swapFramesList[swapFramesList.length - 1];

    expect(shiftLast.state.array).toEqual([1, 2, 3, 4, 5]);
    expect(swapLast.state.array).toEqual([1, 2, 3, 4, 5]);

    // For 10 inversions in reverse array of 5 elements:
    // swap uses 3 writes per swap = 30 writes
    // shift uses 1 write per shift (10) + 2 writes per outer loop (8) = 18 writes
    expect(swapLast.stats.writes).toBeGreaterThan(shiftLast.stats.writes);
    expect(swapLast.stats.writes).toBe(30);
  });
});

describe("twoWayMergeFrames", () => {
  it("merges two sorted halves in linear time", () => {
    const L = [2, 6, 11];
    const R = [4, 5, 7];
    const frames = twoWayMergeFrames(L, R, "lte");
    const last = frames[frames.length - 1];
    const mergedValues = last.state.output.map((x) => x?.value);
    expect(mergedValues).toEqual([2, 4, 5, 6, 7, 11]);
    expect(last.stats.comparisons).toBe(5); // step 6 drained without comparison
    expect(last.state.stabilityBroken).toBe(false);
    for (const f of frames) {
      expect(f.line).toBeGreaterThanOrEqual(0);
      expect(f.line).toBeLessThan(JAVA_TWO_WAY_MERGE.lte.length);
    }
  });

  it("preserves stability with <= on duplicate elements", () => {
    const L = [1, 5, 8];
    const R = [3, 5, 9];
    const frames = twoWayMergeFrames(L, R, "lte");
    const last = frames[frames.length - 1];
    const tags = last.state.output.map((x) => (x?.value === 5 ? x.tag : null)).filter(Boolean);
    expect(tags).toEqual(["a", "b"]); // 5ᵃ (Left) before 5ᵇ (Right)
    expect(last.state.stabilityBroken).toBe(false);
  });

  it("breaks stability with < condition on duplicate elements", () => {
    const L = [1, 5, 8];
    const R = [3, 5, 9];
    const frames = twoWayMergeFrames(L, R, "lt");
    const last = frames[frames.length - 1];
    const tags = last.state.output.map((x) => (x?.value === 5 ? x.tag : null)).filter(Boolean);
    expect(tags).toEqual(["b", "a"]); // 5ᵇ (Right) jumped ahead of 5ᵃ (Left)
    expect(last.state.stabilityBroken).toBe(true);
  });
});

describe("partitionFrames", () => {
  it("right_first correctly partitions around pivot and keeps line bounds", () => {
    const input = [25, 10, 30, 15, 20, 28];
    const frames = partitionFrames(input, "right_first");
    const last = frames[frames.length - 1];
    expect(last.state.corrupted).toBe(false);
    expect(last.state.meetingIdx).toBe(3);
    expect(last.state.array[3]).toBe(25);
    // elements left are <= 25, right are >= 25
    expect(last.state.array.slice(0, 3).every((v) => v <= 25)).toBe(true);
    expect(last.state.array.slice(4).every((v) => v >= 25)).toBe(true);
    for (const f of frames) {
      expect(f.line).toBeGreaterThanOrEqual(0);
      expect(f.line).toBeLessThan(JAVA_PARTITION.right_first.length);
    }
  });

  it("left_first corrupts partition on [25, 10, 30]", () => {
    const input = [25, 10, 30];
    const frames = partitionFrames(input, "left_first");
    const last = frames[frames.length - 1];
    expect(last.state.corrupted).toBe(true);
    expect(last.state.array).toEqual([30, 10, 25]); // 30 swapped to index 0!
    expect(last.state.corruptedReason).toContain("Partition corrupted");
  });
});
