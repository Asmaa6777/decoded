import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TrackPicker } from "@/components/TrackPicker";
import { courses } from "@/content/registry";

function renderPicker() {
  render(
    <MemoryRouter>
      <TrackPicker />
    </MemoryRouter>,
  );
}

describe("track picker", () => {
  it("lists the beginner path in order", () => {
    renderPicker();
    const steps = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(steps[0]).toMatch(/^01.*Computer Literacy/);
    expect(steps[3]).toMatch(/^04.*Algorithm Design & Analysis/);
  });

  it("shows every course, then only the chosen subject", () => {
    renderPicker();
    const cards = () => screen.getAllByRole("heading", { level: 3 }).filter((h) => courses.some((c) => c.title === h.textContent));
    expect(cards()).toHaveLength(courses.length);

    fireEvent.click(screen.getByRole("button", { name: /The machine/ }));
    expect(screen.getByRole("button", { name: /The machine/ }).getAttribute("aria-pressed")).toBe("true");
    expect(cards().map((h) => h.textContent)).toEqual([
      "Computer Organization",
      "Logic Design",
      "Microprocessors",
      "Computer Architecture",
    ]);
  });
});
