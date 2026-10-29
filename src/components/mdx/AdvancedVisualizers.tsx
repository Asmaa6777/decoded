import { useMemo, useState } from "react";
import { btn, inputCls, Legend } from "@/components/mdx/AlgoVisualizers";
import { fibCalls, fText, fmtExp, masterMethod, powN, recursionLevels } from "@/lib/advancedAlgorithms";
import { humanTime, formatOps } from "@/lib/algorithms";

/* ============================================================
   Visualizers for the Advanced Algorithms & Analysis course.
   They reuse the look (and, where it fits, the <Stepper>) of
   AlgoVisualizers.tsx; the logic lives in advancedAlgorithms.ts.
   ============================================================ */

function Panel({ title, legend, children }: { title: string; legend?: [string, string][]; children: React.ReactNode }) {
  return (
    <div className="not-prose my-8 border border-border bg-card rounded-sm overflow-hidden text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
        <div className="eyebrow text-violet">{title}</div>
        {legend && <Legend items={legend} />}
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

/* ---------------------------- Fibonacci ---------------------------- */

export function FibonacciCalls({ initialN = 30 }: { initialN?: number }) {
  const [n, setN] = useState(initialN);
  const rec = fibCalls(n);
  const iter = n + 1;
  return (
    <Panel title="fib(n): recursive vs. with an array">
      <label className="flex flex-wrap items-center gap-4 font-mono text-xs">
        <span className="uppercase tracking-widest text-muted-foreground">n</span>
        <input type="range" min={0} max={100} value={n} onChange={(e) => setN(Number(e.target.value))} className="flex-1 min-w-[160px]" aria-label="n" />
        <span className="font-display text-xl font-bold w-24">n = {n}</span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-orange/60 bg-orange/10 rounded-sm p-4">
          <div className="eyebrow text-orange mb-1">fib (recursive)</div>
          <div className="font-display text-2xl font-bold">{formatOps(rec)} calls</div>
          <div className="font-mono text-xs text-muted-foreground mt-1">≈ {humanTime(rec / 10)} at one call per nanosecond</div>
        </div>
        <div className="border border-mint/60 bg-mint/10 rounded-sm p-4">
          <div className="eyebrow text-mint mb-1">fib2 (array)</div>
          <div className="font-display text-2xl font-bold">{iter} terms</div>
          <div className="font-mono text-xs text-muted-foreground mt-1">≈ {iter} ns: {humanTime(iter / 10)}</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The recursive version recomputes the same terms again and again, so its work more than doubles every two steps of n. The array version computes each term once.
      </p>
    </Panel>
  );
}

/* ------------------------- recurrences ------------------------- */

const PRESETS: { label: string; a: number; b: number; k: number; p?: number }[] = [
  { label: "merge sort", a: 2, b: 2, k: 1 },
  { label: "binary search", a: 1, b: 2, k: 0 },
  { label: "2T(n/2) + n²", a: 2, b: 2, k: 2 },
  { label: "2T(n/2) + √n", a: 2, b: 2, k: 0.5 },
  { label: "3T(n/4) + n²", a: 3, b: 4, k: 2 },
  { label: "Gauss multiply", a: 3, b: 2, k: 1 },
  { label: "2T(n/2) + n log n", a: 2, b: 2, k: 1, p: 1 },
];

const CASE_TONE: Record<string, string> = { "1": "text-sky", "2": "text-violet", "3": "text-orange", gap: "text-muted-foreground" };

/** Recursion tree + master method for T(n) = a·T(n/b) + n^k (log n)^p. */
export function RecurrenceExplorer({ a: a0 = 2, b: b0 = 2, k: k0 = 1, p: p0 = 0 }: { a?: number; b?: number; k?: number; p?: number }) {
  const [v, setV] = useState({ a: a0, b: b0, k: k0, p: p0 });
  const [text, setText] = useState({ a: String(a0), b: String(b0), k: String(k0) });
  const res = useMemo(() => masterMethod(v.a, v.b, v.k, v.p), [v]);
  const levels = useMemo(() => recursionLevels(v.a, v.b, v.k, 4096), [v]);
  const shown = levels.slice(0, 5);
  const maxCost = Math.max(...levels.map((l) => l.cost));
  const ratio = v.a / Math.pow(v.b, v.k);

  const apply = () => {
    const a = Number(text.a);
    const b = Number(text.b);
    const k = Number(text.k);
    if (Number.isInteger(a) && a >= 1 && a <= 16 && b > 1 && b <= 16 && k >= 0 && k <= 4) setV({ a, b, k, p: 0 });
  };
  const pick = (pr: (typeof PRESETS)[number]) => {
    setV({ a: pr.a, b: pr.b, k: pr.k, p: pr.p ?? 0 });
    setText({ a: String(pr.a), b: String(pr.b), k: String(pr.k) });
  };

  const recText = `T(n) = ${v.a === 1 ? "" : v.a}T(n/${v.b}) + ${fText(v.k, v.p)}`;

  return (
    <Panel title="Recursion tree & master method" legend={[["bg-violet", "cost of each level"]]}>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((pr) => (
          <button key={pr.label} type="button" className={`${btn} !px-2 !py-1 !normal-case !tracking-normal`} onClick={() => pick(pr)}>
            {pr.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
        <span>T(n) =</span>
        <input aria-label="a" className={`${inputCls} w-14`} value={text.a} onChange={(e) => setText((t) => ({ ...t, a: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && apply()} />
        <span>T(n /</span>
        <input aria-label="b" className={`${inputCls} w-14`} value={text.b} onChange={(e) => setText((t) => ({ ...t, b: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && apply()} />
        <span>) + n^</span>
        <input aria-label="k" className={`${inputCls} w-16`} value={text.k} onChange={(e) => setText((t) => ({ ...t, k: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && apply()} />
        <button type="button" className={btn} onClick={apply}>
          Solve
        </button>
      </div>

      <div className="font-display text-xl md:text-2xl font-bold">{recText}</div>

      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs border-collapse min-w-[460px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
              <th className="text-left py-2 pr-3 font-normal">level</th>
              <th className="text-left py-2 pr-3 font-normal">subproblems</th>
              <th className="text-left py-2 pr-3 font-normal">each of size</th>
              <th className="text-left py-2 font-normal">level cost (× root)</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => (
              <tr key={l.depth} className="border-b border-border/50">
                <td className="py-2 pr-3">{l.depth}</td>
                <td className="py-2 pr-3">
                  <span className="inline-flex flex-wrap gap-[3px] max-w-[160px] align-middle">
                    {Array.from({ length: Math.min(l.nodes, 27) }, (_, i) => (
                      <span key={i} className="inline-block h-2.5 w-2.5 rounded-full border border-violet bg-violet/20" />
                    ))}
                    {l.nodes > 27 && <span className="text-muted-foreground">…</span>}
                  </span>
                  <span className="ml-2">{formatOps(l.nodes)}</span>
                </td>
                <td className="py-2 pr-3">{l.depth === 0 ? "n" : `n/${formatOps(Math.pow(v.b, l.depth))}`}</td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-2 w-full">
                    <span className="h-2.5 bg-violet rounded-[2px] transition-all" style={{ width: `${Math.max(2, (l.cost / maxCost) * 100)}px` }} />
                    {fmtExp(l.cost)}
                  </span>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} className="py-2 text-muted-foreground">
                … down to pieces of size 1, after about log<sub>{v.b}</sub> n levels. Each level costs <b className="text-foreground">{fmtExp(ratio)}×</b> the one above it.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border-t border-border pt-4 flex flex-col gap-1.5">
        <div className="font-mono text-xs text-muted-foreground">
          compare f(n) = <span className="text-foreground">{fText(v.k, v.p)}</span> with n<sup>log<sub>{v.b}</sub> {v.a}</sup> = <span className="text-foreground">{powN(res.critical)}</span>
        </div>
        <div className="font-display text-lg font-bold">
          <span className={CASE_TONE[String(res.case)]}>{res.case === "gap" ? "No case applies" : `Case ${res.case}`}</span>
          <span className="text-foreground"> → T(n) = {res.answer}</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{res.why}</p>
      </div>
    </Panel>
  );
}
