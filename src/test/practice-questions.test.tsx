import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ModelAnswer, Quiz } from "@/components/mdx/MdxComponents";
import { readQuizScores } from "@/lib/progressStore";

const question = {
  id: "q1",
  prompt: "2 + 2?",
  options: [
    { id: "a", text: "3" },
    { id: "b", text: "4" },
  ],
  correctOptionId: "b",
  explanation: "Count them.",
};

describe("practice questions in lessons", () => {
  beforeEach(() => localStorage.clear());

  it("hides a model answer until the button is pressed", () => {
    render(<ModelAnswer>The answer is 42.</ModelAnswer>);
    expect(screen.queryByText("The answer is 42.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show model answer" }));
    expect(screen.getByText("The answer is 42.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hide model answer" }));
    expect(screen.queryByText("The answer is 42.")).toBeNull();
  });

  it("a practice quiz saves no score and doesn't complete the lesson", () => {
    render(<Quiz courseSlug="advanced-algorithms" lessonSlug="asymptotic-notation" practice questions={[question]} />);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(screen.getByText("1/1 correct")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(readQuizScores()).toEqual({});
    expect(localStorage.getItem("decoded:progress:v1") ?? "").not.toContain("asymptotic-notation");
  });

  it("a normal quiz still saves its score", () => {
    render(<Quiz courseSlug="advanced-algorithms" lessonSlug="some-quiz" questions={[question]} />);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(readQuizScores()["advanced-algorithms/some-quiz"]).toEqual({ best: 1, total: 1 });
  });
});
