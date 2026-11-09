import { ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  sortFrames,
  searchFrames,
  gcdFrames,
  traversalFrames,
  mstFrames,
  knapsackFrames,
  findMaxFrames,
  JAVA_FIND_MAX,
  loopGridInfo,
  type LoopGridMode,
  swapFrames,
  JAVA_SWAP,
  type SwapState,
  JAVA_SORT,
  JAVA_SEARCH,
  JAVA_GCD,
  JAVA_TRAVERSAL,
  JAVA_MST,
  JAVA_KNAPSACK,
  GROWTH,
  humanTime,
  formatOps,
  equalTags,
  keptEqualOrder,
  type Frame,
  type ArrayState,
  type SortAlgorithm,
  type SearchAlgorithm,
  type GraphNode,
  type GraphEdge,
  type KnapsackItem,
} from "@/lib/algorithms";

/* ============================================================
   Algorithm visualizers. Every one of them replays frames from
   src/lib/algorithms.ts through the same <Stepper>: picture on
   top, a plain-English caption, controls, and the Java source
   with the line that is running right now highlighted.

   Colour language (shared with AutomatonDiagram):
     neon   = looking at / comparing right now
     orange = writing / swapping / rejecting
     mint   = done / final / accepted
     violet = pivot or special element
     sky    = the active window the algorithm is working on
   ============================================================ */

export const btn =
  "font-mono text-xs px-3.5 py-2 border border-border rounded-full hover:border-violet/60 hover:bg-violet/[0.06] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors";
/** the main action in a row of buttons, e.g. Play */
export const btnPrimary = "border-violet bg-violet text-white hover:bg-violet/90 hover:border-violet";
export const inputCls =
  "font-mono text-sm px-3 py-2 border border-border bg-transparent text-foreground focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 rounded-lg";

/** Card, header, stage and caption shared by every visualizer (Stepper here, Panel in AdvancedVisualizers). */
export const vizCard = "not-prose my-8 rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden text-foreground";
export const vizHeader = "flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border/60 bg-gradient-to-r from-violet/[0.07] to-transparent";
export const vizStage = "mx-4 sm:mx-5 my-5 rounded-xl bg-secondary/30 p-4 sm:p-5 overflow-x-auto";
export const vizCaption = "min-h-[3em] rounded-lg border-l-[3px] border-violet/50 bg-violet/[0.05] px-4 py-2.5 text-[15px] leading-relaxed";

