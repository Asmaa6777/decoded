import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Epigraph } from "@/components/mdx/MdxComponents";
import { extractPreview } from "@/lib/lessonPreview";

describe("Epigraph", () => {
  it("shows the quote, who said it and where", () => {
    const { getByText } = render(<Epigraph quote="Insight, not numbers." by="Richard Hamming" source="A book, 1962" />);
    expect(getByText("Insight, not numbers.").tagName).toBe("BLOCKQUOTE");
    expect(getByText("Richard Hamming")).toBeTruthy();
    expect(getByText("A book, 1962")).toBeTruthy();
  });

  it("is never picked as a lesson's preview paragraph", () => {
    const source = '# Title\n\n<Epigraph quote="Insight, not numbers." by="Richard Hamming" />\n\nA **matrix** is a grid.\n';
    expect(extractPreview(source)?.text).toBe("A **matrix** is a grid.");
  });
});
