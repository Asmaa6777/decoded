import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { render } from "@testing-library/react";
import { getCourse, flattenLessons } from "@/content/registry";
import { dualModeFrames, interruptCount, interruptFrames, INTERRUPT_TIMELINE, runJobs, DEMO_JOBS } from "@/lib/operatingSystems";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Operating Systems course", () => {
  const course = getCourse("operating-systems")!;

  it("is registered and available", () => {
    expect(course).toBeDefined();
    expect(course.status).toBe("available");
  });

  for (const lesson of flattenLessons(getCourse("operating-systems")!)) {
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
    const dir = path.resolve(__dirname, "../content/operating-systems");
    const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    const all = files.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n").toLowerCase();
    expect(files.length).toBe(flattenLessons(course).length);
    for (const banned of [
      "university", "faculty", "lecturer", "instructor", "professor", "wassif", "silberschatz", "galvin", "gagne",
      "copyright", "©", "9th edition", "dr.", "prof.", "eng.", "plagiarism", "cairo",
    ]) {
      expect(all, `found "${banned}"`).not.toContain(banned);
    }
  });
});

describe("chapter 1 helpers", () => {
  it("walks the interrupt timeline forward and handles two interrupts", () => {
    const frames = interruptFrames();
    const ts = frames.map((f) => f.state.t);
    expect(ts).toEqual([...ts].sort((a, b) => a - b));
    expect(ts[ts.length - 1]).toBe(INTERRUPT_TIMELINE.length);
    expect(frames.filter((f) => f.state.flash === "interrupt")).toHaveLength(2);
  });

  it("counts one interrupt per byte, or one per block with DMA", () => {
    expect(interruptCount(4096, "per-byte")).toBe(4096);
    expect(interruptCount(4096, "dma")).toBe(8);
    expect(interruptCount(1000, "dma")).toBe(2);
    expect(interruptCount(0, "dma")).toBe(0);
  });

  it("finishes the same work sooner with multiprogramming", () => {
    const single = runJobs(DEMO_JOBS, "single");
    const multi = runJobs(DEMO_JOBS, "multi");
    const cpuWork = DEMO_JOBS.reduce((s, j) => s + j.bursts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0), 0);
    expect(single.busy).toBe(cpuWork);
    expect(multi.busy).toBe(cpuWork);
    expect(single.total).toBe(DEMO_JOBS.reduce((s, j) => s + j.bursts.reduce((a, b) => a + b, 0), 0));
    expect(multi.total).toBeLessThan(single.total);
    expect(multi.utilization).toBeGreaterThan(single.utilization);
  });

  it("only runs in kernel mode between the trap and the return", () => {
    const frames = dualModeFrames();
    for (const f of frames) expect(f.state.mode === 0).toBe(f.state.where === "kernel");
  });
});
