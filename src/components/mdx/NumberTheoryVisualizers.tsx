import { useMemo, useState } from "react";
import { btn, Stepper, Toggle } from "@/components/mdx/AlgoVisualizers";
import { Panel } from "@/components/mdx/MatrixVisualizers";
import { factorize, gcd, MATLAB_SIEVE, MATLAB_WILSON, phi, sieveFrames, wilsonFrames, euclidTiles, MATLAB_EUCLID, mod, tileFrames } from "@/lib/numberTheory";

/* ------------------------------- Euclid tiles ------------------------------ */

const TILE_FILL = ["fill-sky/70", "fill-violet/70", "fill-orange/70", "fill-neon/70", "fill-mint/70"];

const EUCLID_PRESETS: Record<string, [number, number]> = { small: [60, 24], mid: [247, 143], big: [1281, 243] };

export function EuclidTilesVisualizer() {
  const [preset, setPreset] = useState("small");
  const [a, b] = EUCLID_PRESETS[preset];
  const frames = useMemo(() => tileFrames(a, b), [a, b]);
  const tiles = useMemo(() => euclidTiles(a, b), [a, b]);
  return (
    <Stepper
      title="Euclid's algorithm as tiling"
      frames={frames}
      code={MATLAB_EUCLID}
      codeLabel="MATLAB"
      inputs={<Toggle<string> value={preset} onChange={setPreset} options={[["small", "gcd(60, 24)"], ["mid", "gcd(247, 143)"], ["big", "gcd(1281, 243)"]]} />}
      render={(s) => (
        <div className="flex flex-col gap-3">
          <svg viewBox={`-1 -1 ${a + 2} ${b + 2}`} className="w-full max-w-[560px] rounded-sm" role="img" aria-label={`A ${a} by ${b} rectangle tiled with squares`}>
            <rect x={0} y={0} width={a} height={b} className="fill-background/60 stroke-foreground/40" strokeWidth={a / 400} />
            {tiles.map((t, i) => (
              <rect
                key={i}
                x={t.x}
                y={t.y}
                width={t.size}
                height={t.size}
                strokeWidth={a / 500}
                className={`stroke-background transition-opacity duration-500 motion-reduce:transition-none ${TILE_FILL[t.step % TILE_FILL.length]}`}
                style={{ opacity: t.step <= s.upto ? 1 : 0, transitionDelay: t.step === s.upto ? `${(i - tiles.findIndex((x) => x.step === t.step)) * 70}ms` : "0ms" }}
              />
            ))}
          </svg>
          <div className="font-mono text-[12px] flex flex-col gap-0.5 min-h-[6.5em]">
            {s.steps.slice(0, s.upto + 1).map((st, i) => (
              <div key={i} className={i === s.upto ? "text-foreground" : "text-muted-foreground"}>
                {st.a} = {st.q} × {st.b} + {st.r}
              </div>
            ))}
          </div>
        </div>
      )}
    />
  );
}

/* ------------------------------ modular clock ----------------------------- */

/** Rings of residues share one layout, so a modulus reads as a place you walk around. */
export const ringPoint = (i: number, n: number, r: number, cx = 150, cy = 150): [number, number] => {
  const t = (2 * Math.PI * i) / n - Math.PI / 2;
  return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
};

