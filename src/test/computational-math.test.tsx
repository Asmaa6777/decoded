import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { render } from "@testing-library/react";
import { getCourse, flattenLessons } from "@/content/registry";
import { diagOf, kron, kronFrames, MAGIC4, norm1, normFrames, normFro, normInf, trace, tril, triu, add, apply2, det2, dot, identity, matMulFrames, mul, elementwiseFrames, MAGIC3, pascal, sub, transpose, vectorProductFrames } from "@/lib/matrix";

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Computational Mathematics course", () => {
  const course = getCourse("computational-mathematics")!;

  for (const lesson of flattenLessons(course)) {
    it(`renders lesson "${lesson.slug}" with its title`, () => {
      const Lesson = lesson.Component;
      const { container, unmount } = render(<Lesson />);
      expect(container.querySelector("h1")?.textContent).toBe(lesson.title);
      unmount();
    });
  }

  it("registers every lesson file and names no source institution or teacher", () => {
    const dir = path.resolve(__dirname, "../content/computational-mathematics");
    const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    expect(files.length).toBe(flattenLessons(course).length);
    const all = files.map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n").toLowerCase();
    for (const banned of ["lecturer", "lecture ", "instructor", "professor", "faculty of", "university of", "department of", "homework"]) {
      expect(all).not.toContain(banned);
    }
  });
});

describe("matrix arithmetic", () => {
  const A = pascal(3);
  it("builds pascal(3) and recovers B after adding and subtracting A", () => {
    expect(A).toEqual([[1, 1, 1], [1, 2, 3], [1, 3, 6]]);
    expect(add(A, MAGIC3)).toEqual([[9, 2, 7], [4, 7, 10], [5, 12, 8]]);
    expect(sub(add(A, MAGIC3), A)).toEqual(MAGIC3);
  });

  it("transposes, and pascal is symmetric while magic is not", () => {
    expect(transpose(A)).toEqual(A);
    expect(transpose(MAGIC3)).toEqual([[8, 3, 4], [1, 5, 9], [6, 7, 2]]);
    expect(transpose([[1, 2, 3], [4, 5, 6]])).toEqual([[1, 4], [2, 5], [3, 6]]);
  });

  it("gets the dot product example right", () => {
    expect(dot([1, -2, 3, 4], [2, 3, -2, 1])).toBe(-6);
  });

  it("finishes each elementwise animation on the true result", () => {
    const last = elementwiseFrames("add", A, MAGIC3, -2).at(-1)!.state.c;
    expect(last).toEqual(add(A, MAGIC3));
    expect(elementwiseFrames("scalar", A, MAGIC3, -2).at(-1)!.state.c[2][2]).toBe(-12);
  });

  it("builds inner and outer vector products", () => {
    expect(vectorProductFrames("inner", [3, 1, 4], [2, 0, -1]).at(-1)!.state.terms.reduce((a, b) => a + b, 0)).toBe(2);
    expect(vectorProductFrames("outer", [3, 1, 4], [2, 0, -1]).at(-1)!.state.outer).toEqual([[6, 0, -3], [2, 0, -1], [8, 0, -4]]);
  });
});

describe("matrix multiplication and linear maps", () => {
  const A = pascal(3);
  it("matches the worked products and is not commutative", () => {
    expect(mul(A, MAGIC3)).toEqual([[15, 15, 15], [26, 38, 26], [41, 70, 39]]);
    expect(mul(MAGIC3, A)).toEqual([[15, 28, 47], [15, 34, 60], [15, 28, 43]]);
    expect(mul(A, identity(3))).toEqual(A);
    expect(() => mul(A, [[1, 2]])).toThrow();
  });

  it("ends the animation on the product, counting n^3 multiplications", () => {
    const last = matMulFrames(A, MAGIC3).at(-1)!;
    expect(last.state.c).toEqual(mul(A, MAGIC3));
    expect(last.stats.multiplications).toBe(27);
  });

  it("applies 2-by-2 maps and reads their determinant", () => {
    expect(apply2([0, -1, 1, 0], 1, 0)).toEqual([0, 1]);
    expect(det2([1, 1, 0, 1])).toBe(1);
    expect(det2([-1, 0, 0, 1])).toBe(-1);
    expect(det2([1, 2, 0.5, 1])).toBe(0);
  });
});

describe("Kronecker products, norms and special matrices", () => {
  const B = [[5, -4, 2], [-1, 2, 3], [-2, 1, 0]];
  it("builds the block matrix", () => {
    expect(kron([[1, -2], [-1, 0]], [[4, -3], [2, 3]])).toEqual([[4, -3, -8, 6], [2, 3, -4, -6], [-4, 3, 0, 0], [-2, -3, 0, 0]]);
    expect(kron([[1, 2], [3, 4]], [[1, 0], [0, 1]])).toEqual([[1, 0, 2, 0], [0, 1, 0, 2], [3, 0, 4, 0], [0, 3, 0, 4]]);
    expect(kronFrames([[1, 2]], [[1]]).at(-1)!.state.done).toBe(2);
  });

  it("computes each norm and trace", () => {
    expect(norm1(B)).toBe(8);
    expect(normInf(B)).toBe(11);
    expect(normFro(B)).toBe(8);
    expect(norm1([[1, -7], [-2, -3]])).toBe(10);
    expect(normInf([[1, -7], [-2, -3]])).toBe(8);
    expect(normFro([[1, -7], [-2, -3]])).toBeCloseTo(7.937, 3);
    expect(trace(MAGIC4)).toBe(34);
    expect(normFrames("one", B).at(-1)!.state.best).toBe(0);
    expect(normFrames("inf", B).at(-1)!.state.best).toBe(0);
  });

  it("keeps the right triangle and diagonals", () => {
    expect(diagOf(MAGIC4)).toEqual([16, 11, 6, 1]);
    expect(triu([[1, 1], [1, 1]])).toEqual([[1, 1], [0, 1]]);
    expect(tril([[1, 1, 1], [1, 1, 1], [1, 1, 1]], -1)).toEqual([[0, 0, 0], [1, 0, 0], [1, 1, 0]]);
  });
});
