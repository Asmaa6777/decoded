import { useEffect, useMemo, useRef, useState } from "react";
import { btn, Legend, Stepper, Toggle } from "@/components/mdx/AlgoVisualizers";
import { elementwiseFrames, MAGIC3, MATLAB_ELEMENTWISE, MATLAB_VECTOR_PRODUCT, pascal, transpose, vectorProductFrames, type ElementwiseOp, type Mat, type VectorProductKind } from "@/lib/matrix";

/* ============================================================
   Visualizers for the Computational Mathematics course. Matrix
   entries are absolutely positioned and keyed by identity, so a
   row swap or a transpose makes the numbers travel. Colours follow
   AlgoVisualizers: neon = looking at, orange = writing, mint = done,
   violet = special, sky = active window.
   ============================================================ */

export function Panel({ title, legend, children }: { title: string; legend?: [string, string][]; children: React.ReactNode }) {
  return (
    <div className="not-prose my-8 border border-border bg-card rounded-sm overflow-hidden text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div className="eyebrow text-mint">{title}</div>
        {legend && <Legend items={legend} />}
      </div>
      <div className="p-5 flex flex-col gap-4 overflow-x-auto">{children}</div>
    </div>
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

export type CellTone = "neon" | "orange" | "sky" | "violet" | "mint" | "muted";

const TONE: Record<CellTone, string> = {
  neon: "border-neon bg-neon/20",
  orange: "border-orange bg-orange/15",
  sky: "border-sky bg-sky/15",
  violet: "border-violet bg-violet/15",
  mint: "border-mint bg-mint/15",
  muted: "border-border/50 text-muted-foreground/50",
};

export type StageCell = { id: string; row: number; col: number; text: string; tone?: CellTone; hidden?: boolean };

/** A bracketed matrix whose cells slide, recolour and fade between states. */
export function MatrixStage({ rows, cols, cells, label, size = 42 }: { rows: number; cols: number; cells: StageCell[]; label?: React.ReactNode; size?: number }) {
  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <div
        className="relative border-x-2 border-foreground/50 rounded-[5px] transition-[width,height] duration-500 ease-out motion-reduce:transition-none box-content px-1 py-1"
        style={{ width: cols * size, height: rows * size }}
      >
        {cells.map((c) => (
          <div
            key={c.id}
            className={`absolute left-1 top-1 flex items-center justify-center rounded-sm border font-mono text-[13px] transition-[transform,opacity,background-color,border-color] duration-500 ease-out motion-reduce:transition-none ${c.tone ? TONE[c.tone] : "border-border bg-background/50"}`}
            style={{
              width: size - 4,
              height: size - 4,
              transform: `translate(${c.col * size + 2}px, ${c.row * size + 2}px) scale(${c.hidden ? 0.5 : 1})`,
              opacity: c.hidden ? 0 : 1,
            }}
          >
            {c.text}
          </div>
        ))}
      </div>
      {label && <div className="font-mono text-[11px] text-muted-foreground">{label}</div>}
    </div>
  );
}

/** Stage cells for a plain matrix. `tone` and `fmt` decide each entry's look. */
export function matCells(a: (number | string | null)[][], prefix: string, tone?: (i: number, j: number) => CellTone | undefined): StageCell[] {
  return a.flatMap((r, i) =>
    r.map((v, j) => ({ id: `${prefix}${i}-${j}`, row: i, col: j, text: v === null ? "" : String(v), hidden: v === null, tone: tone?.(i, j) })),
  );
}

export const Op = ({ children }: { children: React.ReactNode }) => <div className="font-mono text-xl text-muted-foreground px-1 self-center pb-5">{children}</div>;

/* ----------------------- add, subtract, scale ----------------------- */

export function ElementwiseVisualizer({ op: op0 = "add" }: { op?: ElementwiseOp }) {
  const [op, setOp] = useState(op0);
  const frames = useMemo(() => elementwiseFrames(op, pascal(3), MAGIC3, -2), [op]);
  return (
    <Stepper
      title="Element by element"
      frames={frames}
      code={MATLAB_ELEMENTWISE[op]}
      codeLabel="MATLAB"
      legend={[["bg-neon", "reading"], ["bg-mint", "written"]]}
      inputs={<Toggle<ElementwiseOp> value={op} onChange={setOp} options={[["add", "A + B"], ["subtract", "B − A"], ["scalar", "k × A"]]} />}
      render={(s) => {
        const hot = (i: number, j: number): CellTone | undefined => (s.at && s.at[0] === i && s.at[1] === j ? "neon" : undefined);
        const first = s.op === "subtract" ? s.b! : s.a;
        const second = s.op === "subtract" ? s.a : s.b;
        return (
          <div className="flex flex-wrap items-center gap-3">
            {s.op === "scalar" && (
              <>
                <div className={`font-mono text-lg px-3 py-2 border rounded-sm self-center mb-5 ${s.at ? TONE.neon : "border-border"}`}>{s.k}</div>
                <Op>×</Op>
              </>
            )}
            <MatrixStage rows={3} cols={3} cells={matCells(first, "x", hot)} label={s.op === "subtract" ? "B" : "A"} />
            {second && (
              <>
                <Op>{s.op === "add" ? "+" : "−"}</Op>
                <MatrixStage rows={3} cols={3} cells={matCells(second, "y", hot)} label={s.op === "subtract" ? "A" : "B"} />
              </>
            )}
            <Op>=</Op>
            <MatrixStage rows={3} cols={3} cells={matCells(s.c, "c", (i, j) => (hot(i, j) ? "orange" : s.c[i][j] !== null ? "mint" : undefined))} label="C" />
          </div>
        );
      }}
    />
  );
}

/* ----------------------------- transpose ---------------------------- */

const TRANSPOSE_PRESETS: Record<string, Mat> = {
  magic: MAGIC3,
  wide: [[1, 2, 3], [4, 5, 6]],
  row: [[2, 0, -1]],
};

/** Every entry keeps its identity, so flipping makes it travel across the main diagonal. */
export function TransposeVisualizer() {
  const [preset, setPreset] = useState("wide");
  const [flipped, setFlipped] = useState(false);
  const a = TRANSPOSE_PRESETS[preset];
  const b = flipped ? transpose(a) : a;
  const cells: StageCell[] = a.flatMap((r, i) =>
    r.map((v, j) => ({
      id: `${preset}-${i}-${j}`,
      row: flipped ? j : i,
      col: flipped ? i : j,
      text: String(v),
      tone: (i === j ? "violet" : j > i ? "sky" : "orange") as CellTone,
    })),
  );
  return (
    <Panel title="Transpose" legend={[["bg-violet", "main diagonal stays put"], ["bg-sky", "above"], ["bg-orange", "below"]]}>
      <div className="min-h-[170px] flex items-center justify-center">
        <MatrixStage rows={b.length} cols={b[0].length} cells={cells} size={46} label={`${flipped ? "A'" : "A"} is ${b.length}-by-${b[0].length}`} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={() => setFlipped((f) => !f)}>
          {flipped ? "Flip back" : "Transpose it"}
        </button>
        <Toggle<string>
          value={preset}
          onChange={(p) => {
            setPreset(p);
            setFlipped(false);
          }}
          options={[["wide", "2-by-3"], ["magic", "magic(3)"], ["row", "row vector"]]}
        />
      </div>
    </Panel>
  );
}

/* ---------------------- inner and outer products --------------------- */

export function VectorProductVisualizer({ kind: k0 = "inner" }: { kind?: VectorProductKind }) {
  const [kind, setKind] = useState(k0);
  const frames = useMemo(() => vectorProductFrames(kind, [3, 1, 4], [2, 0, -1]), [kind]);
  return (
    <Stepper
      title="Same vectors, two products"
      frames={frames}
      code={MATLAB_VECTOR_PRODUCT[kind]}
      codeLabel="MATLAB"
      legend={[["bg-neon", "multiplying"], ["bg-mint", "result"]]}
      inputs={<Toggle<VectorProductKind> value={kind} onChange={setKind} options={[["inner", "v * u (inner)"], ["outer", "u * v (outer)"]]} />}
      render={(s) => {
        const u = s.u.map((x) => [x]);
        const v = [s.v];
        const uCells = matCells(u, "u", (i) => (s.at && s.at[0] === i ? "neon" : undefined));
        const vCells = matCells(v, "v", (_, j) => (s.at && s.at[1] === j ? "neon" : undefined));
        return s.kind === "inner" ? (
          <div className="flex flex-wrap items-center gap-3">
            <MatrixStage rows={1} cols={3} cells={vCells} label="v" />
            <Op>×</Op>
            <MatrixStage rows={3} cols={1} cells={uCells} label="u" />
            <Op>=</Op>
            <div className="flex flex-col items-center gap-1.5 pb-5 font-mono text-sm min-w-[150px]">
              <div className="min-h-[24px]">{s.terms.map(signed).join(" + ") || "…"}</div>
              <div className="text-2xl text-mint transition-all">{s.terms.reduce((a, b) => a + b, 0)}</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <MatrixStage rows={3} cols={1} cells={uCells} label="u" />
            <Op>×</Op>
            <MatrixStage rows={1} cols={3} cells={vCells} label="v" />
            <Op>=</Op>
            <MatrixStage rows={3} cols={3} cells={matCells(s.outer, "o", (i, j) => (s.at && s.at[0] === i && s.at[1] === j ? "orange" : s.outer[i][j] !== null ? "mint" : undefined))} label="X" />
          </div>
        );
      }}
    />
  );
}

const signed = (x: number) => (x < 0 ? `(${x})` : String(x));
