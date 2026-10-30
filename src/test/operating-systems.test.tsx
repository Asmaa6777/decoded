import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { render, screen, fireEvent } from "@testing-library/react";
import { LinuxTerminal } from "@/components/mdx/OsVisualizers";
import { getCourse, flattenLessons } from "@/content/registry";
import { dualModeFrames, interruptCount, interruptFrames, INTERRUPT_TIMELINE, runJobs, DEMO_JOBS, syscallFrames, SYSCALL_TABLE, paramPassing, bootFrames, BOOT_STAGES, nextState, PROCESS_TRANSITIONS, contextSwitchFrames, forkTree, ring, produce, consume, ringFull, ringCount, messageSim, runThreads, matrixAddFrames, raceRun, TEXTBOOK_RACE, petersonStart, petersonStep, seeded, testAndSet, compareAndSwap, semWait, semSignal, deadlockFrames, semBuffer, semProduce, semConsume, rwStart, rwArrive, rwLeave, diningStart, diningStep, diningDeadlocked, type PetersonState, type Dining } from "@/lib/operatingSystems";

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

describe("chapter 5 helpers", () => {
  it("reproduces the slides' race: counter ends at 4, not 5", () => {
    const run = raceRun(TEXTBOOK_RACE);
    expect(run[run.length - 1].counter).toBe(4);
    expect(raceRun(["P", "P", "C", "C", "C", "P"]).at(-1)!.counter).toBe(6);
    expect(raceRun(["P", "P", "P", "C", "C", "C"]).at(-1)!.counter).toBe(5);
  });

  it("never lets both processes into Peterson's critical section", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rnd = seeded(seed);
      let s: PetersonState = petersonStart();
      for (let k = 0; k < 400; k++) {
        s = petersonStep(s, rnd() < 0.5 ? 0 : 1);
        expect(s.pc[0] === 3 && s.pc[1] === 3).toBe(false);
      }
      expect(s.entries[0] + s.entries[1]).toBeGreaterThan(0);
    }
  });

  it("implements test_and_set and compare_and_swap", () => {
    const lock = { value: false };
    expect(testAndSet(lock)).toBe(false);
    expect(testAndSet(lock)).toBe(true);
    const v = { value: 0 };
    expect(compareAndSwap(v, 0, 1)).toBe(0);
    expect(v.value).toBe(1);
    expect(compareAndSwap(v, 0, 1)).toBe(1);
  });

  it("queues blocked processes on a semaphore and wakes them in order", () => {
    let s = { value: 1, list: [] as string[] };
    s = semWait(s, "P1").sem;
    const b = semWait(s, "P2");
    expect(b.blocked).toBe(true);
    s = semWait(b.sem, "P3").sem;
    expect(s).toEqual({ value: -2, list: ["P2", "P3"] });
    const w = semSignal(s);
    expect(w.woke).toBe("P2");
    expect(w.sem.value).toBe(-1);
  });

  it("ends the S/Q example with both processes blocked", () => {
    const last = deadlockFrames().at(-1)!.state;
    expect(last.waiting).toEqual({ P0: "Q", P1: "S" });
  });

  it("lets the semaphore buffer use every slot and blocks at the ends", () => {
    let b = semBuffer(4);
    for (let i = 0; i < 4; i++) b = semProduce(b);
    expect(b.full).toBe(4);
    b = semProduce(b);
    expect(b.blockedP).toBe(1);
    b = semConsume(b);
    expect(b.empty).toBe(1);
  });

  it("lets readers share but keeps writers alone", () => {
    let s = rwArrive(rwArrive(rwStart(), "R"), "R");
    expect(s.reading).toEqual(["R1", "R2"]);
    s = rwArrive(s, "W");
    expect(s.writing).toBeNull();
    s = rwArrive(s, "R");
    expect(s.reading).toHaveLength(3);
    for (let i = 0; i < 3; i++) s = rwLeave(s, "R");
    expect(s.writing).toBe("W1");
    s = rwArrive(rwArrive(s, "R"), "R");
    expect(s.reading).toEqual([]);
    s = rwLeave(s, "W");
    expect(s.reading).toEqual(["R4", "R5"]);
  });

  it("deadlocks the naive philosophers but not the asymmetric ones", () => {
    let d: Dining = diningStart();
    for (let i = 0; i < 5; i++) d = diningStep(d, i, "naive");
    for (let i = 0; i < 5; i++) d = diningStep(d, i, "naive");
    expect(diningDeadlocked(d, "naive")).toBe(true);
    for (let seed = 1; seed <= 20; seed++) {
      const rnd = seeded(seed);
      let a = diningStart();
      for (let k = 0; k < 500; k++) {
        a = diningStep(a, Math.floor(rnd() * 5), "asymmetric");
        expect(diningDeadlocked(a, "asymmetric")).toBe(false);
      }
      expect(a.meals.reduce((x, y) => x + y, 0)).toBeGreaterThan(0);
    }
  });
});
