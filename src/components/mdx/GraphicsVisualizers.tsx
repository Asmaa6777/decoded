import { useEffect, useMemo, useRef, useState } from "react";
import { btn, inputCls, Stepper, Toggle } from "@/components/mdx/AlgoVisualizers";
import { Panel } from "@/components/mdx/MatrixVisualizers";
import {
  aspectRatio, bitmapToBits, blend, bresenhamFrames, colorsFor, CPP_BRESENHAM, CPP_DDA, CPP_NAIVE, ddaFrames, from565, HOUSE, HOUSE_LINES, imageSize, lineCoverage,
  naiveFrames, pixelsFor, ppiFromDiagonal, printInches, quantize, rasterDisc, rasterize, rgbTo565, screenInches, toBinary, toHex, wrap, type LineState, type Pt,
} from "@/lib/graphics";

/* ============================================================
   Visualizers for the Computer Graphics course. Pictures are SVG
   grids of pixels, so they scale on any screen. Colors follow the
   rest of the site: neon = looking at now, orange = the ideal
   (mathematical) shape, mint = lit / done, sky = the beam.
   ============================================================ */

const range = "w-40 accent-[hsl(var(--sky))]";
const label = "font-mono text-[11px] uppercase tracking-widest text-muted-foreground";
const fmt = (v: number, d = 3) => String(Number(v.toFixed(d)));
const num = (v: number) => v.toLocaleString("en-US");

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reduce;
}

/** A grid of square cells drawn in SVG. `fill` returns a class or an inline color for each cell. */
function PixelGrid({
  cols,
  rows,
  cell = 18,
  fill,
  gridLines = true,
  label: aria,
  onCell,
  children,
}: {
  cols: number;
  rows: number;
  cell?: number;
  fill: (col: number, row: number) => { className?: string; color?: string; opacity?: number } | null;
  gridLines?: boolean;
  label: string;
  onCell?: (col: number, row: number) => void;
  children?: React.ReactNode;
}) {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const f = fill(c, r);
      cells.push(
        <rect
          key={`${c},${r}`}
          x={c * cell}
          y={r * cell}
          width={cell}
          height={cell}
          className={`${f?.className ?? (f?.color ? "" : "fill-transparent")} ${gridLines ? "stroke-border" : ""} ${onCell ? "cursor-pointer" : ""}`}
          style={f?.color ? { fill: f.color, fillOpacity: f.opacity ?? 1 } : f?.opacity !== undefined ? { fillOpacity: f.opacity } : undefined}
          strokeWidth={gridLines ? 0.5 : 0}
          onClick={onCell ? () => onCell(c, r) : undefined}
          onMouseEnter={onCell ? () => onCell(c, r) : undefined}
        />,
      );
    }
  }
  return (
    <svg viewBox={`0 0 ${cols * cell} ${rows * cell}`} className="w-full block mx-auto" style={{ maxWidth: cols * cell }} role="img" aria-label={aria}>
      {cells}
      {children}
    </svg>
  );
}

function Stat({ k, v, tone = "text-foreground" }: { k: string; v: React.ReactNode; tone?: string }) {
  return (
    <div className="flex flex-col">
      <span className={label}>{k}</span>
      <span className={`font-mono text-base ${tone}`}>{v}</span>
    </div>
  );
}

/* ------------------------- pixels and grids ------------------------- */

/** A circle drawn on a grid. Fewer pixels across and the curve turns into steps. */
export function PixelZoom({ initial = 8 }: { initial?: number }) {
  const [n, setN] = useState(initial);
  const disc = useMemo(() => rasterDisc(n), [n]);
  const cell = 288 / n;
  return (
    <Panel title="Pixels across" legend={[["bg-mint", "lit pixel"], ["bg-orange", "the circle you asked for"]]}>
      <PixelGrid cols={n} rows={n} cell={cell} gridLines={n <= 32} label={`A circle drawn ${n} pixels across`} fill={(c, r) => (disc[r][c] ? { className: "fill-mint/80" } : null)}>
        <circle cx={144} cy={144} r={144 - cell / 4} fill="none" className="stroke-orange" strokeWidth={1.5} />
      </PixelGrid>
      <label className="flex flex-wrap items-center gap-3">
        <span className={label}>Width</span>
        <input type="range" min={4} max={64} value={n} onChange={(e) => setN(Number(e.target.value))} className={range} aria-label="Pixels across" />
        <span className="font-mono text-sm">
          {n} × {n} = {num(n * n)} pixels
        </span>
      </label>
      <p className="text-sm text-muted-foreground">
        Every pixel is either lit or not. There is no "a bit of a pixel", so the smooth orange curve can only be approximated, and the approximation gets better as the pixels get smaller.
      </p>
    </Panel>
  );
}

/** One long row of bits, wrapped at whatever width you tell it. Only the right width shows the picture. */
export function RowWidth() {
  const bits = useMemo(() => bitmapToBits(HOUSE), []);
  const [w, setW] = useState(10);
  const rows = wrap(bits, w);
  return (
    <Panel title="The same bytes, different widths" legend={[["bg-mint", "1"], ["bg-secondary", "0"]]}>
      <div>
        <div className={`${label} mb-1`}>What's stored: {bits.length} bits in one line</div>
        <div className="font-mono text-[11px] leading-snug break-all text-muted-foreground">
          {bits.slice(0, 48).join("")}
          <span className="opacity-60">… ({bits.length - 48} more)</span>
        </div>
      </div>
      <PixelGrid
        cols={w}
        rows={rows.length}
        cell={Math.min(22, 300 / w)}
        label={`The bits wrapped into rows of ${w}`}
        fill={(c, r) => (rows[r]?.[c] === undefined ? null : rows[r][c] ? { className: "fill-mint/80" } : { className: "fill-secondary" })}
      />
      <label className="flex flex-wrap items-center gap-3">
        <span className={label}>Width</span>
        <input type="range" min={8} max={16} value={w} onChange={(e) => setW(Number(e.target.value))} className={range} aria-label="Row width in pixels" />
        <span className={`font-mono text-sm ${w === 12 ? "text-mint" : "text-orange"}`}>
          {w} pixels per row {w === 12 ? "· matches the metadata" : "· wrong width"}
        </span>
      </label>
    </Panel>
  );
}

