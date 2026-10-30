import type { ProgressMap } from "@/lib/progressBackup";

const STORAGE_KEY = "decoded:progress:v1";
const LAST_LESSON_KEY = "decoded:last-lesson:v1";

export function readProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function writeProgress(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("decoded:progress"));
  } catch {
    /* ignore quota errors */
  }
}

export type LastLesson = { course: string; lesson: string };

/** The lesson last opened on this device, for "continue where you left off". */
export function readLastLesson(): LastLesson | null {
  try {
    const raw = localStorage.getItem(LAST_LESSON_KEY);
    return raw ? (JSON.parse(raw) as LastLesson) : null;
  } catch {
    return null;
  }
}

export function writeLastLesson(last: LastLesson) {
  try {
    localStorage.setItem(LAST_LESSON_KEY, JSON.stringify(last));
  } catch {
    /* ignore quota errors */
  }
}

export function clearLastLesson() {
  try {
    localStorage.removeItem(LAST_LESSON_KEY);
  } catch {
    /* storage unavailable */
  }
}
