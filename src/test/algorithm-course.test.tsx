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
});
