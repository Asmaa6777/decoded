import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AutomatonDiagram } from "@/components/mdx/MdxComponents";

describe("AutomatonDiagram", () => {
  it("renders the 3-state lesson example without throwing", () => {
    render(
      <AutomatonDiagram
        states={["q0", "q1", "q2"]}
        alphabet={["a", "b"]}
        transitions={[
          { from: "q0", to: "q1", label: "a" },
          { from: "q0", to: "q0", label: "b" },
          { from: "q1", to: "q1", label: "a" },
          { from: "q1", to: "q2", label: "b" },
          { from: "q2", to: "q1", label: "a" },
          { from: "q2", to: "q0", label: "b" },
        ]}
        initial="q0"
        accepting={["q2"]}
      />
    );
    expect(screen.getByText("READY")).toBeDefined();
  });

  it("correctly simulates NFA execution for strings ending in ab", () => {
    render(
      <AutomatonDiagram
        states={["q0", "q1", "q2"]}
        alphabet={["a", "b"]}
        transitions={[
          { from: "q0", to: "q0", label: "a" },
          { from: "q0", to: "q0", label: "b" },
          { from: "q0", to: "q1", label: "a" },
          { from: "q1", to: "q2", label: "b" },
        ]}
        initial="q0"
        accepting={["q2"]}
      />
    );

    const input = screen.getByPlaceholderText("Type a string over {a, b}");
    const stepButton = screen.getByRole("button", { name: /Step/i });

    // Test "aab"
    fireEvent.change(input, { target: { value: "aab" } });
    expect(screen.getAllByText("q0").length).toBeGreaterThan(0);

    // Step 1: 'a' -> active states: {q0, q1}
    fireEvent.click(stepButton);
    expect(screen.getByText("{q0, q1}")).toBeDefined();
    expect(screen.getByText("READING")).toBeDefined();

    // Step 2: 'a' -> active states: {q0, q1}
    fireEvent.click(stepButton);
    expect(screen.getByText("{q0, q1}")).toBeDefined();

    // Step 3: 'b' -> active states: {q0, q2} -> ACCEPTED!
    fireEvent.click(stepButton);
    expect(screen.getByText("{q0, q2}")).toBeDefined();
    expect(screen.getByText("ACCEPTED")).toBeDefined();

    // Test "ba" -> REJECTED
    fireEvent.change(input, { target: { value: "ba" } });
    fireEvent.click(stepButton); // 'b' -> {q0}
    fireEvent.click(stepButton); // 'a' -> {q0, q1} -> REJECTED
    expect(screen.getByText("REJECTED")).toBeDefined();
  });
});