/* ---------------------------- color depth ---------------------------- */

/** A smooth ramp from black to white, stored with fewer and fewer bits. */
export function BitDepthExplorer() {
  const [bits, setBits] = useState(2);
  const [pick, setPick] = useState(67);
  const n = 32;
  const values = Array.from({ length: n }, (_, i) => Math.round((i * 255) / (n - 1)));
  const levels = colorsFor(bits);
  const stored = quantize(pick, bits);
  const index = bits >= 8 ? pick : Math.round(pick / (255 / (levels - 1)));
  const gray = (v: number) => `rgb(${v},${v},${v})`;
  return (
    <Panel title="Bit depth">
      <PixelGrid cols={n} rows={2} cell={14} gridLines={false} label="A grey ramp, smooth on top and stored at the chosen depth below" fill={(c, r) => ({ color: gray(r === 0 ? values[c] : quantize(values[c], bits)) })} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat k="Bits per pixel" v={bits} />
        <Stat k="Shades" v={`2^${bits} = ${num(levels)}`} tone="text-mint" />
        <Stat k="Picked brightness" v={pick} />
        <Stat k="Stored as" v={`${toBinary(index, bits)} → ${stored}`} tone="text-sky" />
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-3">
          <span className={label}>Bits</span>
          <input type="range" min={1} max={8} value={bits} onChange={(e) => setBits(Number(e.target.value))} className={range} aria-label="Bits per pixel" />
        </label>
        <label className="flex items-center gap-3">
          <span className={label}>Brightness</span>
          <input type="range" min={0} max={255} value={pick} onChange={(e) => setPick(Number(e.target.value))} className={range} aria-label="Brightness to store" />
        </label>
        <span className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 border border-border" style={{ background: gray(pick) }} aria-hidden />
          <span className="font-mono text-xs text-muted-foreground">→</span>
          <span className="inline-block h-6 w-6 border border-border" style={{ background: gray(stored) }} aria-hidden />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        The top strip is the brightness you wanted; the bottom strip is what {bits} bit{bits > 1 ? "s" : ""} can store. Every value snaps to the nearest of {num(levels)} shades, which is why low depths show visible bands.
      </p>
    </Panel>
  );
}

function ChannelSlider({ name, value, onChange, tone }: { name: string; value: number; onChange: (v: number) => void; tone: string }) {
  return (
    <label className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[3.5rem_10rem_auto] items-center gap-x-3 gap-y-1">
      <span className={`${label} ${tone}`}>{name}</span>
      <input type="range" min={0} max={255} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[hsl(var(--sky))]" aria-label={`${name} channel`} />
      <span className="col-span-2 sm:col-span-1 font-mono text-xs">
        {String(value).padStart(3, " ")} = {toBinary(value, 8)} = {toHex(value)}
      </span>
    </label>
  );
}

/** Mix a 24-bit color from three bytes, then see what survives packing it into 16 bits. */
export function RgbMixer() {
  const [rgb, setRgb] = useState<[number, number, number]>([255, 128, 64]);
  const set = (i: number) => (v: number) => setRgb((c) => c.map((x, j) => (j === i ? v : x)) as [number, number, number]);
  const p = rgbTo565(...rgb);
  const back = from565(p.packed);
  const css = (c: number[]) => `rgb(${c.join(",")})`;
  return (
    <Panel title="One pixel, three bytes">
      <div className="flex flex-col gap-3">
        <ChannelSlider name="Red" value={rgb[0]} onChange={set(0)} tone="text-orange" />
        <ChannelSlider name="Green" value={rgb[1]} onChange={set(1)} tone="text-mint" />
        <ChannelSlider name="Blue" value={rgb[2]} onChange={set(2)} tone="text-sky" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <span className="inline-block h-14 w-14 shrink-0 border border-border" style={{ background: css(rgb) }} aria-hidden />
          <div>
            <div className={label}>24-bit true color</div>
            <div className="font-mono text-lg">#{toHex(rgb[0])}{toHex(rgb[1])}{toHex(rgb[2])}</div>
            <div className="font-mono text-[11px] text-muted-foreground">3 bytes · 16,777,216 possible colors</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-block h-14 w-14 shrink-0 border border-border" style={{ background: css(back) }} aria-hidden />
          <div>
            <div className={label}>16-bit high color (5-6-5)</div>
            <div className="font-mono text-sm break-all">
              <span className="text-orange">{toBinary(p.r5, 5)}</span>
              <span className="text-mint">{toBinary(p.g6, 6)}</span>
              <span className="text-sky">{toBinary(p.b5, 5)}</span>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">comes back as ({back.join(", ")})</div>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        High color keeps only the top 5 bits of red and blue and the top 6 of green, so most colors come back slightly off. Green gets the extra bit because eyes are most sensitive to it.
      </p>
    </Panel>
  );
}

