import { useMemo, useState } from "react";
import { btn, Stepper, Toggle } from "@/components/mdx/AlgoVisualizers";
import { Panel } from "@/components/mdx/MatrixVisualizers";
import { euclidTiles, MATLAB_EUCLID, mod, tileFrames } from "@/lib/numberTheory";

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

