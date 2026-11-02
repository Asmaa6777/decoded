import type { Frame } from "@/lib/algorithms";

/* ============================================================
   Computer Graphics: pixels, color depth, resolution and the
   line-drawing algorithms. Everything here is plain arithmetic
   so the lessons' worked examples can be checked in tests.
   ============================================================ */

export type Pt = [number, number];

/** Rounds halves up (2.5 → 3), like the C++ `round` used in the examples for positive numbers. */
export const roundHalfUp = (v: number) => Math.floor(Number(v.toFixed(9)) + 0.5);

/* ------------------------- color depth ------------------------- */

/** How many different values a pixel with this many bits can hold. */
export const colorsFor = (bits: number) => 2 ** bits;

/** Snap an 8-bit brightness (0–255) to the nearest level a smaller bit depth can store. */
export function quantize(value: number, bits: number) {
  if (bits >= 8) return value;
  const step = 255 / (colorsFor(bits) - 1);
  return Math.round(Math.round(value / step) * step);
}

export const toBinary = (n: number, width: number) => n.toString(2).padStart(width, "0");
export const toHex = (n: number, width = 2) => n.toString(16).toUpperCase().padStart(width, "0");

/** Pack 24-bit RGB into 16 bits: 5 for red, 6 for green, 5 for blue. */
export function rgbTo565(r: number, g: number, b: number) {
  const r5 = r >> 3;
  const g6 = g >> 2;
  const b5 = b >> 3;
  return { r5, g6, b5, packed: (r5 << 11) | (g6 << 5) | b5 };
}

/** Unpack 5-6-5 back to 8 bits per channel, copying the top bits into the empty low bits. */
export function from565(packed: number): [number, number, number] {
  const r5 = (packed >> 11) & 31;
  const g6 = (packed >> 5) & 63;
  const b5 = packed & 31;
  return [(r5 << 3) | (r5 >> 2), (g6 << 2) | (g6 >> 4), (b5 << 3) | (b5 >> 2)];
}

/** Draw a color with alpha `a` (0–255) over a background: a/255 of the color, the rest background. */
export function blend(fg: [number, number, number], bg: [number, number, number], a: number): [number, number, number] {
  const t = a / 255;
  return [0, 1, 2].map((i) => Math.round(fg[i] * t + bg[i] * (1 - t))) as [number, number, number];
}

/* -------------------------- image size -------------------------- */

export type ImageSize = { pixels: number; bits: number; bytes: number; kb: number; mb: number };

/** Uncompressed size of a width × height image at a given number of bits per pixel. */
export function imageSize(width: number, height: number, bitsPerPixel: number): ImageSize {
  const pixels = width * height;
  const bits = pixels * bitsPerPixel;
  const bytes = bits / 8;
  return { pixels, bits, bytes, kb: bytes / 1024, mb: bytes / 1024 / 1024 };
}

/* -------------------------- resolution -------------------------- */

/** Printed length in inches of `pixels` at `ppi` pixels per inch. */
export const printInches = (pixels: number, ppi: number) => pixels / ppi;

/** Pixels needed to print `inches` at `ppi`. */
export const pixelsFor = (inches: number, ppi: number) => Math.round(inches * ppi);

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** 1920 × 1080 → [16, 9]. */
export function aspectRatio(width: number, height: number): [number, number] {
  const g = gcd(width, height);
  return [width / g, height / g];
}

/** Pixels per inch of a screen, from its resolution and its diagonal size in inches. */
export function ppiFromDiagonal(width: number, height: number, diagonalInches: number) {
  return Math.hypot(width, height) / diagonalInches;
}

/** The physical width and height of a screen, from its diagonal and its pixel shape. */
export function screenInches(width: number, height: number, diagonalInches: number): [number, number] {
  const d = Math.hypot(width, height);
  return [(diagonalInches * width) / d, (diagonalInches * height) / d];
}

/* ---------------------------- bitmaps ---------------------------- */

