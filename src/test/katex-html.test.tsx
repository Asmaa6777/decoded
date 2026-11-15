import { describe, expect, it } from "vitest";
import { getLesson } from "@/content/registry";
import { renderLesson } from "./renderLesson";

// rehypeKatexHtml compiles each formula to one span holding KaTeX's HTML.
// The page should still get KaTeX's full markup, MathML included.
describe("formulas compiled as HTML strings", () => {
  it("renders KaTeX markup with MathML and keeps heading ids", async () => {
    const lesson = getLesson("algorithm-design-and-analysis", "merge-sort")!.lesson;
    const { container } = await renderLesson(lesson);

    const formulas = container.querySelectorAll(".katex");
    expect(formulas.length).toBeGreaterThan(0);
    for (const f of formulas) {
      expect(f.querySelector(".katex-mathml math")).toBeTruthy();
      expect(f.querySelector(".katex-html")).toBeTruthy();
    }

    // "## Analysis: where $n \log n$ comes from": the id comes from the formula's text
    const heading = container.querySelector("h2#analysis-where-n-log-n-comes-from");
    expect(heading?.querySelector(".katex")).toBeTruthy();
  });
});