export function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
      {items.map(([cls, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-full ${cls}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

function CodePanel({ code, line, label }: { code: string[]; line: number; label: string }) {
  return (
    <div className="border-t border-border bg-background/40">
      <div className="px-5 pt-3 font-mono text-xs text-muted-foreground">{label}</div>
      {/* a div, not a <pre>: .prose-reading styles every pre as a dark code block */}
      <div className="overflow-x-auto py-3 text-[12px] leading-[1.6] font-mono" role="region" aria-label={label}>
        {code.map((l, i) => (
          <div
            key={i}
            className={`px-5 whitespace-pre border-l-2 transition-colors ${
              i === line ? "bg-violet/10 border-violet text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            <span className="inline-block w-6 select-none text-right mr-3 opacity-40">{i + 1}</span>
            {l || " "}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Focus mode scales the picture to fill the screen, but never past this. */
const FOCUS_MAX_ZOOM = 2.4;

/**
 * Shared focus-mode container for interactive panels and visualizers.
 * Opens full screen (or a fixed overlay where Fullscreen API is unavailable),
 * scales the content to fit the screen height, and exits on Escape or button click.
 */
export function FocusPanel({
  title,
  eyebrowTone = "text-mint",
  legend,
  extraHeader,
  cardClass = "not-prose my-8 border border-border bg-card rounded-sm overflow-hidden text-foreground",
  headerClass = "flex flex-wrap items-center justify-between gap-3 px-5 pt-4",
  bodyClass = "p-5 flex flex-col gap-4 overflow-x-auto",
  children,
}: {
  title: string;
  eyebrowTone?: string;
  legend?: [string, string][];
  extraHeader?: ReactNode;
  cardClass?: string;
  headerClass?: string;
  bodyClass?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pictureRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [measure, setMeasure] = useState(0);
  const fittedFor = useRef(-1);

  const refit = useCallback(() => {
    setZoom(1);
    setMeasure((m) => m + 1);
  }, []);

  const enterFocus = () => {
    setFocus(true);
    refit();
    rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  const exitFocus = () => {
    setFocus(false);
    setZoom(1);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    if (!focus) return;
    const onChange = () => {
      if (!document.fullscreenElement) setFocus(false);
    };
    const onResize = refit;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        exitFocus();
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [focus, refit]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const pic = pictureRef.current;
    if (!focus || !stage || !pic || pic.offsetHeight === 0) return;
    const pad = 32;
    const room = (stage.clientHeight - pad) * 0.96;
    if (fittedFor.current !== measure) {
      fittedFor.current = measure;
      const fit = Math.min(FOCUS_MAX_ZOOM, room / pic.offsetHeight);
      if (fit > 1.05) setZoom(fit);
    } else if (zoom > 1 && stage.scrollHeight > stage.clientHeight + 1) {
      setZoom(Math.max(1, (room * zoom) / (stage.scrollHeight - pad)));
    }
  }, [focus, zoom, measure, children]);

  return (
    <div
      ref={rootRef}
      role={focus ? "dialog" : undefined}
      aria-modal={focus ? "true" : undefined}
      aria-label={focus ? `${title}, focus mode` : undefined}
      className={focus ? "not-prose fixed inset-0 z-50 flex flex-col bg-background text-foreground" : cardClass}
    >
      <div className={focus ? "flex flex-wrap items-center justify-between gap-3 px-5 sm:px-8 pt-4" : headerClass}>
        <div className={`eyebrow ${eyebrowTone}`}>{title}</div>
        <div className="flex flex-wrap items-center gap-4">
          {extraHeader}
          {legend && <Legend items={legend} />}
          {focus ? (
            <button type="button" className={btn} onClick={exitFocus}>
              ✕ Exit
            </button>
          ) : (
            <button
              type="button"
              className={`${btn} !px-3 !py-1`}
              onClick={enterFocus}
              aria-label={`Open ${title} in focus mode`}
              title="Focus mode: full screen, no distractions"
            >
              ⛶ Focus
            </button>
          )}
        </div>
      </div>

      {focus ? (
        <>
          <div ref={stageRef} className="flex-1 min-h-0 min-w-0 overflow-auto px-5 sm:px-8 py-4 flex flex-col">
            <div ref={pictureRef} className="my-auto flex flex-col gap-4" style={{ zoom }}>
              {children}
            </div>
          </div>
          <div className="hidden sm:block px-5 sm:px-8 pb-4 pt-2 border-t border-border font-mono text-xs text-muted-foreground">
            esc exit
          </div>
        </>
      ) : (
        <div className={bodyClass}>{children}</div>
      )}
    </div>
  );
}

export function Stepper<S>({
  title,
  frames,
  code,
  codeLabel = "Java",
  render,
  legend,
  inputs,
  startAt = 0,
}: {
  title: string;
  frames: Frame<S>[];
  code: string[];
  /** heading for the source panel; the highlighted row is frame.line */
  codeLabel?: string;
  render: (state: S) => ReactNode;
  legend?: [string, string][];
  inputs?: ReactNode;
  /** frame to show when `frames` changes, e.g. the first step of a newly added operation */
  startAt?: number;
}) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const last = frames.length - 1;

  // Focus mode: just the picture, caption and controls, filling the screen. Uses the
  // Fullscreen API where it exists and falls back to a fixed overlay (e.g. iPhone Safari).
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pictureRef = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [measure, setMeasure] = useState(0); // bump to re-fit the picture from scratch
  const fittedFor = useRef(-1);
  const refit = useCallback(() => {
    setZoom(1);
    setMeasure((m) => m + 1);
  }, []);

  useEffect(() => {
    setIdx(Math.min(startAt, Math.max(0, frames.length - 1)));
    setPlaying(false);
    // startAt is read when frames change, not tracked on its own
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  useEffect(() => {
    if (!playing) return;
    if (idx >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, last)), speed);
    return () => clearTimeout(t);
  }, [playing, idx, last, speed]);

  const toggleCode = useCallback(() => {
    setShowCode((v) => !v);
    refit();
  }, [refit]);
  const enterFocus = () => {
    setFocus(true);
    refit();
    rootRef.current?.requestFullscreen?.().catch(() => {});
  };
  const exitFocus = () => {
    setFocus(false);
    setZoom(1);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    if (!focus) return;
    // Esc in real fullscreen is handled by the browser; follow it out
    const onChange = () => {
      if (!document.fullscreenElement) setFocus(false);
    };
    const onResize = refit;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, select, textarea")) return;
      // a focused button would also react to Space on keyup; take focus off it first
      if (e.target instanceof HTMLButtonElement) e.target.blur();
      if (e.key === "Escape") exitFocus();
      else if (e.key === " ") setPlaying((p) => !p);
      else if (e.key === "ArrowRight") {
        setPlaying(false);
        setIdx((i) => Math.min(last, i + 1));
      } else if (e.key === "ArrowLeft") {
        setPlaying(false);
        setIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "r" || e.key === "R") {
        setPlaying(false);
        setIdx(0);
      } else if (e.key === "c" || e.key === "C") toggleCode();
      else return;
      e.preventDefault();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [focus, last, refit, toggleCode]);

  // Fit the picture to the stage's height. Percentage widths inside keep filling the width
  // because CSS zoom re-runs layout. On entry, resize or code toggle it is measured at zoom 1
  // and scaled up; after that a step that grows taller (a call stack wrapping) only ever
  // shrinks it, so it can't oscillate on content whose height follows its width.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const pic = pictureRef.current;
    if (!focus || !stage || !pic || pic.offsetHeight === 0) return;
    const pad = 32; // stage py-4
    const room = (stage.clientHeight - pad) * 0.96;
    if (fittedFor.current !== measure) {
      fittedFor.current = measure;
      const fit = Math.min(FOCUS_MAX_ZOOM, room / pic.offsetHeight);
      if (fit > 1.05) setZoom(fit);
    } else if (zoom > 1 && stage.scrollHeight > stage.clientHeight + 1) {
      setZoom(Math.max(1, (room * zoom) / (stage.scrollHeight - pad)));
    }
  }, [focus, zoom, measure, idx]);

  const frame = frames[Math.min(idx, last)];
  if (!frame) return null;

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn} onClick={() => { setPlaying(false); setIdx(0); }} disabled={idx === 0}>
        ⟲ Reset
      </button>
      <button type="button" className={btn} onClick={() => { setPlaying(false); setIdx((i) => Math.max(0, i - 1)); }} disabled={idx === 0}>
        ← Back
      </button>
      <button type="button" className={btn} onClick={() => { setPlaying(false); setIdx((i) => Math.min(last, i + 1)); }} disabled={idx >= last}>
        Step →
      </button>
      <button
        type="button"
        className={`${btn} ${btnPrimary}`}
        onClick={() => {
          if (idx >= last) setIdx(0);
          setPlaying((p) => !p);
        }}
      >
        {playing ? "❚❚ Pause" : "▶ Play"}
      </button>
      <label className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
        speed
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-transparent border border-border rounded-full px-3 py-1.5 text-foreground">
          <option value={1200}>slow</option>
          <option value={700}>normal</option>
          <option value={250}>fast</option>
        </select>
      </label>
    </div>
  );

  const stats = (
    <div className="flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
      <span className="rounded-full bg-secondary px-3 py-1">
        step <span className="text-foreground font-medium">{idx + 1}</span>/{frames.length}
      </span>
      {Object.entries(frame.stats).map(([k, v]) => (
        <span key={k} className="rounded-full bg-secondary px-3 py-1">
          {k} <span className="text-foreground font-medium">{v}</span>
        </span>
      ))}
    </div>
  );

  if (focus) {
    return (
      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title}, focus mode`}
        className="not-prose fixed inset-0 z-50 flex flex-col bg-background text-foreground"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-8 pt-4">
          <div className="eyebrow text-sky">{title}</div>
          <div className="flex flex-wrap items-center gap-4">
            {legend && <Legend items={legend} />}
            <button type="button" className={btn} onClick={toggleCode} aria-pressed={showCode}>
              {showCode ? "Hide code" : "Show code"}
            </button>
            <button type="button" className={btn} onClick={exitFocus}>
              ✕ Exit
            </button>
          </div>
        </div>

        <div className={`flex-1 min-h-0 flex ${showCode ? "flex-col lg:flex-row" : "flex-col"}`}>
          <div ref={stageRef} className="flex-1 min-h-0 min-w-0 overflow-auto px-5 sm:px-8 py-4 flex flex-col">
            {/* my-auto rather than justify-center: centres without clipping the top when it overflows */}
            <div ref={pictureRef} className="my-auto" style={{ zoom }}>
              {render(frame.state)}
            </div>
          </div>
          {showCode && (
            <div className="lg:w-[min(46%,560px)] max-h-[40%] lg:max-h-none overflow-auto border-t lg:border-t-0 lg:border-l border-border">
              <CodePanel code={code} line={frame.line} label={codeLabel} />
            </div>
          )}
        </div>

        <div className="px-5 sm:px-8 pb-5 pt-3 flex flex-col gap-3 border-t border-border">
          <p aria-live="polite" className="min-h-[2.5em] text-base sm:text-lg leading-relaxed">
            {frame.message}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {controls}
            {stats}
          </div>
          <div className="hidden sm:block font-mono text-xs text-muted-foreground">
            space play · ← → step · R reset · C code · esc exit
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={vizCard}>
      <div className={vizHeader}>
        <div className="eyebrow text-sky">{title}</div>
        <div className="flex flex-wrap items-center gap-4">
          {legend && <Legend items={legend} />}
          <button type="button" className={`${btn} !px-3 !py-1`} onClick={enterFocus} aria-label={`Open ${title} in focus mode`} title="Focus mode: full screen, no distractions">
            ⛶ Focus
          </button>
        </div>
      </div>

      <div className={vizStage}>{render(frame.state)}</div>

      <div className="px-5 pb-5 flex flex-col gap-3">
        <p aria-live="polite" className={vizCaption}>
          {frame.message}
        </p>
        {stats}
        {controls}
        {inputs}
      </div>

      <CodePanel code={code} line={frame.line} label={codeLabel} />
    </div>
  );
}

/* ---------------------------- array views ---------------------------- */

function cellTone(i: number, s: ArrayState) {
  if (s.found === i) return "mint";
  if (s.write?.includes(i)) return "orange";
  if (s.compare?.includes(i)) return "neon";
  if (s.pivot === i) return "violet";
  if (s.sorted?.includes(i)) return "mint";
  return null;
}

const barBg: Record<string, string> = { mint: "bg-mint", orange: "bg-orange", neon: "bg-neon", violet: "bg-violet" };
const cellBorder: Record<string, string> = {
  mint: "bg-mint/20 ring-2 ring-mint/50",
  orange: "bg-orange/15 ring-2 ring-orange/45 motion-safe:scale-[1.06]",
  neon: "bg-neon/15 ring-2 ring-neon/50 motion-safe:scale-[1.06]",
  violet: "bg-violet/15 ring-2 ring-violet/45",
};

function inRange(i: number, s: ArrayState) {
  return !s.range || (i >= s.range[0] && i <= s.range[1]);
}

function PointerRow({ s, count }: { s: ArrayState; count: number }) {
  const labels: string[][] = Array.from({ length: count }, () => []);
  Object.entries(s.pointers ?? {}).forEach(([k, v]) => {
    if (v >= 0 && v < count) labels[v].push(k);
  });
  return (
    <>
      {labels.map((l, i) => (
        <div key={i} className="text-center font-mono text-[10px] text-sky leading-tight min-h-[14px]">
          {l.join(",")}
        </div>
      ))}
    </>
  );
}

export function ArrayBars({ s }: { s: ArrayState }) {
  const tags = equalTags(s); // 5ᵃ, 5ᵇ: shows whether equal values keep their order
  const max = Math.max(1, ...s.array);
  const n = s.array.length;
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(26px, 1fr))` };
  return (
    <div className="min-w-fit">
      {s.held && (
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-sm bg-violet/15 ring-1 ring-violet/40 px-3 py-1 rounded-full">
          <span className="text-muted-foreground text-xs">{s.held.label}</span>
          <span className="font-medium text-violet">{s.held.value}</span>
        </div>
      )}
      <div className="grid gap-1 items-end h-40" style={cols}>
        {s.array.map((v, i) => {
          const tone = cellTone(i, s);
          return (
            <div key={i} className={`flex flex-col justify-end h-full transition-opacity ${inRange(i, s) ? "" : "opacity-25"}`}>
              <div
                className={`w-full rounded-t-md transition-all duration-200 ${tone ? barBg[tone] : "bg-foreground/20"}`}
                style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="grid gap-1 mt-1" style={cols}>
        {s.array.map((v, i) => (
          <div key={i} className={`text-center font-mono text-[11px] ${inRange(i, s) ? "text-foreground" : "text-muted-foreground/50"}`}>
            {v}
            {tags[i] && <sup className="text-violet font-semibold">{tags[i]}</sup>}
          </div>
        ))}
        <PointerRow s={s} count={n} />
      </div>
      {s.aux && (
        <div className="mt-4">
          <div className="font-mono text-xs text-muted-foreground mb-1">tmp (merge buffer)</div>
          <div className="flex gap-1">
            {s.aux.map((v, i) => (
              <div key={i} className={`w-10 h-10 flex items-center justify-center font-mono text-sm border rounded-lg ${v === null ? "border-dashed border-border text-muted-foreground" : "border-orange/50 bg-orange/15"}`}>
                {v ?? "·"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ArrayCells({ s }: { s: ArrayState }) {
  const n = s.array.length;
  const cols = { gridTemplateColumns: `repeat(${n}, minmax(2.75rem, 1fr))` };
  return (
    <div className="min-w-fit">
      <div className="grid gap-2" style={cols}>
        {s.array.map((v, i) => {
          const tone = cellTone(i, s);
          return (
            <div
              key={i}
              className={`h-14 flex items-center justify-center font-mono text-base rounded-xl transition-all duration-300 motion-reduce:transition-none ${tone ? cellBorder[tone] : "bg-secondary"} ${inRange(i, s) ? "" : "opacity-25"}`}
            >
              {v}
            </div>
          );
        })}
      </div>
      <div className="grid gap-2 mt-1.5" style={cols}>
        {s.array.map((_, i) => (
          <div key={i} className="text-center font-mono text-[11px] text-muted-foreground">
            {i}
          </div>
        ))}
        <PointerRow s={s} count={n} />
      </div>
    </div>
  );
}

/* Insertion sort gets its own picture: the key lifts out of the row,
   bigger bars slide right underneath it, and it drops into the hole.
   Elements are keyed by s.ids so React moves them instead of repainting. */
const INS_BAR = 96; // tallest bar, px
const INS_LABEL = 18; // value label above each bar, px
const INS_ROW = INS_BAR + INS_LABEL;
const INS_LANE = INS_ROW + 22; // room above the row for the lifted key and its tag

function InsertionBars({ s }: { s: ArrayState }) {
  const n = Math.max(1, s.array.length);
  const max = Math.max(1, ...s.array, s.held?.value ?? 0);
  const split = s.split ?? 0;
  const h = (v: number) => Math.max(4, (v / max) * INS_BAR);
  const slotX = (i: number) => `${(i / n) * 100}%`;
  const width = `${100 / n}%`;
  const move = "transition-[left,bottom] duration-300 ease-out motion-reduce:transition-none";

  type Item = { id: number; slot: number; value: number; lifted: boolean };
  const items: Item[] = s.array.flatMap((v, i) => (i === s.gap ? [] : [{ id: s.ids?.[i] ?? i, slot: i, value: v, lifted: false }]));
  if (s.held && s.gap !== undefined) items.push({ id: s.held.id ?? -1, slot: s.gap, value: s.held.value, lifted: true });
  // Fixed DOM order: if React re-inserted the lifted key at the end, the browser would treat it
  // as a new element and skip the lift transition.
  items.sort((x, y) => x.id - y.id);

  const tone = (it: Item) => {
    if (it.lifted) return "bg-violet";
    if (s.write?.includes(it.slot)) return "bg-orange";
    if (s.compare?.includes(it.slot)) return "bg-neon";
    if (s.sorted?.includes(it.slot)) return "bg-mint";
    return it.slot < split ? "bg-foreground/45" : "bg-foreground/15";
  };

  const cols = { gridTemplateColumns: `repeat(${n}, minmax(36px, 1fr))` };
  const sortedAll = (s.sorted?.length ?? 0) >= s.array.length;

  return (
    <div className="min-w-fit">
      <div className="relative" style={{ height: INS_LANE + INS_ROW, minWidth: n * 36 }}>
        {/* the sorted "hand" */}
        {split > 0 && (
          <div
            className={`absolute bottom-0 left-0 rounded-lg bg-sky/10 border-r-2 border-dashed border-sky transition-[width] duration-300 ease-out motion-reduce:transition-none`}
            style={{ width: slotX(split), height: INS_ROW + 6 }}
          />
        )}

        {/* the hole the key will drop into */}
        {s.gap !== undefined && s.held && (
          <div className={`absolute bottom-0 px-[3px] ${move}`} style={{ left: slotX(s.gap), width }}>
            <div className="w-full rounded-t-[2px] border-2 border-b-0 border-dashed border-violet/70" style={{ height: h(s.held.value) }} />
          </div>
        )}

        {items.map((it) => (
          <div
            key={it.id}
            className={`absolute flex flex-col items-center justify-end px-[3px] ${move}`}
            style={{ left: slotX(it.slot), width, bottom: it.lifted ? INS_ROW + 14 : 0 }}
          >
            {it.lifted && (
              <span className="mb-0.5 font-mono text-[10px] text-violet">{s.held?.label}</span>
            )}
            <span className={`font-mono text-[11px] leading-[18px] ${it.lifted || it.slot < split || sortedAll ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
              {it.value}
            </span>
            <div className={`w-full rounded-t-[2px] transition-colors duration-200 ${tone(it)}`} style={{ height: h(it.value) }} />
          </div>
        ))}
      </div>

      <div className="grid mt-1" style={cols}>
        {s.array.map((_, i) => (
          <div key={i} className="text-center font-mono text-[10px] text-muted-foreground">
            {i}
          </div>
        ))}
        <PointerRow s={s} count={s.array.length} />
      </div>

      {!sortedAll && split > 0 && (
        <div className="grid mt-2 font-mono text-xs" style={cols}>
          <div className="text-sky border-t border-sky pt-1 text-center" style={{ gridColumn: `span ${Math.min(split, n)}` }}>
            sorted
          </div>
          {split < s.array.length && (
            <div className="text-muted-foreground border-t border-border pt-1 text-center" style={{ gridColumn: `span ${s.array.length - split}` }}>
              not yet looked at
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Divide-and-conquer picture for merge and quick sort: cut points open
   real gaps in the row (divide) and the call stack shows how deep the
   recursion is. Merge sort also gets a tmp lane under its piece that bars
   move down into and back up from (combine); quick sort gets a pivot line
   and spans for what each pointer has confirmed. Bars are keyed by
   s.ids / s.auxIds so they slide instead of repainting. */
const MS_SLOT = 10; // width units per array slot (positions are % of the row)
const MS_GAP = 4; // width units a cut opens between two pieces
const MS_BAR = 96;
const MS_LABEL = 18;
const MS_ROW = MS_BAR + MS_LABEL;
const MS_PTR = 20; // pointer labels under the row
const MS_TMP_TOP = MS_ROW + MS_PTR + 30;

function PieceBars({ s, call, buffer }: { s: ArrayState; call: string; buffer: boolean }) {
  const n = s.array.length;
  const aux = s.aux ?? [];
  const max = Math.max(1, ...s.array, ...aux.map((v) => v ?? 0));
  const h = (v: number) => Math.max(4, (v / max) * MS_BAR);
  const cuts = s.cuts ?? [];
  // unused gap space is split evenly on both sides so the row stays centred
  const lead = ((Math.max(0, n - 1) - cuts.length) * MS_GAP) / 2;
  const total = n * MS_SLOT + Math.max(0, n - 1) * MS_GAP;
  const pct = (u: number) => `${(u / total) * 100}%`;
  const x = (slot: number) => pct(lead + slot * MS_SLOT + cuts.filter((c) => c <= slot).length * MS_GAP);
  const xu = (slot: number) => lead + slot * MS_SLOT + cuts.filter((c) => c <= slot).length * MS_GAP;
  const slotW = pct(MS_SLOT);
  const [lo, hi] = s.range ?? [0, n - 1];
  const holes = new Set(s.holes ?? []);
  const sortedAll = (s.sorted?.length ?? 0) >= n;
  const baseCase = lo === hi && !s.aux;
  const move = "transition-[left,top,width] duration-300 ease-out motion-reduce:transition-none";

  type Item = { id: number; slot: number; value: number; inTmp: boolean; tone: string };
  const items: Item[] = [];
  s.array.forEach((v, i) => {
    if (holes.has(i)) return;
    const inRange = i >= lo && i <= hi;
    const tone = s.write?.includes(i)
      ? "bg-orange"
      : s.compare?.includes(i)
        ? "bg-neon"
        : s.pivot === i
          ? "bg-violet"
          : baseCase && inRange
            ? "bg-sky"
            : sortedAll || s.sorted?.includes(i)
              ? "bg-mint"
              : inRange
                ? "bg-foreground/45"
                : "bg-foreground/15";
    items.push({ id: s.ids?.[i] ?? i, slot: i, value: v, inTmp: false, tone });
  });
  aux.forEach((v, t) => {
    if (v === null) return;
    items.push({ id: s.auxIds?.[t] ?? n + t, slot: lo + t, value: v, inTmp: true, tone: s.auxWrite?.includes(t) ? "bg-orange" : "bg-foreground/45" });
  });
  // fixed DOM order, so React never re-inserts a node (that would skip its transition)
  items.sort((p, q) => p.id - q.id);

  const pointers: Record<number, string[]> = {};
  Object.entries(s.pointers ?? {}).forEach(([k, v]) => (pointers[v] ??= []).push(k));

  return (
    <div className="min-w-fit">
      <div className="mb-4 flex flex-wrap items-center gap-1.5 font-mono text-[11px] min-h-[24px]">
        <span className="text-xs text-muted-foreground mr-1">call stack</span>
        {(s.stack ?? []).length === 0 && <span className="text-muted-foreground">(empty)</span>}
        {(s.stack ?? []).map(([l, r], d, all) => (
          <span key={d} className="inline-flex items-center gap-1.5">
            {d > 0 && <span className="text-muted-foreground">›</span>}
            <span
              className={`px-1.5 py-0.5 rounded-lg border ${d === all.length - 1 ? "border-sky bg-sky/15 text-foreground" : "border-border text-muted-foreground"}`}
            >
              {call}({l}, {r})
            </span>
          </span>
        ))}
      </div>

      <div className="relative" style={{ minWidth: n * 40, height: buffer ? MS_TMP_TOP + MS_ROW : MS_ROW + 48 }}>
        {/* the tmp lane, always drawn so the layout never jumps */}
        {buffer && (
          <>
            <div className="absolute inset-x-0 rounded-lg bg-orange/[0.04] border border-dashed border-orange/25" style={{ top: MS_TMP_TOP - 22, bottom: -4 }} />
            <div className={`absolute left-2 font-mono text-xs ${s.aux ? "text-orange" : "text-muted-foreground"}`} style={{ top: MS_TMP_TOP - 18 }}>
              tmp {s.aux ? `[${s.aux.length}]` : "(empty until a merge)"}
            </div>
          </>
        )}

        {/* quick sort: everything under the line belongs left of the pivot, everything over it right */}
        {s.pivot !== undefined && (
          <div
            className={`absolute z-10 border-t border-dashed border-violet pointer-events-none ${move}`}
            style={{ left: x(lo), width: pct(xu(hi) + MS_SLOT - xu(lo)), top: MS_ROW - h(s.array[s.pivot]) }}
          />
        )}

        {(s.marks ?? []).map((m) => (
          <div
            key={m.label}
            className={`absolute border-t-2 border-violet/60 text-center font-mono text-[10px] text-violet ${move}`}
            style={{ left: x(m.from), width: pct(xu(m.to) + MS_SLOT - xu(m.from)), top: MS_ROW + 24 }}
          >
            {m.label}
          </div>
        ))}

        {/* the piece the current call owns */}
        {!sortedAll && (
          <div className={`absolute h-[2px] bg-sky ${move}`} style={{ left: x(lo), width: pct(xu(hi) + MS_SLOT - xu(lo)), top: MS_ROW + 1 }} />
        )}

        {/* slots whose bar has gone down into tmp */}
        {[...holes].map((i) => (
          <div key={`hole-${i}`} className="absolute px-[3px]" style={{ left: x(i), width: slotW, top: MS_ROW - h(s.array[i]) }}>
            <div className="w-full rounded-t-[2px] border border-b-0 border-dashed border-foreground/30" style={{ height: h(s.array[i]) }} />
          </div>
        ))}

        {/* the tmp buffer, one slot under each slot of the piece */}
        {aux.map((v, t) => (
          <div key={`tmp-${t}`} className="absolute px-[3px]" style={{ left: x(lo + t), width: slotW, top: MS_TMP_TOP + MS_ROW - 2 }}>
            <div className={`w-full h-[2px] ${v === null ? "bg-orange/40" : "bg-orange"}`} />
          </div>
        ))}

        {items.map((it) => (
          <div
            key={it.id}
            className={`absolute flex flex-col items-center justify-end px-[3px] ${move}`}
            style={{ left: x(it.slot), width: slotW, top: (it.inTmp ? MS_TMP_TOP : 0) + MS_ROW - h(it.value) - MS_LABEL }}
          >
            <span className="font-mono text-[11px] leading-[18px] text-foreground">{it.value}</span>
            <div className={`w-full rounded-t-[2px] transition-colors duration-200 ${it.tone}`} style={{ height: h(it.value) }} />
          </div>
        ))}

        {Object.entries(pointers).map(([slot, names]) => (
          <div
            key={names.join(",")}
            className={`absolute text-center font-mono text-[10px] text-sky ${move}`}
            style={{ left: x(Number(slot)), width: slotW, top: MS_ROW + 5 }}
          >
            {names.join(",")}
          </div>
        ))}
      </div>
    </div>
  );
}

function parseNumbers(text: string, maxLen = 14) {
  const nums = text
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((t) => Number(t))
    .filter((x) => Number.isInteger(x) && x >= 0 && x <= 999);
  return nums.slice(0, maxLen);
}

function randomNumbers(len: number) {
  return Array.from({ length: len }, () => 1 + Math.floor(Math.random() * 98));
}

const SORT_TITLES: Record<SortAlgorithm, string> = {
  selection: "Selection sort",
  bubble: "Bubble sort",
  insertion: "Insertion sort",
  merge: "Merge sort",
  quick: "Quick sort",
};

export function SortVisualizer({ algorithm, initial = [38, 27, 43, 3, 9, 82, 10] }: { algorithm: SortAlgorithm; initial?: number[] }) {
  const [data, setData] = useState(initial);
  const [text, setText] = useState(initial.join(", "));
  const frames = useMemo(() => sortFrames(algorithm, data), [algorithm, data]);

  const apply = () => {
    const nums = parseNumbers(text);
    if (nums.length >= 2) setData(nums);
  };

  const legend: [string, string][] = algorithm === "merge" ? [
    ["bg-sky", "base case"],
    ["bg-neon", "comparing fronts"],
    ["bg-orange", "just moved"],
    ["bg-mint", "final position"],
  ] : algorithm === "quick" ? [
    ["bg-violet", "pivot"],
    ["bg-neon", "checking"],
    ["bg-orange", "swapped"],
    ["bg-sky", "base case"],
    ["bg-mint", "final position"],
  ] : algorithm === "insertion" ? [
    ["bg-violet", "key (in hand)"],
    ["bg-neon", "comparing with key"],
    ["bg-orange", "shifted right"],
    ["bg-mint", "final position"],
  ] : [
    ["bg-neon", "comparing"],
    ["bg-orange", "swapping"],
    ["bg-mint", "final position"],
  ];

  return (
    <Stepper
      title={SORT_TITLES[algorithm]}
      frames={frames}
      code={JAVA_SORT[algorithm]}
      legend={legend}
      render={(s) =>
        algorithm === "insertion" ? <InsertionBars s={s} /> : algorithm === "merge" ? (
          <PieceBars s={s} call="mergeSort" buffer />
        ) : algorithm === "quick" ? (
          <PieceBars s={s} call="quickSort" buffer={false} />
        ) : <ArrayBars s={s} />
      }
      inputs={
        <div className="flex flex-wrap items-stretch gap-2">
          <input
            aria-label="Numbers to sort"
            className={`${inputCls} flex-1 min-w-[180px]`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            spellCheck={false}
          />
          <button type="button" className={btn} onClick={apply}>
            Use these
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              const r = randomNumbers(data.length);
              setData(r);
              setText(r.join(", "));
            }}
          >
            Shuffle
          </button>
        </div>
      }
    />
  );
}

/** One input, sorted by selection and by bubble sort: did equal values keep their order? */
export function StabilityCompare({ initial = [3, 7, 8, 5, 2, 1, 9, 5, 4] }: { initial?: number[] }) {
  const start = sortFrames("bubble", initial)[0].state;
  const rows: [string, ArrayState][] = [["start", start]];
  for (const algo of ["selection", "bubble"] as const) {
    const frames = sortFrames(algo, initial);
    rows.push([SORT_TITLES[algo].toLowerCase(), frames[frames.length - 1].state]);
  }
  return (
    <FocusPanel title="Stable or not?" eyebrowTone="text-sky" cardClass={vizCard} headerClass={vizHeader}>
      {rows.map(([label, s], r) => {
        const tags = equalTags(s);
        const kept = keptEqualOrder(s);
        const cols = { gridTemplateColumns: `repeat(${s.array.length}, minmax(34px, 1fr))` };
        return (
          <div key={label} className="min-w-fit">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-3 font-mono text-xs text-muted-foreground">
              {label}
              {r > 0 && kept !== null && (
                <span className={kept ? "text-mint" : "text-orange"}>{kept ? "equal values kept their order: stable" : "equal values swapped order: not stable"}</span>
              )}
            </div>
            <div className="grid gap-1" style={cols}>
              {s.array.map((v, i) => (
                <div key={i} className={`h-12 flex items-center justify-center font-mono text-base rounded-xl ${tags[i] ? cellBorder.violet : "bg-secondary"}`}>
                  {v}
                  {tags[i] && <sup className="text-violet font-semibold">{tags[i]}</sup>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </FocusPanel>
  );
}

export function SearchVisualizer({
  algorithm,
  array = [3, 8, 12, 17, 21, 29, 34, 40, 46, 51, 58, 63, 70, 77, 85],
  target = 58,
  cases = false,
}: {
  algorithm: SearchAlgorithm;
  array?: number[];
  target?: number;
  /** linear search only: buttons for the best and worst case, and the comparison count of each */
  cases?: boolean;
}) {
  const [t, setT] = useState(target);
  const [text, setText] = useState(String(target));
  const frames = useMemo(() => searchFrames(algorithm, array, t), [algorithm, array, t]);
  const pick = (v: number) => {
    setT(v);
    setText(String(v));
  };
  const n = array.length;
  const presets: [string, number][] = [
    ["best: first", array[0]],
    ["worst: last", array[n - 1]],
    ["worst: missing", Math.max(...array) + 1],
  ];
  return (
    <Stepper
      title={algorithm === "binary" ? "Binary search" : "Linear search"}
      frames={frames}
      code={JAVA_SEARCH[algorithm]}
      legend={[
        ["bg-neon", "checking"],
        ["bg-sky", "still possible"],
        ["bg-mint", "found"],
      ]}
      render={(s) => <ArrayCells s={s} />}
      inputs={
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-xs text-muted-foreground" htmlFor={`target-${algorithm}`}>
            target
          </label>
          <input
            id={`target-${algorithm}`}
            className={`${inputCls} w-24`}
            value={text}
            inputMode="numeric"
            onChange={(e) => {
              setText(e.target.value);
              const v = Number(e.target.value);
              if (e.target.value !== "" && Number.isInteger(v)) setT(v);
            }}
          />
          <span className="text-xs text-muted-foreground">Try a number that isn't in the array, too.</span>
          {cases && (
            <>
              <div className="basis-full flex flex-wrap gap-2">
                {presets.map(([label, v]) => (
                  <button key={label} type="button" className={`${btn} ${t === v ? "border-foreground" : ""}`} onClick={() => pick(v)}>
                    {label} ({v})
                  </button>
                ))}
              </div>
              <div className="basis-full font-mono text-xs text-muted-foreground">
                n = <span className="text-foreground">{n}</span> · best <span className="text-foreground">1</span> · worst{" "}
                <span className="text-foreground">{n}</span> · average <span className="text-foreground">{+((n * (n + 1) / 2 + n) / (n + 1)).toFixed(1)}</span> comparisons
              </div>
            </>
          )}
        </div>
      }
    />
  );
}

/* ------------------------------- GCD ------------------------------- */

export function EuclidVisualizer({ m = 210, n = 45 }: { m?: number; n?: number }) {
  const [vals, setVals] = useState({ m, n });
  const [text, setText] = useState({ m: String(m), n: String(n) });
  const frames = useMemo(() => gcdFrames(vals.m, vals.n), [vals]);
  const apply = () => {
    const a = Number(text.m);
    const b = Number(text.n);
    if (Number.isInteger(a) && Number.isInteger(b) && a > 0 && b >= 0 && a < 1e9 && b < 1e9) setVals({ m: a, n: b });
  };
  return (
    <Stepper
      title="Euclid's algorithm"
      frames={frames}
      code={JAVA_GCD}
      render={(s) => (
        <div className="flex flex-col gap-4">
          <div className="font-display text-2xl md:text-3xl font-semibold">
            gcd(<span className="text-sky">{s.m}</span>, <span className="text-orange">{s.n}</span>)
            {s.result !== undefined && <span className="text-mint"> = {s.result}</span>}
          </div>
          <table className="font-mono text-sm border-collapse w-full max-w-md">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left py-1.5 pr-4">m</th>
                <th className="text-left py-1.5 pr-4">n</th>
                <th className="text-left py-1.5">r = m mod n</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r, i) => {
                const latest = i === s.rows.length - 1;
                return (
                  <tr key={i} className={`border-b border-border/50 ${latest ? "bg-neon/10" : ""}`}>
                    <td className="py-1.5 pr-4">{r.m}</td>
                    <td className="py-1.5 pr-4">{r.n}</td>
                    <td className="py-1.5">{r.r === null ? <span className="text-mint">stop — n is 0</span> : r.r}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      inputs={
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="m" className={`${inputCls} w-28`} value={text.m} inputMode="numeric" onChange={(e) => setText((t) => ({ ...t, m: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && apply()} />
          <input aria-label="n" className={`${inputCls} w-28`} value={text.n} inputMode="numeric" onChange={(e) => setText((t) => ({ ...t, n: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && apply()} />
          <button type="button" className={btn} onClick={apply}>
            Run gcd
          </button>
        </div>
      }
    />
  );
}

/* ------------------------------ graphs ------------------------------ */

const DEFAULT_NODES: GraphNode[] = [
  { id: 0, x: 60, y: 120 },
  { id: 1, x: 170, y: 50 },
  { id: 2, x: 170, y: 190 },
  { id: 3, x: 290, y: 30 },
  { id: 4, x: 290, y: 130 },
  { id: 5, x: 290, y: 220 },
  { id: 6, x: 400, y: 90 },
];
const DEFAULT_EDGES: GraphEdge[] = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 4 },
  { from: 2, to: 5 },
  { from: 3, to: 6 },
  { from: 4, to: 6 },
];

const sameEdge = (e: GraphEdge, pair?: [number, number]) =>
  !!pair && ((e.from === pair[0] && e.to === pair[1]) || (e.from === pair[1] && e.to === pair[0]));

/** A small triangle just outside the target node's circle (r = 18), pointing along the edge. */
function Arrowhead({ from, to, className }: { from: { x: number; y: number }; to: { x: number; y: number }; className: string }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tipX = to.x - ux * 19;
  const tipY = to.y - uy * 19;
  const bx = tipX - ux * 10;
  const by = tipY - uy * 10;
  const pts = `${tipX},${tipY} ${bx - uy * 5},${by + ux * 5} ${bx + uy * 5},${by - ux * 5}`;
  return <polygon points={pts} className={`${className} transition-colors`} />;
}

export function GraphSvg({
  nodes,
  edges,
  edgeClass,
  nodeClass,
  showWeights,
  directed,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  edgeClass: (e: GraphEdge, i: number) => { stroke: string; width: number; dash?: string };
  nodeClass: (id: number) => string;
  showWeights?: boolean;
  directed?: boolean; // draw an arrowhead where each edge meets its "to" node
}) {
  const w = Math.max(...nodes.map((n) => n.x)) + 50;
  const h = Math.max(...nodes.map((n) => n.y)) + 40;
  const pos = new Map(nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block mx-auto max-w-full h-auto text-foreground" role="img" aria-label="Graph">
      {edges.map((e, i) => {
        const a = pos.get(e.from)!;
        const b = pos.get(e.to)!;
        const st = edgeClass(e, i);
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`${st.stroke} transition-all`} strokeWidth={st.width} strokeDasharray={st.dash} strokeLinecap="round" />
            {directed && <Arrowhead from={a} to={b} className={st.stroke.replace("stroke-", "fill-")} />}
            {showWeights && e.weight !== undefined && (
              <g>
                <rect x={(a.x + b.x) / 2 - 12} y={(a.y + b.y) / 2 - 9} width={24} height={18} rx={9} className="fill-card stroke-border" strokeWidth={1} />
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} textAnchor="middle" dominantBaseline="central" fontSize={11} className="font-mono fill-current">
                  {e.weight}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={19} strokeWidth={2} className={`transition-colors duration-300 ${nodeClass(n.id)}`} />
          <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={14} className="font-mono fill-current font-medium">
            {n.label ?? n.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Chips({ label, items, tone, hint }: { label: string; items: (number | string)[]; tone: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
      <span className="w-14 text-xs text-muted-foreground">{label}</span>
      {items.length === 0 ? (
        <span className="text-muted-foreground italic">empty</span>
      ) : (
        items.map((v, i) => (
          <span key={`${v}-${i}`} className={`px-2.5 py-1 border rounded-full ${tone}`}>
            {v}
          </span>
        ))
      )}
      {hint && items.length > 0 && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function Toggle<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-secondary p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`font-mono text-xs px-3.5 py-1.5 rounded-full transition-colors ${value === v ? "bg-violet text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/70"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function GraphTraversal({
  algorithm = "bfs",
  nodes = DEFAULT_NODES,
  edges = DEFAULT_EDGES,
  start = 0,
  directed = false,
}: {
  algorithm?: "bfs" | "dfs";
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  start?: number;
  directed?: boolean;
}) {
  const [kind, setKind] = useState(algorithm);
  const names = useMemo(() => {
    const out: string[] = [];
    for (const n of nodes) out[n.id] = n.label ?? String(n.id);
    return out;
  }, [nodes]);
  const frames = useMemo(() => traversalFrames(kind, nodes.length, edges, start, directed, names), [kind, nodes, edges, start, directed, names]);
  return (
    <Stepper
      title={kind === "bfs" ? "Breadth-first search" : "Depth-first search"}
      frames={frames}
      code={JAVA_TRAVERSAL[kind]}
      legend={[
        ["bg-neon", "current / checking"],
        ["bg-sky", "seen, waiting"],
        ["bg-mint", "visited / tree edge"],
      ]}
      render={(s) => (
        <div className="flex flex-col gap-4">
          <GraphSvg
            nodes={nodes}
            edges={edges}
            directed={directed}
            edgeClass={(e) =>
              sameEdge(e, s.checking)
                ? { stroke: "stroke-neon", width: 4 }
                : s.treeEdges.some((t) => sameEdge(e, t))
                  ? { stroke: "stroke-mint", width: 3.5 }
                  : { stroke: "stroke-border", width: 2 }
            }
            nodeClass={(id) =>
              id === s.current
                ? "fill-neon/40 stroke-neon"
                : s.order.includes(id)
                  ? "fill-mint/25 stroke-mint"
                  : s.visited.includes(id)
                    ? "fill-sky/15 stroke-sky"
                    : "fill-card stroke-current"
            }
          />
          <div className="flex flex-col gap-2">
            <Chips label={kind === "bfs" ? "queue" : "stack"} items={s.frontier.map((v) => names[v])} tone="border-sky bg-sky/10" hint={kind === "bfs" ? "← front … back" : "bottom … top →"} />
            <Chips label="order" items={s.order.map((v) => names[v])} tone="border-mint bg-mint/10" />
          </div>
        </div>
      )}
      inputs={
        <Toggle<"bfs" | "dfs">
          value={kind}
          onChange={setKind}
          options={[
            ["bfs", "BFS (queue)"],
            ["dfs", "DFS (stack)"],
          ]}
        />
      }
    />
  );
}

/* ------------------------------- MST ------------------------------- */

const MST_NODES: GraphNode[] = [
  { id: 0, x: 50, y: 120 },
  { id: 1, x: 170, y: 40 },
  { id: 2, x: 170, y: 200 },
  { id: 3, x: 300, y: 120 },
  { id: 4, x: 420, y: 40 },
  { id: 5, x: 420, y: 200 },
];
const MST_EDGES: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 3 },
  { from: 1, to: 2, weight: 1 },
  { from: 1, to: 3, weight: 2 },
  { from: 2, to: 3, weight: 4 },
  { from: 3, to: 4, weight: 2 },
  { from: 4, to: 5, weight: 6 },
  { from: 3, to: 5, weight: 5 },
  { from: 2, to: 5, weight: 7 },
];

export function MstVisualizer({
  algorithm = "prim",
  nodes = MST_NODES,
  edges = MST_EDGES,
}: {
  algorithm?: "prim" | "kruskal";
  nodes?: GraphNode[];
  edges?: GraphEdge[];
}) {
  const [kind, setKind] = useState(algorithm);
  const frames = useMemo(() => {
    const names: string[] = [];
    for (const n of nodes) names[n.id] = n.label ?? String(n.id);
    return mstFrames(kind, nodes.length, edges, names);
  }, [kind, nodes, edges]);
  return (
    <Stepper
      title={kind === "prim" ? "Prim's algorithm" : "Kruskal's algorithm"}
      frames={frames}
      code={JAVA_MST[kind]}
      legend={[
        ["bg-neon", "candidate / considering"],
        ["bg-mint", "in the tree"],
        ["bg-orange", "rejected (cycle)"],
      ]}
      render={(s) => (
        <GraphSvg
          nodes={nodes}
          edges={edges}
          showWeights
          edgeClass={(_, i) =>
            i === s.considering && !s.accepted.includes(i) && !s.rejected.includes(i)
              ? { stroke: "stroke-neon", width: 5 }
              : s.accepted.includes(i)
                ? { stroke: "stroke-mint", width: 4.5 }
                : s.rejected.includes(i)
                  ? { stroke: "stroke-orange", width: 2, dash: "5 4" }
                  : s.candidates.includes(i)
                    ? { stroke: "stroke-neon", width: 2.5, dash: "2 3" }
                    : { stroke: "stroke-border", width: 2 }
          }
          nodeClass={(id) => (s.inTree.includes(id) ? "fill-mint/25 stroke-mint" : "fill-card stroke-current")}
        />
      )}
      inputs={
        <Toggle<"prim" | "kruskal">
          value={kind}
          onChange={setKind}
          options={[
            ["prim", "Prim"],
            ["kruskal", "Kruskal"],
          ]}
        />
      }
    />
  );
}

/* ----------------------------- knapsack ----------------------------- */

const DEFAULT_ITEMS: KnapsackItem[] = [
  { name: "item 1", weight: 2, value: 12 },
  { name: "item 2", weight: 1, value: 10 },
  { name: "item 3", weight: 3, value: 20 },
  { name: "item 4", weight: 2, value: 15 },
];

export function KnapsackTable({ items = DEFAULT_ITEMS, capacity = 5 }: { items?: KnapsackItem[]; capacity?: number }) {
  const frames = useMemo(() => knapsackFrames(items, capacity), [items, capacity]);
  const eq = (a?: [number, number], i?: number, w?: number) => !!a && a[0] === i && a[1] === w;
  return (
    <Stepper
      title="0/1 knapsack: filling the table"
      frames={frames}
      code={JAVA_KNAPSACK}
      legend={[
        ["bg-neon", "cell being filled"],
        ["bg-sky", "cells it reads"],
        ["bg-violet", "walking back"],
        ["bg-mint", "item taken"],
      ]}
      render={(s) => (
        <table className="font-mono text-xs border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left text-xs text-muted-foreground font-normal">item (w, v) \ capacity</th>
              {Array.from({ length: capacity + 1 }, (_, w) => (
                <th key={w} className="px-2 py-1.5 w-10 text-center text-muted-foreground font-normal">
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.table.map((row, i) => (
              <tr key={i}>
                <td className={`px-2 py-1.5 whitespace-nowrap ${i > 0 && s.chosen.includes(i - 1) ? "text-mint font-semibold" : "text-muted-foreground"}`}>
                  {i === 0 ? "none" : `${items[i - 1].name} (${items[i - 1].weight}, ${items[i - 1].value})`}
                </td>
                {row.map((v, w) => {
                  const cls = eq(s.cell, i, w)
                    ? "bg-neon/30 border-neon"
                    : s.deps?.some((d) => d[0] === i && d[1] === w)
                      ? "bg-sky/20 border-sky"
                      : eq(s.trace, i, w)
                        ? "bg-violet/25 border-violet"
                        : "border-border";
                  return (
                    <td key={w} className={`w-10 h-8 text-center border transition-colors ${cls}`}>
                      {v ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    />
  );
}

/* ------------------------------ growth ------------------------------ */

const GROWTH_NS = [10, 20, 30, 50, 100, 1_000, 10_000, 100_000, 1_000_000];

export function GrowthTable({ initialN = 100 }: { initialN?: number }) {
  const [i, setI] = useState(Math.max(0, GROWTH_NS.indexOf(initialN)));
  const n = GROWTH_NS[i];
  return (
    <FocusPanel title="How the work grows with n" eyebrowTone="text-sky" cardClass={vizCard} headerClass={vizHeader}>
      <label className="flex flex-wrap items-center gap-4 font-mono text-xs">
        <span className="text-muted-foreground">input size</span>
        <input type="range" min={0} max={GROWTH_NS.length - 1} value={i} onChange={(e) => setI(Number(e.target.value))} className="flex-1 min-w-[160px] accent-current" aria-label="Input size n" />
        <span className="font-display text-xl font-semibold text-violet w-28">n = {n.toLocaleString("en-US")}</span>
      </label>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs border-collapse">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left py-2 pr-4 font-normal">growth</th>
              <th className="text-right py-2 pr-4 font-normal">basic operations</th>
              <th className="text-right py-2 font-normal">time at ~10⁸ ops/sec</th>
            </tr>
          </thead>
          <tbody>
            {GROWTH.map((g) => {
              const ops = g.f(n);
              const bad = ops / 1e8 > 1;
              return (
                <tr key={g.label} className="border-b border-border/50">
                  <td className="py-2 pr-4">
                    <span className="font-semibold">{g.label}</span> <span className="text-muted-foreground">{g.name}</span>
                  </td>
                  <td className="py-2 pr-4 text-right">{formatOps(ops)}</td>
                  <td className={`py-2 text-right ${bad ? "text-orange" : "text-mint"}`}>{humanTime(ops)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Drag the slider. Up to n = 30 every row looks harmless. At a million, the slow rows take hours or longer, and avoiding them is what this course is about.
      </p>
    </FocusPanel>
  );
}

/* ----------------------------- foundations ----------------------------- */

export function FindMaxVisualizer({
  initial = [8, 1, 4, 9, 3, 7],
}: {
  initial?: number[];
}) {
  const [array, setArray] = useState<number[]>(initial);
  const [text, setText] = useState(initial.join(", "));
  const frames = useMemo(() => findMaxFrames(array), [array]);

  const presets: [string, number[]][] = [
    ["Lesson instance", [8, 1, 4, 9, 3, 7]],
    ["All negative", [-5, -2, -9, -1, -8]],
    ["Descending", [9, 7, 5, 3, 1]],
    ["Ascending", [2, 4, 6, 8, 10]],
  ];

  const pick = (arr: number[]) => {
    setArray(arr);
    setText(arr.join(", "));
  };

  const applyCustom = () => {
    const nums = text
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s !== "" && !isNaN(Number(s)))
      .map(Number);
    if (nums.length > 0 && nums.length <= 16) {
      setArray(nums);
    }
  };

  return (
    <Stepper
      title="Finding the maximum: findMax"
      frames={frames}
      code={JAVA_FIND_MAX}
      legend={[
        ["bg-neon", "comparing / checking"],
        ["bg-mint", "current max"],
        ["bg-orange", "new max recorded"],
      ]}
      render={(s) => <ArrayCells s={s} />}
      inputs={
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Presets:</span>
            {presets.map(([label, arr]) => (
              <button
                key={label}
                type="button"
                className={`${btn} ${JSON.stringify(array) === JSON.stringify(arr) ? "border-foreground" : ""}`}
                onClick={() => pick(arr)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="font-mono text-xs text-muted-foreground" htmlFor="findmax-custom">
              Custom array:
            </label>
            <input
              id="findmax-custom"
              className={`${inputCls} min-w-[200px] flex-1`}
              value={text}
              placeholder="e.g. 12, 4, 19, 7"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCustom();
              }}
            />
            <button type="button" className={`${btn} ${btnPrimary}`} onClick={applyCustom}>
              Load
            </button>
            <span className="text-xs text-muted-foreground">Up to 16 numbers.</span>
          </div>
        </div>
      }
    />
  );
}

export function NestedLoopGrid({ initialN = 4 }: { initialN?: number }) {
  const [n, setN] = useState(initialN);
  const [mode, setMode] = useState<LoopGridMode>("dependent");
  const [activeStep, setActiveStep] = useState<number>(-1);

  const info = useMemo(() => loopGridInfo(n, mode), [n, mode]);

  useEffect(() => {
    setActiveStep(-1);
  }, [n, mode]);

  const currentCell = activeStep >= 0 && activeStep < info.activeCells.length ? info.activeCells[activeStep] : null;

  return (
    <FocusPanel
      title="Nested loop execution geometry"
      eyebrowTone="text-sky"
      cardClass={vizCard}
      headerClass={vizHeader}
      extraHeader={
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            className={`${btn} ${mode === "dependent" ? "border-foreground bg-secondary font-semibold" : ""}`}
            onClick={() => setMode("dependent")}
          >
            Dependent (j ≤ i)
          </button>
          <button
            type="button"
            className={`${btn} ${mode === "independent" ? "border-foreground bg-secondary font-semibold" : ""}`}
            onClick={() => setMode("independent")}
          >
            Independent (j ≤ n)
          </button>
          <button
            type="button"
            className={`${btn} ${mode === "fixed" ? "border-foreground bg-secondary font-semibold" : ""}`}
            onClick={() => setMode("fixed")}
          >
            Fixed inner (j ≤ 3)
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <label className="flex items-center gap-3">
          <span className="text-muted-foreground">Outer loop size (n):</span>
          <input
            type="range"
            min={2}
            max={8}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-28 sm:w-36 accent-sky"
            aria-label="Outer loop size n"
          />
          <span className="font-display text-lg font-semibold text-sky w-10">n = {n}</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={btn}
            disabled={activeStep <= -1}
            onClick={() => setActiveStep((s) => Math.max(-1, s - 1))}
          >
            ← Prev
          </button>
          <button
            type="button"
            className={`${btn} ${btnPrimary}`}
            disabled={activeStep >= info.activeCells.length - 1}
            onClick={() => setActiveStep((s) => Math.min(info.activeCells.length - 1, s + 1))}
          >
            Step ({activeStep + 1}/{info.activeCells.length})
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => setActiveStep(activeStep === -1 ? info.activeCells.length - 1 : -1)}
          >
            {activeStep === -1 ? "Show all" : "Reset"}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-2">
        <div className="text-xs font-mono text-muted-foreground text-center">
          Columns: inner loop <span className="text-foreground">j = 1 … {n}</span> · Rows: outer loop <span className="text-foreground">i = 1 … {n}</span>
        </div>
        <div className="overflow-x-auto p-2 w-full flex justify-center">
          <div className="flex flex-col gap-1.5 min-w-fit">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <span className="w-8 text-right pr-2">i \ j</span>
              {Array.from({ length: n }, (_, idx) => (
                <span key={idx} className="w-8 sm:w-10 text-center">
                  {idx + 1}
                </span>
              ))}
              <span className="w-16 pl-2 text-left">passes</span>
            </div>

            {Array.from({ length: n }, (_, rowIdx) => {
              const iVal = rowIdx + 1;
              const limit = info.rowCounts[rowIdx];
              return (
                <div key={rowIdx} className="flex items-center gap-1.5">
                  <span className="w-8 font-mono text-xs text-muted-foreground text-right pr-2">
                    i={iVal}
                  </span>
                  {Array.from({ length: n }, (_, colIdx) => {
                    const jVal = colIdx + 1;
                    const isActive = jVal <= limit;
                    const isCurrent = currentCell && currentCell[0] === iVal && currentCell[1] === jVal;
                    const stepIdx = info.activeCells.findIndex((c) => c[0] === iVal && c[1] === jVal);
                    const isExecuted = activeStep === -1 || stepIdx <= activeStep;

                    return (
                      <div
                        key={colIdx}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-mono text-xs transition-all duration-200 motion-reduce:transition-none border ${
                          !isActive
                            ? "bg-secondary/20 border-dashed border-border/40 text-muted-foreground/30 select-none"
                            : isCurrent
                            ? "bg-neon border-neon text-black font-bold ring-2 ring-neon/50 scale-105"
                            : isExecuted
                            ? "bg-sky/20 border-sky/50 text-foreground font-semibold"
                            : "bg-secondary/60 border-border text-muted-foreground"
                        }`}
                        title={isActive ? `Pass i=${iVal}, j=${jVal}` : `j=${jVal} > limit, does not run`}
                      >
                        {isActive ? `${iVal},${jVal}` : "·"}
                      </div>
                    );
                  })}
                  <span className="w-16 pl-2 font-mono text-xs text-muted-foreground">
                    {limit} {limit === 1 ? "step" : "steps"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border/60">
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 font-mono text-xs">
          <div className="text-muted-foreground mb-1">Total operations:</div>
          <div className="text-sm font-semibold text-foreground mb-1">{info.formula}</div>
          <div className="text-sky font-semibold text-base">{info.bigO} time complexity</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 text-xs text-muted-foreground leading-relaxed">
          {mode === "dependent" && (
            <>
              The active cells form a <strong className="text-foreground">triangle</strong>. The sum is{" "}
              <code className="text-foreground">n(n+1)/2 = ½n² + ½n</code>. Dropping lower-order terms and the constant factor{" "}
              <code className="text-foreground">½</code> yields <strong className="text-foreground">O(n²)</strong>.
            </>
          )}
          {mode === "independent" && (
            <>
              Every row runs all <strong className="text-foreground">n</strong> iterations, forming a full{" "}
              <code className="text-foreground">n × n</code> square. Total operations: <code className="text-foreground">n²</code>, which is{" "}
              <strong className="text-foreground">O(n²)</strong>.
            </>
          )}
          {mode === "fixed" && (
            <>
              The inner loop runs a fixed <strong className="text-foreground">3 times</strong> regardless of n. Total operations:{" "}
              <code className="text-foreground">3n</code>. Dropping constant factor 3 yields <strong className="text-foreground">O(n)</strong> (linear).
            </>
          )}
        </div>
      </div>
    </FocusPanel>
  );
}

export function ArraySwapVisualizer({
  initial = [5, 9, 14, 2],
  x = 0,
  y = 1,
}: {
  initial?: number[];
  x?: number;
  y?: number;
}) {
  const [mode, setMode] = useState<"correct" | "buggy">("correct");
  const frames = useMemo(() => swapFrames(initial, x, y, mode), [initial, x, y, mode]);
  const code = mode === "correct" ? JAVA_SWAP.correct : JAVA_SWAP.buggy;

  return (
    <Stepper
      title="The swap method: temporary variable vs the overwrite bug"
      frames={frames}
      code={code}
      legend={[
        ["bg-violet", "temporary variable (temp)"],
        ["bg-neon", "indices to swap"],
        ["bg-orange", "written / modified slot"],
      ]}
      render={(s: SwapState) => (
        <div className="flex flex-col gap-5 items-center py-2">
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-muted-foreground font-semibold">temp:</span>
            <div
              className={`w-14 h-12 rounded-xl flex items-center justify-center font-mono text-base border-2 transition-all duration-300 motion-reduce:transition-none ${
                s.temp !== null
                  ? "border-violet bg-violet/20 text-foreground font-bold shadow-sm ring-2 ring-violet/40"
                  : "border-dashed border-border bg-secondary/30 text-muted-foreground/40"
              }`}
            >
              {s.temp !== null ? s.temp : "empty"}
            </div>
            {s.buggy && <span className="text-orange font-semibold">(omitted in buggy version)</span>}
          </div>

          <div className="flex flex-col items-center gap-1.5 w-full max-w-sm">
            <div className="text-xs font-mono text-muted-foreground">array slots</div>
            <div className="grid grid-cols-4 gap-2.5 w-full">
              {s.array.map((val, idx) => {
                const isTarget = idx === s.x || idx === s.y;
                const isWritten = s.write?.includes(idx);
                const isComparing = s.compare?.includes(idx);
                return (
                  <div
                    key={idx}
                    className={`h-14 flex flex-col items-center justify-center font-mono rounded-xl border-2 transition-all duration-300 motion-reduce:transition-none ${
                      isWritten
                        ? "border-orange bg-orange/20 text-foreground font-bold ring-2 ring-orange/40 scale-105"
                        : isComparing
                        ? "border-neon bg-neon/15 text-foreground font-bold ring-2 ring-neon/40"
                        : isTarget
                        ? "border-border/80 bg-secondary/50 text-foreground"
                        : "border-border/40 bg-secondary/20 text-muted-foreground opacity-60"
                    }`}
                  >
                    <span className="text-base font-semibold">{val}</span>
                    <span className="text-[10px] text-muted-foreground">[{idx}]</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      inputs={
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Mode:</span>
            <button
              type="button"
              className={`${btn} ${mode === "correct" ? "border-foreground bg-secondary font-semibold" : ""}`}
              onClick={() => setMode("correct")}
            >
              Correct (with temp)
            </button>
            <button
              type="button"
              className={`${btn} ${mode === "buggy" ? "border-orange text-orange bg-orange/10 font-semibold" : ""}`}
              onClick={() => setMode("buggy")}
            >
              The bug (without temp)
            </button>
          </div>
          <span className="text-muted-foreground">
            Swapping indices <span className="text-foreground">{x}</span> and <span className="text-foreground">{y}</span>
          </span>
        </div>
      }
    />
  );
}

export function ArrayReferenceVisualizer() {
  const [mode, setMode] = useState<"alias" | "clone">("alias");
  const [mutated, setMutated] = useState(false);

  const heapA = mutated && mode === "alias" ? [99, 24, 16] : [12, 24, 16];
  const heapB = mutated && mode === "clone" ? [99, 24, 16] : [12, 24, 16];

  const handleModeChange = (newMode: "alias" | "clone") => {
    setMode(newMode);
    setMutated(false);
  };

  return (
    <FocusPanel
      title="The reference trap: int[] copy = original vs .clone()"
      eyebrowTone="text-orange"
      cardClass={vizCard}
      headerClass={vizHeader}
      extraHeader={
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            className={`${btn} ${mode === "alias" ? "border-orange bg-orange/10 text-orange font-semibold" : ""}`}
            onClick={() => handleModeChange("alias")}
          >
            copy = original (alias)
          </button>
          <button
            type="button"
            className={`${btn} ${mode === "clone" ? "border-mint bg-mint/10 text-mint font-semibold" : ""}`}
            onClick={() => handleModeChange("clone")}
          >
            copy = original.clone() (independent)
          </button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 items-start py-2">
        <div className="rounded-xl border border-border/70 bg-secondary/20 p-4 flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="font-semibold text-foreground tracking-wide uppercase">Stack (Variables)</span>
            <span className="text-[11px] text-muted-foreground">stores memory addresses</span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
              <span className="font-semibold text-foreground">original</span>
              <div className="flex items-center gap-1.5 text-sky font-semibold">
                <span>→ ref @0x100</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
              <span className="font-semibold text-foreground">copy</span>
              <div className="flex items-center gap-1.5 font-semibold">
                {mode === "alias" ? (
                  <span className="text-orange">→ ref @0x100 (same!)</span>
                ) : (
                  <span className="text-mint">→ ref @0x200 (new!)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-secondary/20 p-4 flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="font-semibold text-foreground tracking-wide uppercase">Heap (Array Objects)</span>
            <span className="text-[11px] text-muted-foreground">stores actual element values</span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-lg border border-border bg-card flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-semibold text-sky">Object @0x100</span>
                <span>{mode === "alias" ? "referenced by original & copy" : "referenced by original"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {heapA.map((val, idx) => (
                  <div
                    key={idx}
                    className={`py-2 rounded-md font-mono text-sm border ${
                      idx === 0 && mutated && mode === "alias"
                        ? "bg-orange/20 border-orange text-foreground font-bold ring-2 ring-orange/40"
                        : "bg-secondary/40 border-border/60 text-foreground"
                    }`}
                  >
                    <div>{val}</div>
                    <div className="text-[10px] text-muted-foreground">[{idx}]</div>
                  </div>
                ))}
              </div>
            </div>

            {mode === "clone" && (
              <div className="p-3 rounded-lg border border-mint/40 bg-card flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold text-mint">Object @0x200 (clone)</span>
                  <span>referenced by copy</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {heapB.map((val, idx) => (
                    <div
                      key={idx}
                      className={`py-2 rounded-md font-mono text-sm border ${
                        idx === 0 && mutated
                          ? "bg-mint/20 border-mint text-foreground font-bold ring-2 ring-mint/40"
                          : "bg-secondary/40 border-border/60 text-foreground"
                      }`}
                    >
                      <div>{val}</div>
                      <div className="text-[10px] text-muted-foreground">[{idx}]</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`${btn} ${mutated ? "border-border" : btnPrimary}`}
            onClick={() => setMutated(true)}
            disabled={mutated}
          >
            Execute: copy[0] = 99
          </button>
          {mutated && (
            <button type="button" className={btn} onClick={() => setMutated(false)}>
              Reset
            </button>
          )}
        </div>

        <div className="text-xs font-mono">
          {!mutated ? (
            <span className="text-muted-foreground">Click "Execute" to mutate copy[0] and observe the side effect.</span>
          ) : mode === "alias" ? (
            <span className="text-orange font-semibold">
              ⚠️ Trap triggered: original[0] also changed to 99! Both variables share one array in the heap.
            </span>
          ) : (
            <span className="text-mint font-semibold">
              ✓ Independent: original[0] remained 12! .clone() allocated a separate heap array.
            </span>
          )}
        </div>
      </div>
    </FocusPanel>
  );
}

/* ----------------------------- practice ----------------------------- */

export type LeetCodeProblem = {
  id: number;
  title: string;
  slug: string;
  why: string;
  difficulty?: "Easy" | "Medium" | "Hard";
};

export function LeetCodeProblems({ problems, note = "solve them in Java" }: { problems: LeetCodeProblem[]; note?: string }) {
  return (
    <section className="not-prose my-10 rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-baseline justify-between gap-3 flex-wrap">
        <div className="eyebrow text-orange">Practice on LeetCode</div>
        <span className="font-mono text-xs text-muted-foreground">{note}</span>
      </div>
      <ul className="divide-y divide-border">
        {problems.map((p) => {
          const diff = p.difficulty ?? "Easy";
          return (
            <li key={p.id}>
              <a
                href={`https://leetcode.com/problems/${p.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 px-5 py-3.5 hover:bg-foreground/5 transition-colors"
              >
                <span className="font-mono text-xs text-muted-foreground w-12 shrink-0 pt-0.5">#{p.id}</span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-display font-semibold group-hover:underline underline-offset-4">{p.title}</span>
                    <span className={`font-mono text-xs ${diff === "Easy" ? "text-mint" : "text-orange"}`}>
                      {diff === "Easy" ? "easy" : `stretch · ${diff.toLowerCase()}`}
                    </span>
                  </span>
                  <span className="block text-sm text-muted-foreground leading-relaxed mt-0.5">{p.why}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors pt-0.5">↗</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* -------------------------- merge sort tree -------------------------- */

type Piece = { lo: number; hi: number; carried: boolean };

/** Pieces at every depth of the recursion, using the same mid as the Java code. */
function splitLevels(n: number) {
  const levels: Piece[][] = [[{ lo: 0, hi: n - 1, carried: false }]];
  while (levels[levels.length - 1].some((p) => p.hi > p.lo)) {
    const next: Piece[] = [];
    for (const p of levels[levels.length - 1]) {
      if (p.hi === p.lo) {
        next.push({ ...p, carried: true });
      } else {
        const mid = Math.floor((p.lo + p.hi) / 2);
        next.push({ lo: p.lo, hi: mid, carried: false }, { lo: mid + 1, hi: p.hi, carried: false });
      }
    }
    levels.push(next);
  }
  return levels;
}

export function MergeSortTree({ input = [38, 27, 43, 3, 9, 82, 10] }: { input?: number[] }) {
  const n = input.length;
  const levels = useMemo(() => splitLevels(n), [n]);
  const depth = levels.length - 1;

  // Split rows go down to single elements; merge rows replay the same ranges back up, sorted.
  const rows = [
    ...levels.map((pieces, d) => ({
      pieces,
      sorted: d === depth,
      label: d === 0 ? "input" : d === depth ? "size 1" : "split",
      kind: d === 0 ? "input" : d === depth ? "base" : "split",
    })),
    ...levels
      .slice(0, depth)
      .reverse()
      .map((pieces, i) => ({
        pieces: pieces.map((p) => ({ ...p, carried: p.carried || p.hi === p.lo })),
        sorted: true,
        label: i === depth - 1 ? "sorted" : "merge",
        kind: i === depth - 1 ? "output" : "merge",
      })),
  ];

  const boxTone: Record<string, string> = {
    input: "border-neon bg-neon/10",
    split: "border-foreground/30",
    base: "border-sky/70 bg-sky/10",
    merge: "border-orange/70 bg-orange/10",
    output: "border-mint bg-mint/15",
  };

  return (
    <FocusPanel
      title="Merge sort, level by level"
      eyebrowTone="text-sky"
      legend={[["bg-sky", "base case"], ["bg-orange", "merged"], ["bg-mint", "done"]]}
      cardClass={vizCard}
      headerClass={vizHeader}
    >
      <div className="grid gap-y-2 gap-x-3 min-w-fit" style={{ gridTemplateColumns: "auto 1fr" }}>
        {rows.map((row, r) => (
          <div key={r} className="contents">
            <div
              className={`font-mono text-xs self-center text-right ${
                r === depth ? "text-sky" : r > depth ? "text-orange" : "text-muted-foreground"
              } ${row.kind === "output" ? "!text-mint" : ""}`}
            >
              {row.label}
            </div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(34px, 1fr))` }}>
              {row.pieces.map((p) => {
                const vals = input.slice(p.lo, p.hi + 1);
                if (row.sorted) vals.sort((a, b) => a - b);
                const dim = p.carried && row.kind !== "base";
                return (
                  <div
                    key={`${p.lo}-${p.hi}`}
                    style={{ gridColumn: `${p.lo + 1} / ${p.hi + 2}` }}
                    className={`h-9 flex items-center justify-around px-1 font-mono text-[13px] border rounded-lg transition-opacity ${
                      dim ? "border-dashed border-border text-muted-foreground opacity-60" : boxTone[row.kind]
                    }`}
                  >
                    {vals.map((v, i) => (
                      <span key={i}>{v}</span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Each box sits under the slice of the array it came from. Dashed boxes are pieces that were already size 1 and are just waiting for the others.
      </p>
    </FocusPanel>
  );
}