/** A 12 × 12 one-bit picture of a house. '#' is a lit pixel. */
export const HOUSE = [
  "............",
  ".....##.....",
  "....####....",
  "...######...",
  "..########..",
  ".##########.",
  "..#......#..",
  "..#.##...#..",
  "..#.##.#.#..",
  "..#....#.#..",
  "..########..",
  "............",
];

export const bitmapToBits = (rows: string[]) => rows.flatMap((r) => [...r].map((c) => (c === "#" ? 1 : 0)));

/** Lay a flat list of pixel values out in rows of `width`. The last row may be short. */
export function wrap<T>(flat: T[], width: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < flat.length; i += width) rows.push(flat.slice(i, i + width));
  return rows;
}

/** Which pixels of an n × n grid have their centre inside a circle filling the grid. */
export function rasterDisc(n: number): boolean[][] {
  const r = n / 2;
  return Array.from({ length: n }, (_, row) =>
    Array.from({ length: n }, (_, col) => Math.hypot(col + 0.5 - r, row + 0.5 - r) <= r - 0.25),
  );
}

/* ----------------------- coverage and aliasing ----------------------- */

const distToSegment = (px: number, py: number, [ax, ay]: Pt, [bx, by]: Pt) => {
  const vx = bx - ax;
  const vy = by - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len2));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
};

/**
 * How much of each pixel a line of the given width covers, from 0 to 1. Each pixel is
 * tested at samples × samples evenly spaced points. With one sample, only the centre
 * counts, so every pixel is all or nothing: that is aliasing.
 */
export function lineCoverage(a: Pt, b: Pt, width: number, cols: number, rows: number, samples: number): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      let hit = 0;
      for (let i = 0; i < samples; i++) {
        for (let j = 0; j < samples; j++) {
          const px = c + (i + 0.5) / samples;
          const py = r + (j + 0.5) / samples;
          if (distToSegment(px, py, a, b) <= width / 2) hit++;
        }
      }
      return hit / (samples * samples);
    }),
  );
}

/* ------------------------ line algorithms ------------------------ */

export type LineRow = { k: number; x: number; y: number; plot: Pt; p?: number };
export type LineState = {
  from: Pt;
  to: Pt;
  rows: LineRow[];
  plotted: Pt[];
  /** the exact (unrounded) point the algorithm is at */
  exact?: Pt;
  done: boolean;
};

const fmt = (v: number) => String(Number(v.toFixed(3)));

export const CPP_NAIVE = [
  "void naiveLine(int x0, int y0, int x1, int y1) {",
  "  float m = (y1 - y0) / (float)(x1 - x0);",
  "  float c = y0 - m * x0;",
  "  for (int x = x0; x <= x1; x++) {",
  "    float y = m * x + c;",
  "    putpixel(x, round(y));",
  "  }",
  "}",
];

/** Evaluate y = mx + c at every whole x. Steep lines come out with gaps. */
export function naiveFrames(from: Pt, to: Pt): Frame<LineState>[] {
  let [x0, y0] = from;
  let [x1, y1] = to;
  if (x0 > x1) [x0, y0, x1, y1] = [x1, y1, x0, y0];
  const frames: Frame<LineState>[] = [];
  const rows: LineRow[] = [];
  const plotted: Pt[] = [];
  const push = (line: number, message: string, extra: Partial<LineState> = {}) =>
    frames.push({ state: { from: [x0, y0], to: [x1, y1], rows: [...rows], plotted: [...plotted], done: false, ...extra }, line, message, stats: { pixels: plotted.length } });

  if (x0 === x1) {
    push(1, `x1 − x0 is 0, so the slope is a division by zero. y = mx + c can't describe a vertical line, so this method draws nothing.`, { done: true });
    return frames;
  }
  const m = (y1 - y0) / (x1 - x0);
  push(1, `Slope m = (${y1} − ${y0}) / (${x1} − ${x0}) = ${y1 - y0}/${x1 - x0} = ${fmt(m)}.`);
  const c = y0 - m * x0;
  push(2, `Intercept c = y0 − m·x0 = ${y0} − ${fmt(m)} × ${x0} = ${fmt(c)}. Keep the fraction: rounding c here would shift the whole line.`);
  for (let x = x0; x <= x1; x++) {
    const y = m * x + c;
    push(4, `x = ${x}: y = ${fmt(m)} × ${x} + ${fmt(c)} = ${fmt(y)}.`, { exact: [x, y] });
    const plot: Pt = [x, roundHalfUp(y)];
    plotted.push(plot);
    rows.push({ k: x - x0, x, y, plot });
    push(5, `Round ${fmt(y)} to ${plot[1]} and light pixel (${plot[0]}, ${plot[1]}).`, { exact: [x, y] });
  }
  const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
  push(
    6,
    steep
      ? `Done, but look at the gaps. The line rises ${Math.abs(y1 - y0)} rows over only ${x1 - x0} columns, and one pixel per column can't fill that.`
      : `Done: one pixel in each of the ${x1 - x0 + 1} columns, with no gaps because the line is no steeper than 45°.`,
    { done: true },
  );
  return frames;
}