/** A red square drawn with alpha over a background, so you can see what "partly transparent" means numerically. */
export function AlphaBlend() {
  const [a, setA] = useState(128);
  const fg: [number, number, number] = [255, 107, 53];
  const bg: [number, number, number] = [126, 184, 255];
  const out = blend(fg, bg, a);
  return (
    <Panel title="The alpha byte">
      <svg viewBox="0 0 240 120" className="w-full max-w-sm mx-auto block" role="img" aria-label={`An orange square at alpha ${a} over a blue one`}>
        <rect x={20} y={20} width={130} height={80} style={{ fill: `rgb(${bg.join(",")})` }} />
        <rect x={90} y={35} width={130} height={70} style={{ fill: `rgb(${fg.join(",")})`, fillOpacity: a / 255 }} />
      </svg>
      <label className="flex flex-wrap items-center gap-3">
        <span className={label}>Alpha</span>
        <input type="range" min={0} max={255} value={a} onChange={(e) => setA(Number(e.target.value))} className={range} aria-label="Alpha" />
        <span className="font-mono text-sm">
          {a} {a === 0 ? "· fully transparent" : a === 255 ? "· fully opaque" : "· semi-transparent"}
        </span>
      </label>
      <div className="font-mono text-xs text-muted-foreground leading-relaxed">
        overlap = {fmt(a / 255)} × orange + {fmt(1 - a / 255)} × blue = <span className="text-foreground">({out.join(", ")})</span>
      </div>
    </Panel>
  );
}

/* ----------------------------- image size ----------------------------- */

const PRESETS: [string, number, number, number][] = [
  ["640×480 · 1-bit", 640, 480, 1],
  ["640×480 · 8-bit", 640, 480, 8],
  ["640×480 · 24-bit", 640, 480, 24],
  ["1200×800 · 24-bit", 1200, 800, 24],
  ["4700×3133 · 24-bit", 4700, 3133, 24],
  ["1920×1080 · 32-bit", 1920, 1080, 32],
];

