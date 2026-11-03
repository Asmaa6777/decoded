import { describe, expect, it } from "vitest";
import {
  aspectRatio, bitmapToBits, blend, bresenhamFrames, colorsFor, ddaFrames, ddaRounded, lcdTransmission, lcdTwist, slopeKind, from565, HOUSE, HOUSE_LINES, imageSize, lastPlotted, lineCoverage, naiveFrames,
  pixelsFor, ppiFromDiagonal, printInches, quantize, rasterDisc, rasterize, rgbTo565, roundHalfUp, screenInches, wrap, type Pt,
} from "@/lib/graphics";

const ys = (pts: Pt[]) => pts.map((p) => p[1]);
const xs = (pts: Pt[]) => pts.map((p) => p[0]);

describe("colour depth", () => {
  it("counts colours as 2 to the number of bits", () => {
    expect([1, 2, 4, 8, 16, 24].map(colorsFor)).toEqual([2, 4, 16, 256, 65_536, 16_777_216]);
    expect(colorsFor(32)).toBe(4_294_967_296);
    expect(colorsFor(48)).toBe(281_474_976_710_656);
  });
  it("quantizes to the levels a bit depth can store", () => {
    expect(quantize(100, 1)).toBe(0);
    expect(quantize(200, 1)).toBe(255);
    expect(quantize(100, 2)).toBe(85);
    expect(quantize(67, 8)).toBe(67);
    expect((67).toString(2).padStart(8, "0")).toBe("01000011");
  });
  it("packs 5-6-5 high colour and gets close to the original back", () => {
    const { r5, g6, b5, packed } = rgbTo565(255, 128, 64);
    expect([r5, g6, b5]).toEqual([31, 32, 8]);
    expect(packed).toBe(0b11111_100000_01000);
    expect(from565(packed)).toEqual([255, 130, 66]);
    expect(2 ** 5 * 2 ** 6 * 2 ** 5).toBe(65_536);
  });
  it("blends with alpha", () => {
    expect(blend([255, 0, 0], [0, 0, 255], 255)).toEqual([255, 0, 0]);
    expect(blend([255, 0, 0], [0, 0, 255], 0)).toEqual([0, 0, 255]);
    expect(blend([255, 255, 255], [0, 0, 0], 128)).toEqual([128, 128, 128]);
  });
});

describe("image size, matching the worked examples", () => {
  it("640 × 480 at 1, 8, 24 and 32 bits", () => {
    expect(imageSize(640, 480, 1).kb).toBe(37.5);
    expect(imageSize(640, 480, 8).kb).toBe(300);
    expect(imageSize(640, 480, 24).kb).toBe(900);
    expect(imageSize(640, 480, 32).kb).toBe(1200);
  });
  it("1200 × 800 and 4700 × 3133 true colour", () => {
    const a = imageSize(1200, 800, 24);
    expect(a.pixels).toBe(960_000);
    expect(a.bytes).toBe(2_880_000);
    expect(a.kb).toBe(2812.5);
    expect(a.mb).toBeCloseTo(2.7466, 4);
    const b = imageSize(4700, 3133, 24);
    expect(b.pixels).toBe(14_725_100);
    expect(b.bytes).toBe(44_175_300);
    // the notes truncate to 42.12; it rounds to 42.13
    expect(b.mb.toFixed(2)).toBe("42.13");
  });
  it("counts megapixels", () => {
    expect(2048 * 1536).toBe(3_145_728);
  });
});

describe("resolution", () => {
  it("converts pixels to printed inches and back", () => {
    expect(printInches(1200, 72).toFixed(3)).toBe("16.667");
    expect(printInches(800, 72).toFixed(3)).toBe("11.111");
    expect(printInches(1200, 300)).toBe(4);
    expect(printInches(800, 300).toFixed(3)).toBe("2.667");
    expect(pixelsFor(4, 240)).toBe(960);
    expect(pixelsFor(6, 240)).toBe(1440);
  });
  it("finds aspect ratios and pixel density", () => {
    expect(aspectRatio(1920, 1080)).toEqual([16, 9]);
    expect(aspectRatio(640, 480)).toEqual([4, 3]);
    expect(1920 * 1080).toBe(2_073_600);
    expect(ppiFromDiagonal(640, 480, 15).toFixed(1)).toBe("53.3");
    expect(screenInches(640, 480, 15)).toEqual([12, 9]);
    expect(Math.round(ppiFromDiagonal(1920, 1080, 24))).toBe(92);
  });
});

