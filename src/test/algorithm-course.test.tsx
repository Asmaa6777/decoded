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
  });
});
