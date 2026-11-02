import { renderLesson } from "./renderLesson";
import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { flattenLessons, getCourse } from "@/content/registry";

const SLUG = "computer-graphics";
const dir = path.resolve(__dirname, "../content", SLUG);
const sources = readdirSync(dir)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => ({ file: f, text: readFileSync(path.join(dir, f), "utf8") }));

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("computer graphics course", () => {
  const course = getCourse(SLUG)!;

  it("is available and registers every lesson file", () => {
    expect(course.status).toBe("available");
    expect(sources.length).toBe(flattenLessons(course).length);
  });

  for (const lesson of flattenLessons(course)) {
    it(`renders "${lesson.slug}" with its title`, async () => {
      const { container, unmount } = await renderLesson(lesson);
      expect(container.querySelector("h1")?.textContent).toBe(lesson.title);
      unmount();
    });
  }

  it("names no source institution or teacher", () => {
    const all = sources.map((s) => s.text).join("\n").toLowerCase();
    for (const banned of ["lecturer", "instructor", "professor", "dr.", "faculty of", "university", "department of", "obaid", "lecture "]) {
      expect(all).not.toContain(banned);
    }
  });

  it("keeps the corrected worked examples, not the rounded ones", () => {
    const dda = sources.find((s) => s.file.includes("dda"))!.text;
    expect(dda).toContain("| 6 | 11 | 6.571 | (11, 7) |");
    expect(dda).toContain("| 4 | 7.5 | 11 | (8, 11) |");
    const slope = sources.find((s) => s.file.includes("slope"))!.text;
    expect(slope).toContain("c = y_1 - m x_1 = 10 - \\frac{2}{3} \\times 5 = 10 - 3.333 = 6.667");
  });
});
