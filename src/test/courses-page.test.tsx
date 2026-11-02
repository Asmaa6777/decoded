import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Courses from "@/pages/Courses";

vi.mock("@/hooks/useAccountStatus", async (importActual) => ({
  ...(await importActual<typeof import("@/hooks/useAccountStatus")>()),
  useAccountStatus: () => "signed-in",
  useEnrollments: () => ({ "logic-design": true }),
}));

describe("courses page", () => {
  it("keeps the paths on screen for someone with courses of their own", () => {
    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>,
    );
    expect(screen.getByRole("region", { name: "Your courses" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Suggested paths" })).toBeTruthy();
  });

  it("names prerequisites on the course cards", () => {
    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>,
    );
    const card = screen.getByRole("link", { name: /Microprocessors.*Helps to know first/s });
    expect(within(card).getByText(/Logic Design, Computer Organization/)).toBeTruthy();
  });
});
