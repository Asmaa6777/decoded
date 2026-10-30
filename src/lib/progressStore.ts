import type { ProgressMap } from "@/lib/progressBackup";

const STORAGE_KEY = "decoded:progress:v1";

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
