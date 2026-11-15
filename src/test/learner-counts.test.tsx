import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import CourseCard from "@/components/CourseCard";
import { CourseLearners, LessonLearners, QuizAverage } from "@/components/LearnerCounts";
import { resetLearnerStatsForTests } from "@/lib/learnerStats";

function fakeApi(routes: Record<string, unknown>) {
  const fetch = vi.fn(async (url: string) => {
    const path = new URL(url).pathname;
    return path in routes ? Response.json(routes[path]) : new Response(null, { status: 500 });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetLearnerStatsForTests();
});

describe("learner counts", () => {
  it("show what the API reports on the course, lesson and quiz", async () => {
    resetLearnerStatsForTests(true);
    const fetch = fakeApi({
      "/stats/logic-design": { registered: 48, finished: 12, completedThisWeek: { signals: 31 }, quizAverages: { "numbers-quiz": 72 } },
    });
    render(
      <>
        <CourseLearners course="logic-design" />
        <LessonLearners course="logic-design" lesson="signals" />
        <QuizAverage course="logic-design" lesson="numbers-quiz" />
      </>,
    );
    expect(await screen.findByText("48 people taking it · 12 finished")).toBeTruthy();
    expect(screen.getByText("31 finished this week")).toBeTruthy();
    expect(screen.getByText("Readers average 72% on this quiz.")).toBeTruthy();
    // one request shared by all three, sending the course's lesson count
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toMatch(/\/stats\/logic-design\?lessons=\d+$/);
  });

  it("show nothing for a count the API left out", async () => {
    resetLearnerStatsForTests(true);
    const fetch = fakeApi({ "/stats/logic-design": { completedThisWeek: {}, quizAverages: {} } });
    const { container } = render(
      <>
        <CourseLearners course="logic-design" />
        <LessonLearners course="logic-design" lesson="signals" />
      </>,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("show nothing when the API can't be reached", async () => {
    resetLearnerStatsForTests(true);
    const fetch = fakeApi({});
    const { container } = render(<CourseLearners course="logic-design" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("add the learner count to a course card", async () => {
    resetLearnerStatsForTests(true);
    fakeApi({ "/stats": { registered: { "logic-design": 48 } } });
    render(
      <MemoryRouter>
        <CourseCard slug="logic-design" />
        <CourseCard slug="microprocessors" />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/lessons · 48 learners/)).toBeTruthy();
    expect(screen.getAllByText(/learners/)).toHaveLength(1);
  });

  it("make no request until the app switches them on", () => {
    const fetch = fakeApi({});
    render(<CourseLearners course="logic-design" />);
    expect(fetch).not.toHaveBeenCalled();
  });
});
