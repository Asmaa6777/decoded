import { describe, expect, it } from "vitest";
import { BackupError, backupFileName, makeBackup, mergeProgress, parseBackup } from "@/lib/progressBackup";

const known = {
  algo: new Set(["merge-sort", "quick-sort", "bfs"]),
  toc: new Set(["nfa"]),
};

describe("progress backup", () => {
  it("round-trips through export and import", () => {
    const backup = makeBackup({ algo: ["quick-sort", "merge-sort", "merge-sort"], toc: [] }, new Date("2026-10-15T10:00:00Z"));
    expect(backup).toEqual({
      app: "decoded",
      kind: "progress",
      version: 1,
      exportedAt: "2026-10-15T10:00:00.000Z",
      progress: { algo: ["merge-sort", "quick-sort"] },
    });
    expect(parseBackup(JSON.stringify(backup))).toEqual({ algo: ["merge-sort", "quick-sort"] });
  });

  it("names the file by local date", () => {
    expect(backupFileName(new Date(2026, 9, 5, 23, 59))).toBe("decoded-progress-2026-10-05.json");
  });

  it("accepts a bare localStorage map", () => {
    expect(parseBackup('{"algo":["bfs", 3, ""]}')).toEqual({ algo: ["bfs"] });
  });

  it("rejects files it can't use", () => {
    expect(() => parseBackup("not json")).toThrow(BackupError);
    expect(() => parseBackup("[1,2]")).toThrow(BackupError);
    expect(() => parseBackup('{"app":"other","progress":{}}')).toThrow(/different app/);
    expect(() => parseBackup('{"app":"decoded","version":2,"progress":{}}')).toThrow(/version 2/);
  });

  it("merges without losing current progress and skips lessons that no longer exist", () => {
    const { merged, added, skipped } = mergeProgress(
      { algo: ["merge-sort"] },
      { algo: ["merge-sort", "bfs", "old-lesson"], toc: ["nfa"], gone: ["x"] },
      known,
    );
    expect(merged).toEqual({ algo: ["merge-sort", "bfs"], toc: ["nfa"] });
    expect(added).toBe(2);
    expect(skipped).toBe(2);
  });
});
