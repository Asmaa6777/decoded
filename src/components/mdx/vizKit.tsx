import { ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Frame } from "@/lib/algorithms";

/* ============================================================
   The kit every visualizer is built from: button and card
   styles, Legend, FocusPanel, Stepper, Toggle, Panel, useTween.
   It lives on its own so a lesson that uses one visualizer
   family doesn't download the algorithm and matrix ones too.
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

export function Panel({ title, legend, children }: { title: string; legend?: [string, string][]; children: React.ReactNode }) {
  return (
    <FocusPanel title={title} eyebrowTone="text-mint" legend={legend}>
      {children}
    </FocusPanel>
  );
}

/** Eases `target` in on every change. Reduced-motion users get the end state straight away. */
export function useTween(target: number[], ms = 650): [number[], (from: number[]) => void] {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  const key = target.join(",");
  const [restart, setRestart] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof requestAnimationFrame === "undefined") {
      current.current = target;
      setValue(target);
      return;
    }
    const from = current.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const next = target.map((x, i) => (from[i] ?? x) + (x - (from[i] ?? x)) * e);
      current.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // the serialized key stands in for the array; restart replays from a new start
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, restart, ms]);
  const replayFrom = (from: number[]) => {
    current.current = from;
    setValue(from);
    setRestart((r) => r + 1);
  };
  return [value, replayFrom];
}
