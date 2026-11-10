import { renderLesson } from "./renderLesson";
import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { getCourse, flattenLessons } from "@/content/registry";
import {
  SortVisualizer,
  SearchVisualizer,
  StabilityCompare,
  GraphTraversal,
  MstVisualizer,
  KnapsackTable,
  EuclidVisualizer,
  GrowthTable,
  FindMaxVisualizer,
  NestedLoopGrid,
  ArraySwapVisualizer,
  ArrayReferenceVisualizer,
  BubbleEarlyExitVisualizer,
  InsertionShiftVisualizer,
  TwoWayMergeVisualizer,
  PartitionVisualizer,
  BinarySearchUnsortedVisualizer,
  BinarySearchBoundaryVisualizer,
  EuclidTilingVisualizer,
  GcdComparisonVisualizer,
  AdjacencyVisualizer,
  BfsQueueExplosionVisualizer,
  ShortestPathCompareVisualizer,
} from "@/components/mdx/AlgoVisualizers";

beforeAll(() => {
  // ReactFlow (used by <Diagram>) needs ResizeObserver, which jsdom lacks.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Algorithm Design & Analysis course", () => {
  const course = getCourse("algorithm-design-and-analysis")!;

  it("is registered and available", () => {
    expect(course).toBeDefined();
    expect(course.status).toBe("available");
    expect(flattenLessons(course).length).toBeGreaterThanOrEqual(10);
  });

  for (const lesson of flattenLessons(getCourse("algorithm-design-and-analysis")!)) {
    it(`renders lesson "${lesson.slug}" without throwing`, async () => {
      const { container, unmount } = await renderLesson(lesson);
      expect(container.querySelector("h1")?.textContent).toBe(lesson.title);
      unmount();
    });
  }

  it("never mentions source institutions or instructors", () => {
    const dir = path.resolve(__dirname, "../content/algorithm-design-and-analysis");
    const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    const all = files.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n").toLowerCase();
    expect(files.length).toBe(flattenLessons(course).length);
    for (const banned of ["kufa", "uokufa", "lecturer", "faculty of", "haidary", "cslib"]) {
      expect(all).not.toContain(banned);
    }
  });
});

function stepToEnd(root: HTMLElement) {
  const step = within(root).getByRole("button", { name: /^step/i });
  let guard = 0;
  while (!(step as HTMLButtonElement).disabled && guard++ < 2000) fireEvent.click(step);
  return guard;
}

