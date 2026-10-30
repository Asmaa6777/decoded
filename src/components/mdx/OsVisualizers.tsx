import { useEffect, useMemo, useRef, useState } from "react";
import { btn, Legend, Stepper, Toggle } from "@/components/mdx/AlgoVisualizers";
import {
  DEMO_JOBS,
  DUAL_MODE_CODE,
  dualModeFrames,
  INTERRUPT_CODE,
  INTERRUPT_TIMELINE,
  interruptCount,
  interruptFrames,
  MIGRATION_STEPS,
  runJobs,
  STORAGE_LEVELS,
  type Lane,
  type ModeState,
  BOOT_CODE,
  BOOT_STAGES,
  bootFrames,
  COPY_FILE_CALLS,
  MICROKERNEL_HOPS,
  paramPassing,
  STRUCTURES,
  SYSCALL_CODE,
  SYSCALL_TABLE,
  syscallFrames,
  type BootState,
  type ParamMethod,
  type StructureKind,
  type SyscallState,
  consume,
  contextSwitchFrames,
  forkTree,
  LINUX_TREE,
  messageSim,
  nextState,
  produce,
  PROCESS_TRANSITIONS,
  ring,
  ringCount,
  ringEmpty,
  ringFull,
  SWITCH_CODE,
  type Capacity,
  type ForkNode,
  type PcbView,
  type PEvent,
  type PState,
  type Ring,
  type SwitchState,
} from "@/lib/operatingSystems";
import { exists, initialShell, promptPath, readFile, run, type ShellState } from "@/lib/miniShell";

/* ============================================================
   Visualizers for the Operating Systems course. They reuse the
   look (and, where it fits, the <Stepper>) of AlgoVisualizers.tsx;
   the logic lives in operatingSystems.ts.
   ============================================================ */

export function Panel({ title, legend, children }: { title: string; legend?: [string, string][]; children: React.ReactNode }) {
  return (
    <div className="not-prose my-8 border border-border bg-card rounded-sm overflow-hidden text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div className="eyebrow text-mint">{title}</div>
        {legend && <Legend items={legend} />}
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

/** Advance a counter every `ms` while `on`, wrapping at `n`. Drives the small looping animations. */
function useTicker(on: boolean, n: number, ms = 600) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(t);
  }, [on, n, ms]);
  return [i, setI] as const;
}

/* --------------------------- system layers --------------------------- */

const LAYERS = [
  { name: "Users", detail: "people, machines, other computers", tone: "border-sky bg-sky/10" },
  { name: "Application programs", detail: "browser, compiler, word processor, games, databases", tone: "border-violet bg-violet/10" },
  { name: "Operating system", detail: "controls and coordinates the hardware for everyone", tone: "border-mint bg-mint/15" },
  { name: "Hardware", detail: "CPU, memory, I/O devices", tone: "border-orange bg-orange/10" },
];

/** The four components of a computer system, with a request travelling down to the hardware and the answer coming back up. */
export function SystemLayers() {
  const [running, setRunning] = useState(false);
  // 0..3 going down, 4..6 coming back up
  const [step, setStep] = useTicker(running, 7, 650);
  const at = step <= 3 ? step : 6 - step;
  const goingUp = step > 3;
  const notes = [
    "You click 'Save' in an app.",
    "The app can't touch the disk itself, so it asks the operating system.",
    "The OS picks the right device driver and tells the disk controller what to write.",
    "The hardware does the actual work: bits land on the disk.",
    "The hardware reports back to the OS (with an interrupt).",
    "The OS tells the app the save worked.",
    "The app shows you a little 'Saved ✓'.",
  ];
  return (
    <Panel title="Four components of a computer system">
      <div className="flex flex-col gap-2">
        {LAYERS.map((l, i) => (
          <div
            key={l.name}
            className={`relative flex items-center justify-between gap-3 border-l-4 rounded-sm px-4 py-3 transition-all duration-300 ${l.tone} ${
              running && at === i ? "scale-[1.02] shadow-lg ring-1 ring-foreground/30" : "opacity-90"
            }`}
          >
            <div>
              <div className="font-display font-bold">{l.name}</div>
              <div className="text-xs text-muted-foreground">{l.detail}</div>
            </div>
            {running && at === i && (
              <span className="font-mono text-lg animate-bounce" aria-hidden>
                {goingUp ? "▲" : "▼"}
              </span>
            )}
          </div>
        ))}
      </div>
      <p aria-live="polite" className="min-h-[2.5em] text-sm leading-relaxed">
        {running ? notes[step] : "Press play to follow one request from a user, down through the layers to the hardware, and back up."}
      </p>
      <div className="flex gap-2">
        <button type="button" className={btn} onClick={() => setRunning((r) => !r)}>
          {running ? "❚❚ Pause" : "▶ Play"}
        </button>
        <button type="button" className={btn} onClick={() => { setRunning(false); setStep(0); }}>
          ⟲ Reset
        </button>
      </div>
    </Panel>
  );
}

/* --------------------------- interrupt timeline --------------------------- */

const LANE_TONE: Record<string, string> = {
  user: "bg-sky",
  isr: "bg-orange",
  idle: "bg-muted",
  transfer: "bg-violet",
};