export function ModClock({ a: a0 = 11, n: n0 = 7 }: { a?: number; n?: number }) {
  const [a, setA] = useState(a0);
  const [n, setN] = useState(n0);
  const r = mod(a, n);
  const q = Math.floor(a / n);
  return (
    <Panel title="Arithmetic on a clock" legend={[["bg-mint", "a mod n"]]}>
      <div className="flex flex-wrap gap-6 items-center">
        <svg viewBox="0 0 300 300" className="w-full max-w-[280px]" role="img" aria-label={`Clock with ${n} positions, pointer at ${r}`}>
          <circle cx={150} cy={150} r={118} className="fill-background/60 stroke-border" />
          {Array.from({ length: n }, (_, i) => {
            const [x, y] = ringPoint(i, n, 118);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={n > 16 ? 10 : 15} className={`transition-colors duration-500 ${i === r ? "fill-mint" : "fill-card stroke-border"}`} />
                <text x={x} y={y} dy=".35em" textAnchor="middle" fontSize={n > 16 ? 10 : 13} className={`font-mono ${i === r ? "fill-background font-bold" : "fill-foreground"}`}>{i}</text>
              </g>
            );
          })}
          <line
            x1={150}
            y1={150}
            x2={150}
            y2={62}
            strokeWidth={3}
            strokeLinecap="round"
            className="stroke-mint transition-transform duration-700 ease-in-out motion-reduce:transition-none"
            style={{ transformOrigin: "150px 150px", transform: `rotate(${(a * 360) / n}deg)` }}
          />
          <circle cx={150} cy={150} r={5} className="fill-mint" />
        </svg>
        <div className="flex flex-col gap-3 font-mono text-sm min-w-[220px] flex-1">
          <div className="text-lg">{a} mod {n} = <span className="text-mint">{r}</span></div>
          <div className="text-muted-foreground text-[12px]">{a} = ({q}) × {n} + {r}</div>
          <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            a = {a}
            <input type="range" aria-label="Value of a" min={-30} max={60} value={a} onChange={(e) => setA(Number(e.target.value))} className="accent-[hsl(var(--mint))]" />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            n = {n}
            <input type="range" aria-label="Modulus n" min={2} max={24} value={n} onChange={(e) => setN(Number(e.target.value))} className="accent-[hsl(var(--mint))]" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => setA(a - 1)}>a − 1</button>
            <button type="button" className={btn} onClick={() => setA(a + 1)}>a + 1</button>
            <button type="button" className={btn} onClick={() => setA(a + n)}>a + n</button>
            <button type="button" className={btn} onClick={() => setA(-11)}>a = −11</button>
          </div>
          <div className="text-[12px] text-muted-foreground">Also here: {[r - 2 * n, r - n, r, r + n, r + 2 * n].join(", ")}</div>
        </div>
      </div>
    </Panel>
  );
}


/* ------------------------------- the sieve ------------------------------- */

export function SieveVisualizer({ n = 100 }: { n?: number }) {
  const frames = useMemo(() => sieveFrames(n), [n]);
  const nums = useMemo(() => Array.from({ length: n - 1 }, (_, i) => i + 2), [n]);
  return (
    <Stepper
      title="Sieve of Eratosthenes"
      frames={frames}
      code={MATLAB_SIEVE}
      codeLabel="MATLAB"
      legend={[["bg-violet", "current prime"], ["bg-orange", "just struck"], ["bg-mint", "prime"]]}
      render={(s) => {
        const newlyIn = s.prime;
        return (
          <div className="grid gap-1 max-w-[440px]" style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}>
            <div />
            {nums.map((v) => {
              const by = s.crossed[v];
              const fresh = by !== undefined && by === newlyIn;
              const isCur = v === s.prime;
              const survivor = !by && (s.done || (s.prime !== null && v <= s.prime));
              return (
                <div
                  key={v}
                  className={`relative aspect-square flex items-center justify-center rounded-sm border font-mono text-[11px] transition-[background-color,border-color,color,opacity] duration-300 motion-reduce:transition-none ${
                    isCur ? "bg-violet/40 border-violet" : fresh ? "bg-orange/30 border-orange" : by ? "border-border/30 text-muted-foreground/40" : survivor ? "bg-mint/20 border-mint" : "border-border bg-background/50"
                  }`}
                  style={{ transitionDelay: fresh ? `${Math.floor(v / by) * 18}ms` : "0ms" }}
                >
                  {v}
                </div>
              );
            })}
          </div>
        );
      }}
    />
  );
}

/* ------------------------------- the totient ------------------------------ */