describe("bitmaps", () => {
  it("wraps a flat list into rows", () => {
    const bits = bitmapToBits(HOUSE);
    expect(bits.length).toBe(144);
    expect(wrap(bits, 12).map((r) => r.map((b) => (b ? "#" : ".")).join(""))).toEqual(HOUSE);
    expect(wrap(bits, 11)[0].length).toBe(11);
  });
  it("rasterizes a symmetric disc", () => {
    const d = rasterDisc(8);
    expect(d[0]).toEqual(d[7]);
    expect(d[3][3]).toBe(true);
    expect(d[0][0]).toBe(false);
  });
  it("draws a display file into a frame buffer", () => {
    const fb = rasterize(HOUSE_LINES, 16, 15);
    expect(fb[13][2]).toBe(1);
    expect(fb[1][7]).toBe(1);
    expect(fb[0][0]).toBe(0);
  });
});

describe("antialiasing coverage", () => {
  it("is all-or-nothing with one sample and fractional with many", () => {
    const one = lineCoverage([0, 0.5], [10, 4.5], 1, 10, 5, 1).flat();
    expect(one.every((v) => v === 0 || v === 1)).toBe(true);
    const many = lineCoverage([0, 0.5], [10, 4.5], 1, 10, 5, 4).flat();
    expect(many.some((v) => v > 0 && v < 1)).toBe(true);
  });
  it("splits a line on a pixel boundary across two rows", () => {
    const cov = lineCoverage([0, 2], [8, 2], 1, 8, 4, 4);
    expect(cov[1][4]).toBe(0.5);
    expect(cov[2][4]).toBe(0.5);
    const centred = lineCoverage([0, 2.5], [8, 2.5], 1, 8, 4, 4);
    expect(centred[2][4]).toBe(1);
  });
});

describe("naive slope-intercept line", () => {
  it("draws P1(5,10) to P2(11,14) keeping c = 6.667", () => {
    const pts = lastPlotted(naiveFrames([5, 10], [11, 14]));
    expect(xs(pts)).toEqual([5, 6, 7, 8, 9, 10, 11]);
    expect(ys(pts)).toEqual([10, 11, 11, 12, 13, 13, 14]);
  });
  it("shows the cost of rounding c to 7, as the notes did", () => {
    const shifted = [5, 6, 7, 8, 9, 10, 11].map((x) => roundHalfUp(0.666 * x + 7));
    expect(shifted).toEqual([10, 11, 12, 12, 13, 14, 14]);
  });
  it("leaves gaps on a steep line and refuses a vertical one", () => {
    const pts = lastPlotted(naiveFrames([2, 1], [4, 9]));
    expect(pts.length).toBe(3);
    const frames = naiveFrames([3, 1], [3, 6]);
    expect(lastPlotted(frames)).toEqual([]);
  });
  it("swaps endpoints given right to left", () => {
    expect(lastPlotted(naiveFrames([11, 14], [5, 10]))).toEqual(lastPlotted(naiveFrames([5, 10], [11, 14])));
  });
});

describe("DDA, the five practice problems", () => {
  it("problem 1: (5,4) to (12,7), with m = 3/7 kept exact", () => {
    const pts = lastPlotted(ddaFrames([5, 4], [12, 7]));
    expect(xs(pts)).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    // the notes used m = 0.4 and plotted y = 6 at x = 11; with 3/7 it is 6.57 → 7
    expect(ys(pts)).toEqual([4, 4, 5, 5, 6, 6, 7, 7]);
  });
  it("problem 2: (5,7) to (10,15), with 1/m = 0.625 kept exact", () => {
    const pts = lastPlotted(ddaFrames([5, 7], [10, 15]));
    expect(ys(pts)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15]);
    // the notes used 0.6 and plotted x = 7 at y = 11; the exact x there is 7.5 → 8
    expect(xs(pts)).toEqual([5, 6, 6, 7, 8, 8, 9, 9, 10]);
  });
  it("problems 3 and 4: 45° lines in both directions", () => {
    expect(lastPlotted(ddaFrames([3, 5], [8, 10]))).toEqual([[3, 5], [4, 6], [5, 7], [6, 8], [7, 9], [8, 10]]);
    expect(lastPlotted(ddaFrames([8, 10], [3, 5]))).toEqual([[8, 10], [7, 9], [6, 8], [5, 7], [4, 6], [3, 5]]);
  });
  it("problem 5: a horizontal line", () => {
    expect(ys(lastPlotted(ddaFrames([2, 2], [9, 2])))).toEqual(Array(8).fill(2));
  });
  it("the naive example from the notes, (2,2) to (8,5)", () => {
    const frames = ddaFrames([2, 2], [8, 5]);
    expect(frames[frames.length - 1].state.rows.map((r) => r.y)).toEqual([2, 2.5, 3, 3.5, 4, 4.5, 5]);
    expect(ys(lastPlotted(frames))).toEqual([2, 3, 3, 4, 4, 5, 5]);
  });
  it("the homework line from the notes, (3,1) to (9,6)", () => {
    expect(lastPlotted(ddaFrames([3, 1], [9, 6]))).toEqual([[3, 1], [4, 2], [5, 3], [6, 4], [7, 4], [8, 5], [9, 6]]);
  });
  it("a single point", () => {
    expect(lastPlotted(ddaFrames([4, 4], [4, 4]))).toEqual([[4, 4]]);
  });
});