function TimelineLane({ label, lane, t, length }: { label: string; lane: Lane; t: number; length: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="relative flex-1 h-7 rounded-sm bg-background/60 border border-border overflow-hidden">
        {lane.map((s, i) => {
          const end = Math.min(s.to, t);
          if (end <= s.from) return null;
          return (
            <div
              key={i}
              className={`absolute top-0 bottom-0 ${LANE_TONE[s.kind]} transition-all duration-500`}
              style={{ left: `${(s.from / length) * 100}%`, width: `${((end - s.from) / length) * 100}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** The textbook interrupt timeline, revealed step by step. */
export function InterruptTimeline() {
  const frames = useMemo(() => interruptFrames(), []);
  const { length, cpu, io } = INTERRUPT_TIMELINE;
  return (
    <Stepper
      title="Interrupt timeline"
      frames={frames}
      code={INTERRUPT_CODE}
      codeLabel="What happens"
      legend={[["bg-sky", "user process"], ["bg-orange", "interrupt handling"], ["bg-violet", "I/O transfer"], ["bg-muted", "idle"]]}
      render={(s) => (
        <div className="flex flex-col gap-3 min-w-[420px]">
          <TimelineLane label="CPU" lane={cpu} t={s.t} length={length} />
          <TimelineLane label="I/O device" lane={io} t={s.t} length={length} />
          <div className="flex items-center gap-3">
            <div className="w-24 shrink-0" />
            <div className="relative flex-1 h-6">
              <div className="absolute top-0 h-6 w-0.5 bg-foreground transition-all duration-500" style={{ left: `${(s.t / length) * 100}%` }} />
              {s.flash && (
                <span
                  key={`${s.t}-${s.flash}`}
                  className={`absolute -top-1 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm animate-in zoom-in-50 fade-in duration-300 ${
                    s.flash === "interrupt" ? "bg-orange text-background" : s.flash === "request" ? "bg-violet text-background" : "bg-sky text-background"
                  }`}
                  style={{ left: `${(s.t / length) * 100}%` }}
                >
                  {s.flash === "interrupt" ? "⚡ interrupt" : s.flash === "request" ? "I/O request" : "resume"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    />
  );
}

/* --------------------------- storage hierarchy --------------------------- */

/** The storage pyramid: click a level for its size, speed and volatility. */
export function StorageHierarchy() {
  const [sel, setSel] = useState(2);
  const lvl = STORAGE_LEVELS[sel];
  const n = STORAGE_LEVELS.length;
  return (
    <Panel title="Storage-device hierarchy" legend={[["bg-orange", "volatile"], ["bg-sky", "nonvolatile"]]}>
      <div className="flex flex-col items-center gap-1">
        {STORAGE_LEVELS.map((l, i) => (
          <button
            key={l.name}
            type="button"
            onClick={() => setSel(i)}
            className={`font-mono text-[11px] sm:text-xs py-2 rounded-sm border transition-all duration-300 ${
              l.volatile ? "border-orange/60 bg-orange/10" : "border-sky/60 bg-sky/10"
            } ${i === sel ? "ring-2 ring-foreground scale-[1.03]" : "hover:scale-[1.01]"}`}
            style={{ width: `${40 + (60 * i) / (n - 1)}%` }}
          >
            {l.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>▲ faster · smaller · more expensive per byte</span>
        <span>▼ slower · bigger · cheaper per byte</span>
      </div>
      <div key={sel} className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
        {[
          ["typical size", lvl.size],
          ["access time", lvl.access],
          ["volatile?", lvl.volatile ? "yes, lost on power-off" : "no, survives power-off"],
          ["managed by", lvl.managedBy],
        ].map(([k, v]) => (
          <div key={k} className="border border-border rounded-sm p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
            <div className="text-sm mt-1">{v}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Example: {lvl.example}.</p>
    </Panel>
  );
}

const PLACES = ["Magnetic disk", "Main memory", "Cache", "Hardware register"];

/** Integer A climbing from the disk to a CPU register, leaving a copy at every level. */
export function MigrationOfA() {
  const [i, setI] = useState(0);
  const step = MIGRATION_STEPS[i];
  return (
    <Panel title="Migration of integer A from disk to register">
      <div className="grid grid-cols-4 gap-2 items-end">
        {PLACES.map((p, k) => {
          const has = k <= step.at;
          const current = k === step.at;
          const stale = i === MIGRATION_STEPS.length - 1 && k < step.at;
          return (
            <div key={p} className="flex flex-col items-center gap-2">
              <div
                className={`h-16 w-16 sm:h-20 sm:w-20 rounded-sm border-2 flex items-center justify-center font-display text-2xl font-bold transition-all duration-500 ${
                  current ? "border-mint bg-mint/20 scale-110" : has ? (stale ? "border-orange bg-orange/10" : "border-border bg-muted/40") : "border-dashed border-border"
                }`}
              >
                {has && <span className={`animate-in zoom-in-50 duration-300 ${stale ? "text-orange" : ""}`}>{current && i === MIGRATION_STEPS.length - 1 ? "A+1" : "A"}</span>}
              </div>
              <div className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{p}</div>
            </div>
          );
        })}
      </div>
      <p aria-live="polite" className="min-h-[3em] text-sm leading-relaxed">
        {step.message}
      </p>
      <div className="flex gap-2">
        <button type="button" className={btn} onClick={() => setI(0)} disabled={i === 0}>
          ⟲ Reset
        </button>
        <button type="button" className={btn} onClick={() => setI((x) => Math.min(MIGRATION_STEPS.length - 1, x + 1))} disabled={i === MIGRATION_STEPS.length - 1}>
          Step →
        </button>
      </div>
    </Panel>
  );
}

/* ------------------------------ DMA ------------------------------ */

/** How many times the CPU gets interrupted moving a file, with and without DMA. */
export function DmaCounter() {
  const [kb, setKb] = useState(4);
  const bytes = kb * 1024;
  const perByte = interruptCount(bytes, "per-byte");
  const dma = interruptCount(bytes, "dma");
  const [tick] = useTicker(true, 12, 180);
  return (
    <Panel title="Interrupts without and with DMA" legend={[["bg-orange", "interrupt to the CPU"], ["bg-violet", "data"]]}>
      <label className="flex flex-wrap items-center gap-4 font-mono text-xs">
        <span className="uppercase tracking-widest text-muted-foreground">transfer size</span>
        <input type="range" min={1} max={64} value={kb} onChange={(e) => setKb(Number(e.target.value))} className="flex-1 min-w-[160px]" aria-label="transfer size in KB" />
        <span className="font-display text-lg font-bold w-20">{kb} KB</span>
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: "One interrupt per byte", count: perByte, every: 1 },
          { label: "DMA: one interrupt per 512-byte block", count: dma, every: 12 },
        ].map((m) => (
          <div key={m.label} className="border border-border rounded-sm p-4 flex flex-col gap-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
            <div className="flex items-center gap-1 h-6">
              {Array.from({ length: 12 }, (_, k) => (
                <span
                  key={k}
                  className={`h-4 w-4 rounded-[2px] transition-colors duration-150 ${
                    k <= tick ? ((k + 1) % m.every === 0 ? "bg-orange" : "bg-violet") : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="font-display text-3xl font-bold">{m.count.toLocaleString("en-US")}</div>
            <div className="text-xs text-muted-foreground">interrupts the CPU must stop for</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        With DMA the device controller copies whole blocks straight into main memory, and the CPU is only told once each block is done. That's {perByte && dma ? Math.round(perByte / dma) : 0}× fewer interruptions here.
      </p>
    </Panel>
  );
}

/* --------------------------- multiprogramming --------------------------- */

const JOB_TONE: Record<string, string> = { A: "bg-sky", B: "bg-violet", C: "bg-orange" };

/** One CPU and three jobs: run them one at a time, or switch whenever a job waits for I/O. */
export function MultiprogrammingDemo() {
  const [mode, setMode] = useState<"single" | "multi">("single");
  const run = useMemo(() => runJobs(DEMO_JOBS, mode), [mode]);
  const longest = useMemo(() => Math.max(runJobs(DEMO_JOBS, "single").total, run.total), [run]);
  const [t, setT] = useState(0);
  useEffect(() => {
    setT(0);
  }, [mode]);
  useEffect(() => {
    if (t >= run.total) return;
    const id = setTimeout(() => setT((x) => x + 1), 160);
    return () => clearTimeout(id);
  }, [t, run.total]);

  const row = (label: string, lane: { from: number; to: number; job: string | null }[], isCpu = false) => (
    <div className="flex items-center gap-3" key={label}>
      <div className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="relative flex-1 h-6 rounded-sm bg-background/60 border border-border overflow-hidden">
        {lane.map((s, i) => {
          const end = Math.min(s.to, t);
          if (end <= s.from) return null;
          return (
            <div
              key={i}
              className={`absolute top-0 bottom-0 ${s.job ? JOB_TONE[s.job] : isCpu ? "bg-muted" : ""} ${!isCpu && s.job ? "opacity-50" : ""}`}
              style={{ left: `${(s.from / longest) * 100}%`, width: `${((end - s.from) / longest) * 100}%` }}
            >
              {isCpu && s.job && end - s.from >= 1 && <span className="px-1 font-mono text-[10px] text-background font-bold">{s.job}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Panel title="Multiprogramming keeps the CPU busy" legend={[["bg-sky", "job A"], ["bg-violet", "job B"], ["bg-orange", "job C"], ["bg-muted", "CPU idle"]]}>
      <Toggle<"single" | "multi">
        value={mode}
        onChange={setMode}
        options={[
          ["single", "One job at a time"],
          ["multi", "Multiprogramming"],
        ]}
      />
      <div className="flex flex-col gap-2 overflow-x-auto">
        {row("CPU", run.cpu, true)}
        {DEMO_JOBS.map((j, i) => row(`${j.name} waits I/O`, run.io[i]))}
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>
          time <span className="text-foreground">{Math.min(t, run.total)}</span>/{run.total}
        </span>
        <span>
          CPU utilization <span className="text-foreground">{Math.round(run.utilization * 100)}%</span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Each job alternates between using the CPU and waiting for I/O. Run alone, the CPU sits idle (grey) every time the job waits. With multiprogramming the OS switches to another job instead, so the same work finishes sooner.
      </p>
      <button type="button" className={`${btn} self-start`} onClick={() => setT(0)}>
        ⟲ Replay
      </button>
    </Panel>
  );
}

/* ------------------------------ dual mode ------------------------------ */

/** User mode, trap into the kernel, and back again. */
export function DualModeSwitch() {
  const frames = useMemo(() => dualModeFrames(), []);
  return (
    <Stepper
      title="Transition from user to kernel mode"
      frames={frames}
      code={DUAL_MODE_CODE}
      codeLabel="What happens"
      legend={[["bg-sky", "user mode (bit = 1)"], ["bg-orange", "kernel mode (bit = 0)"]]}
      render={(s: ModeState) => (
        <div className="flex flex-col gap-3 min-w-[300px]">
          {(["user", "kernel"] as const).map((zone) => (
            <div
              key={zone}
              className={`relative rounded-sm border-2 px-4 py-4 transition-all duration-500 ${
                s.where === zone ? (zone === "user" ? "border-sky bg-sky/15" : "border-orange bg-orange/15") : "border-border opacity-50"
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{zone === "user" ? "user mode" : "kernel mode"}</div>
              <div className="font-display font-bold">{zone === "user" ? "user process" : "operating system kernel"}</div>
              {s.where === zone && <span className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-foreground animate-ping" aria-hidden />}
            </div>
          ))}
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="uppercase tracking-widest text-[10px] text-muted-foreground">mode bit</span>
            <span key={s.mode} className={`px-3 py-1 rounded-sm font-bold animate-in zoom-in-75 duration-300 ${s.mode ? "bg-sky text-background" : "bg-orange text-background"}`}>
              {s.mode}
            </span>
            {s.arrow && <span className="animate-bounce">{s.arrow === "down" ? "↓ trap" : "↑ return"}</span>}
          </div>
        </div>
      )}
    />
  );
}

/* ------------------------------ timer ------------------------------ */

/** A program stuck in an infinite loop, and the timer that takes the CPU back from it. */
export function TimerInterrupt({ slice = 8 }: { slice?: number }) {
  const [on, setOn] = useState(false);
  const [tick, setTick] = useTicker(on, slice + 3, 450);
  const counter = Math.max(0, slice - tick);
  const fired = tick >= slice;
  return (
    <Panel title="The timer takes back control" legend={[["bg-sky", "user program"], ["bg-orange", "operating system"]]}>
      <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
        <div className={`rounded-sm border-2 p-4 font-mono text-xs transition-colors duration-300 ${fired ? "border-orange bg-orange/10" : "border-sky bg-sky/10"}`}>
          {fired ? (
            <div className="animate-in fade-in duration-300">
              <div className="font-display text-base font-bold">⚡ timer interrupt → OS is back in charge</div>
              <div className="text-muted-foreground mt-1">It can give the CPU to another program, or end this one for going over its time.</div>
            </div>
          ) : (
            <>
              <div>while (true) {"{"}</div>
              <div className="pl-4">
                x = x + 1; <span className={on ? "inline-block animate-spin" : ""}>↻</span>
              </div>
              <div>{"}"}</div>
              <div className="text-muted-foreground mt-1">this loop will never give the CPU back by itself</div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">counter</div>
          <div key={counter} className={`font-display text-5xl font-bold w-20 text-center animate-in zoom-in-90 duration-200 ${counter === 0 ? "text-orange" : ""}`}>
            {counter}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Before giving a program the CPU, the OS loads the timer's counter. Every clock tick the counter goes down by one. At zero the timer raises an interrupt, and the OS runs again, no matter what the program was doing.
      </p>
      <div className="flex gap-2">
        <button type="button" className={btn} onClick={() => setOn((r) => !r)}>
          {on ? "❚❚ Pause" : "▶ Run the program"}
        </button>
        <button type="button" className={btn} onClick={() => { setOn(false); setTick(0); }}>
          ⟲ Reset
        </button>
      </div>
    </Panel>
  );
}

/* ------------------------------ system calls ------------------------------ */

const SYSCALL_STAGES = [
  { key: "user", label: "user application", sub: "open(\"notes.txt\")", tone: "border-sky bg-sky/10" },
  { key: "api", label: "API / C library", sub: "libc, Win32, Java API", tone: "border-violet bg-violet/10" },
  { key: "interface", label: "system-call interface", sub: "table of call numbers", tone: "border-orange bg-orange/10" },
  { key: "kernel", label: "kernel", sub: "the real implementation", tone: "border-mint bg-mint/15" },
] as const;

/** A system call travelling from a program through the API and the system-call table into the kernel, and back. */
export function SystemCallFlow() {
  const [call, setCall] = useState<"open" | "printf">("open");
  const frames = useMemo(() => syscallFrames(call), [call]);
  return (
    <Stepper
      title="API → system call → OS"
      frames={frames}
      code={SYSCALL_CODE}
      codeLabel="What happens"
      legend={[["bg-sky", "user mode"], ["bg-orange", "kernel mode"]]}
      inputs={
        <Toggle<"open" | "printf">
          value={call}
          onChange={setCall}
          options={[
            ["open", "open() a file"],
            ["printf", "printf() in C"],
          ]}
        />
      }
      render={(s: SyscallState) => {
        const at = s.stage === "return" ? "user" : s.stage;
        return (
          <div className="grid md:grid-cols-[1fr_200px] gap-4 min-w-[300px]">
            <div className="flex flex-col gap-2">
              {SYSCALL_STAGES.map((st, i) => (
                <div key={st.key} className="flex flex-col items-stretch">
                  {i === 2 && (
                    <div className="my-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span className="flex-1 border-t border-dashed border-border" />
                      user mode ↑ · kernel mode ↓
                      <span className="flex-1 border-t border-dashed border-border" />
                    </div>
                  )}
                  <div className={`relative rounded-sm border-l-4 px-4 py-2 transition-all duration-300 ${st.tone} ${at === st.key ? "ring-2 ring-foreground scale-[1.02]" : "opacity-60"}`}>
                    <div className="font-display font-bold text-sm">{st.label}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{st.key === "user" && call === "printf" ? "printf(\"Hello\")" : st.sub}</div>
                    {at === st.key && <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-foreground animate-ping" aria-hidden />}
                  </div>
                </div>
              ))}
              {s.stage === "return" && <div className="font-mono text-xs text-mint animate-in fade-in slide-in-from-bottom-2 duration-300">↑ return value delivered</div>}
            </div>
            <div className="border border-border rounded-sm">
              <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">system-call table</div>
              {SYSCALL_TABLE.map((name, i) => (
                <div key={name} className={`flex justify-between px-3 py-1 font-mono text-xs transition-colors duration-300 ${s.index === i ? "bg-orange/25 text-foreground font-bold" : "text-muted-foreground"}`}>
                  <span>{i}</span>
                  <span>{name}()</span>
                </div>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
}

/** The system calls behind "copy one file to another", ticking off one by one. */
export function CopyFileCalls() {
  const [run, setRun] = useState(false);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run || n >= COPY_FILE_CALLS.length) return;
    const t = setTimeout(() => setN((x) => x + 1), 550);
    return () => clearTimeout(t);
  }, [run, n]);
  const tone: Record<string, string> = { input: "bg-sky", open: "bg-violet", loop: "bg-orange", close: "bg-mint" };
  return (
    <Panel title="System calls to copy one file to another" legend={[["bg-sky", "get file names"], ["bg-violet", "open files"], ["bg-orange", "copy loop"], ["bg-mint", "finish"]]}>
      <div className="font-mono text-xs text-muted-foreground">
        <span className="text-foreground">$ cp</span> in.txt out.txt
      </div>
      <ol className="flex flex-col gap-1">
        {COPY_FILE_CALLS.map((c, i) => (
          <li
            key={i}
            className={`flex items-center gap-3 rounded-sm px-3 py-1.5 text-sm transition-all duration-300 ${i < n ? "bg-muted/50 opacity-100 translate-x-0" : "opacity-30 -translate-x-1"}`}
          >
            <span className={`h-2.5 w-2.5 rounded-[2px] ${tone[c.group]}`} />
            <span className="font-mono text-[10px] w-5 text-muted-foreground">{i + 1}</span>
            {c.step}
            {i < n && <span className="ml-auto text-mint animate-in zoom-in-50 duration-200">✓</span>}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Even a simple copy makes many system calls, and the read/write pair runs once per block, so a big file means thousands of them. Most programmers never see these: the API hides them.
      </p>
      <div className="flex gap-2">
        <button type="button" className={btn} onClick={() => { if (n >= COPY_FILE_CALLS.length) setN(0); setRun(true); }}>
          ▶ Run cp
        </button>
        <button type="button" className={btn} onClick={() => { setRun(false); setN(0); }}>
          ⟲ Reset
        </button>
      </div>
    </Panel>
  );
}

/** The three ways to hand parameters to the OS. */
export function ParameterPassing() {
  const [method, setMethod] = useState<ParamMethod>("table");
  const [count, setCount] = useState(3);
  const params = Array.from({ length: count }, (_, i) => `p${i + 1}`);
  const r = paramPassing(method, params);
  const box = "rounded-sm border border-border p-3 min-h-[120px] flex flex-col gap-1";
  const cell = (v: string, tone: string) => (
    <div key={v} className={`font-mono text-xs px-2 py-1 rounded-sm ${tone} animate-in fade-in slide-in-from-left-2 duration-300`}>
      {v}
    </div>
  );
  const notes: Record<ParamMethod, string> = {
    registers: "Simplest and fastest: put each parameter in a CPU register. But there are only a few registers, so long parameter lists don't fit.",
    table: "Store the parameters in a block (table) in memory and pass the block's address in one register. Linux and Solaris do this. No limit on the number of parameters.",
    stack: "The program pushes the parameters onto the stack, and the operating system pops them off. No limit either.",
  };
  return (
    <Panel title="Passing parameters to a system call">
      <div className="flex flex-wrap items-center gap-4">
        <Toggle<ParamMethod>
          value={method}
          onChange={setMethod}
          options={[
            ["registers", "Registers"],
            ["table", "Table in memory"],
            ["stack", "Stack"],
          ]}
        />
        <label className="inline-flex items-center gap-2 font-mono text-xs">
          <span className="uppercase tracking-widest text-muted-foreground">parameters</span>
          <input type="range" min={1} max={7} value={count} onChange={(e) => setCount(Number(e.target.value))} aria-label="number of parameters" />
          <span className="w-4">{count}</span>
        </label>
      </div>
      <div key={method} className="grid grid-cols-3 gap-3">
        <div className={box}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">CPU registers</div>
          {r.registers.map((v) => cell(v, "bg-sky/20"))}
          {r.overflow && <div className="font-mono text-[11px] text-orange animate-pulse">✗ {count - 4} won't fit!</div>}
        </div>
        <div className={box}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">memory (table at X)</div>
          {r.memory.map((v) => cell(v, "bg-violet/20"))}
        </div>
        <div className={box}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">stack (top first)</div>
          {r.stack.map((v) => cell(v, "bg-orange/20"))}
        </div>
      </div>
      <p className="text-sm leading-relaxed">{notes[method]}</p>
    </Panel>
  );
}

/* ------------------------------ OS structures ------------------------------ */

const STRUCTURE_ORDER: [StructureKind, string][] = [
  ["simple", "Simple"],
  ["unix", "UNIX"],
  ["layered", "Layered"],
  ["microkernel", "Microkernel"],
  ["modules", "Modules"],
  ["hybrid", "Hybrid"],
];

/** Flip between the ways to structure an OS. The microkernel view animates its message passing. */
export function OsStructures() {
  const [kind, setKind] = useState<StructureKind>("simple");
  const s = STRUCTURES[kind];
  const [hop] = useTicker(kind === "microkernel", MICROKERNEL_HOPS.length, 700);
  const where = MICROKERNEL_HOPS[hop];
  return (
    <Panel title="Ways to structure an operating system">
      <div className="flex flex-wrap gap-1.5">
        {STRUCTURE_ORDER.map(([k, label]) => (
          <button key={k} type="button" className={`${btn} !px-2 !py-1 ${k === kind ? "bg-foreground text-background" : ""}`} onClick={() => setKind(k)}>
            {label}
          </button>
        ))}
      </div>
      <div key={kind} className="flex flex-col gap-3 animate-in fade-in duration-300">
        <div>
          <div className="font-display text-xl font-bold">{s.title}</div>
          <div className="font-mono text-[11px] text-muted-foreground">e.g. {s.example}</div>
        </div>
        {kind === "microkernel" ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              {["application", "file system", "device driver"].map((m) => (
                <div key={m} className={`rounded-sm border-2 px-2 py-3 text-center text-sm transition-all duration-300 ${where === m ? "border-mint bg-mint/20 scale-105" : "border-sky/50 bg-sky/10"}`}>
                  {m}
                </div>
              ))}
            </div>
            <div className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">user mode ↑ · messages · kernel mode ↓</div>
            <div className={`rounded-sm border-2 px-3 py-3 text-center text-sm transition-all duration-300 ${where === "microkernel" ? "border-mint bg-mint/20 scale-[1.02]" : "border-orange/50 bg-orange/10"}`}>
              microkernel: interprocess communication · memory management · CPU scheduling
            </div>
            <div className="rounded-sm border border-border bg-muted/40 px-3 py-2 text-center text-sm">hardware</div>
            <p className="font-mono text-xs text-muted-foreground">
              message now at: <span className="text-foreground">{where}</span>. The app asks to read a file: app → microkernel → file system → microkernel → app.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {s.layers.map((l, i) => (
              <div
                key={i}
                className="rounded-sm border border-border bg-muted/30 px-3 py-2 text-sm animate-in fade-in slide-in-from-top-1 duration-300"
                style={{ marginLeft: kind === "layered" ? `${i * 4}%` : 0, marginRight: kind === "layered" ? `${i * 4}%` : 0, animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                {l}
              </div>
            ))}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="border-l-2 border-mint pl-3">
            <div className="eyebrow text-mint mb-1">good</div>
            <ul className="list-disc pl-4 space-y-0.5">{s.pros.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div className="border-l-2 border-orange pl-3">
            <div className="eyebrow text-orange mb-1">bad</div>
            <ul className="list-disc pl-4 space-y-0.5">{s.cons.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------ boot ------------------------------ */

/** From the power button to a running kernel. */
export function BootSequence() {
  const frames = useMemo(() => bootFrames(), []);
  return (
    <Stepper
      title="System boot"
      frames={frames}
      code={BOOT_CODE}
      codeLabel="What happens"
      render={(s: BootState) => (
        <div className="flex flex-wrap items-center gap-2 min-w-[300px]">
          {BOOT_STAGES.map((name, i) => (
            <div key={name} className="flex items-center gap-2">
              <div
                className={`rounded-sm border-2 px-3 py-2 text-xs sm:text-sm font-display font-bold transition-all duration-500 ${
                  i < s.stage ? "border-mint/60 bg-mint/10 opacity-70" : i === s.stage ? "border-mint bg-mint/25 scale-110 shadow-lg" : "border-dashed border-border opacity-40"
                }`}
              >
                {i === 0 && "⏻ "}
                {name}
                {i === BOOT_STAGES.length - 1 && i === s.stage && " 🎉"}
              </div>
              {i < BOOT_STAGES.length - 1 && <span className={`transition-opacity duration-500 ${i < s.stage ? "opacity-100" : "opacity-20"}`}>→</span>}
            </div>
          ))}
        </div>
      )}
    />
  );
}

/* ------------------------------ Linux terminal ------------------------------ */

type Mission = { text: string; hint: string; done: (st: ShellState, history: string[]) => boolean };

const ran = (history: string[], re: RegExp) => history.some((h) => re.test(h.trim()));

const LAB1_MISSIONS: Mission[] = [
  { text: "Print the working directory", hint: "pwd", done: (_s, h) => ran(h, /^pwd$/) },
  { text: "List everything, hidden files too", hint: "ls -a", done: (_s, h) => ran(h, /^ls\b.*-\w*a/) },
  { text: "Read the manual page of ls", hint: "man ls", done: (_s, h) => ran(h, /^man ls$/) },
  { text: "Make a directory called new1", hint: "mkdir new1", done: (s) => exists(s, "~/new1", "dir") },
  { text: "Create an empty file f1.txt inside new1", hint: "touch new1/f1.txt", done: (s) => exists(s, "~/new1/f1.txt", "file") },
  { text: "Copy file1 into new1", hint: "cp file1 new1", done: (s) => exists(s, "~/new1/file1", "file") },
  { text: "Remove the empty directory dir2", hint: "rmdir dir2", done: (s, h) => !exists(s, "~/dir2") && ran(h, /^(rmdir|rm)\b/) },
  { text: "Print both text files with one command", hint: "cat file1 file2.txt", done: (_s, h) => ran(h, /^cat\s+\S+\s+\S+/) },
  { text: "Save the output of ls into a file called list", hint: "ls > list", done: (s) => (readFile(s, "~/list") ?? "").includes("dir1") },
  { text: "Append ls to list again, then sort it and drop repeats", hint: "ls >> list   then   sort list | uniq", done: (_s, h) => ran(h, />>/) && ran(h, /sort.*\|\s*uniq/) },
];

type Line = { kind: "in" | "out" | "err"; text: string; prompt?: string };

/** A small Linux terminal running in the browser, with the lab's tasks as checkable missions. */
export function LinuxTerminal() {
  const [st, setSt] = useState<ShellState>(initialShell);
  const [lines, setLines] = useState<Line[]>([{ kind: "out", text: "Welcome! This is a pretend Linux terminal. Try ls, then work through the missions." }]);
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [back, setBack] = useState(-1);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = LAB1_MISSIONS.map((m) => m.done(st, history));
  const score = done.filter(Boolean).length;

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const submit = (cmd: string) => {
    const prompt = `user@linux:${promptPath(st.cwd)}$`;
    const r = run(st, cmd);
    setSt(r.state);
    setHistory((h) => (cmd.trim() ? [...h, cmd] : h));
    setBack(-1);
    setInput("");
    if (r.clear) return setLines([]);
    setLines((ls) => [...ls, { kind: "in", text: cmd, prompt }, ...(r.output ? [{ kind: r.error ? "err" : "out", text: r.output } as Line] : [])]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit(input);
    else if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const i = back < 0 ? history.length - 1 : Math.max(0, back - 1);
      setBack(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown" && back >= 0) {
      e.preventDefault();
      const i = back + 1;
      if (i >= history.length) {
        setBack(-1);
        setInput("");
      } else {
        setBack(i);
        setInput(history[i]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const reset = () => {
    setSt(initialShell());
    setLines([{ kind: "out", text: "Fresh start: the home directory is back to dir1, dir2, file1 and file2.txt." }]);
    setHistory([]);
    setInput("");
  };

  return (
    <Panel title="Practice terminal" legend={[["bg-mint", `${score}/${LAB1_MISSIONS.length} missions`]]}>
      <div className="grid lg:grid-cols-[1fr_260px] gap-4">
        <div
          className="rounded-sm bg-[#0d1117] text-[#c9d1d9] font-mono text-[13px] leading-relaxed h-[340px] flex flex-col cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            <span className="ml-2 text-[11px] text-white/40">bash</span>
          </div>
          <div ref={scroller} className="flex-1 overflow-y-auto px-3 py-2" role="log" aria-live="polite">
            {lines.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap break-words animate-in fade-in duration-150">
                {l.kind === "in" ? (
                  <>
                    <span className="text-[#7ee787]">{l.prompt}</span> {l.text}
                  </>
                ) : (
                  <span className={l.kind === "err" ? "text-[#ff7b72]" : ""}>{l.text}</span>
                )}
              </div>
            ))}
            <div className="flex items-center">
              <span className="text-[#7ee787] shrink-0">user@linux:{promptPath(st.cwd)}$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                className="flex-1 min-w-0 bg-transparent outline-none ml-2 caret-[#7ee787]"
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                aria-label="terminal input"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">missions</div>
          {LAB1_MISSIONS.map((m, i) => (
            <button
              key={m.text}
              type="button"
              onClick={() => {
                setInput(m.hint.split("   ")[0]);
                inputRef.current?.focus();
              }}
              title={`Hint: ${m.hint}`}
              className={`text-left text-xs rounded-sm px-2 py-1.5 border transition-all duration-300 ${done[i] ? "border-mint bg-mint/15" : "border-border hover:border-foreground/40"}`}
            >
              <span className={`inline-block w-4 ${done[i] ? "text-mint animate-in zoom-in-50 duration-300" : "text-muted-foreground"}`}>{done[i] ? "✓" : i + 1}</span> {m.text}
            </button>
          ))}
          {score === LAB1_MISSIONS.length && <div className="text-sm font-display font-bold text-mint animate-in zoom-in-75 duration-500">🎉 All done. You speak Linux now!</div>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btn} onClick={reset}>
          ⟲ Reset files
        </button>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">↑ ↓ history · ctrl+L clear · click a mission for a hint</span>
      </div>
    </Panel>
  );
}

/* ------------------------------ process in memory ------------------------------ */

/** A process's memory: call functions to grow the stack down, allocate to grow the heap up. */
export function ProcessMemory() {
  const [frames, setFrames] = useState<string[]>(["main()"]);
  const [heap, setHeap] = useState<number[]>([]);
  const FN = ["readFile()", "parse()", "draw()", "sum()"];
  const full = frames.length + heap.length >= 7;
  return (
    <Panel title="A process in memory" legend={[["bg-orange", "stack"], ["bg-violet", "heap"], ["bg-sky", "data"], ["bg-mint", "text"]]}>
      <div className="grid sm:grid-cols-[220px_1fr] gap-5 items-start">
        <div className="flex flex-col border-2 border-border rounded-sm overflow-hidden font-mono text-[11px]">
          <div className="px-2 py-0.5 text-[10px] text-muted-foreground text-right">max address</div>
          <div className="flex flex-col">
            {frames.map((f, i) => (
              <div key={i} className="bg-orange/25 border-b border-orange/40 px-2 py-1.5 animate-in slide-in-from-top-2 fade-in duration-300">
                stack frame: {f}
              </div>
            ))}
            <div className="text-center text-muted-foreground py-0.5">↓ stack grows down</div>
          </div>
          <div className="h-10 sm:h-16 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,hsl(var(--border))_6px,hsl(var(--border))_7px)] flex items-center justify-center text-muted-foreground">
            {full ? <span className="text-orange animate-pulse">nearly out of room!</span> : "free"}
          </div>
          <div className="flex flex-col-reverse">
            {heap.map((h, i) => (
              <div key={i} className="bg-violet/25 border-t border-violet/40 px-2 py-1.5 animate-in slide-in-from-bottom-2 fade-in duration-300">
                heap block #{h} (malloc)
              </div>
            ))}
            <div className="text-center text-muted-foreground py-0.5">↑ heap grows up</div>
          </div>
          <div className="bg-sky/20 px-2 py-2 border-t border-border">data: global variables</div>
          <div className="bg-mint/20 px-2 py-2 border-t border-border">text: the program code</div>
          <div className="px-2 py-0.5 text-[10px] text-muted-foreground text-right">0</div>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="leading-relaxed">
            A process isn't just its code. It's the <b>text</b> (code), the <b>data</b> (globals), a <b>heap</b> for memory allocated while it runs, and a <b>stack</b> for function calls: their parameters, return addresses and local variables.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} disabled={full} onClick={() => setFrames((f) => [...f, FN[(f.length - 1) % FN.length]])}>
              call a function
            </button>
            <button type="button" className={btn} disabled={frames.length <= 1} onClick={() => setFrames((f) => f.slice(0, -1))}>
              return
            </button>
            <button type="button" className={btn} disabled={full} onClick={() => setHeap((h) => [...h, h.length + 1])}>
              malloc()
            </button>
            <button type="button" className={btn} disabled={!heap.length} onClick={() => setHeap((h) => h.slice(0, -1))}>
              free()
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">The stack and heap grow toward each other through the free space in the middle. If they ever meet, the process is out of memory.</p>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------ process states ------------------------------ */

const STATE_POS: Record<PState, [number, number]> = {
  new: [80, 50],
  terminated: [520, 50],
  ready: [170, 170],
  running: [430, 170],
  waiting: [300, 265],
};

const STATE_NOTE: Record<PState, string> = {
  new: "new: the process is being created.",
  ready: "ready: it's waiting to be assigned to a processor.",
  running: "running: its instructions are being executed. On one CPU, only one process can be here at a time.",
  waiting: "waiting: it's waiting for some event, like an I/O finishing or a signal.",
  terminated: "terminated: it has finished execution.",
};

/** The five-state diagram. Click the events to move a process around it. */
export function ProcessStateDiagram() {
  const [s, setS] = useState<PState>("new");
  const [last, setLast] = useState<PEvent | null>(null);
  const [trail, setTrail] = useState<PState[]>(["new"]);
  const fire = (e: PEvent) => {
    const to = nextState(s, e);
    if (!to) return;
    setS(to);
    setLast(e);
    setTrail((t) => [...t, to].slice(-8));
  };
  const edge = (from: PState, to: PState, bend = 0) => {
    const [x1, y1] = STATE_POS[from];
    const [x2, y2] = STATE_POS[to];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const sx = x1 + ux * 46;
    const sy = y1 + uy * 24;
    const ex = x2 - ux * 46;
    const ey = y2 - uy * 24;
    const mx = (sx + ex) / 2 - uy * bend;
    const my = (sy + ey) / 2 + ux * bend;
    return { d: `M${sx},${sy} Q${mx},${my} ${ex},${ey}`, lx: (sx + 2 * mx + ex) / 4, ly: (sy + 2 * my + ey) / 4 };
  };
  return (
    <Panel title="Diagram of process state">
      <svg viewBox="0 0 600 310" className="w-full h-auto max-w-[640px] mx-auto" role="img" aria-label="process state diagram">
        <defs>
          <marker id="os-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
          </marker>
          <marker id="os-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-mint" />
          </marker>
        </defs>
        {PROCESS_TRANSITIONS.map((t) => {
          const bend = t.event === "dispatch" ? -40 : t.event === "interrupt" ? -40 : 0;
          const g = edge(t.from, t.to, bend);
          const hot = last === t.event && s === t.to;
          return (
            <g key={t.event}>
              <path d={g.d} fill="none" strokeWidth={hot ? 3 : 1.5} className={`transition-all duration-300 ${hot ? "stroke-mint" : "stroke-muted-foreground"}`} markerEnd={`url(#${hot ? "os-arrow-hot" : "os-arrow"})`} />
              <text x={g.lx} y={g.ly - 6} textAnchor="middle" className={`font-mono text-[11px] ${hot ? "fill-mint font-bold" : "fill-muted-foreground"}`}>
                {t.label}
              </text>
            </g>
          );
        })}
        {(Object.keys(STATE_POS) as PState[]).map((k) => {
          const [x, y] = STATE_POS[k];
          const on = k === s;
          return (
            <g key={k}>
              {on && <ellipse cx={x} cy={y} rx={56} ry={30} className="fill-mint/20 animate-pulse" />}
              <ellipse cx={x} cy={y} rx={46} ry={24} strokeWidth={on ? 3 : 1.5} className={`transition-all duration-300 ${on ? "fill-mint/30 stroke-mint" : "fill-card stroke-border"}`} />
              <text x={x} y={y + 4} textAnchor="middle" className={`font-display text-[14px] font-bold ${on ? "fill-foreground" : "fill-muted-foreground"}`}>
                {k}
              </text>
            </g>
          );
        })}
      </svg>
      <p aria-live="polite" className="text-sm min-h-[2.5em]">
        {STATE_NOTE[s]}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PROCESS_TRANSITIONS.map((t) => (
          <button key={t.event} type="button" className={`${btn} !px-2 !py-1 !normal-case !tracking-normal`} disabled={t.from !== s} onClick={() => fire(t.event)}>
            {t.label}
          </button>
        ))}
        <button type="button" className={`${btn} !px-2 !py-1`} onClick={() => { setS("new"); setLast(null); setTrail(["new"]); }}>
          ⟲ new process
        </button>
      </div>
      <div className="font-mono text-[11px] text-muted-foreground">path: {trail.join(" → ")}</div>
    </Panel>
  );
}

/* ------------------------------ context switch ------------------------------ */

function PcbCard({ p, hot }: { p: PcbView; hot: boolean }) {
  return (
    <div className={`rounded-sm border-2 p-3 font-mono text-xs flex flex-col gap-1 transition-all duration-300 ${hot ? "border-mint bg-mint/15 scale-[1.03]" : "border-border"}`}>
      <div className="font-display font-bold text-sm">PCB{p.name.slice(1)}</div>
      <div>process state: <span className="text-foreground">{p.state}</span></div>
      <div>process number: {p.name}</div>
      <div>program counter: <span key={p.pc} className="inline-block animate-in zoom-in-75 duration-300">{p.pc}</span></div>
      <div>registers: <span key={p.reg} className="inline-block animate-in zoom-in-75 duration-300">r1 = {p.reg}</span></div>
      <div className="text-muted-foreground">memory limits · open files · …</div>
    </div>
  );
}

/** CPU switching from P0 to P1 and back, saving into and reloading from the PCBs. */
export function ContextSwitch() {
  const frames = useMemo(() => contextSwitchFrames(), []);
  return (
    <Stepper
      title="CPU switch from process to process"
      frames={frames}
      code={SWITCH_CODE}
      codeLabel="What happens"
      legend={[["bg-sky", "executing"], ["bg-muted", "idle (OS working)"]]}
      render={(s: SwitchState) => (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center min-w-[420px]">
          <PcbCard p={s.pcb[0]} hot={s.touch === 0} />
          <div className="flex flex-col items-center gap-2">
            <div className={`rounded-sm border-2 px-4 py-3 text-center transition-all duration-300 ${s.running === null ? "border-dashed border-muted-foreground" : "border-sky bg-sky/20"}`}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">CPU</div>
              <div className="font-display font-bold">{s.running === null ? "OS" : `P${s.running}`}</div>
              {s.cpu && <div className="font-mono text-[11px]">PC {s.cpu.pc}</div>}
            </div>
            <div className="font-mono text-lg h-6">
              {s.phase !== "exec" && (
                <span key={`${s.phase}${s.touch}`} className="animate-in fade-in duration-300">
                  {s.phase === "save" ? (s.touch === 0 ? "← save" : "save →") : s.touch === 0 ? "reload →" : "← reload"}
                </span>
              )}
              {s.phase === "exec" && s.running !== null && <span className="animate-spin inline-block">⚙</span>}
            </div>
          </div>
          <PcbCard p={s.pcb[1]} hot={s.touch === 1} />
        </div>
      )}
    />
  );
}

/* ------------------------------ fork ------------------------------ */

/** Put tree nodes on a grid: x by leaf order, y by `level`. */
function layoutTree<T>(nodes: T[], id: (n: T) => number, parent: (n: T) => number | null, level: (n: T) => number) {
  const kids = new Map<number, T[]>();
  for (const n of nodes) {
    const p = parent(n);
    if (p !== null) kids.set(p, [...(kids.get(p) ?? []), n]);
  }
  const pos = new Map<number, { x: number; y: number }>();
  let leaf = 0;
  const walk = (n: T): number => {
    const ch = kids.get(id(n)) ?? [];
    const x = ch.length ? ch.map(walk).reduce((a, b) => a + b, 0) / ch.length : leaf++;
    pos.set(id(n), { x, y: level(n) });
    return x;
  };
  nodes.filter((n) => parent(n) === null).forEach(walk);
  return { pos, leaves: Math.max(1, leaf) };
}

/** How many processes do n fork() calls make? Watch the tree double. */
export function ForkTree() {
  const [n, setN] = useState(2);
  const nodes = useMemo(() => forkTree(n), [n]);
  // depth in the tree = number of ancestors, which keeps children below their parents
  const depth = (k: ForkNode): number => (k.parent === null ? 0 : 1 + depth(nodes[k.parent]));
  const { pos, leaves } = layoutTree(nodes, (k) => k.id, (k) => k.parent, depth);
  const maxDepth = Math.max(...nodes.map(depth));
  const W = 560;
  const H = 70 + maxDepth * 70;
  const X = (x: number) => 30 + (leaves === 1 ? (W - 60) / 2 : (x / (leaves - 1)) * (W - 60));
  const Y = (y: number) => 30 + y * 70;
  const tone = ["fill-mint", "fill-sky", "fill-violet", "fill-orange", "fill-neon"];
  return (
    <Panel title="fork() doubles the processes" legend={[["bg-mint", "original"], ["bg-sky", "born at fork 1"], ["bg-violet", "fork 2"], ["bg-orange", "fork 3"]]}>
      <div className="flex flex-wrap items-center gap-4">
        <pre className="font-mono text-xs bg-muted/40 rounded-sm px-3 py-2 m-0">
          {"int main() {\n" + Array.from({ length: n }, () => "    fork();\n").join("") + '    printf("hi\\n");\n}'}
        </pre>
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 font-mono text-xs">
            <span className="uppercase tracking-widest text-muted-foreground">fork() calls</span>
            <input type="range" min={0} max={4} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of fork calls" />
            <span className="w-4">{n}</span>
          </label>
          <div className="font-display text-2xl font-bold">
            {nodes.length} processes · "hi" printed {nodes.length}×
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            2<sup>{n}</sup> = {nodes.length}, so {nodes.length - 1} new child processes
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="tree of processes created by fork">
        {nodes.map((k) => {
          if (k.parent === null) return null;
          const a = pos.get(k.parent)!;
          const b = pos.get(k.id)!;
          return <line key={`e${k.id}`} x1={X(a.x)} y1={Y(a.y)} x2={X(b.x)} y2={Y(b.y)} className="stroke-border" strokeWidth={1.5} />;
        })}
        {nodes.map((k) => {
          const p = pos.get(k.id)!;
          return (
            <g key={`${n}-${k.id}`} className="animate-in zoom-in-50 fade-in duration-500" style={{ transformOrigin: `${X(p.x)}px ${Y(p.y)}px`, animationDelay: `${k.bornAt * 150}ms`, animationFillMode: "both" }}>
              <circle cx={X(p.x)} cy={Y(p.y)} r={14} className={tone[k.bornAt]} />
              <text x={X(p.x)} y={Y(p.y) + 4} textAnchor="middle" className="fill-background font-mono text-[10px] font-bold">
                P{k.id}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-muted-foreground leading-relaxed">
        fork() creates a child that is a copy of the parent, and <i>both</i> continue from the next line. So at every fork() call, every process that exists splits in two.
      </p>
    </Panel>
  );
}

/** The textbook's tree of processes on a Linux system. */
export function LinuxProcessTree() {
  const { pos, leaves } = layoutTree(
    LINUX_TREE,
    (p) => p.pid,
    (p) => p.parent,
    (p) => {
      let d = 0;
      let cur = p;
      while (cur.parent !== null) {
        cur = LINUX_TREE.find((q) => q.pid === cur.parent)!;
        d++;
      }
      return d;
    },
  );
  const W = 640;
  const X = (x: number) => 45 + (x / (leaves - 1)) * (W - 90);
  const Y = (y: number) => 30 + y * 70;
  const [hover, setHover] = useState<number | null>(null);
  return (
    <Panel title="A tree of processes in Linux">
      <svg viewBox={`0 0 ${W} 260`} className="w-full h-auto" role="img" aria-label="Linux process tree">
        {LINUX_TREE.map((p) => {
          if (p.parent === null) return null;
          const a = pos.get(p.parent)!;
          const b = pos.get(p.pid)!;
          return <line key={`e${p.pid}`} x1={X(a.x)} y1={Y(a.y)} x2={X(b.x)} y2={Y(b.y)} className="stroke-border" strokeWidth={1.5} />;
        })}
        {LINUX_TREE.map((p) => {
          const q = pos.get(p.pid)!;
          const on = hover === p.pid;
          return (
            <g key={p.pid} onMouseEnter={() => setHover(p.pid)} onMouseLeave={() => setHover(null)} className="cursor-default">
              <rect x={X(q.x) - 38} y={Y(q.y) - 17} width={76} height={34} rx={4} className={`transition-all ${on ? "fill-mint/30 stroke-mint" : "fill-card stroke-border"}`} strokeWidth={1.5} />
              <text x={X(q.x)} y={Y(q.y) - 2} textAnchor="middle" className="fill-foreground font-display text-[12px] font-bold">
                {p.name}
              </text>
              <text x={X(q.x)} y={Y(q.y) + 11} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
                pid = {p.pid}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-muted-foreground leading-relaxed">
        <b>init</b> (pid 1) is the root of every user process. A user logged in through <b>login</b> got a <b>bash</b> shell, and every command typed in that shell, like <b>ps</b> or <b>emacs</b>, became bash's child.
      </p>
    </Panel>
  );
}

/* ------------------------------ bounded buffer ------------------------------ */

/** The shared-memory bounded buffer: a ring of BUFFER_SIZE slots with in and out pointers. */
export function BoundedBuffer({ size = 8 }: { size?: number }) {
  const [r, setR] = useState<Ring>(() => ring(size));
  const [log, setLog] = useState<string>("Press produce or consume, or let them both run.");
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState<"p" | "c" | null>(null);
  const doProduce = () => {
    const next = produce(r);
    setBusy("p");
    if (!next) return setLog(`Producer: (in + 1) % ${size} == out, so the buffer is full. It spins in its while loop, waiting.`);
    setR(next);
    setLog(`Producer: buffer[${r.in}] = item ${r.next}; in = (${r.in} + 1) % ${size} = ${next.in}.`);
  };
  const doConsume = () => {
    const res = consume(r);
    setBusy("c");
    if (!res) return setLog("Consumer: in == out, so the buffer is empty. It spins, waiting.");
    setR(res.ring);
    setLog(`Consumer: took item ${res.item} from buffer[${r.out}]; out = (${r.out} + 1) % ${size} = ${res.ring.out}.`);
  };
  const actions = useRef({ doProduce, doConsume });
  actions.current = { doProduce, doConsume };
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => (Math.random() < 0.55 ? actions.current.doProduce() : actions.current.doConsume()), 650);
    return () => clearInterval(t);
  }, [auto]);
  const R = 95;
  const C = 130;
  const angle = (i: number) => (i / size) * Math.PI * 2 - Math.PI / 2;
  const pt = (i: number, rad: number) => [C + rad * Math.cos(angle(i)), C + rad * Math.sin(angle(i))] as const;
  return (
    <Panel title="Bounded buffer in shared memory" legend={[["bg-mint", "item"], ["bg-sky", "in (producer)"], ["bg-orange", "out (consumer)"]]}>
      <div className="grid sm:grid-cols-[260px_1fr] gap-4 items-center">
        <svg viewBox="0 0 260 260" className="w-full max-w-[260px] h-auto mx-auto" role="img" aria-label="circular buffer">
          {r.buf.map((v, i) => {
            const [x, y] = pt(i, R);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={22} strokeWidth={2} className={`transition-all duration-300 ${v !== null ? "fill-mint/40 stroke-mint" : "fill-card stroke-border"}`} />
                <text x={x} y={y + 4} textAnchor="middle" className="fill-foreground font-mono text-[12px] font-bold">
                  {v ?? ""}
                </text>
                <text x={pt(i, R + 34)[0]} y={pt(i, R + 34)[1] + 3} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">
                  [{i}]
                </text>
              </g>
            );
          })}
          {(["in", "out"] as const).map((k) => {
            const idx = k === "in" ? r.in : r.out;
            const [x, y] = pt(idx, R - 40);
            return (
              <g key={k} style={{ transition: "transform 300ms" }}>
                <line x1={C} y1={C} x2={x} y2={y} strokeWidth={k === "in" ? 3 : 2} strokeDasharray={k === "out" ? "4 3" : undefined} className={`transition-all duration-300 ${k === "in" ? "stroke-sky" : "stroke-orange"}`} />
                <text x={(C + x) / 2 + (k === "in" ? 8 : -8)} y={(C + y) / 2} textAnchor="middle" className={`font-mono text-[10px] font-bold ${k === "in" ? "fill-sky" : "fill-orange"}`}>
                  {k}
                </text>
              </g>
            );
          })}
          <text x={C} y={C + 4} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">
            {ringCount(r)}/{size - 1}
          </text>
        </svg>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${btn} ${busy === "p" ? "border-sky" : ""}`} onClick={doProduce}>
              produce
            </button>
            <button type="button" className={`${btn} ${busy === "c" ? "border-orange" : ""}`} onClick={doConsume}>
              consume
            </button>
            <button type="button" className={btn} onClick={() => setAuto((a) => !a)}>
              {auto ? "❚❚ stop" : "▶ run both"}
            </button>
            <button type="button" className={btn} onClick={() => { setAuto(false); setR(ring(size)); setLog("Empty buffer: in == out == 0."); }}>
              ⟲
            </button>
          </div>
          <p aria-live="polite" className="text-sm min-h-[3em] leading-relaxed font-mono">
            {log}
          </p>
          <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-widest">
            {ringFull(r) && <span className="px-2 py-0.5 rounded-sm bg-orange text-background animate-in zoom-in-75">full</span>}
            {ringEmpty(r) && <span className="px-2 py-0.5 rounded-sm bg-muted">empty</span>}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Fill it up: one slot always stays empty. If the buffer could fill completely, in would equal out, and that already means "empty". So this solution can use only BUFFER_SIZE − 1 slots.
          </p>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------ message buffering ------------------------------ */

/** Sender vs. a slower receiver, with a zero, bounded or unbounded message queue. */
export function MessageBuffering() {
  const [cap, setCap] = useState<Capacity>("bounded");
  const sim = useMemo(() => messageSim(cap, 18), [cap]);
  const [t, setT] = useState(0);
  useEffect(() => setT(0), [cap]);
  useEffect(() => {
    if (t >= sim.length) return;
    const id = setTimeout(() => setT((x) => x + 1), 450);
    return () => clearTimeout(id);
  }, [t, sim.length]);
  const now = sim[Math.max(0, t - 1)];
  const notes: Record<Capacity, string> = {
    zero: "Zero capacity: there's no queue at all. The sender must wait until the receiver takes the message: a rendezvous.",
    bounded: "Bounded capacity (here 3): the sender can run ahead until the queue is full, then it must wait.",
    unbounded: "Unbounded capacity: the queue is infinitely long, so the sender never waits. The messages just pile up.",
  };
  return (
    <Panel title="Buffering: how many messages can wait on the link?" legend={[["bg-sky", "message in the queue"], ["bg-orange", "sender blocked"]]}>
      <Toggle<Capacity>
        value={cap}
        onChange={setCap}
        options={[
          ["zero", "Zero"],
          ["bounded", "Bounded"],
          ["unbounded", "Unbounded"],
        ]}
      />
      <div className="flex items-center gap-3">
        <div className={`rounded-sm border-2 px-3 py-2 text-center transition-colors duration-200 ${now?.blocked ? "border-orange bg-orange/20" : "border-border"}`}>
          <div className="font-display font-bold">sender</div>
          <div className="font-mono text-[10px]">{now?.blocked ? "blocked ⏸" : "sending ▶"}</div>
        </div>
        <div className="flex-1 min-h-[44px] rounded-sm border border-dashed border-border flex items-center gap-1 px-2 overflow-hidden">
          {Array.from({ length: now?.queue ?? 0 }, (_, i) => (
            <span key={i} className="h-6 w-6 shrink-0 rounded-sm bg-sky animate-in zoom-in-50 duration-200" />
          ))}
          {cap === "zero" && <span className="font-mono text-[10px] text-muted-foreground">no queue</span>}
        </div>
        <div className="rounded-sm border-2 border-border px-3 py-2 text-center">
          <div className="font-display font-bold">receiver</div>
          <div className="font-mono text-[10px]">every 3 ticks</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>tick <span className="text-foreground">{now?.tick ?? 0}</span></span>
        <span>sent <span className="text-foreground">{now?.sent ?? 0}</span></span>
        <span>received <span className="text-foreground">{now?.received ?? 0}</span></span>
        <span>blocked ticks <span className="text-foreground">{sim.slice(0, t).filter((x) => x.blocked).length}</span></span>
      </div>
      <p className="text-sm leading-relaxed">{notes[cap]}</p>
      <button type="button" className={`${btn} self-start`} onClick={() => setT(0)}>
        ⟲ Replay
      </button>
    </Panel>
  );
}
