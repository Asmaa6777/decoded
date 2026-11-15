import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Diagram } from "@/components/mdx/Diagram";

describe("Diagram", () => {
  it("renders the spec example pipeline without throwing", () => {
    const { container } = render(
      <Diagram
        nodes={[
          { id: "string", label: "String", type: "source" },
          { id: "fa", label: "Finite Automaton" },
          { id: "output", label: "Accept or Reject", type: "sink" },
        ]}
        edges={[
          { from: "string", to: "fa", label: "Input Tape" },
          { from: "fa", to: "output", label: "Output" },
        ]}
        direction="LR"
      />
    );
    expect(container.querySelector(".react-flow")).toBeTruthy();
  });
});
