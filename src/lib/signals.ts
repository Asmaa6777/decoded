import type { Frame } from "@/lib/algorithms";

/* ============================================================
   Signals project: sampling, additive noise, moving averages as
   convolution, and the error norm and SNR used to judge them.
   conv(x, h, 'same') here behaves like MATLAB's: zeros past the
   ends, and the central part of the full result.
   ============================================================ */

/** Seeded random numbers, so every reader sees the same noise. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** n samples of standard normal noise (mean 0, standard deviation 1), from a seed. */
export function gaussian(n: number, seed: number): number[] {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => {
    let u = 0;
    while (u === 0) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  });
}

/** The full convolution, length x + h − 1: every pair of positions adds into out[i + j]. */
export function convFull(x: number[], h: number[]): number[] {
  const out = Array(x.length + h.length - 1).fill(0);
  x.forEach((a, i) => h.forEach((b, j) => (out[i + j] += a * b)));
  return out;
}

/** MATLAB's conv(x, h, 'same'): the central part of the full result, the same length as x. */
export function convSame(x: number[], h: number[]): number[] {
  const start = Math.floor(h.length / 2);
  return convFull(x, h).slice(start, start + x.length);
}

export const movingAverageKernel = (M: number) => Array(M).fill(1 / M);
export const movingAverage = (x: number[], M: number) => convSame(x, movingAverageKernel(M));

export const sumSquares = (v: number[]) => v.reduce((s, a) => s + a * a, 0);
export const norm = (v: number[]) => Math.sqrt(sumSquares(v));
export const errorNorm = (x: number[], xHat: number[]) => norm(x.map((a, i) => a - xHat[i]));

/** Signal-to-noise ratio in decibels: 10·log10(‖x‖² / ‖x − x̂‖²). */
export const snr = (x: number[], xHat: number[]) => 10 * Math.log10(sumSquares(x) / errorNorm(x, xHat) ** 2);

export const std = (v: number[]) => {
  const m = v.reduce((s, a) => s + a, 0) / v.length;
  return Math.sqrt(v.reduce((s, a) => s + (a - m) ** 2, 0) / v.length);
};

/** A wave of frequency f measured Fs times a second, for `seconds` seconds. */
export function sampleTimes(Fs: number, seconds: number): number[] {
  return Array.from({ length: Math.floor(Fs * seconds) + 1 }, (_, n) => n / Fs);
}

/**
 * The frequency the samples appear to show. Sampling at Fs folds every frequency into
 * the range 0 … Fs/2, so anything above Fs/2 shows up as a slower, false wave.
 */
export function apparentFrequency(f: number, Fs: number) {
  const r = ((f % Fs) + Fs) % Fs;
  return Math.min(r, Fs - r);
}

/** The test signal for the trade-off: slow waves, a sharp spike near 200 and a fast burst from 380 to 460. */
export function playgroundClean(N = 600): number[] {
  return Array.from({ length: N }, (_, n) => {
    let v = 0.55 * Math.sin((2 * Math.PI * 3 * n) / N) + 0.25 * Math.sin((2 * Math.PI * 7 * n) / N + 0.5);
    v += Math.exp(-(((n - 200) / 1.6) ** 2));
    if (n >= 380 && n <= 460) v += 0.45 * Math.sin((2 * Math.PI * n) / 9) * Math.sin((Math.PI * (n - 380)) / 80);
    return v;
  });
}

/** A voice-like buzz: 140 Hz with 25 overtones, shaped into two syllables, peak 1. */
export function voiceLike(Fs: number, seconds = 1.6): number[] {
  const N = Math.floor(Fs * seconds);
  const out = Array.from({ length: N }, (_, i) => {
    const t = i / Fs;
    let v = 0;
    for (let k = 1; k <= 25; k++) v += Math.sin(2 * Math.PI * 140 * k * t + 0.3 * k) / k;
    return v * Math.abs(Math.sin((Math.PI * t) / 0.8)) ** 0.6;
  });
  const peak = Math.max(...out.map(Math.abs));
  return out.map((v) => v / peak);
}

/* ---------------------- the convolution stepper ---------------------- */

export type ConvStep = {
  x: number[];
  h: number[];
  /** output position being computed, or −1 before the first */
  n: number;
  y: (number | null)[];
  /** the window's values, padded with zeros past the ends */
  window: number[];
  products: number[];
};

export const MATLAB_MOVING_AVERAGE = [
  "x = [3 1 3 1 3];",
  "h = ones(1, 3) / 3;         % kernel [1/3 1/3 1/3]",
  "y = zeros(size(x));",
  "xp = [0 x 0];               % zeros past both ends",
  "for n = 1:length(x)",
  "  w = xp(n:n+2);            % the window",
  "  y(n) = sum(w .* h);       % multiply and add",
  "end",
  "% same as conv(x, h, 'same')",
];

/** Slide a 3-weight kernel along x, one window at a time. */
export function convFrames(x: number[], h: number[]): Frame<ConvStep>[] {
  const xp = [0, ...x, 0];
  const y: (number | null)[] = x.map(() => null);
  const f = (v: number) => String(Number(v.toFixed(2)));
  const frames: Frame<ConvStep>[] = [
    { state: { x, h, n: -1, y: [...y], window: [], products: [] }, line: 3, message: `Pad the signal with a zero at each end, so the window has something to cover there.`, stats: { outputs: 0 } },
  ];
  x.forEach((_, n) => {
    const window = xp.slice(n, n + 3);
    const products = window.map((w, i) => w * h[i]);
    frames.push({ state: { x, h, n, y: [...y], window, products }, line: 5, message: `Window over positions ${n} to ${n + 2} of the padded signal: [${window.join(", ")}].`, stats: { outputs: n } });
    y[n] = products.reduce((s, p) => s + p, 0);
    frames.push({
      state: { x, h, n, y: [...y], window, products },
      line: 6,
      message: `${window.map((w, i) => `${f(h[i])}·${w}`).join(" + ")} = ${f(y[n] as number)}.`,
      stats: { outputs: n + 1 },
    });
  });
  frames.push({ state: { x, h, n: x.length, y: [...y], window: [], products: [] }, line: 8, message: `Done: [${y.map((v) => f(v as number)).join(", ")}], one output per window position.`, stats: { outputs: x.length } });
  return frames;
}