describe("visualizers step all the way through", () => {
  it.each(["selection", "bubble", "insertion", "merge", "quick"] as const)("%s sort", (algo) => {
    const { container } = render(<SortVisualizer algorithm={algo} initial={[5, 2, 9, 1, 7]} />);
    stepToEnd(container);
    expect(screen.getByText(/^Sorted\./)).toBeDefined();
  });

  it("focus mode shows just the visualizer, takes keyboard controls and keeps the step", () => {
    const { container } = render(<SortVisualizer algorithm="insertion" initial={[5, 2, 9, 1, 7]} />);
    fireEvent.click(within(container).getByRole("button", { name: /focus mode/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByText("Java")).toBeNull(); // code hidden by default
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(dialog.textContent).toMatch(/step\s*3\//i);
    fireEvent.keyDown(window, { key: "c" });
    expect(within(dialog).getByText("Java")).toBeDefined();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container.textContent).toMatch(/step\s*3\//i);
  });

  it("binary search finds the target", () => {
    const { container } = render(<SearchVisualizer algorithm="binary" target={58} />);
    stepToEnd(container);
    expect(screen.getByText(/Found it/)).toBeDefined();
  });

  it("linear search presets hit the best and worst case", () => {
    const { container } = render(<SearchVisualizer algorithm="linear" array={[34, 7, 23, 32]} target={7} cases />);
    fireEvent.click(screen.getByRole("button", { name: /best: first/ }));
    stepToEnd(container);
    expect(container.textContent).toMatch(/comparisons\s*1/);
    fireEvent.click(screen.getByRole("button", { name: /worst: missing/ }));
    stepToEnd(container);
    expect(container.textContent).toMatch(/comparisons\s*4/);
    expect(screen.getByText(/isn't here/)).toBeDefined();
  });

  it("stability comparison flags selection sort, not bubble sort", () => {
    render(<StabilityCompare initial={[3, 7, 8, 5, 2, 1, 9, 5, 4]} />);
    expect(screen.getAllByText(/not stable/)).toHaveLength(1);
    expect(screen.getAllByText(/: stable$/)).toHaveLength(1);
  });

  it("graph traversal toggles between BFS and DFS", () => {
    const { container } = render(<GraphTraversal />);
    stepToEnd(container);
    expect(screen.getByText(/level by level/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /DFS/ }));
    stepToEnd(container);
    expect(screen.getByText(/deep down one path/)).toBeDefined();
  });

  it("MST, knapsack, Euclid and growth table render their final state", () => {
    const mst = render(<MstVisualizer algorithm="kruskal" />);
    stepToEnd(mst.container);
    expect(screen.getByText(/Total weight = 13/)).toBeDefined();
    mst.unmount();

    const ks = render(<KnapsackTable />);
    stepToEnd(ks.container);
    expect(screen.getByText(/Total value 37/)).toBeDefined();
    ks.unmount();

    const eu = render(<EuclidVisualizer m={210} n={45} />);
    stepToEnd(eu.container);
    expect(screen.getByText(/= 15\. Took/)).toBeDefined();
    eu.unmount();

    render(<GrowthTable />);
    expect(screen.getByText("O(n log n)")).toBeDefined();
  });

  it("findMax visualizer steps through and finds maximum", () => {
    const { container } = render(<FindMaxVisualizer initial={[8, 1, 4, 9, 3, 7]} />);
    stepToEnd(container);
    expect(screen.getByText(/Return max = 9/)).toBeDefined();
  });

  it("nested loop grid toggles between modes and steps", () => {
    render(<NestedLoopGrid initialN={4} />);
    expect(screen.getByText(/O\(n²\) time complexity/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Fixed inner/ }));
    expect(screen.getByText(/O\(n\) time complexity/)).toBeDefined();
  });

  it("array swap visualizer steps through temp and buggy versions", () => {
    const { container } = render(<ArraySwapVisualizer initial={[5, 9, 14, 2]} x={0} y={1} />);
    stepToEnd(container);
    expect(screen.getByText(/Swap complete!/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /The bug/ }));
    stepToEnd(container);
    expect(screen.getByText(/Swap failed\./)).toBeDefined();
  });

  it("array reference visualizer demonstrates alias mutation vs clone", () => {
    render(<ArrayReferenceVisualizer />);
    expect(screen.getByText(/Click "Execute"/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Execute: copy\[0\] = 99/ }));
    expect(screen.getByText(/Trap triggered/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /copy = original\.clone\(\)/ }));
    fireEvent.click(screen.getByRole("button", { name: /Execute: copy\[0\] = 99/ }));
    expect(screen.getByText(/Independent/)).toBeDefined();
  });

  it("bubble early exit visualizer toggles with/without flag and steps through", () => {
    const { container } = render(<BubbleEarlyExitVisualizer initial={[1, 2, 3, 4, 5, 6]} />);
    stepToEnd(container);
    expect(screen.getByText(/O\(n\) best-case reached/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Without flag/ }));
    stepToEnd(container);
    expect(screen.getByText(/Completed all 5 passes/)).toBeDefined();
  });

  it("insertion shift visualizer compares shifting vs adjacent swapping", () => {
    const { container } = render(<InsertionShiftVisualizer initial={[6, 2, 11, 7, 5]} />);
    stepToEnd(container);
    expect(screen.getByText(/Shifting minimizes writes/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Adjacent Swapping/ }));
    stepToEnd(container);
    expect(screen.getByText(/Swapping incurred 3x writes/)).toBeDefined();
  });

  it("two-way merge visualizer steps through and catches stability bug with <", () => {
    const { container } = render(<TwoWayMergeVisualizer initialLeft={[1, 5, 8]} initialRight={[3, 5, 9]} />);
    stepToEnd(container);
    expect(screen.getByText(/preserved stability/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Unstable bug/ }));
    stepToEnd(container);
    expect(screen.getByText(/Stability bug detected/)).toBeDefined();
  });

  it("partition visualizer demonstrates correct partition and left-first bug", () => {
    const { container } = render(<PartitionVisualizer initial={[25, 10, 30, 15, 20, 28]} />);
    stepToEnd(container);
    expect(screen.getByText(/Partition successful!/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Bug demo: \[25, 10, 30\]/ }));
    fireEvent.click(screen.getByRole("button", { name: /Left pointer first/ }));
    stepToEnd(container);
    expect(screen.getAllByText(/Partition corrupted!/).length).toBeGreaterThan(0);
  });

  it("binary search unsorted visualizer steps through and catches silent data loss on unsorted data", () => {
    const { container } = render(<BinarySearchUnsortedVisualizer />);
    stepToEnd(container);
    expect(screen.getAllByText(/Silent Failure/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Sorted array/ }));
    stepToEnd(container);
    expect(screen.getAllByText(/Found:/).length).toBeGreaterThan(0);
  });

  it("binary search boundary visualizer demonstrates premature exit and infinite loop traps", () => {
    const { container } = render(<BinarySearchBoundaryVisualizer />);
    // Correct mode finds target
    stepToEnd(container);
    expect(screen.getAllByText(/Target Found/).length).toBeGreaterThan(0);

    // Bug 1: low < high misses boundary
    fireEvent.click(screen.getByRole("button", { name: /low < high/ }));
    stepToEnd(container);
    expect(screen.getAllByText(/Off-by-one boundary failure/).length).toBeGreaterThan(0);

    // Bug 2: low = mid infinite loop trap
    fireEvent.click(screen.getByRole("button", { name: /low = mid/ }));
    fireEvent.click(screen.getByRole("button", { name: /Loop bug: \[10, 20\]/ }));
    stepToEnd(container);
    expect(screen.getAllByText(/Infinite Loop Trap/).length).toBeGreaterThan(0);
  });

  it("Euclid tiling visualizer steps through rectangle square tiling to completion", () => {
    const { container } = render(<EuclidTilingVisualizer m={60} n={24} />);
    stepToEnd(container);
    expect(screen.getAllByText(/Floor fully tiled/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/gcd\(60, 24\) = 12/).length).toBeGreaterThan(0);
  });

  it("GCD comparison visualizer renders brute force vs Euclid operation metrics", () => {
    render(<GcdComparisonVisualizer m={210} n={45} />);
    expect(screen.getByText(/Brute force approach/)).toBeDefined();
    expect(screen.getByText(/Euclid's algorithm/)).toBeDefined();
    expect(screen.getByText("31")).toBeDefined(); // 31 candidate tests
    expect(screen.getByText("3")).toBeDefined(); // 3 divisions
    expect(screen.getByText(/10.3× fewer operations with Euclid/)).toBeDefined();
  });

  it("Euclid visualizer toggles between correct sequence and overwrite bug", () => {
    const { container } = render(<EuclidVisualizer m={60} n={24} />);
    stepToEnd(container);
    expect(screen.getAllByText(/= 12/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Overwrite bug/ }));
    stepToEnd(container);
    expect(screen.getAllByText(/= 0/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Assignment bug active/)).toBeDefined();
  });

  it("AdjacencyVisualizer renders matrix, list, switches presets and handles interaction", () => {
    const { container } = render(<AdjacencyVisualizer initialPreset="triangle" />);
    expect(screen.getByText(/Graph Storage: Adjacency Matrix vs Adjacency List/)).toBeDefined();
    expect(screen.getByText(/Symmetric \(M = Mᵀ\)/)).toBeDefined();
    expect(screen.getByText(/Triangle \(3\)/)).toBeDefined();

    // Switch to Directed DAG
    fireEvent.click(screen.getByRole("button", { name: /Directed DAG/ }));
    expect(screen.getByText(/Asymmetric/)).toBeDefined();

    // Switch to House
    fireEvent.click(screen.getByRole("button", { name: /House \(5\)/ }));
    expect(screen.getByText(/5 × 5 = 25/)).toBeDefined();
  });

  it("BfsQueueExplosionVisualizer steps through and catches duplicate enqueues in buggy mode", () => {
    const { container } = render(<BfsQueueExplosionVisualizer />);
    stepToEnd(container);
    expect(screen.getByText(/cleanly with 6 enqueues/i)).toBeDefined();

    // Switch to dequeue bug mode
    fireEvent.click(screen.getByRole("button", { name: /Mark on dequeue/ }));
    stepToEnd(container);
    expect(screen.getByText(/Notice the disaster/i)).toBeDefined();
    expect(screen.getByText("Duplicate Enqueues")).toBeDefined();
  });

  it("ShortestPathCompareVisualizer renders comparison between BFS shortest path and DFS path", () => {
    render(<ShortestPathCompareVisualizer />);
    expect(screen.getByText(/Unweighted Shortest Path: BFS vs DFS/)).toBeDefined();
    expect(screen.getByText(/Guaranteed Shortest Path/)).toBeDefined();
    expect(screen.getByText(/Breadth-First Search \(BFS\)/)).toBeDefined();
    expect(screen.getByText(/Depth-First Search \(DFS\)/)).toBeDefined();
  });

  it("GraphTraversal supports presets", () => {
    const { container } = render(<GraphTraversal preset="lecture-bfs" />);
    stepToEnd(container);
    expect(screen.getByText(/1 → 2 → 4 → 3 → 5 → 7 → 8 → 9 → 10 → 6/)).toBeDefined();
  });

  describe("Module 0 practice calculations and exam questions", () => {
    it("verifies factorial algorithm hand calculations", () => {
      // Step-by-step trace for N = 4
      let f = 1;
      let n = 4;
      while (n > 0) {
        f = f * n;
        n--;
      }
      expect(f).toBe(24);

      // Edge case N = 0
      let f0 = 1;
      let n0 = 0;
      if (n0 > 0) {
        while (n0 > 0) {
          f0 = f0 * n0;
          n0--;
        }
      }
      expect(f0).toBe(1);
    });

    it("verifies triangular nested loop iteration count and operations", () => {
      const n = 5;
      let iterations = 0;
      let assignments = 0;
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= i; j++) {
          iterations++;
          assignments += 2; // x = i + j, y = x + 3
        }
      }
      expect(iterations).toBe(15);
      expect((n * (n + 1)) / 2).toBe(15);
      expect(assignments + n + 1).toBe(36); // inner + sum=1 + initial x=1
    });

    it("verifies linear search average-case formula and calculations", () => {
      const averageComparisons = (n: number) => n / 2 + n / (n + 1);
      expect(averageComparisons(7)).toBe(4.375);
      expect(averageComparisons(9)).toBe(5.4);
    });

    it("verifies 32-bit signed integer overflow arithmetic", () => {
      const mathSum = 1_000_000 * 5_000;
      expect(mathSum).toBe(5_000_000_000);
      const mod32 = BigInt(mathSum) % BigInt(2 ** 32);
      // In 32-bit signed two's complement:
      const signed32 = Number(BigInt.asIntN(32, BigInt(mathSum)));
      expect(signed32).toBe(705_032_704);
      expect(mathSum - 2 ** 32).toBe(705_032_704);
    });

    it("verifies doubling experiment runtime predictions", () => {
      const quadraticTime = (t0: number, k: number) => t0 * k * k;
      const linearTime = (t0: number, k: number) => t0 * k;

      // From 2,000 to 4,000 (2x) and 8,000 (4x)
      expect(quadraticTime(15.0, 2)).toBe(60.0);
      expect(quadraticTime(15.0, 4)).toBe(240.0);
      expect(linearTime(15.0, 2)).toBe(30.0);

      // From 500 to 2,000 (4x)
      expect(quadraticTime(8, 4)).toBe(128);
    });
  });

  describe("Module 1 practice calculations and exam questions", () => {
    it("verifies Selection Sort hand trace, comparison counts, and instability on First Exam list", () => {
      type Tagged = { val: number; tag: string };
      const arr: Tagged[] = [
        { val: 3, tag: "3" },
        { val: 7, tag: "7" },
        { val: 8, tag: "8" },
        { val: 5, tag: "5a" },
        { val: 2, tag: "2" },
        { val: 1, tag: "1" },
        { val: 9, tag: "9" },
        { val: 5, tag: "5b" },
        { val: 4, tag: "4" },
      ];

      let comparisons = 0;
      let swaps = 0;
      const passSnapshots: number[][] = [];

      for (let i = 0; i < arr.length - 1; i++) {
        let min = i;
        for (let j = i + 1; j < arr.length; j++) {
          comparisons++;
          if (arr[j].val < arr[min].val) {
            min = j;
          }
        }
        const temp = arr[i];
        arr[i] = arr[min];
        arr[min] = temp;
        swaps++;
        passSnapshots.push(arr.map((x) => x.val));
      }

      expect(comparisons).toBe(36); // (9 * 8) / 2
      expect(swaps).toBe(8);

      // Pass 1: 1 swapped to index 0
      expect(passSnapshots[0]).toEqual([1, 7, 8, 5, 2, 3, 9, 5, 4]);
      // Pass 2: 2 swapped to index 1
      expect(passSnapshots[1]).toEqual([1, 2, 8, 5, 7, 3, 9, 5, 4]);
      // Pass 3: 3 swapped to index 2
      expect(passSnapshots[2]).toEqual([1, 2, 3, 5, 7, 8, 9, 5, 4]);
      // Pass 4: 4 swapped to index 3 with 5a, sending 5a to index 8
      expect(passSnapshots[3]).toEqual([1, 2, 3, 4, 7, 8, 9, 5, 5]);

      // Final sorted values
      expect(arr.map((x) => x.val)).toEqual([1, 2, 3, 4, 5, 5, 7, 8, 9]);

      // Verify instability: 5b now precedes 5a
      const fiveTags = arr.filter((x) => x.val === 5).map((x) => x.tag);
      expect(fiveTags).toEqual(["5b", "5a"]);
    });

    it("verifies Bubble Sort pass-by-pass operations and early exit flag behavior", () => {
      // 1. Lecture example [6, 2, 11, 7, 5]
      const a = [6, 2, 11, 7, 5];
      let comps = 0;
      let swaps = 0;
      for (let i = 0; i < a.length - 1; i++) {
        for (let j = 0; j < a.length - 1 - i; j++) {
          comps++;
          if (a[j + 1] < a[j]) {
            const t = a[j];
            a[j] = a[j + 1];
            a[j + 1] = t;
            swaps++;
          }
        }
      }
      expect(comps).toBe(10);
      expect(swaps).toBe(5);
      expect(a).toEqual([2, 5, 6, 7, 11]);

      // 2. Early-exit flag on already sorted input [2, 5, 6, 7, 11]
      const sortedA = [2, 5, 6, 7, 11];
      let flagComps = 0;
      let flagSwaps = 0;
      let flagPasses = 0;
      for (let i = 0; i < sortedA.length - 1; i++) {
        flagPasses++;
        let swapped = false;
        for (let j = 0; j < sortedA.length - 1 - i; j++) {
          flagComps++;
          if (sortedA[j + 1] < sortedA[j]) {
            const t = sortedA[j];
            sortedA[j] = sortedA[j + 1];
            sortedA[j + 1] = t;
            flagSwaps++;
            swapped = true;
          }
        }
        if (!swapped) break;
      }
      expect(flagPasses).toBe(1);
      expect(flagComps).toBe(4);
      expect(flagSwaps).toBe(0);

      // 3. Without flag on already sorted input [2, 5, 6, 7, 11]
      let noFlagComps = 0;
      let noFlagPasses = 0;
      for (let i = 0; i < sortedA.length - 1; i++) {
        noFlagPasses++;
        for (let j = 0; j < sortedA.length - 1 - i; j++) {
          noFlagComps++;
        }
      }
      expect(noFlagPasses).toBe(4);
      expect(noFlagComps).toBe(10);
    });

    it("verifies Insertion Sort trace, comparisons, shifts, and inversion count", () => {
      // Trace [6, 2, 11, 7, 5]
      const a = [6, 2, 11, 7, 5];
      let comps = 0;
      let shifts = 0;
      for (let i = 1; i < a.length; i++) {
        const key = a[i];
        let j = i - 1;
        while (j >= 0) {
          comps++;
          if (a[j] > key) {
            a[j + 1] = a[j];
            shifts++;
            j--;
          } else {
            break;
          }
        }
        a[j + 1] = key;
      }
      expect(comps).toBe(8);
      expect(shifts).toBe(5);
      expect(a).toEqual([2, 5, 6, 7, 11]);

      // Inversions on reverse-sorted [5, 4, 3, 2, 1]
      const rev = [5, 4, 3, 2, 1];
      let revComps = 0;
      let revShifts = 0;
      for (let i = 1; i < rev.length; i++) {
        const key = rev[i];
        let j = i - 1;
        while (j >= 0 && rev[j] > key) {
          revComps++;
          rev[j + 1] = rev[j];
          revShifts++;
          j--;
        }
        rev[j + 1] = key;
      }
      expect(revComps).toBe(10);
      expect(revShifts).toBe(10);
      expect((5 * 4) / 2).toBe(10);

      // Stability verification on duplicates [1, 12, 46a, 6, 37, 5, 46b, 3, 32]
      type Tagged = { val: number; tag: string };
      const dupArr: Tagged[] = [
        { val: 1, tag: "1" },
        { val: 12, tag: "12" },
        { val: 46, tag: "46a" },
        { val: 6, tag: "6" },
        { val: 37, tag: "37" },
        { val: 5, tag: "5" },
        { val: 46, tag: "46b" },
        { val: 3, tag: "3" },
        { val: 32, tag: "32" },
      ];
      for (let i = 1; i < dupArr.length; i++) {
        const key = dupArr[i];
        let j = i - 1;
        while (j >= 0 && dupArr[j].val > key.val) {
          dupArr[j + 1] = dupArr[j];
          j--;
        }
        dupArr[j + 1] = key;
      }
      const tags = dupArr.filter((x) => x.val === 46).map((x) => x.tag);
      expect(tags).toEqual(["46a", "46b"]); // Stable order preserved
    });

    it("verifies Merge Sort tree structure and two-way merge comparisons", () => {
      const leftHalf = [2, 6, 11];
      const rightHalf = [4, 5, 7];
      const merged: number[] = [];

      let l = 0;
      let r = 0;
      let mergeComps = 0;

      while (l < leftHalf.length && r < rightHalf.length) {
        mergeComps++;
        if (leftHalf[l] <= rightHalf[r]) {
          merged.push(leftHalf[l++]);
        } else {
          merged.push(rightHalf[r++]);
        }
      }
      while (l < leftHalf.length) merged.push(leftHalf[l++]);
      while (r < rightHalf.length) merged.push(rightHalf[r++]);

      expect(mergeComps).toBe(5); // p + q - 1 = 3 + 3 - 1 = 5
      expect(merged).toEqual([2, 4, 5, 6, 7, 11]);

      // Odd-sized halving: 7 elements
      const n = 7;
      const mid = Math.floor(n / 2);
      expect(mid).toBe(3);
      expect(n - mid).toBe(4);
    });

    it("verifies Quick Sort two-pointer partitioning and worst-case comparison count", () => {
      // 1. Partition [25, 10, 30, 15, 20, 28] with pivot 25
      const a = [25, 10, 30, 15, 20, 28];
      const pivot = a[0];
      let left = 0;
      let right = a.length - 1;

      while (left < right) {
        while (a[right] >= pivot && left < right) right--;
        while (a[left] <= pivot && left < right) left++;
        if (left < right) {
          const t = a[left];
          a[left] = a[right];
          a[right] = t;
        }
      }
      const temp = a[0];
      a[0] = a[right];
      a[right] = temp;

      expect(right).toBe(3); // pivot placed at index 3
      expect(a[3]).toBe(25);
      expect(a).toEqual([15, 10, 20, 25, 30, 28]);

      // 2. Demonstrating left-pointer-first failure on [25, 10, 30]
      const buggyArr = [25, 10, 30];
      const buggyPivot = buggyArr[0];
      let bLeft = 0;
      let bRight = buggyArr.length - 1;
      while (bLeft < bRight) {
        while (buggyArr[bLeft] <= buggyPivot && bLeft < bRight) bLeft++;
        while (buggyArr[bRight] >= buggyPivot && bLeft < bRight) bRight--;
        if (bLeft < bRight) {
          const t = buggyArr[bLeft];
          buggyArr[bLeft] = buggyArr[bRight];
          buggyArr[bRight] = t;
        }
      }
      const bTemp = buggyArr[0];
      buggyArr[0] = buggyArr[bRight];
      buggyArr[bRight] = bTemp;
      // Corrupted: 30 swapped to index 0, left of pivot 25!
      expect(buggyArr).toEqual([30, 10, 25]);

      // 3. Worst-case comparison count on sorted array of size 8
      const n = 8;
      const worstCaseComparisons = (n * (n - 1)) / 2;
      expect(worstCaseComparisons).toBe(28);
    });

    describe("Module 2 practice calculations and exam questions", () => {
      it("verifies Lab 8 Binary Search trace on even numbers array", () => {
        const array = Array.from({ length: 10 }, (_, i) => i * 2); // [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
        expect(array).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

        // (a) Successful search for K = 8
        let low = 0;
        let high = array.length - 1;
        let comparisons8 = 0;
        let foundIndex = -1;

        while (low <= high) {
          comparisons8++;
          const mid = Math.floor((low + high) / 2);
          if (array[mid] === 8) {
            foundIndex = mid;
            break;
          } else if (array[mid] < 8) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        expect(comparisons8).toBe(1);
        expect(foundIndex).toBe(4);
        expect(foundIndex + 1).toBe(5); // 1-based location

        // (c) Unsuccessful search for K = 7
        low = 0;
        high = array.length - 1;
        let comparisons7 = 0;
        const trace7: Array<{ low: number; high: number; mid: number; val: number }> = [];

        while (low <= high) {
          comparisons7++;
          const mid = Math.floor((low + high) / 2);
          trace7.push({ low, high, mid, val: array[mid] });
          if (array[mid] === 7) {
            break;
          } else if (array[mid] < 7) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        expect(comparisons7).toBe(4);
        expect(trace7).toEqual([
          { low: 0, high: 9, mid: 4, val: 8 },
          { low: 0, high: 3, mid: 1, val: 2 },
          { low: 2, high: 3, mid: 2, val: 4 },
          { low: 3, high: 3, mid: 3, val: 6 },
        ]);
        expect(low).toBe(4);
        expect(high).toBe(3);
        expect(low <= high).toBe(false);
      });

      it("verifies binary search failure on unsorted array and comparison bounds", () => {
        const unsorted = [4, 9, 1, 7, 3, 8];
        let low = 0;
        let high = unsorted.length - 1;
        let result = -1;
        const steps: number[] = [];

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          steps.push(unsorted[mid]);
          if (unsorted[mid] === 9) {
            result = mid;
            break;
          } else if (unsorted[mid] < 9) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        expect(result).toBe(-1); // Fails to find 9!
        expect(steps).toEqual([1, 3, 8]);

        // Comparison bound for n = 1024
        const n = 1024;
        const maxComparisons = Math.floor(Math.log2(n)) + 1;
        expect(maxComparisons).toBe(11);
      });

      it("verifies 32-bit signed overflow and 2-element boundary condition", () => {
        const low = 1_000_000_000;
        const high = 1_500_000_000;
        // 32-bit signed addition wrap-around
        const sum32 = (low + high) | 0;
        expect(sum32).toBe(-1794967296);
        const midBuggy = (sum32 / 2) | 0;
        expect(midBuggy).toBe(-897483648);

        // Safe subtraction midpoint
        const midSafe = low + Math.floor((high - low) / 2);
        expect(midSafe).toBe(1_250_000_000);

        // Premature exit of low < high on 2-element array [10, 20] searching for 20
        const arr = [10, 20];
        let l = 0;
        let h = 1;
        let found = -1;
        while (l < h) {
          const m = Math.floor((l + h) / 2);
          if (arr[m] === 20) {
            found = m;
            break;
          } else if (arr[m] < 20) {
            l = m + 1;
          } else {
            h = m - 1;
          }
        }
        expect(found).toBe(-1); // Prematurely stopped at l = 1, h = 1 without checking index 1
      });

      it("verifies sorting breakeven calculation for n = 1024", () => {
        const n = 1024;
        const log2n = Math.log2(n); // 10
        const sortCost = n * log2n; // 10240
        const searchDiff = n / 2 - log2n; // 512 - 10 = 502
        const kThreshold = sortCost / searchDiff; // ~20.398
        expect(kThreshold).toBeCloseTo(20.398, 2);
        expect(Math.ceil(kThreshold)).toBe(21);
      });

      it("verifies Euclid GCD trace on (45, 210), (31415, 14142), and worst-case Fibonacci (89, 55)", () => {
        // Trace GCD(45, 210)
        let m = 45;
        let n = 210;
        let divisions45_210 = 0;
        const pairs: Array<[number, number]> = [];

        while (n !== 0) {
          divisions45_210++;
          const r = m % n;
          pairs.push([m, n]);
          m = n;
          n = r;
        }
        expect(m).toBe(15);
        expect(divisions45_210).toBe(4);
        expect(pairs).toEqual([
          [45, 210],
          [210, 45],
          [45, 30],
          [30, 15],
        ]);

        // Homework GCD(31415, 14142)
        let mHw = 31415;
        let nHw = 14142;
        let divisionsHw = 0;
        while (nHw !== 0) {
          divisionsHw++;
          const r = mHw % nHw;
          mHw = nHw;
          nHw = r;
        }
        expect(mHw).toBe(1); // Coprime
        expect(divisionsHw).toBe(10);

        // Worst-case Fibonacci (89, 55)
        let mFib = 89;
        let nFib = 55;
        let divisionsFib = 0;
        const quotients: number[] = [];
        while (nFib !== 0) {
          divisionsFib++;
          quotients.push(Math.floor(mFib / nFib));
          const r = mFib % nFib;
          mFib = nFib;
          nFib = r;
        }
        expect(mFib).toBe(1);
        expect(divisionsFib).toBe(9);
        expect(quotients).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 2]); // All 1s until base case

        // Buggy swap order in Euclid
        let mBug = 60;
        let nBug = 24;
        while (nBug !== 0) {
          const r = mBug % nBug;
          nBug = r;
          mBug = nBug; // Buggy: copies updated nBug (which is r) into mBug!
        }
        expect(mBug).toBe(0); // Erroneous 0

        // LCM derivation
        const gcd60_24 = 12;
        const lcm = (60 / gcd60_24) * 24;
        expect(lcm).toBe(120);
      });
    });

    describe("Module 3 practice calculations and exam questions", () => {
      it("verifies Lecture 7 DFS and BFS traces, orders, and tree edges on 7-vertex graph", () => {
        // Graph V = {A, B, C, D, E, F, G}
        const adj: Record<string, string[]> = {
          A: ["B", "D", "E"],
          B: ["A", "C", "E"],
          C: ["B", "E", "F", "G"],
          D: ["A", "E"],
          E: ["A", "B", "C", "D", "F"],
          F: ["C", "E", "G"],
          G: ["C", "F"],
        };

        // 1. DFS trace starting from A (alphabetical order)
        const dfsVisited = new Set<string>();
        const dfsOrder: string[] = [];
        const dfsTreeEdges: string[] = [];
        const stack: string[] = ["A"];
        dfsVisited.add("A");
        dfsOrder.push("A");

        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          const unvisitedNeighbor = adj[top].find((w) => !dfsVisited.has(w));
          if (unvisitedNeighbor) {
            dfsVisited.add(unvisitedNeighbor);
            dfsOrder.push(unvisitedNeighbor);
            dfsTreeEdges.push(`${top}-${unvisitedNeighbor}`);
            stack.push(unvisitedNeighbor);
          } else {
            stack.pop(); // backtrack
          }
        }

        expect(dfsOrder).toEqual(["A", "B", "C", "E", "D", "F", "G"]);
        expect(dfsTreeEdges).toEqual(["A-B", "B-C", "C-E", "E-D", "E-F", "F-G"]);
        expect(dfsTreeEdges.length).toBe(6);

        // 2. BFS trace starting from A (alphabetical order)
        const bfsVisited = new Set<string>();
        const bfsOrder: string[] = [];
        const bfsTreeEdges: string[] = [];
        const queue: string[] = ["A"];
        bfsVisited.add("A");

        while (queue.length > 0) {
          const v = queue.shift()!;
          bfsOrder.push(v);
          for (const w of adj[v]) {
            if (!bfsVisited.has(w)) {
              bfsVisited.add(w);
              bfsTreeEdges.push(`${v}-${w}`);
              queue.push(w);
            }
          }
        }

        expect(bfsOrder).toEqual(["A", "B", "D", "E", "C", "F", "G"]);
        expect(bfsTreeEdges).toEqual(["A-B", "A-D", "A-E", "B-C", "E-F", "C-G"]);
        expect(bfsTreeEdges.length).toBe(6);
      });

      it("verifies Homework 9-vertex A-to-S graph DFS and BFS spanning trees", () => {
        const adj: Record<string, string[]> = {
          A: ["B", "S"],
          B: ["A"],
          C: ["D", "E", "F", "S"],
          D: ["C"],
          E: ["C", "H"],
          F: ["C", "G"],
          G: ["F", "H", "S"],
          H: ["E", "G"],
          S: ["A", "C", "G"],
        };

        // DFS trace from A
        const dfsVisited = new Set<string>();
        const dfsOrder: string[] = [];
        const dfsTreeEdges: string[] = [];
        const stack: string[] = ["A"];
        dfsVisited.add("A");
        dfsOrder.push("A");

        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          const next = adj[top].find((w) => !dfsVisited.has(w));
          if (next) {
            dfsVisited.add(next);
            dfsOrder.push(next);
            dfsTreeEdges.push(`${top}-${next}`);
            stack.push(next);
          } else {
            stack.pop();
          }
        }

        expect(dfsOrder).toEqual(["A", "B", "S", "C", "D", "E", "H", "G", "F"]);
        expect(dfsTreeEdges).toEqual(["A-B", "A-S", "S-C", "C-D", "C-E", "E-H", "H-G", "G-F"]);
        expect(dfsTreeEdges.length).toBe(8); // V - 1 = 9 - 1 = 8

        // BFS trace from A
        const bfsVisited = new Set<string>();
        const bfsOrder: string[] = [];
        const bfsTreeEdges: string[] = [];
        const queue: string[] = ["A"];
        bfsVisited.add("A");

        while (queue.length > 0) {
          const v = queue.shift()!;
          bfsOrder.push(v);
          for (const w of adj[v]) {
            if (!bfsVisited.has(w)) {
              bfsVisited.add(w);
              bfsTreeEdges.push(`${v}-${w}`);
              queue.push(w);
            }
          }
        }

        expect(bfsOrder).toEqual(["A", "B", "S", "C", "G", "D", "E", "F", "H"]);
        expect(bfsTreeEdges).toEqual(["A-B", "A-S", "S-C", "S-G", "C-D", "C-E", "C-F", "G-H"]);
        expect(bfsTreeEdges.length).toBe(8); // V - 1 = 8

        // Both spanning trees have exactly V - 1 edges
        const V = Object.keys(adj).length;
        expect(dfsTreeEdges.length).toBe(V - 1);
        expect(bfsTreeEdges.length).toBe(V - 1);
      });

      it("verifies BFS Queue Explosion on diamond graph when marking visited on dequeue", () => {
        // Diamond graph: 0-1, 0-2, 1-3, 2-3
        const adj = [
          [1, 2],
          [0, 3],
          [0, 3],
          [1, 2],
        ];

        // 1. Correct BFS: mark visited on enqueue
        const correctQueue: number[] = [];
        const correctVisited = new Array(4).fill(false);
        let correctEnqueues = 0;

        correctVisited[0] = true;
        correctQueue.push(0);
        correctEnqueues++;

        while (correctQueue.length > 0) {
          const v = correctQueue.shift()!;
          for (const w of adj[v]) {
            if (!correctVisited[w]) {
              correctVisited[w] = true;
              correctQueue.push(w);
              correctEnqueues++;
            }
          }
        }
        expect(correctEnqueues).toBe(4); // Each vertex enqueued exactly once

        // 2. Buggy BFS: mark visited on dequeue
        const buggyQueue: number[] = [];
        const buggyVisited = new Array(4).fill(false);
        let buggyEnqueues = 0;

        buggyQueue.push(0);
        buggyEnqueues++;

        const enqueuedOrder: number[] = [0];
        while (buggyQueue.length > 0) {
          const v = buggyQueue.shift()!;
          buggyVisited[v] = true; // Bug: marked here!
          for (const w of adj[v]) {
            if (!buggyVisited[w]) {
              buggyQueue.push(w);
              buggyEnqueues++;
              enqueuedOrder.push(w);
            }
          }
        }
        expect(buggyEnqueues).toBe(5); // Vertex 3 is enqueued twice!
        expect(enqueuedOrder).toEqual([0, 1, 2, 3, 3]);
      });

      it("verifies Adjacency List vs Matrix space and Handshaking Lemma", () => {
        const V = 10_000;
        const E = 50_000;

        // Matrix: 1 byte per cell
        const matrixBytes = V * V * 1;
        expect(matrixBytes).toBe(100_000_000); // 100 MB

        // List: 4 bytes per header (V headers) + 4 bytes per edge endpoint (2E endpoints)
        const listInts = V + 2 * E;
        expect(listInts).toBe(110_000);
        const listBytes = listInts * 4;
        expect(listBytes).toBe(440_000); // 0.44 MB

        const spaceSavingsRatio = matrixBytes / listBytes;
        expect(spaceSavingsRatio).toBeCloseTo(227.27, 2);

        // Handshaking Lemma: sum of degrees is 2E
        const averageDegree = 10;
        const totalDegreeSum = V * averageDegree;
        expect(totalDegreeSum).toBe(2 * E);
      });

      it("verifies Disconnected Components traversal with wrapper", () => {
        // Component 1: 0-1, 1-2, 2-0 (size 3)
        // Component 2: 3-4, 4-5, 5-6, 6-7 (size 5)
        const n = 8;
        const adj: number[][] = [
          [1, 2],
          [0, 2],
          [0, 1],
          [4],
          [3, 5],
          [4, 6],
          [5, 7],
          [6],
        ];

        // Single BFS from 0
        const visitedSingle = new Array(n).fill(false);
        const queueSingle: number[] = [0];
        visitedSingle[0] = true;
        let singleVisitedCount = 0;

        while (queueSingle.length > 0) {
          const v = queueSingle.shift()!;
          singleVisitedCount++;
          for (const w of adj[v]) {
            if (!visitedSingle[w]) {
              visitedSingle[w] = true;
              queueSingle.push(w);
            }
          }
        }
        expect(singleVisitedCount).toBe(3); // Only component 1
        expect(visitedSingle).toEqual([true, true, true, false, false, false, false, false]);

        // Full wrapper across all components
        const visitedFull = new Array(n).fill(false);
        let components = 0;
        let fullVisitedCount = 0;

        for (let i = 0; i < n; i++) {
          if (!visitedFull[i]) {
            components++;
            const q = [i];
            visitedFull[i] = true;
            while (q.length > 0) {
              const v = q.shift()!;
              fullVisitedCount++;
              for (const w of adj[v]) {
                if (!visitedFull[w]) {
                  visitedFull[w] = true;
                  q.push(w);
                }
              }
            }
          }
        }
        expect(components).toBe(2);
        expect(fullVisitedCount).toBe(8);
      });
    });

    describe("Module 4 practice calculations and exam questions", () => {
      it("verifies Prim's algorithm trace starting from vertex C and total weight 15", () => {
        // Vertices: 0=a, 1=b, 2=c, 3=d, 4=e, 5=f
        // Edges: ab=3, bc=1, bf=4, cf=4, af=5, df=5, ae=6, cd=6, ef=2, de=8
        const n = 6;
        const adj: { to: number; weight: number; name: string }[][] = Array.from({ length: n }, () => []);
        const addEdge = (u: number, v: number, w: number, name: string) => {
          adj[u].push({ to: v, weight: w, name });
          adj[v].push({ to: u, weight: w, name });
        };
        addEdge(0, 1, 3, "ab");
        addEdge(1, 2, 1, "bc");
        addEdge(1, 5, 4, "bf");
        addEdge(2, 5, 4, "cf");
        addEdge(0, 5, 5, "af");
        addEdge(5, 3, 5, "df");
        addEdge(0, 4, 6, "ae");
        addEdge(2, 3, 6, "cd");
        addEdge(5, 4, 2, "ef");
        addEdge(4, 3, 8, "de");

        // Trace from vertex c (index 2)
        const inTree = new Array(n).fill(false);
        inTree[2] = true;
        const treeEdges: { from: number; to: number; weight: number; name: string }[] = [];
        let totalWeight = 0;

        for (let step = 1; step < n; step++) {
          let minWeight = Infinity;
          let bestEdge: { from: number; to: number; weight: number; name: string } | null = null;

          for (let u = 0; u < n; u++) {
            if (inTree[u]) {
              for (const e of adj[u]) {
                if (!inTree[e.to]) {
                  // Tie-breaker: lowest weight, then alphabetical by edge name
                  if (
                    e.weight < minWeight ||
                    (e.weight === minWeight && bestEdge && e.name < bestEdge.name)
                  ) {
                    minWeight = e.weight;
                    bestEdge = { from: u, to: e.to, weight: e.weight, name: e.name };
                  }
                }
              }
            }
          }

          expect(bestEdge).not.toBeNull();
          inTree[bestEdge!.to] = true;
          treeEdges.push(bestEdge!);
          totalWeight += bestEdge!.weight;
        }

        expect(treeEdges.map((e) => e.name)).toEqual(["bc", "ab", "bf", "ef", "df"]);
        expect(treeEdges.map((e) => e.weight)).toEqual([1, 3, 4, 2, 5]);
        expect(totalWeight).toBe(15);
        expect(inTree.every((v) => v)).toBe(true);
      });

      it("verifies Kruskal's algorithm trace, cycle rejections (cf, af), and total weight 15", () => {
        // 0=a, 1=b, 2=c, 3=d, 4=e, 5=f
        const edges = [
          { u: 1, v: 2, weight: 1, name: "bc" },
          { u: 4, v: 5, weight: 2, name: "ef" },
          { u: 0, v: 1, weight: 3, name: "ab" },
          { u: 1, v: 5, weight: 4, name: "bf" },
          { u: 2, v: 5, weight: 4, name: "cf" },
          { u: 0, v: 5, weight: 5, name: "af" },
          { u: 3, v: 5, weight: 5, name: "df" },
          { u: 0, v: 4, weight: 6, name: "ae" },
          { u: 2, v: 3, weight: 6, name: "cd" },
          { u: 3, v: 4, weight: 8, name: "de" },
        ];

        // Sort edges non-decreasing
        edges.sort((a, b) => a.weight - b.weight);

        const parent = [0, 1, 2, 3, 4, 5];
        const find = (x: number): number => {
          while (parent[x] !== x) x = parent[x];
          return x;
        };

        const accepted: string[] = [];
        const rejected: string[] = [];
        let totalWeight = 0;

        for (const e of edges) {
          const rootU = find(e.u);
          const rootV = find(e.v);
          if (rootU !== rootV) {
            parent[rootU] = rootV;
            accepted.push(e.name);
            totalWeight += e.weight;
            if (accepted.length === 5) break;
          } else {
            rejected.push(e.name);
          }
        }

        expect(accepted).toEqual(["bc", "ef", "ab", "bf", "df"]);
        expect(rejected).toEqual(["cf", "af"]);
        expect(totalWeight).toBe(15);
      });

      it("verifies greedy coin change counterexample failure on {1, 3, 4}", () => {
        const coins = [4, 3, 1]; // sorted descending for greedy

        const greedyCoins = (amount: number): number[] => {
          const result: number[] = [];
          let rem = amount;
          for (const c of coins) {
            while (rem >= c) {
              result.push(c);
              rem -= c;
            }
          }
          return result;
        };

        const minCoinsDP = (amount: number): number => {
          const dp = new Array(amount + 1).fill(Infinity);
          dp[0] = 0;
          for (let i = 1; i <= amount; i++) {
            for (const c of coins) {
              if (i >= c) dp[i] = Math.min(dp[i], 1 + dp[i - c]);
            }
          }
          return dp[amount];
        };

        // Amount 6: greedy gives 4 + 1 + 1 (3 coins), optimal is 3 + 3 (2 coins)
        expect(greedyCoins(6)).toEqual([4, 1, 1]);
        expect(greedyCoins(6).length).toBe(3);
        expect(minCoinsDP(6)).toBe(2);

        // Amount 10: greedy gives 4 + 4 + 1 + 1 (4 coins), optimal is 4 + 3 + 3 (3 coins)
        expect(greedyCoins(10)).toEqual([4, 4, 1, 1]);
        expect(greedyCoins(10).length).toBe(4);
        expect(minCoinsDP(10)).toBe(3);

        // Amount 14: greedy gives 4 + 4 + 4 + 1 + 1 (5 coins), optimal is 4 + 4 + 3 + 3 (4 coins)
        expect(greedyCoins(14)).toEqual([4, 4, 4, 1, 1]);
        expect(greedyCoins(14).length).toBe(5);
        expect(minCoinsDP(14)).toBe(4);
      });

      it("verifies 0/1 knapsack DP table hand trace, corner value 140, and unbounded bug 200", () => {
        const wt = [3, 2, 4, 1];
        const val = [100, 20, 60, 40];
        const W = 5;
        const n = wt.length;

        // 1. Correct 0/1 Knapsack Table
        const V: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
        for (let i = 1; i <= n; i++) {
          for (let w = 1; w <= W; w++) {
            if (wt[i - 1] > w) {
              V[i][w] = V[i - 1][w];
            } else {
              V[i][w] = Math.max(V[i - 1][w], val[i - 1] + V[i - 1][w - wt[i - 1]]);
            }
          }
        }

        // Verify each row
        expect(V[0]).toEqual([0, 0, 0, 0, 0, 0]);
        expect(V[1]).toEqual([0, 0, 0, 100, 100, 100]);
        expect(V[2]).toEqual([0, 0, 20, 100, 100, 120]);
        expect(V[3]).toEqual([0, 0, 20, 100, 100, 120]); // Row 3 identical to Row 2
        expect(V[4]).toEqual([0, 40, 40, 100, 140, 140]);
        expect(V[4][5]).toBe(140);

        // 2. Buggy Unbounded Knapsack Table (reading from current row i)
        const Vbug: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
        for (let i = 1; i <= n; i++) {
          for (let w = 1; w <= W; w++) {
            if (wt[i - 1] > w) {
              Vbug[i][w] = Vbug[i - 1][w];
            } else {
              Vbug[i][w] = Math.max(Vbug[i - 1][w], val[i - 1] + Vbug[i][w - wt[i - 1]]);
            }
          }
        }
        expect(Vbug[4]).toEqual([0, 40, 80, 120, 160, 200]);
        expect(Vbug[4][5]).toBe(200); // 5 * 40 by taking item 4 five times
      });

      it("verifies knapsack backtracking subset reconstruction selecting items {1, 4}", () => {
        const wt = [3, 2, 4, 1];
        const val = [100, 20, 60, 40];
        const W = 5;
        const n = wt.length;

        const V: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
        for (let i = 1; i <= n; i++) {
          for (let w = 1; w <= W; w++) {
            if (wt[i - 1] > w) {
              V[i][w] = V[i - 1][w];
            } else {
              V[i][w] = Math.max(V[i - 1][w], val[i - 1] + V[i - 1][w - wt[i - 1]]);
            }
          }
        }

        // Backtrack
        const itemsTaken: number[] = [];
        let currW = W;
        for (let i = n; i >= 1; i--) {
          if (V[i][currW] !== V[i - 1][currW]) {
            itemsTaken.push(i); // 1-indexed item number
            currW -= wt[i - 1];
          }
        }

        expect(itemsTaken).toEqual([4, 1]); // Items 4 and 1 taken
        const totalWeight = itemsTaken.reduce((sum, idx) => sum + wt[idx - 1], 0);
        const totalVal = itemsTaken.reduce((sum, idx) => sum + val[idx - 1], 0);
        expect(totalWeight).toBe(4);
        expect(totalWeight).toBeLessThanOrEqual(W);
        expect(totalVal).toBe(140);
        expect(currW).toBe(1); // 1 unit capacity remains empty
      });

      it("verifies 1D array space-optimized knapsack requires backwards iteration", () => {
        const wt = [3, 2, 4, 1];
        const val = [100, 20, 60, 40];
        const W = 5;

        // Backwards iteration: correct 0/1 knapsack
        const dpBackwards = new Array(W + 1).fill(0);
        for (let i = 0; i < wt.length; i++) {
          for (let w = W; w >= wt[i]; w--) {
            dpBackwards[w] = Math.max(dpBackwards[w], val[i] + dpBackwards[w - wt[i]]);
          }
        }
        expect(dpBackwards[5]).toBe(140);
        expect(dpBackwards).toEqual([0, 40, 40, 100, 140, 140]);

        // Forward iteration: buggy unbounded knapsack
        const dpForwards = new Array(W + 1).fill(0);
        for (let i = 0; i < wt.length; i++) {
          for (let w = wt[i]; w <= W; w++) {
            dpForwards[w] = Math.max(dpForwards[w], val[i] + dpForwards[w - wt[i]]);
          }
        }
        expect(dpForwards[5]).toBe(200);
        expect(dpForwards).toEqual([0, 40, 80, 120, 160, 200]);
      });
    });
  });
});
