import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { flattenLessons, getCourse } from "@/content/registry";
import { handleHint } from "@/lib/profiles";
import People from "@/pages/People";
import ProfileSettings from "@/pages/ProfileSettings";
import PublicProfile from "@/pages/PublicProfile";

vi.mock("@/hooks/useAccountStatus", async (importActual) => ({
  ...(await importActual<typeof import("@/hooks/useAccountStatus")>()),
  useAccountStatus: () => "signed-in",
}));

/** Answers each "METHOD /path" with a status and JSON body. */
function fakeApi(routes: Record<string, [number, unknown?]>) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const { pathname } = new URL(url);
    const [status, body] = routes[`${init?.method ?? "GET"} ${pathname}`] ?? [500];
    return body === undefined ? new Response(null, { status }) : Response.json(body, { status });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function at(path: string, element: JSX.Element, pattern = path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("handle hints", () => {
  it("explain what's wrong as you type, and nothing when it's fine", () => {
    expect(handleHint("ab")).toMatch(/3 characters/);
    expect(handleHint("Sara")).toMatch(/lowercase/);
    expect(handleHint("sara_")).toMatch(/Start and end/);
    expect(handleHint("sara_k")).toBeNull();
  });
});

describe("public profile page", () => {
  it("shows the handle and each known course with its progress", async () => {
    const total = flattenLessons(getCourse("logic-design")!).length;
    fakeApi({
      "GET /profiles/sara_k": [
        200,
        { handle: "sara_k", avatarUrl: null, since: Date.UTC(2026, 9, 1), courses: [{ course: "logic-design", completed: 2 }, { course: "retired-course", completed: 4 }] },
      ],
    });
    at("/u/sara_k", <PublicProfile />, "/u/:handle");
    expect(await screen.findByRole("heading", { name: "@sara_k" })).toBeTruthy();
    expect(screen.getByText(`2/${total} lessons`)).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Report/ })).toBeTruthy();
  });

  it("says so when there's no public profile", async () => {
    fakeApi({ "GET /profiles/nobody": [404, { error: "not_found" }] });
    at("/u/nobody", <PublicProfile />, "/u/:handle");
    expect(await screen.findByText("No public profile here.")).toBeTruthy();
  });
});

describe("people search", () => {
  it("waits for two characters, then lists matching handles", async () => {
    const fetch = fakeApi({ "GET /profiles": [200, { results: [{ handle: "sara_k", avatarUrl: null }] }] });
    at("/people", <People />);
    const box = screen.getByLabelText("Search handles");
    fireEvent.change(box, { target: { value: "s" } });
    fireEvent.change(box, { target: { value: "@Sa" } });
    expect(await screen.findByRole("link", { name: "S @sara_k" })).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toMatch(/\/profiles\?q=sa$/);
  });
});

describe("profile settings", () => {
  it("explains a taken handle, then saves another", async () => {
    let taken = true;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (!init?.method) return Response.json({ profile: null });
        if (taken) {
          taken = false;
          return Response.json({ error: "taken" }, { status: 409 });
        }
        return Response.json({ profile: { handle: "sara_k2", public: true, hidden: false } });
      }),
    );
    at("/profile", <ProfileSettings />);
    const input = await screen.findByLabelText("Handle");
    fireEvent.change(input, { target: { value: "Sara_K" } });
    expect((input as HTMLInputElement).value).toBe("sara_k");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Someone already has that handle.")).toBeTruthy();

    fireEvent.change(input, { target: { value: "sara_k2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved.")).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("link", { name: "View your public page" }).getAttribute("href")).toBe("/u/sara_k2"));
  });
});
