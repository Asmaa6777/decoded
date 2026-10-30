import { useEffect, useMemo, useState } from "react";
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
} from "@/lib/operatingSystems";

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
