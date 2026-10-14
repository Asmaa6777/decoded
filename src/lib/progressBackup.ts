/* Progress backup: the file format for exporting completed lessons and the
   rules for reading one back in. Pure functions, so they are easy to test;
   the storage side lives in useProgress. */

export type ProgressMap = Record<string, string[]>; // courseSlug -> completed lesson slugs

export type ProgressBackup = {
  app: "decoded";
  kind: "progress";
  version: 1;
  exportedAt: string;
  progress: ProgressMap;
};

/** Which lessons exist right now, per course. */
export type KnownLessons = Record<string, Set<string>>;

export function makeBackup(progress: ProgressMap, now = new Date()): ProgressBackup {
  const clean: ProgressMap = {};
  for (const [course, lessons] of Object.entries(progress)) {
    if (lessons.length) clean[course] = [...new Set(lessons)].sort();
  }
  return { app: "decoded", kind: "progress", version: 1, exportedAt: now.toISOString(), progress: clean };
}

/** Named by the user's local date, not UTC. */
export function backupFileName(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `decoded-progress-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

export class BackupError extends Error {}

/**
 * Reads a backup file's text. Accepts the backup format above, or a bare
 * { course: [lessons] } map (what localStorage holds), for hand-edited files.
 */
export function parseBackup(text: string): ProgressMap {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError("This file isn't valid JSON.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new BackupError("This file doesn't look like a Decoded progress backup.");
  }
  const obj = data as Record<string, unknown>;
  if ("app" in obj && obj.app !== "decoded") {
    throw new BackupError("This backup is from a different app.");
  }
  if ("version" in obj && obj.version !== 1) {
    throw new BackupError(`This backup uses format version ${String(obj.version)}, which this site can't read.`);
  }
  const raw = "progress" in obj ? obj.progress : obj;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new BackupError("This file doesn't contain any progress.");
  }

  const out: ProgressMap = {};
  for (const [course, lessons] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(lessons)) continue;
    const slugs = lessons.filter((l): l is string => typeof l === "string" && l.length > 0);
    if (slugs.length) out[course] = slugs;
  }
  return out;
}

export type MergeResult = {
  merged: ProgressMap;
  /** lessons newly marked complete by the import */
  added: number;
  /** lessons in the file that no longer exist on the site */
  skipped: number;
};

/** Union of current progress and the backup, keeping only lessons that still exist. */
export function mergeProgress(current: ProgressMap, incoming: ProgressMap, known: KnownLessons): MergeResult {
  const merged: ProgressMap = {};
  for (const [course, lessons] of Object.entries(current)) merged[course] = [...lessons];

  let added = 0;
  let skipped = 0;
  for (const [course, lessons] of Object.entries(incoming)) {
    const exists = known[course];
    const set = new Set(merged[course] ?? []);
    for (const lesson of new Set(lessons)) {
      if (!exists?.has(lesson)) {
        skipped++;
        continue;
      }
      if (!set.has(lesson)) {
        set.add(lesson);
        added++;
      }
    }
    if (set.size) merged[course] = [...set];
  }
  return { merged, added, skipped };
}
