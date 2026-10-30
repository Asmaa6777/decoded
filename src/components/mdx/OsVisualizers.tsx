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
