import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "decoded:progress:v1";

import type { ProgressMap } from "@/lib/progressBackup";

function read(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function write(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("decoded:progress"));
  } catch {
    /* ignore quota errors */
  }
}

/** Every course's completed lessons, straight from storage (for backups). */
export function readAllProgress(): ProgressMap {
  return read();
}

/** Replace all stored progress and notify every mounted useProgress. */
export function saveAllProgress(map: ProgressMap) {
  write(map);
}

export function useProgress(courseSlug?: string) {
  const [map, setMap] = useState<ProgressMap>(() => read());

  useEffect(() => {
    const handler = () => setMap(read());
    window.addEventListener("decoded:progress", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("decoded:progress", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const completed = courseSlug ? map[courseSlug] ?? [] : [];

  const isComplete = useCallback(
    (lessonSlug: string) => (courseSlug ? (map[courseSlug] ?? []).includes(lessonSlug) : false),
    [map, courseSlug]
  );

  const toggle = useCallback(
    (lessonSlug: string) => {
      if (!courseSlug) return;
      const current = new Set(map[courseSlug] ?? []);
      if (current.has(lessonSlug)) current.delete(lessonSlug);
      else current.add(lessonSlug);
      const next = { ...map, [courseSlug]: [...current] };
      setMap(next);
      write(next);
    },
    [map, courseSlug]
  );

  const setComplete = useCallback(
    (lessonSlug: string, value: boolean) => {
      if (!courseSlug) return;
      const current = new Set(map[courseSlug] ?? []);
      if (value) current.add(lessonSlug);
      else current.delete(lessonSlug);
      const next = { ...map, [courseSlug]: [...current] };
      setMap(next);
      write(next);
    },
    [map, courseSlug]
  );

  const reset = useCallback(() => {
    if (!courseSlug) return;
    const next = { ...map };
    delete next[courseSlug];
    setMap(next);
    write(next);
  }, [map, courseSlug]);

  return { completed, isComplete, toggle, setComplete, reset, allProgress: map };
}
