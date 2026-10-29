import { useMemo, useState } from "react";
import { btn, inputCls, Legend, Toggle } from "@/components/mdx/AlgoVisualizers";
import { fibCalls, firstViolation, fText, fmtExp, masterMethod, powN, recursionLevels, termShares, type BoundKind } from "@/lib/advancedAlgorithms";
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

/* ----------------------- term contribution ----------------------- */

/** The lecture's experiment: how much of T(n) = 3n² + 8n + 10 each term is responsible for. */
export function TermContribution({ initialN = 10 }: { initialN?: number }) {
  const [n, setN] = useState(initialN);
  const [coef, setCoef] = useState<"3" | "1">("3");
  const lead = Number(coef);
  const terms = [
    { label: `${coef === "3" ? "3" : ""}n²`, value: lead * n * n, bar: "bg-violet" },
    { label: "8n", value: 8 * n, bar: "bg-sky" },
    { label: "10", value: 10, bar: "bg-orange" },
  ];
  const shares = termShares(terms.map((t) => t.value));
  return (
    <Panel title={`Who does the work in T(n) = ${terms[0].label} + 8n + 10?`} legend={terms.map((t) => [t.bar, t.label] as [string, string])}>
      <label className="flex flex-wrap items-center gap-4 font-mono text-xs">
        <span className="uppercase tracking-widest text-muted-foreground">n</span>
        <input type="range" min={1} max={100} value={n} onChange={(e) => setN(Number(e.target.value))} className="flex-1 min-w-[160px]" aria-label="n" />
        <span className="font-display text-xl font-bold w-24">n = {n}</span>
      </label>
      <div className="flex h-8 w-full overflow-hidden rounded-sm border border-border">
        {terms.map((t, i) => (
          <div key={t.label} className={`${t.bar} transition-all duration-200`} style={{ width: `${shares[i] * 100}%` }} title={t.label} />
        ))}
      </div>
      <table className="w-full font-mono text-xs border-collapse">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
            <th className="text-left py-1.5 font-normal">term</th>
            <th className="text-right py-1.5 font-normal">value</th>
            <th className="text-right py-1.5 font-normal">share of T(n)</th>
          </tr>
        </thead>
        <tbody>
          {terms.map((t, i) => (
            <tr key={t.label} className="border-b border-border/50">
              <td className="py-1.5">{t.label}</td>
              <td className="py-1.5 text-right">{t.value.toLocaleString("en-US")}</td>
              <td className="py-1.5 text-right">{(shares[i] * 100).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-3">
        <Toggle<"3" | "1">
          value={coef}
          onChange={setCoef}
          options={[
            ["3", "Experiment 1: keep the 3"],
            ["1", "Experiment 2: drop the 3"],
          ]}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        At n = 1 the constant 10 is the biggest part. Slide to the right: the n² term takes over whether or not you keep its coefficient.
      </p>
    </Panel>
  );
}

/* --------------------------- Big-O witness --------------------------- */

type WitnessPreset = { label: string; f: (n: number) => number; g: (n: number) => number; fText: string; gText: string; kind: BoundKind; c: number; n0: number };

const WITNESS_PRESETS: WitnessPreset[] = [
  { label: "3n + 2 ∈ O(n)", f: (n) => 3 * n + 2, g: (n) => n, fText: "3n + 2", gText: "n", kind: "O", c: 5, n0: 1 },
  { label: "3n² + 20 ∈ O(n²)", f: (n) => 3 * n * n + 20, g: (n) => n * n, fText: "3n² + 20", gText: "n²", kind: "O", c: 4, n0: 5 },
  { label: "n² ∈ Ω(n)", f: (n) => n * n, g: (n) => n, fText: "n²", gText: "n", kind: "Ω", c: 1, n0: 1 },
  { label: "5n² + 100n ∈ Ω(n²)", f: (n) => 5 * n * n + 100 * n, g: (n) => n * n, fText: "5n² + 100n", gText: "n²", kind: "Ω", c: 5, n0: 1 },
];

/** Plot f(n) against c·g(n) and check whether the chosen c and n₀ prove the bound. */
export function BigOWitness() {
  const [pi, setPi] = useState(0);
  const pr = WITNESS_PRESETS[pi];
  const [c, setC] = useState(pr.c);
  const [n0, setN0] = useState(pr.n0);
  const choose = (i: number) => {
    setPi(i);
    setC(WITNESS_PRESETS[i].c);
    setN0(WITNESS_PRESETS[i].n0);
  };

  const bad = firstViolation(pr.f, pr.g, c, n0, pr.kind);
  const maxN = Math.max(12, n0 * 2 + 4);
  const W = 460;
  const H = 200;
  const pts = Array.from({ length: maxN + 1 }, (_, n) => n);
  const yMax = Math.max(...pts.map((n) => Math.max(pr.f(n), c * pr.g(n)))) * 1.05 || 1;
  const X = (n: number) => 30 + (n / maxN) * (W - 40);
  const Y = (v: number) => H - 20 - (v / yMax) * (H - 30);
  const path = (fn: (n: number) => number) => pts.map((n, i) => `${i ? "L" : "M"}${X(n).toFixed(1)},${Y(fn(n)).toFixed(1)}`).join(" ");

  return (
    <Panel title="Find c and n₀" legend={[["bg-violet", "f(n)"], ["bg-sky", "c · g(n)"]]}>
      <div className="flex flex-wrap gap-1.5">
        {WITNESS_PRESETS.map((p, i) => (
          <button key={p.label} type="button" className={`${btn} !px-2 !py-1 !normal-case !tracking-normal ${i === pi ? "border-foreground" : ""}`} onClick={() => choose(i)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
        <label className="inline-flex items-center gap-2">
          <span className="uppercase tracking-widest text-muted-foreground">c</span>
          <input type="range" min={0.5} max={10} step={0.5} value={c} onChange={(e) => setC(Number(e.target.value))} aria-label="c" />
          <span className="w-8 text-foreground">{c}</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <span className="uppercase tracking-widest text-muted-foreground">n₀</span>
          <input type="range" min={1} max={20} value={n0} onChange={(e) => setN0(Number(e.target.value))} aria-label="n0" />
          <span className="w-8 text-foreground">{n0}</span>
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-[560px]" role="img" aria-label="f(n) against c times g(n)">
        <rect x={X(n0)} y={10} width={X(maxN) - X(n0)} height={H - 30} className={bad === null ? "fill-mint/10" : "fill-orange/10"} />
        <line x1={X(n0)} x2={X(n0)} y1={10} y2={H - 20} className="stroke-muted-foreground" strokeDasharray="3 3" />
        <text x={X(n0) + 4} y={22} fontSize={10} className="fill-muted-foreground font-mono">n ≥ n₀</text>
        <line x1={30} x2={W - 10} y1={H - 20} y2={H - 20} className="stroke-border" />
        <path d={path((n) => c * pr.g(n))} className="stroke-sky fill-none" strokeWidth={2.5} />
        <path d={path(pr.f)} className="stroke-violet fill-none" strokeWidth={2.5} />
        {pts.filter((n) => n % Math.ceil(maxN / 6) === 0).map((n) => (
          <text key={n} x={X(n)} y={H - 6} fontSize={10} textAnchor="middle" className="fill-muted-foreground font-mono">{n}</text>
        ))}
      </svg>
      <div className="font-mono text-sm">
        need 0 ≤ {pr.kind === "O" ? `${pr.fText} ≤ ${c}·${pr.gText}` : `${c}·${pr.gText} ≤ ${pr.fText}`} for every n ≥ {n0}
      </div>
      <p className={`text-sm font-semibold ${bad === null ? "text-mint" : "text-orange"}`}>
        {bad === null
          ? `It holds. c = ${c} and n₀ = ${n0} prove ${pr.fText} ∈ ${pr.kind}(${pr.gText}).`
          : `Fails at n = ${bad}: f(${bad}) = ${pr.f(bad)} but c·g(${bad}) = ${c * pr.g(bad)}. Try a ${pr.kind === "O" ? "bigger c or a bigger n₀" : "smaller c or a bigger n₀"}.`}
      </p>
    </Panel>
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
