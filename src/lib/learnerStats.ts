/* How many people take each course, from the Worker's /stats routes. The
   Worker leaves out any count under 10, so a missing number means "too few
   to show" and the UI shows nothing in its place. Requests are made once per
   page load and shared by every component that asks. */

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/progressSync";
import { flattenLessons, getCourse } from "@/content/registry";

export type CourseStats = {
  registered?: number;
  finished?: number;
  /** lesson slug -> people who completed it in the last 7 days */
  completedThisWeek: Record<string, number>;
  /** quiz lesson slug -> average best score, in percent */
  quizAverages: Record<string, number>;
};

// main.tsx turns this on, so tests and previews never call the API.
let enabled = false;
let all: Promise<Record<string, number> | null> | null = null;
const perCourse = new Map<string, Promise<CourseStats | null>>();

export function enableLearnerStats() {
  enabled = true;
}

/** Test hook: start from nothing, optionally with the API switched on. */
export function resetLearnerStatsForTests(on = false) {
  enabled = on;
  all = null;
  perCourse.clear();
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`);
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

function loadAll() {
  all ??= getJson<{ registered: Record<string, number> }>("/stats").then((body) => body?.registered ?? null);
  return all;
}

function loadCourse(course: string, lessons: number) {
  const key = `${course}?lessons=${lessons}`;
  if (!perCourse.has(key)) perCourse.set(key, getJson<CourseStats>(`/stats/${course}?lessons=${lessons}`));
  return perCourse.get(key)!;
}

function useLoaded<T>(load: (() => Promise<T | null>) | null, deps: unknown[]): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    if (!enabled || !load) return;
    let live = true;
    load().then((v) => live && setValue(v));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}

/** How many people take the course, or undefined when there are too few to show. */
export function useLearnerCount(course: string): number | undefined {
  return useLoaded(loadAll, [])?.[course];
}

/** The course's numbers, or null until loaded (and for good if the API can't be reached). */
export function useCourseStats(course: string): CourseStats | null {
  const found = getCourse(course);
  const lessons = found ? flattenLessons(found).length : 0;
  return useLoaded(lessons > 0 ? () => loadCourse(course, lessons) : null, [course, lessons]);
}
