import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { render, screen, fireEvent } from "@testing-library/react";
import { LinuxTerminal } from "@/components/mdx/OsVisualizers";
import { getCourse, flattenLessons } from "@/content/registry";
import { dualModeFrames, interruptCount, interruptFrames, INTERRUPT_TIMELINE, runJobs, DEMO_JOBS, syscallFrames, SYSCALL_TABLE, paramPassing, bootFrames, BOOT_STAGES, nextState, PROCESS_TRANSITIONS, contextSwitchFrames, forkTree, ring, produce, consume, ringFull, ringCount, messageSim, runThreads, matrixAddFrames } from "@/lib/operatingSystems";

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

describe("chapter 2 helpers", () => {
  it("looks up the right system-call number and returns to user mode", () => {
    for (const call of ["open", "printf"] as const) {
      const frames = syscallFrames(call);
      const idx = frames.find((f) => f.state.index !== null)!.state.index!;
      expect(SYSCALL_TABLE[idx]).toBe(call === "open" ? "open" : "write");
      expect(frames[0].state.mode).toBe(1);
      expect(frames[frames.length - 1].state.mode).toBe(1);
      expect(frames.some((f) => f.state.mode === 0)).toBe(true);
    }
  });

  it("runs out of registers but never out of table or stack space", () => {
    const six = ["a", "b", "c", "d", "e", "f"];
    expect(paramPassing("registers", six).overflow).toBe(true);
    expect(paramPassing("registers", six.slice(0, 3)).overflow).toBe(false);
    expect(paramPassing("table", six).memory).toEqual(six);
    expect(paramPassing("table", six).registers).toHaveLength(1);
    expect(paramPassing("stack", six).stack[0]).toBe("f");
  });

  it("boots in order and ends running", () => {
    const frames = bootFrames();
    expect(frames.map((f) => f.state.stage)).toEqual(BOOT_STAGES.map((_, i) => i));
  });
});

describe("Linux practice terminal", () => {
  it("runs typed commands and ticks off missions", () => {
    render(<LinuxTerminal />);
    const input = screen.getByLabelText("terminal input");
    fireEvent.change(input, { target: { value: "mkdir new1" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "ls" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("log").textContent).toContain("dir1  dir2  file1  file2.txt  new1");
    expect(screen.getByText("1/10 missions")).toBeTruthy();
  });
});

describe("chapter 3 helpers", () => {
  it("only allows the textbook's state transitions", () => {
    expect(nextState("new", "admitted")).toBe("ready");
    expect(nextState("ready", "dispatch")).toBe("running");
    expect(nextState("ready", "wait")).toBeNull();
    expect(nextState("waiting", "dispatch")).toBeNull();
    expect(nextState("running", "exit")).toBe("terminated");
    expect(PROCESS_TRANSITIONS).toHaveLength(6);
  });

  it("saves into and reloads from the right PCB", () => {
    const frames = contextSwitchFrames();
    const touched = frames.filter((f) => f.state.touch !== null).map((f) => [f.state.phase, f.state.touch]);
    expect(touched).toEqual([["save", 0], ["reload", 1], ["save", 1], ["reload", 0]]);
    const last = frames[frames.length - 1].state;
    expect(last.cpu!.pc).toBeGreaterThan(last.pcb[0].pc);
    expect(frames.filter((f) => f.state.running === null).length).toBe(6);
  });

  it("makes 2^n processes from n forks", () => {
    for (let n = 0; n <= 4; n++) expect(forkTree(n)).toHaveLength(2 ** n);
    expect(forkTree(2).filter((p) => p.parent === 0)).toHaveLength(2);
  });

  it("uses only BUFFER_SIZE - 1 slots of the bounded buffer", () => {
    let r = ring(10);
    let made = 0;
    for (let next = produce(r); next; next = produce(r)) {
      r = next;
      made++;
    }
    expect(made).toBe(9);
    expect(ringFull(r)).toBe(true);
    const c = consume(r)!;
    expect(c.item).toBe(1);
    expect(ringCount(c.ring)).toBe(8);
  });

  it("blocks the sender according to the link's capacity", () => {
    const blocked = (cap: "zero" | "bounded" | "unbounded") => messageSim(cap, 18).filter((x) => x.blocked).length;
    expect(blocked("unbounded")).toBe(0);
    expect(blocked("zero")).toBeGreaterThan(blocked("bounded"));
    expect(blocked("bounded")).toBeGreaterThan(0);
    expect(Math.max(...messageSim("bounded", 18).map((x) => x.queue))).toBe(3);
  });
});

describe("lab 2 helpers", () => {
  const base = { yieldEach: false, join: false, priorities: { t1: 5, A: 5, B: 5 }, iterations: 5, seed: 3 };

  it("prints every thread's lines plus main's exactly once", () => {
    const out = runThreads(base);
    expect(out.filter((l) => l.thread === "main")).toHaveLength(1);
    for (const t of ["t1", "A", "B"] as const) expect(out.filter((l) => l.thread === t)).toHaveLength(5);
  });

  it("puts main last when it joins, and alternates threads with yield", () => {
    const joined = runThreads({ ...base, join: true });
    expect(joined[joined.length - 1].thread).toBe("main");
    const turns = runThreads({ ...base, yieldEach: true, join: true }).filter((l) => l.thread !== "main").map((l) => l.thread);
    expect(turns.slice(0, 6)).toEqual(["t1", "A", "B", "t1", "A", "B"]);
  });

  it("replays the same schedule for the same seed", () => {
    expect(runThreads(base)).toEqual(runThreads(base));
  });

  it("fills every cell before main's join returns", () => {
    const frames = matrixAddFrames(3, 4);
    const last = frames[frames.length - 1].state;
    expect(last.joined).toBe(true);
    expect(last.done.flat().every(Boolean)).toBe(true);
    expect(frames.slice(0, -1).every((f) => !f.state.joined)).toBe(true);
  });
});