describe("Bresenham", () => {
  it("matches the standard textbook example (20,10) to (30,18)", () => {
    const frames = bresenhamFrames([20, 10], [30, 18]);
    const rows = frames[frames.length - 1].state.rows;
    expect(rows.map((r) => r.plot)).toEqual([
      [20, 10], [21, 11], [22, 12], [23, 12], [24, 13], [25, 14], [26, 15], [27, 16], [28, 16], [29, 17], [30, 18],
    ]);
    expect(rows.map((r) => r.p)).toEqual([6, 2, -2, 14, 10, 6, 2, -2, 14, 10, 6]);
  });
  it("agrees with exact DDA on (5,4) to (12,7)", () => {
    expect(lastPlotted(bresenhamFrames([5, 4], [12, 7]))).toEqual(lastPlotted(ddaFrames([5, 4], [12, 7])));
  });
  it("handles steep lines and every direction without gaps", () => {
    for (const [a, b] of [[[0, 0], [3, 9]], [[9, 9], [0, 2]], [[0, 9], [9, 0]], [[5, 5], [5, 0]], [[0, 3], [8, 3]]] as [Pt, Pt][]) {
      const pts = lastPlotted(bresenhamFrames(a, b));
      expect(pts[0]).toEqual(a);
      expect(pts[pts.length - 1]).toEqual(b);
      for (let i = 1; i < pts.length; i++) {
        expect(Math.max(Math.abs(pts[i][0] - pts[i - 1][0]), Math.abs(pts[i][1] - pts[i - 1][1]))).toBe(1);
      }
    }
  });
});

describe("second-round helpers", () => {
  it("shows Bresenham's two choices and the midpoint at each decision", () => {
    const frames = bresenhamFrames([20, 10], [30, 18]);
    const first = frames.find((f) => f.state.candidates)!.state;
    expect(first.candidates).toEqual([[21, 10], [21, 11]]);
    expect(first.midpoint).toEqual([21, 10.5]);
    const decided = frames.find((f) => f.state.chosen !== undefined)!.state;
    expect(decided.chosen).toBe(1);
    const steep = bresenhamFrames([0, 0], [2, 6]).find((f) => f.state.candidates)!.state;
    expect(steep.candidates).toEqual([[0, 1], [1, 1]]);
  });
  it("reproduces the notes' rounded-slope DDA and its wrong pixel", () => {
    const r = ddaRounded([5, 4], [12, 7], 1);
    expect(r.exact.map((v) => Number(v.toFixed(1)))).toEqual([4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8]);
    expect(r.plot[6]).toEqual([11, 6]);
    expect(lastPlotted(ddaFrames([5, 4], [12, 7]))[6]).toEqual([11, 7]);
    expect(ddaRounded([5, 7], [10, 15], 1).plot[4]).toEqual([7, 11]);
  });
  it("classifies slopes", () => {
    expect(slopeKind([0, 0], [5, 2])).toBe("gentle");
    expect(slopeKind([0, 0], [3, 3])).toBe("diagonal");
    expect(slopeKind([0, 0], [2, 7])).toBe("steep");
    expect(slopeKind([0, 4], [6, 4])).toBe("horizontal");
    expect(slopeKind([3, 0], [3, 5])).toBe("vertical");
  });
  it("passes light with no voltage and blocks it at full voltage", () => {
    expect(lcdTransmission(0)).toBeCloseTo(1);
    expect(lcdTransmission(1)).toBeCloseTo(0);
    expect(lcdTransmission(0.5)).toBeCloseTo(0.5);
    expect(lcdTwist(0.25)).toBe(67.5);
  });
});

describe("truncating instead of rounding, as the notes' C++ table does", () => {
  it("matches the notes' pixels for P1(5,10) to P2(11,14)", () => {
    const m = 2 / 3;
    const c = 10 - m * 5;
    const truncated = [5, 6, 7, 8, 9, 10, 11].map((x) => Math.trunc(Number((m * x + c).toFixed(9))));
    expect(truncated).toEqual([10, 10, 11, 12, 12, 13, 14]);
    expect([5, 6, 7, 8, 9, 10, 11].map((x) => Math.trunc(0.666 * x + 7))).toEqual(truncated);
  });
});