export const CPP_DDA = [
  "void dda(int x0, int y0, int x1, int y1) {",
  "  int dx = x1 - x0, dy = y1 - y0;",
  "  int steps = max(abs(dx), abs(dy));",
  "  float xInc = dx / (float) steps;",
  "  float yInc = dy / (float) steps;",
  "  float x = x0, y = y0;",
  "  for (int k = 0; k <= steps; k++) {",
  "    putpixel(round(x), round(y));",
  "    x += xInc;",
  "    y += yInc;",
  "  }",
  "}",
];

/** The digital differential analyzer: add a fixed increment at each step instead of multiplying. */
export function ddaFrames(from: Pt, to: Pt): Frame<LineState>[] {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const frames: Frame<LineState>[] = [];
  const rows: LineRow[] = [];
  const plotted: Pt[] = [];
  const push = (line: number, message: string, extra: Partial<LineState> = {}) =>
    frames.push({ state: { from, to, rows: [...rows], plotted: [...plotted], done: false, ...extra }, line, message, stats: { steps: rows.length, pixels: plotted.length } });

  const dx = x1 - x0;
  const dy = y1 - y0;
  push(1, `Δx = ${x1} − ${x0} = ${dx}, Δy = ${y1} − ${y0} = ${dy}.`);
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if (steps === 0) {
    rows.push({ k: 0, x: x0, y: y0, plot: [x0, y0] });
    plotted.push([x0, y0]);
    push(7, `Both points are the same, so there is one pixel to light: (${x0}, ${y0}).`, { done: true });
    return frames;
  }
  push(2, `steps = max(|${dx}|, |${dy}|) = ${steps}. The longer direction decides how many steps to take, so it moves exactly 1 pixel each step.`);
  const xInc = dx / steps;
  const yInc = dy / steps;
  push(3, `xInc = ${dx} / ${steps} = ${fmt(xInc)}.`);
  push(4, `yInc = ${dy} / ${steps} = ${fmt(yInc)}.`);
  let x = x0;
  let y = y0;
  push(5, `Start at the first endpoint, (${x0}, ${y0}).`, { exact: [x, y] });
  for (let k = 0; k <= steps; k++) {
    const plot: Pt = [roundHalfUp(x), roundHalfUp(y)];
    plotted.push(plot);
    rows.push({ k, x, y, plot });
    push(7, `k = ${k}: the exact point is (${fmt(x)}, ${fmt(y)}). Round each part and light (${plot[0]}, ${plot[1]}).`, { exact: [x, y] });
    if (k === steps) break;
    x += xInc;
    y += yInc;
    push(9, `Add the increments: x = ${fmt(x)}, y = ${fmt(y)}.`, { exact: [x, y] });
  }
  push(10, `Done after ${steps} steps: ${plotted.length} pixels, endpoints included.`, { done: true });
  return frames;
}