/** Width × height × bits, then divide down to bytes, KB and MB, one visible step at a time. */
export function ImageSizeCalculator() {
  const [w, setW] = useState(640);
  const [h, setH] = useState(480);
  const [bpp, setBpp] = useState(24);
  const s = imageSize(w, h, bpp);
  const steps: [string, string, string][] = [
    ["Pixels", `${num(w)} × ${num(h)}`, `${num(s.pixels)} pixels`],
    ["Bits", `${num(s.pixels)} × ${bpp} bits`, `${num(s.bits)} bits`],
    ["Bytes", `${num(s.bits)} ÷ 8`, `${num(s.bytes)} bytes`],
    ["Kilobytes", `${num(s.bytes)} ÷ 1024`, `${fmt(s.kb, 2)} KB`],
    ["Megabytes", `${fmt(s.kb, 2)} ÷ 1024`, `${fmt(s.mb, 2)} MB`],
  ];
  return (
    <Panel title="How big is it?">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([name, pw, ph, pb]) => (
          <button key={name} type="button" className={btn} onClick={() => (setW(pw), setH(ph), setBpp(pb))}>
            {name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
        <input className={`${inputCls} w-24`} inputMode="numeric" aria-label="Width in pixels" value={w} onChange={(e) => setW(Math.max(0, Math.min(100000, Number(e.target.value.replace(/\D/g, "")) || 0)))} />
        ×
        <input className={`${inputCls} w-24`} inputMode="numeric" aria-label="Height in pixels" value={h} onChange={(e) => setH(Math.max(0, Math.min(100000, Number(e.target.value.replace(/\D/g, "")) || 0)))} />
        at
        <select className={inputCls} aria-label="Bits per pixel" value={bpp} onChange={(e) => setBpp(Number(e.target.value))}>
          {[1, 8, 16, 24, 32, 48].map((b) => (
            <option key={b} value={b} className="bg-background">
              {b} bits per pixel
            </option>
          ))}
        </select>
      </div>
      <table className="font-mono text-sm border-collapse w-full max-w-xl">
        <tbody>
          {steps.map(([k, how, res], i) => (
            <tr key={k} className="border-b border-border/50">
              <td className="py-1.5 pr-3 text-[10px] uppercase tracking-widest text-muted-foreground">{i + 1}. {k}</td>
              <td className="py-1.5 pr-3 text-muted-foreground">{how}</td>
              <td className={`py-1.5 text-right ${i === steps.length - 1 ? "text-mint" : ""}`}>{res}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ----------------------------- resolution ----------------------------- */

/** The same pixels printed at different PPI: more pixels per inch means a smaller, sharper print. */
export function PrintSizeCalculator() {
  const [w, setW] = useState(1200);
  const [h, setH] = useState(800);
  const [ppi, setPpi] = useState(72);
  const iw = printInches(w, ppi);
  const ih = printInches(h, ppi);
  const scale = 300 / Math.max(17, iw, ih);
  return (
    <Panel title="Pixels to paper" legend={[["bg-mint/40", "printed size"], ["bg-transparent border border-border", "letter paper, 8.5 × 11 in"]]}>
      <svg viewBox={`0 0 ${Math.max(17, iw) * scale + 2} ${Math.max(11, ih) * scale + 2}`} className="w-full max-w-md block" role="img" aria-label={`Printed at ${ppi} PPI the image is ${fmt(iw)} by ${fmt(ih)} inches`}>
        <rect x={1} y={1} width={8.5 * scale} height={11 * scale} className="fill-transparent stroke-border" strokeDasharray="4 3" />
        <rect x={1} y={1} width={iw * scale} height={ih * scale} className="fill-mint/40 stroke-mint transition-all duration-500 motion-reduce:transition-none" />
      </svg>
      <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
        <input className={`${inputCls} w-24`} inputMode="numeric" aria-label="Width in pixels" value={w} onChange={(e) => setW(Math.min(20000, Number(e.target.value.replace(/\D/g, "")) || 0))} />
        ×
        <input className={`${inputCls} w-24`} inputMode="numeric" aria-label="Height in pixels" value={h} onChange={(e) => setH(Math.min(20000, Number(e.target.value.replace(/\D/g, "")) || 0))} />
        pixels at
        <Toggle value={String(ppi)} options={[["72", "72"], ["150", "150"], ["240", "240"], ["300", "300"]]} onChange={(v) => setPpi(Number(v))} />
        PPI
      </div>
      <div className="font-mono text-sm leading-relaxed">
        {num(w)} ÷ {ppi} = <span className="text-mint">{fmt(iw)} in</span> wide · {num(h)} ÷ {ppi} = <span className="text-mint">{fmt(ih)} in</span> tall
      </div>
      <p className="text-sm text-muted-foreground">
        The file doesn't change, only how tightly its pixels are packed on paper. Printing a 4 × 6 inch photo at 240 PPI needs {pixelsFor(4, 240)} × {pixelsFor(6, 240)} pixels.
      </p>
    </Panel>
  );
}

const SCREENS: [string, number, number, number][] = [
  ["15″ 640×480 CRT", 640, 480, 15],
  ["24″ 1080p monitor", 1920, 1080, 24],
  ["27″ 1440p monitor", 2560, 1440, 27],
  ["13.3″ laptop", 2560, 1600, 13.3],
  ["6.1″ phone", 1179, 2556, 6.1],
];

/** Resolution, aspect ratio and pixel density of a screen from its pixel count and diagonal. */
export function ScreenDensity() {
  const [i, setI] = useState(1);
  const [name, w, h, d] = SCREENS[i];
  const [aw, ah] = aspectRatio(w, h);
  const [iw, ih] = screenInches(w, h, d);
  const ppi = ppiFromDiagonal(w, h, d);
  const scale = 160 / Math.max(w, h);
  return (
    <Panel title="Screens compared">
      <div className="flex flex-wrap gap-2">
        {SCREENS.map(([n], j) => (
          <button key={n} type="button" className={`${btn} ${j === i ? "border-foreground" : ""}`} onClick={() => setI(j)} aria-pressed={j === i}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-8">
        <svg viewBox="0 0 170 170" className="w-40 shrink-0" role="img" aria-label={`${name}: ${w} by ${h}`}>
          <rect x={(170 - w * scale) / 2} y={(170 - h * scale) / 2} width={w * scale} height={h * scale} className="fill-sky/20 stroke-sky transition-all duration-500 motion-reduce:transition-none" strokeWidth={2} />
          <line x1={(170 - w * scale) / 2} y1={(170 + h * scale) / 2} x2={(170 + w * scale) / 2} y2={(170 - h * scale) / 2} className="stroke-orange" strokeDasharray="4 3" />
        </svg>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <Stat k="Resolution" v={`${num(w)} × ${num(h)}`} />
          <Stat k="Total pixels" v={`${num(w * h)} (${fmt((w * h) / 1e6, 1)} MP)`} />
          <Stat k="Aspect ratio" v={aw <= 32 ? `${aw}:${ah}` : `about ${fmt(w / h, 2)}:1`} />
          <Stat k="Physical size" v={`${fmt(iw, 1)} × ${fmt(ih, 1)} in`} />
          <Stat k="Diagonal in pixels" v={`√(${num(w)}² + ${num(h)}²) = ${num(Math.round(Math.hypot(w, h)))}`} />
          <Stat k="Pixel density" v={`${num(Math.round(Math.hypot(w, h)))} ÷ ${d} = ${Math.round(ppi)} PPI`} tone="text-mint" />
        </div>
      </div>
    </Panel>
  );
}

/* --------------------------- display hardware --------------------------- */

const FB_COLS = 16;
const FB_ROWS = 15;

/**
 * A raster display sweeps every pixel row by row and reads the frame buffer as it goes.
 * A random-scan display only visits the lines in its display file. Same picture, two routes.
 */
export function ScanDisplay({ initialMode = "raster" }: { initialMode?: "raster" | "random" }) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<"raster" | "random">(initialMode);
  const [playing, setPlaying] = useState(false);
  const [persist, setPersist] = useState(60);
  const [t, setT] = useState(0);
  const fb = useMemo(() => rasterize(HOUSE_LINES, FB_COLS, FB_ROWS), []);
  const lineSegs = useMemo(() => HOUSE_LINES.map(([a, b]) => ({ a, b, len: Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]))) })), []);
  // raster: one tick per pixel plus a 2-tick retrace at the end of each row and 4 at the bottom
  const rowTicks = FB_COLS + 2;
  const rasterPeriod = rowTicks * FB_ROWS + 4;
  const randomPeriod = lineSegs.reduce((s, l) => s + l.len + 1, 0) + 4;
  const period = mode === "raster" ? rasterPeriod : randomPeriod;

  useEffect(() => {
    setT(0);
  }, [mode]);
  useEffect(() => {
    if (!playing || reduce) return;
    const id = setInterval(() => setT((x) => x + 1), 28);
    return () => clearInterval(id);
  }, [playing, reduce]);

  const phase = t % period;
  // when each pixel was last hit by the beam, in ticks
  const glow = (col: number, row: number) => {
    let hitAt: number | null = null;
    if (mode === "raster") {
      if (!fb[row][col]) return 0;
      hitAt = row * rowTicks + col;
    } else {
      let start = 0;
      for (const l of lineSegs) {
        for (let s = 0; s <= l.len; s++) {
          const x = Math.round(l.a[0] + ((l.b[0] - l.a[0]) * s) / l.len);
          const y = Math.round(l.a[1] + ((l.b[1] - l.a[1]) * s) / l.len);
          if (x === col && y === row) hitAt = start + s;
        }
        start += l.len + 1;
      }
      if (hitAt === null) return 0;
    }
    if (!playing && t === 0) return 1;
    const age = (phase - hitAt + period) % period;
    return Math.max(0, 1 - age / persist);
  };

  let beam: Pt | null = null;
  let retrace: "horizontal" | "vertical" | null = null;
  let activeLine = -1;
  if (mode === "raster") {
    const row = Math.floor(phase / rowTicks);
    const col = phase % rowTicks;
    if (row >= FB_ROWS) retrace = "vertical";
    else if (col >= FB_COLS) retrace = "horizontal";
    else beam = [col, row];
  } else {
    let start = 0;
    lineSegs.forEach((l, i) => {
      if (phase >= start && phase <= start + l.len) {
        const s = phase - start;
        beam = [l.a[0] + ((l.b[0] - l.a[0]) * s) / l.len, l.a[1] + ((l.b[1] - l.a[1]) * s) / l.len];
        activeLine = i;
      }
      start += l.len + 1;
    });
    if (activeLine < 0) retrace = "vertical";
  }

  const cell = 20;
  return (
    <Panel title={mode === "raster" ? "Raster scan" : "Random (vector) scan"} legend={[["bg-mint", "glowing phosphor"], ["bg-sky", "electron beam"]]}>
      <div className="flex flex-wrap items-center gap-3">
        <Toggle value={mode} options={[["raster", "Raster scan"], ["random", "Random scan"]]} onChange={(v) => setMode(v as typeof mode)} />
        <button type="button" className={btn} onClick={() => setPlaying((p) => !p)} disabled={reduce}>
          {playing ? "Pause" : "Start the beam"}
        </button>
        <label className="flex items-center gap-2">
          <span className={label}>Persistence</span>
          <input type="range" min={8} max={260} value={persist} onChange={(e) => setPersist(Number(e.target.value))} className="w-28 accent-[hsl(var(--sky))]" aria-label="Phosphor persistence" />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-[1fr_auto] items-start">
        <div className="bg-black/90 p-2 rounded-sm">
          <PixelGrid cols={FB_COLS} rows={FB_ROWS} cell={cell} gridLines={false} label="The screen" fill={(c, r) => {
            const g = glow(c, r);
            return g > 0 ? { color: "hsl(var(--mint))", opacity: 0.15 + 0.85 * g } : null;
          }}>
            {beam && <circle cx={(beam[0] + 0.5) * cell} cy={(beam[1] + 0.5) * cell} r={5} className="fill-sky" />}
            {retrace === "horizontal" && (
              <line x1={FB_COLS * cell} y1={(Math.floor(phase / rowTicks) + 0.5) * cell} x2={0} y2={(Math.floor(phase / rowTicks) + 1.5) * cell} className="stroke-sky" strokeDasharray="4 4" strokeWidth={1.5} />
            )}
            {retrace === "vertical" && <line x1={FB_COLS * cell} y1={FB_ROWS * cell} x2={0} y2={0} className="stroke-sky" strokeDasharray="4 4" strokeWidth={1.5} />}
          </PixelGrid>
        </div>
        {mode === "raster" ? (
          <div>
            <div className={`${label} mb-1`}>Frame buffer (1 bit per pixel)</div>
            <div className="font-mono text-[10px] leading-[1.35]">
              {fb.map((row, r) => (
                <div key={r} className={beam && (beam as Pt)[1] === r ? "text-sky" : "text-muted-foreground"}>
                  {row.join("")}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className={`${label} mb-1`}>Display file</div>
            <ol className="font-mono text-[11px] leading-[1.5]">
              {HOUSE_LINES.map(([a, b], i) => (
                <li key={i} className={i === activeLine ? "text-sky" : "text-muted-foreground"}>
                  LINE ({a[0]},{a[1]}) → ({b[0]},{b[1]})
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {retrace === "horizontal"
          ? "Horizontal retrace: the beam is switched off and flies back to the left edge for the next row."
          : retrace === "vertical"
            ? "Vertical retrace: the frame is finished, and the beam returns to the top-left corner to start the next one."
            : mode === "raster"
              ? "The beam visits every position on the screen, lit or not, switching on only where the frame buffer holds a 1."
              : "The beam moves only along the lines in the display file, so it never visits empty parts of the screen."}
        {reduce && " (Animation is off because your system asks for reduced motion.)"}
      </p>
    </Panel>
  );
}

/** Each pixel is three colored stripes. From a distance your eye adds them into one color. */
export function SubpixelZoom() {
  const [rgb, setRgb] = useState<[number, number, number]>([255, 200, 0]);
  const set = (i: number) => (v: number) => setRgb((c) => c.map((x, j) => (j === i ? v : x)) as [number, number, number]);
  const stripes: [string, number][] = [
    ["255,40,40", rgb[0]],
    ["40,255,40", rgb[1]],
    ["40,90,255", rgb[2]],
  ];
  return (
    <Panel title="Subpixels">
      <div className="flex flex-wrap items-center gap-8">
        <svg viewBox="0 0 150 150" className="w-40" role="img" aria-label="Nine pixels magnified, each made of red, green and blue stripes">
          <rect width={150} height={150} className="fill-black" />
          {Array.from({ length: 9 }, (_, p) =>
            stripes.map(([c, v], s) => (
              <rect key={`${p}-${s}`} x={(p % 3) * 50 + 4 + s * 15} y={Math.floor(p / 3) * 50 + 4} width={12} height={42} rx={2} style={{ fill: `rgb(${c})`, fillOpacity: 0.08 + 0.92 * (v / 255) }} />
            )),
          )}
        </svg>
        <div className="flex flex-col items-center gap-2">
          <span className="inline-block h-16 w-16 border border-border" style={{ background: `rgb(${rgb.join(",")})` }} aria-hidden />
          <span className={label}>From a distance</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <ChannelSlider name="Red" value={rgb[0]} onChange={set(0)} tone="text-orange" />
        <ChannelSlider name="Green" value={rgb[1]} onChange={set(1)} tone="text-mint" />
        <ChannelSlider name="Blue" value={rgb[2]} onChange={set(2)} tone="text-sky" />
      </div>
    </Panel>
  );
}

/** A night scene on an LCD lit from the edges or from a grid of LEDs behind it. */
export function BacklightDemo() {
  const [mode, setMode] = useState<"edge" | "direct">("edge");
  const cols = 8;
  const rows = 5;
  // brightness the picture wants in each zone: a dark sky with a bright moon at (6, 1)
  const want = (c: number, r: number) => (Math.hypot(c - 6, r - 1) < 1.2 ? 1 : 0.04);
  const backlight = (c: number, r: number) => {
    if (mode === "direct") return want(c, r) > 0.5 ? 1 : 0.08;
    return 0.75; // edge lighting spreads one level over the whole panel
  };
  // the liquid crystals can block most, but not all, of the light behind them
  const shown = (c: number, r: number) => Math.min(1, backlight(c, r) * (want(c, r) > 0.5 ? 1 : 0.18));
  return (
    <Panel title="Backlight">
      <Toggle value={mode} options={[["edge", "Edge LED"], ["direct", "Direct LED"]]} onChange={(v) => setMode(v as typeof mode)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className={`${label} mb-1`}>Backlight</div>
          <PixelGrid cols={cols} rows={rows} cell={30} label="Backlight brightness" fill={(c, r) => ({ color: "rgb(255,250,230)", opacity: backlight(c, r) })}>
            {mode === "edge" && (
              <>
                <rect x={0} y={0} width={4} height={rows * 30} className="fill-orange" />
                <rect x={cols * 30 - 4} y={0} width={4} height={rows * 30} className="fill-orange" />
              </>
            )}
          </PixelGrid>
        </div>
        <div>
          <div className={`${label} mb-1`}>What you see</div>
          <div className="bg-black">
            <PixelGrid cols={cols} rows={rows} cell={30} gridLines={false} label="The picture on screen" fill={(c, r) => ({ color: "rgb(235,240,255)", opacity: shown(c, r) })} />
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {mode === "edge"
          ? "Edge lighting puts LEDs along the sides and spreads their light behind the whole panel. The crystals can't block it completely, so the black sky glows grey."
          : "Direct lighting puts LEDs in a grid behind the panel. Zones behind dark areas can be dimmed, so the sky stays black while the moon stays bright."}
      </p>
    </Panel>
  );
}

/** A circle as a vector path and as a 16 × 16 raster, zoomed in on its edge. */
export function VectorVsRaster() {
  const [zoom, setZoom] = useState(1);
  const n = 16;
  const disc = useMemo(() => rasterDisc(n), []);
  const size = n / zoom;
  const cx = 8 + 8 * Math.SQRT1_2;
  const cy = 8 - 8 * Math.SQRT1_2;
  const vx = Math.max(0, Math.min(n - size, cx - size / 2));
  const vy = Math.max(0, Math.min(n - size, cy - size / 2));
  const view = `${vx} ${vy} ${size} ${size}`;
  return (
    <Panel title="Zoom in">
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <div>
          <div className={`${label} mb-1`}>Vector: a circle, centre (8, 8), radius 8</div>
          <svg viewBox={view} className="w-full aspect-square border border-border block" role="img" aria-label={`Vector circle at ${zoom}× zoom`}>
            <circle cx={8} cy={8} r={8} className="fill-mint/70" />
          </svg>
        </div>
        <div>
          <div className={`${label} mb-1`}>Raster: 16 × 16 pixels</div>
          <svg viewBox={view} className="w-full aspect-square border border-border block" role="img" aria-label={`Raster circle at ${zoom}× zoom`} shapeRendering="crispEdges">
            {disc.flatMap((row, r) => row.map((on, c) => (on ? <rect key={`${c},${r}`} x={c} y={r} width={1} height={1} className="fill-mint/70" /> : null)))}
          </svg>
        </div>
      </div>
      <label className="flex flex-wrap items-center gap-3">
        <span className={label}>Zoom</span>
        <input type="range" min={1} max={8} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className={range} aria-label="Zoom" />
        <span className="font-mono text-sm">{zoom}×</span>
      </label>
      <p className="text-sm text-muted-foreground">
        The vector is redrawn from its equation at every zoom, so its edge stays smooth. The raster only has its 256 stored pixels; zooming makes each one bigger.
      </p>
    </Panel>
  );
}

/* ------------------------------ coordinates ------------------------------ */

/** Hover a pixel to read its coordinates with the origin at the top-left or the bottom-left. */
export function CoordinatePicker() {
  const cols = 10;
  const rows = 7;
  const [origin, setOrigin] = useState<"top" | "bottom">("top");
  const [pick, setPick] = useState<[number, number]>([3, 5]);
  const [c, r] = pick;
  const y = origin === "top" ? r : rows - 1 - r;
  const cell = 32;
  return (
    <Panel title="Pixel coordinates" legend={[["bg-neon", "picked pixel"], ["bg-orange", "origin (0, 0)"]]}>
      <Toggle value={origin} options={[["top", "Origin top-left (most screens)"], ["bottom", "Origin bottom-left (OpenGL, maths)"]]} onChange={(v) => setOrigin(v as typeof origin)} />
      <PixelGrid
        cols={cols}
        rows={rows}
        cell={cell}
        label="A 10 by 7 pixel grid"
        onCell={(cc, rr) => setPick([cc, rr])}
        fill={(cc, rr) => (cc === c && rr === r ? { className: "fill-neon/70" } : (origin === "top" ? rr === 0 : rr === rows - 1) && cc === 0 ? { className: "fill-orange/50" } : null)}
      >
        {Array.from({ length: cols }, (_, i) => (
          <text key={`x${i}`} x={(i + 0.5) * cell} y={(origin === "top" ? 0 : rows - 1) * cell + 12} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px] pointer-events-none">
            {i}
          </text>
        ))}
      </PixelGrid>
      <div className="font-mono text-lg">
        column {c}, row {y} → <span className="text-neon">({c}, {y})</span>
      </div>
      <p className="text-sm text-muted-foreground">
        The pixel didn't move, but its y changed. {origin === "top" ? "Here rows count down from the top edge." : "Here rows count up from the bottom edge."} Always find out which convention a system uses before trusting a coordinate.
      </p>
    </Panel>
  );
}

/* ------------------------------- aliasing ------------------------------- */

/** A one-pixel line at any angle, drawn all-or-nothing or by how much of each pixel it covers. */
export function AntialiasDemo() {
  const [angle, setAngle] = useState(22);
  const [aa, setAa] = useState<"off" | "on">("off");
  const cols = 22;
  const rows = 12;
  const a: Pt = [1, rows - 1.5];
  const len = 24;
  const rad = (angle * Math.PI) / 180;
  const b: Pt = [a[0] + len * Math.cos(rad), a[1] - len * Math.sin(rad)];
  const cov = useMemo(() => lineCoverage(a, b, 1, cols, rows, aa === "on" ? 4 : 1), [angle, aa]); // eslint-disable-line react-hooks/exhaustive-deps
  const cell = 16;
  return (
    <Panel title="Jaggies" legend={[["bg-foreground", "pixel ink"], ["bg-orange", "the ideal line"]]}>
      <div className="flex flex-wrap items-center gap-4">
        <Toggle value={aa} options={[["off", "Aliased"], ["on", "Antialiased"]]} onChange={(v) => setAa(v as typeof aa)} />
        <label className="flex items-center gap-3">
          <span className={label}>Angle</span>
          <input type="range" min={0} max={60} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className={range} aria-label="Line angle in degrees" />
          <span className="font-mono text-sm">{angle}°</span>
        </label>
      </div>
      <div className="bg-white rounded-sm p-1">
        <PixelGrid cols={cols} rows={rows} cell={cell} label={`A line at ${angle} degrees, ${aa === "on" ? "antialiased" : "aliased"}`} fill={(c, r) => (cov[r][c] > 0 ? { color: "rgb(15,15,25)", opacity: cov[r][c] } : null)}>
          <line x1={a[0] * cell} y1={a[1] * cell} x2={b[0] * cell} y2={b[1] * cell} className="stroke-orange" strokeWidth={1.2} />
        </PixelGrid>
      </div>
      <p className="text-sm text-muted-foreground">
        {aa === "off"
          ? "Each pixel is tested once, at its centre: inside the line means black, outside means white. Diagonal lines turn into stair steps."
          : "Each pixel is tested at 16 points. A pixel the line half covers gets 50% grey, so the edge looks smooth from a normal viewing distance."}
      </p>
    </Panel>
  );
}

/* ---------------------------- line algorithms ---------------------------- */

const ALGOS = {
  naive: { title: "Slope-intercept (naive) line", frames: naiveFrames, code: CPP_NAIVE },
  dda: { title: "DDA line", frames: ddaFrames, code: CPP_DDA },
  bresenham: { title: "Bresenham's line", frames: bresenhamFrames, code: CPP_BRESENHAM },
} as const;

function LineGrid({ s, cols, rows }: { s: LineState; cols: number; rows: number }) {
  const cell = Math.min(24, 420 / cols);
  // maths convention: y grows upwards, so row 0 is drawn at the bottom
  const Y = (y: number) => (rows - 1 - y + 0.5) * cell;
  const X = (x: number) => (x + 0.5) * cell;
  const lit = new Set(s.plotted.map(([x, y]) => `${x},${y}`));
  const latest = s.plotted[s.plotted.length - 1];
  return (
    <svg viewBox={`-16 0 ${cols * cell + 16} ${rows * cell + 16}`} className="w-full block" style={{ maxWidth: cols * cell + 16 }} role="img" aria-label={`Pixels lit so far: ${s.plotted.map((p) => `(${p[0]}, ${p[1]})`).join(" ")}`}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const y = rows - 1 - r;
          const on = lit.has(`${c},${y}`);
          const isLatest = latest && latest[0] === c && latest[1] === y && !s.done;
          return <rect key={`${c},${r}`} x={c * cell} y={r * cell} width={cell} height={cell} strokeWidth={0.5} className={`stroke-border ${isLatest ? "fill-neon/80" : on ? "fill-mint/70" : "fill-transparent"}`} />;
        }),
      )}
      <line x1={X(s.from[0])} y1={Y(s.from[1])} x2={X(s.to[0])} y2={Y(s.to[1])} className="stroke-orange" strokeWidth={1.5} />
      {s.exact && <circle cx={X(s.exact[0])} cy={Y(s.exact[1])} r={3.5} className="fill-sky" />}
      {Array.from({ length: cols }, (_, c) =>
        c % (cols > 16 ? 2 : 1) === 0 ? (
          <text key={`x${c}`} x={X(c)} y={rows * cell + 11} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">
            {c}
          </text>
        ) : null,
      )}
      {Array.from({ length: rows }, (_, y) =>
        y % (rows > 16 ? 2 : 1) === 0 ? (
          <text key={`y${y}`} x={-4} y={Y(y) + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[8px]">
            {y}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/** Step through a line algorithm pixel by pixel, with its C++ beside it and the table it builds. */
export function LineStepper({ algorithm, from = [5, 4], to = [12, 7] }: { algorithm: keyof typeof ALGOS; from?: Pt; to?: Pt }) {
  const algo = ALGOS[algorithm];
  const [pts, setPts] = useState<[Pt, Pt]>([from, to]);
  const [text, setText] = useState([from[0], from[1], to[0], to[1]].map(String));
  const frames = useMemo(() => algo.frames(pts[0], pts[1]), [algo, pts]);
  const cols = Math.max(pts[0][0], pts[1][0]) + 2;
  const rows = Math.max(pts[0][1], pts[1][1]) + 2;
  const apply = () => {
    const v = text.map(Number);
    if (v.every((n) => Number.isInteger(n) && n >= 0 && n <= 30)) setPts([[v[0], v[1]], [v[2], v[3]]]);
  };
  const names = ["x0", "y0", "x1", "y1"];
  const showP = algorithm === "bresenham";
  return (
    <Stepper
      title={algo.title}
      frames={frames}
      code={[...algo.code]}
      codeLabel="C++"
      legend={[["bg-orange", "ideal line"], ["bg-sky", "exact point"], ["bg-neon", "just lit"], ["bg-mint", "lit"]]}
      render={(s) => (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] items-start">
          <LineGrid s={s} cols={cols} rows={rows} />
          <table className="font-mono text-xs border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="text-left py-1 pr-3">k</th>
                <th className="text-left py-1 pr-3">x</th>
                <th className="text-left py-1 pr-3">y</th>
                {showP && <th className="text-left py-1 pr-3">p</th>}
                <th className="text-left py-1">plot</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r, i) => (
                <tr key={r.k} className={`border-b border-border/50 ${i === s.rows.length - 1 && !s.done ? "bg-neon/10" : ""}`}>
                  <td className="py-1 pr-3">{r.k}</td>
                  <td className="py-1 pr-3">{fmt(r.x)}</td>
                  <td className="py-1 pr-3">{fmt(r.y)}</td>
                  {showP && <td className="py-1 pr-3">{r.p}</td>}
                  <td className="py-1 text-mint">
                    ({r.plot[0]}, {r.plot[1]})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      inputs={
        <div className="flex flex-wrap items-center gap-2">
          {names.map((n, i) => (
            <input
              key={n}
              aria-label={n}
              placeholder={n}
              className={`${inputCls} w-16`}
              inputMode="numeric"
              value={text[i]}
              onChange={(e) => setText((t) => t.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
          ))}
          <button type="button" className={btn} onClick={apply}>
            Draw
          </button>
          <span className="font-mono text-[10px] text-muted-foreground">whole numbers 0–30</span>
        </div>
      }
    />
  );
}

/** Interactive vs passive graphics: one picture you can steer, one that only plays. */
export function InteractiveVsPassive() {
  const reduce = useReducedMotion();
  const [pos, setPos] = useState(40);
  const [t, setT] = useState(0);
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setT((x) => (x + 1) % 200), 40);
    return () => clearInterval(id);
  }, [reduce]);
  const auto = 20 + Math.abs(100 - t) * 1.6;
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = ref.current?.getBoundingClientRect();
    if (box) setPos(Math.max(10, Math.min(190, ((e.clientX - box.left) / box.width) * 200)));
  };
  return (
    <Panel title="Two kinds of graphics">
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <div>
          <div className={`${label} mb-1 text-mint`}>Interactive: move over it</div>
          <svg ref={ref} viewBox="0 0 200 80" className="w-full border border-border block touch-none cursor-ew-resize" onPointerMove={move} onPointerDown={move} role="img" aria-label="A ball that follows your pointer">
            <circle cx={pos} cy={40} r={12} className="fill-mint" />
          </svg>
        </div>
        <div>
          <div className={`${label} mb-1`}>Passive: you can only watch</div>
          <svg viewBox="0 0 200 80" className="w-full border border-border block" role="img" aria-label="A ball moving on its own">
            <circle cx={auto} cy={40} r={12} className="fill-muted-foreground" />
          </svg>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Both move. Only one listens to you. That two-way loop, input in and a new picture out, is what makes graphics interactive.</p>
    </Panel>
  );
}