export function TotientGrid({ n: n0 = 35 }: { n?: number }) {
  const [n, setN] = useState(n0);
  const f = factorize(n);
  const value = phi(n);
  const formula = f.map(([p]) => `(1 − 1/${p})`).join(" ");
  return (
    <Panel title="Euler's totient" legend={[["bg-mint", "coprime to n"], ["bg-orange", "shares a factor"]]}>
      <div className="flex flex-col gap-1 font-mono text-sm">
        <div className="text-lg">φ({n}) = <span className="text-mint">{value}</span></div>
        <div className="text-[12px] text-muted-foreground">
          {n} = {f.map(([p, e]) => (e > 1 ? `${p}^${e}` : p)).join(" × ")}, so φ({n}) = {n} {formula} = {value}
        </div>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(32px, 1fr))" }}>
        {Array.from({ length: 100 }, (_, i) => i + 1).map((v) => {
          const inRange = v < n;
          const co = inRange && gcd(v, n) === 1;
          return (
            <div
              key={v}
              className={`aspect-square flex items-center justify-center rounded-sm border font-mono text-[11px] transition-[transform,opacity,background-color,border-color] duration-300 motion-reduce:transition-none ${co ? "bg-mint/25 border-mint" : "bg-orange/10 border-orange/40 text-muted-foreground"}`}
              style={{ opacity: inRange ? 1 : 0.05, transform: `scale(${inRange ? 1 : 0.7})` }}
            >
              {v}
            </div>
          );
        })}
      </div>
      <label className="flex flex-col gap-1 font-mono text-[11px] text-muted-foreground max-w-[420px]">
        n = {n}
        <input type="range" aria-label="Value of n" min={2} max={100} value={n} onChange={(e) => setN(Number(e.target.value))} className="accent-[hsl(var(--mint))]" />
      </label>
      <div className="flex flex-wrap gap-2">
        {[23, 35, 37, 81, 100].map((v) => (
          <button key={v} type="button" className={`${btn} ${v === n ? "border-foreground" : ""}`} onClick={() => setN(v)}>φ({v})</button>
        ))}
      </div>
    </Panel>
  );
}

/* --------------------------------- Wilson -------------------------------- */

export function WilsonVisualizer({ p = 13 }: { p?: number }) {
  const frames = useMemo(() => wilsonFrames(p), [p]);
  return (
    <Stepper
      title="Why Wilson's theorem works"
      frames={frames}
      code={MATLAB_WILSON}
      codeLabel="MATLAB"
      legend={[["bg-neon", "this pair"], ["bg-sky", "paired, equals 1"], ["bg-orange", "its own inverse"]]}
      render={(s) => {
        const pos = (v: number) => ringPoint(v - 1, s.p - 1, 118);
        const paired = new Set(s.pairs.flat());
        return (
          <svg viewBox="0 0 300 300" className="w-full max-w-[320px] mx-auto" role="img" aria-label={`Numbers 1 to ${s.p - 1} around a ring, joined to their inverses`}>
            {s.pairs.map(([a, b]) => {
              const [x1, y1] = pos(a);
              const [x2, y2] = pos(b);
              const live = s.active?.[0] === a;
              return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} strokeDasharray={1} strokeWidth={live ? 3 : 1.6} className={`${live ? "stroke-neon" : "stroke-sky"} cm-draw`} />;
            })}
            {Array.from({ length: s.p - 1 }, (_, i) => i + 1).map((v) => {
              const [x, y] = pos(v);
              const live = s.active?.includes(v);
              const self = v === 1 || v === s.p - 1;
              return (
                <g key={v}>
                  <circle cx={x} cy={y} r={15} className={`transition-colors duration-300 ${live ? "fill-neon" : self ? "fill-orange" : paired.has(v) ? "fill-sky" : "fill-card stroke-border"}`} />
                  <text x={x} y={y} dy=".35em" textAnchor="middle" fontSize={12} className={`font-mono ${live || self || paired.has(v) ? "fill-background font-bold" : "fill-foreground"}`}>{v}</text>
                </g>
              );
            })}
          </svg>
        );
      }}
    />
  );
}
