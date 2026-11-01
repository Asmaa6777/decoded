import { renderLesson } from "./renderLesson";
import { beforeAll, describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { flattenLessons, getCourse } from "@/content/registry";

const SLUG = "data-structures";
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

describe("Data Structures course", () => {
  const course = getCourse(SLUG)!;

  it("is available and registers every lesson file", () => {
    expect(course.status).toBe("available");
    expect(sources.length).toBe(flattenLessons(course).length);
  });

  it("ends every module with a quiz", () => {
    for (const m of course.modules) expect(m.lessons.at(-1)?.kind, m.title).toBe("quiz");
  });

  for (const lesson of flattenLessons(course)) {
    it(`renders "${lesson.slug}" with its title`, async () => {
      const { container, unmount } = await renderLesson(lesson);
      expect(container.querySelector("h1")?.textContent).toBe(lesson.title);
      unmount();
    });
  }

  it("gives every quiz this course's slug and its own lesson slug", () => {
    for (const lesson of flattenLessons(course).filter((l) => l.kind === "quiz")) {
      const src = sources.find((s) => s.text.includes(`lessonSlug="${lesson.slug}"`));
      expect(src, lesson.slug).toBeTruthy();
      expect(src!.text).toContain(`courseSlug="${SLUG}"`);
    }
  });

  it("shows every code example in Python first, then Java and C++", () => {
    for (const { file, text } of sources) {
      for (const tabs of text.match(/<CodeTabs>[\s\S]*?<\/CodeTabs>/g) ?? []) {
        expect([...tabs.matchAll(/```(\w+)/g)].map((m) => m[1]), file).toEqual(["python", "java", "cpp"]);
      }
    }
  });

  it("links to the courses it builds on", () => {
    const all = sources.map((s) => s.text).join("\n");
    for (const other of ["discrete-mathematics", "algorithm-design-and-analysis", "advanced-algorithms", "computer-organization", "operating-systems"]) {
      expect(all, other).toContain(`/courses/${other}/`);
    }
  });
});
