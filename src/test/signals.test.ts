import { describe, expect, it } from "vitest";
import {
  apparentFrequency, convFrames, convFull, convSame, errorNorm, gaussian, gaussianHistogram, gaussianPdf, movingAverage, movingAverageKernel, playgroundClean, snr, std, sumSquares, tradeoffDecomposition, voiceLike,
} from "@/lib/signals";

const round = (v: number[], d = 4) => v.map((a) => Number(a.toFixed(d)));

describe("convolution", () => {
  it("full convolution is polynomial multiplication", () => {
    expect(convFull([1, 2], [1, 3])).toEqual([1, 5, 6]);
    expect(convFull([1, 2, 3], [4, 5, 6])).toEqual([4, 13, 28, 27, 18]);
  });
  it("'same' matches MATLAB on the five-sample example", () => {
    expect(round(convSame([3, 1, 3, 1, 3], movingAverageKernel(3)))).toEqual([1.3333, 2.3333, 1.6667, 2.3333, 1.3333]);
    expect(round(movingAverage([0, 0, 6, 0, 0], 3))).toEqual([0, 2, 2, 2, 0]);
  });
  it("'same' with an even kernel takes MATLAB's central part", () => {
    // conv([1 2 3 4], [1 1], 'same') in MATLAB is [3 5 7 4]
    expect(convSame([1, 2, 3, 4], [1, 1])).toEqual([3, 5, 7, 4]);
  });
  it("the stepper ends on conv(x, h, 'same')", () => {
    const frames = convFrames([3, 1, 3, 1, 3], [1 / 3, 1 / 3, 1 / 3]);
    expect(round(frames[frames.length - 1].state.y as number[])).toEqual(round(convSame([3, 1, 3, 1, 3], movingAverageKernel(3))));
    expect(round(convFrames([3, 1, 3, 1, 3], [0.25, 0.5, 0.25]).at(-1)!.state.y as number[])).toEqual([1.75, 2, 2, 2, 1.75]);
    expect(convFrames([3, 1, 3, 1, 3], [0, 1, 0]).at(-1)!.state.y).toEqual([3, 1, 3, 1, 3]);
  });
});

describe("measuring the result, the worked example", () => {
  const x = [2, 2, 2, 2, 2];
  const y = [3, 1, 3, 1, 3];
  const xHat = movingAverage(y, 3);
  it("before filtering", () => {
    expect(sumSquares(x)).toBe(20);
    expect(errorNorm(x, y) ** 2).toBeCloseTo(5);
    expect(errorNorm(x, y).toFixed(2)).toBe("2.24");
    expect(snr(x, y).toFixed(1)).toBe("6.0");
  });
  it("after a 3-sample moving average", () => {
    expect((errorNorm(x, xHat) ** 2).toFixed(2)).toBe("1.22");
    expect(errorNorm(x, xHat).toFixed(2)).toBe("1.11");
    expect(snr(x, xHat).toFixed(1)).toBe("12.1");
  });
  it("the course-grade weighted sum", () => {
    expect(0.5 * 80 + 0.3 * 90 + 0.2 * 70).toBe(81);
  });
});

describe("noise", () => {
  it("is repeatable from a seed and close to standard normal", () => {
    const a = gaussian(20000, 42);
    expect(gaussian(5, 42)).toEqual(a.slice(0, 5));
    expect(std(a)).toBeGreaterThan(0.97);
    expect(std(a)).toBeLessThan(1.03);
  });
  it("averaging M samples shrinks it by about √M", () => {
    const e = gaussian(20000, 7);
    const ratio = std(e) / std(movingAverage(e, 9).slice(10, -10));
    expect(ratio).toBeGreaterThan(2.8);
    expect(ratio).toBeLessThan(3.2);
  });
  it("computes theoretical Gaussian PDF and histogram matching bell curve", () => {
    const sigma = 0.2;
    // PDF at 0 should be 1 / (sigma * sqrt(2pi)) ≈ 1.9947
    expect(gaussianPdf(0, sigma)).toBeCloseTo(1 / (sigma * Math.sqrt(2 * Math.PI)), 4);
    expect(gaussianPdf(sigma, sigma)).toBeCloseTo(gaussianPdf(0, sigma) * Math.exp(-0.5), 4);
    expect(gaussianPdf(-sigma, sigma)).toBe(gaussianPdf(sigma, sigma));

    const samples = gaussian(5000, 42).map((v) => v * sigma);
    const bins = gaussianHistogram(samples, sigma, 21, 3);
    expect(bins).toHaveLength(21);
    const midBin = bins[10]; // centre bin around 0
    expect(midBin.density).toBeGreaterThan(1.5);
    expect(midBin.theoretical).toBeCloseTo(gaussianPdf(0, sigma), 1);
  });
});

describe("sampling", () => {
  it("folds fast waves into slow false ones", () => {
    expect(apparentFrequency(2, 16)).toBe(2);
    expect(apparentFrequency(5, 7)).toBe(2);
    expect(apparentFrequency(7, 7)).toBe(0);
  });
  it("gives the 44,100 numbers from the page", () => {
    expect((1 / 44100) * 1e6).toBeCloseTo(22.68, 2);
    expect(3 * 44100).toBe(132300);
  });
});

describe("the trade-off", () => {
  it("SNR rises with M, peaks, then falls as the spike and burst blur", () => {
    const clean = playgroundClean();
    const e = gaussian(clean.length, 42);
    const y = clean.map((v, i) => v + 0.2 * e[i]);
    const curve = Array.from({ length: 61 }, (_, i) => snr(clean, movingAverage(y, i + 1)));
    const best = curve.indexOf(Math.max(...curve)) + 1;
    expect(best).toBeGreaterThan(1);
    expect(best).toBeLessThan(61);
    expect(curve[best - 1]).toBeGreaterThan(curve[0]);
    expect(curve[60]).toBeLessThan(curve[best - 1]);
  });
  it("decomposes error into growing blur and decaying noise", () => {
    const clean = playgroundClean();
    const e = gaussian(clean.length, 42);
    const noise = e.map((v) => 0.2 * v);
    const decomp = tradeoffDecomposition(clean, noise, 61);
    expect(decomp).toHaveLength(61);

    // M=1: zero blur, full noise
    expect(decomp[0].blurError).toBeCloseTo(0, 4);
    expect(decomp[0].noiseError).toBeGreaterThan(decomp[10].noiseError);

    // blur error grows monotonically
    expect(decomp[10].blurError).toBeGreaterThan(decomp[0].blurError);
    expect(decomp[30].blurError).toBeGreaterThan(decomp[10].blurError);

    // noise error shrinks monotonically
    expect(decomp[0].noiseError).toBeGreaterThan(decomp[10].noiseError);
    expect(decomp[10].noiseError).toBeGreaterThan(decomp[30].noiseError);

    // optimal M minimizes total error
    const minErrM = decomp.slice().sort((a, b) => a.totalError - b.totalError)[0].m;
    const maxSnrM = decomp.slice().sort((a, b) => b.snrDb - a.snrDb)[0].m;
    expect(minErrM).toBe(maxSnrM);
  });
  it("builds a voice-like sound with peak 1", () => {
    const v = voiceLike(8000, 0.5);
    expect(v.length).toBe(4000);
    expect(Math.max(...v.map(Math.abs))).toBeCloseTo(1);
  });
});
