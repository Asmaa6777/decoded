import { describe, expect, it } from "vitest";
import { boundedWaitingFrames, compareSchedulers, faults, pipeCloseRead, pipeCloseWrite, pipeRead, pipeStart, pipeWrite, randomTrace, schedule, seeded, type Algo, type Proc, type Repl } from "@/lib/operatingSystems";

/* Cross-checks the course's schedulers and page-replacement policies against
   deliberately naive reference versions (one time unit, or one reference, at a
   time) on many random workloads. */

function reference(procs: Proc[], algo: Algo, q: number) {
  const n = procs.length;
  const left = procs.map((p) => p.burst);
  const done = procs.map(() => -1);
  const key = (i: number) => (algo === "sjf" || algo === "srtf" ? left[i] : algo.startsWith("priority") ? procs[i].priority ?? 0 : procs[i].arrival);
  const better = (a: number, b: number) => key(a) < key(b) || (key(a) === key(b) && (procs[a].arrival < procs[b].arrival || (procs[a].arrival === procs[b].arrival && a < b)));
  const queue: number[] = [];
  const order = procs.map((_, i) => i).sort((a, b) => procs[a].arrival - procs[b].arrival || a - b);
  let admitted = 0;
  let cur = -1;
  let used = 0;
  for (let t = 0; done.some((d) => d < 0); t++) {
    while (admitted < n && procs[order[admitted]].arrival <= t) queue.push(order[admitted++]);
    if (algo === "rr") {
      if (cur >= 0 && (left[cur] === 0 || used === q)) {
        if (left[cur] === 0) done[cur] = t;
        else queue.push(cur);
        cur = -1;
      }
      if (cur < 0 && queue.length) {
        cur = queue.shift()!;
        used = 0;
      }
    } else {
      if (cur >= 0 && left[cur] === 0) {
        done[cur] = t;
        cur = -1;
      }
      const ready = procs.map((_, i) => i).filter((i) => procs[i].arrival <= t && left[i] > 0);
      const best = ready.reduce((a, b) => (better(b, a) ? b : a), ready[0]);
      if (ready.length && (cur < 0 || ((algo === "srtf" || algo === "priority-p") && key(best) < key(cur)))) cur = best;
    }
    if (cur >= 0) {
      left[cur]--;
      used++;
    }
  }
  return procs.map((p, i) => done[i] - p.arrival - p.burst);
}

function refFaults(refs: number[], n: number, algo: "fifo" | "lru" | "opt") {
  let frames: number[] = [];
  let count = 0;
  refs.forEach((p, t) => {
    if (frames.includes(p)) {
      if (algo === "lru") frames = [...frames.filter((x) => x !== p), p];
      return;
    }
    count++;
    if (frames.length === n) {
      if (algo === "opt") {
        const next = (x: number) => (refs.indexOf(x, t + 1) < 0 ? Infinity : refs.indexOf(x, t + 1));
        // farthest next use; ties go to the page loaded earliest, which is the front of the list
        const victim = frames.reduce((a, b) => (next(b) > next(a) ? b : a));
        frames = frames.filter((x) => x !== victim);
      } else frames = frames.slice(1);
    }
    frames.push(p);
  });
  return count;
}

describe("CPU schedulers match a tick-by-tick reference", () => {
  const algos: Algo[] = ["fcfs", "sjf", "srtf", "priority", "priority-p", "rr"];
  it.each(algos)("%s on 2,000 random workloads", (algo) => {
    const rand = seeded(algos.indexOf(algo) + 11);
    for (let trial = 0; trial < 2000; trial++) {
      const n = 1 + Math.floor(rand() * 5);
      const procs: Proc[] = Array.from({ length: n }, (_, i) => ({
        name: `P${i + 1}`,
        arrival: Math.floor(rand() * 8),
        burst: 1 + Math.floor(rand() * 9),
        priority: 1 + Math.floor(rand() * 4),
      }));
      const q = 1 + Math.floor(rand() * 5);
      const got = schedule(procs, algo, q).stats.map((s) => s.waiting);
      expect(got, JSON.stringify({ procs, q })).toEqual(reference(procs, algo, q));
    }
  });
});

describe("page replacement matches a reference", () => {
  it.each(["fifo", "lru", "opt"] as const)("%s on 2,000 random strings", (algo) => {
    const rand = seeded(algo.length + 5);
    for (let trial = 0; trial < 2000; trial++) {
      const refs = Array.from({ length: 4 + Math.floor(rand() * 20) }, () => Math.floor(rand() * 7));
      const n = 1 + Math.floor(rand() * 5);
      expect(faults(refs, n, algo as Repl), JSON.stringify({ refs, n })).toBe(refFaults(refs, n, algo));
    }
  });
});

describe("bounded waiting with test_and_set", () => {
  it("never lets anyone wait more than n − 1 turns, and only one process is ever inside", () => {
    const f = boundedWaitingFrames("bounded");
    expect(Math.max(...f.map((x) => x.state.worst))).toBeLessThanOrEqual(3);
    expect(f.at(-1)!.state.lock).toBe(false);
    for (const x of f) expect(x.state.waiting.every((w, i) => !(w && x.state.inside === i))).toBe(true);
  });
  it("shows plain test_and_set starving a process", () => {
    const f = boundedWaitingFrames("simple");
    expect(f.at(-1)!.state.waited[3]).toBeGreaterThan(3);
    expect(f.at(-1)!.state.entries[3]).toBe(0);
  });
});

describe("ordinary pipes", () => {
  it("blocks a reader on an empty pipe until data arrives", () => {
    let p = pipeRead(pipeStart(), 3);
    expect(p.readerWants).toBe(3);
    p = pipeWrite(p, "hello");
    expect(p.readerWants).toBe(0);
    expect(p.received).toBe("hel");
    expect(p.buf.join("")).toBe("lo");
  });
  it("blocks a writer on a full pipe until there's room", () => {
    let p = pipeWrite(pipeStart(8), "pipes!");
    p = pipeWrite(p, "hello");
    expect(p.buf.length).toBe(8);
    expect(p.pending.join("")).toBe("llo");
    p = pipeRead(p, 3);
    expect(p.pending).toEqual([]);
    expect(p.buf.join("")).toBe("es!hello");
  });
  it("returns end of file once the write end is closed and the pipe drained", () => {
    let p = pipeCloseWrite(pipeWrite(pipeStart(), "hi"));
    p = pipeRead(p, 8);
    expect(p.received).toBe("hi");
    expect(p.eof).toBe(false);
    p = pipeRead(p, 8);
    expect(p.eof).toBe(true);
    const blocked = pipeCloseWrite(pipeRead(pipeStart(), 3));
    expect(blocked.eof).toBe(true);
  });
  it("breaks the pipe when the reader has gone", () => {
    expect(pipeWrite(pipeCloseRead(pipeStart()), "x").broken).toBe(true);
  });
});

describe("trace-driven simulation", () => {
  it("SRTF has the lowest average wait on every trace (it's provably optimal for that)", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const runs = compareSchedulers(randomTrace(seed), 4);
      const srtf = runs.find((r) => r.algo === "srtf")!.avgWaiting;
      for (const r of runs) expect(srtf, `seed ${seed} vs ${r.algo}`).toBeLessThanOrEqual(r.avgWaiting + 1e-9);
    }
  });
});