export const CPP_BRESENHAM = [
  "void bresenham(int x0, int y0, int x1, int y1) {",
  "  int dx = abs(x1 - x0), dy = abs(y1 - y0);",
  "  int sx = x1 >= x0 ? 1 : -1, sy = y1 >= y0 ? 1 : -1;",
  "  bool steep = dy > dx;",
  "  if (steep) swap(dx, dy);   // walk along y instead",
  "  int p = 2 * dy - dx;",
  "  int x = x0, y = y0;",
  "  for (int k = 0; k <= dx; k++) {",
  "    putpixel(x, y);",
  "    if (p >= 0) {             // past the midpoint: move up too",
  "      if (steep) x += sx; else y += sy;",
  "      p += 2 * dy - 2 * dx;",
  "    } else {",
  "      p += 2 * dy;",
  "    }",
  "    if (steep) y += sy; else x += sx;",
  "  }",
  "}",
];

/** Bresenham's line algorithm: whole numbers only, deciding each step from the sign of p. */
export function bresenhamFrames(from: Pt, to: Pt): Frame<LineState>[] {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const frames: Frame<LineState>[] = [];
  const rows: LineRow[] = [];
  const plotted: Pt[] = [];
  const push = (line: number, message: string, extra: Partial<LineState> = {}) =>
    frames.push({ state: { from, to, rows: [...rows], plotted: [...plotted], done: false, ...extra }, line, message, stats: { pixels: plotted.length } });

  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  push(1, `Δx = ${dx}, Δy = ${dy}.`);
  const sx = x1 >= x0 ? 1 : -1;
  const sy = y1 >= y0 ? 1 : -1;
  push(2, `x moves by ${sx > 0 ? "+1" : "−1"} and y by ${sy > 0 ? "+1" : "−1"}, towards the second endpoint.`);
  const steep = dy > dx;
  if (steep) {
    [dx, dy] = [dy, dx];
    push(4, `The line is steep (Δy > Δx), so swap the roles: step along y every time and decide whether x moves.`);
  } else {
    push(3, `The line is gentle (Δy ≤ Δx), so step along x every time and decide whether y moves.`);
  }
  let p = 2 * dy - dx;
  push(5, `p₀ = 2·${dy} − ${dx} = ${p}.`);
  let x = x0;
  let y = y0;
  for (let k = 0; k <= dx; k++) {
    plotted.push([x, y]);
    rows.push({ k, x, y, plot: [x, y], p });
    push(8, `k = ${k}: light (${x}, ${y}). p = ${p}.`, { exact: [x, y] });
    if (k === dx) break;
    const side = steep ? "x" : "y";
    if (p >= 0) {
      if (steep) x += sx;
      else y += sy;
      const old = p;
      p += 2 * dy - 2 * dx;
      push(11, `p = ${old} is not negative: the line has passed the midpoint, so ${side} moves too. p = ${old} + 2·${dy} − 2·${dx} = ${p}.`);
    } else {
      const old = p;
      p += 2 * dy;
      push(13, `p = ${old} is negative: the line is still below the midpoint, so ${side} stays. p = ${old} + 2·${dy} = ${p}.`);
    }
    if (steep) y += sy;
    else x += sx;
  }
  push(16, `Done: ${plotted.length} pixels, using only adds, subtracts and a sign check.`, { done: true });
  return frames;
}

export const lastPlotted = (frames: Frame<LineState>[]) => frames[frames.length - 1].state.plotted;

/* ---------------------- raster vs random scan ---------------------- */

/** A display file: the line commands a random-scan display traces, in order. */
export const HOUSE_LINES: [Pt, Pt][] = [
  [[2, 13], [13, 13]],
  [[13, 13], [13, 6]],
  [[13, 6], [2, 6]],
  [[2, 6], [2, 13]],
  [[1, 7], [7, 1]],
  [[7, 1], [14, 8]],
  [[5, 13], [5, 9]],
  [[5, 9], [8, 9]],
  [[8, 9], [8, 13]],
];

/** Rasterize a display file into a frame buffer of 0s and 1s, as a raster display would store it. */
export function rasterize(lines: [Pt, Pt][], cols: number, rows: number): number[][] {
  const grid = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (const [a, b] of lines) {
    for (const [x, y] of lastPlotted(bresenhamFrames(a, b))) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) grid[y][x] = 1;
    }
  }
  return grid;
}
