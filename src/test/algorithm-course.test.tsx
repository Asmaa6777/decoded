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
  const step = within(root).getByRole("button", { name: /step/i });
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
});
