import { useRef } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { courses, flattenLessons } from "@/content/registry";
import { readAllProgress, saveAllProgress } from "@/hooks/useProgress";
import { BackupError, backupFileName, makeBackup, mergeProgress, parseBackup, type KnownLessons } from "@/lib/progressBackup";

function knownLessons(): KnownLessons {
  return Object.fromEntries(courses.map((c) => [c.slug, new Set(flattenLessons(c).map((l) => l.slug))]));
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Export progress to a JSON file and import it back (merged, never
 * overwriting what's already complete). Progress otherwise lives only in
 * this browser's localStorage.
 */
export function ProgressBackup({ className = "" }: { className?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const exportProgress = () => {
    const progress = readAllProgress();
    const lessons = Object.values(progress).reduce((n, l) => n + l.length, 0);
    if (lessons === 0) {
      toast("Nothing to export yet", { description: "Complete a lesson first, then come back to save your progress." });
      return;
    }
    const blob = new Blob([JSON.stringify(makeBackup(progress), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFileName();
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Progress exported", { description: `${plural(lessons, "completed lesson")} saved to ${a.download}.` });
  };

  const importProgress = async (file: File) => {
    try {
      const incoming = parseBackup(await file.text());
      const { merged, added, skipped } = mergeProgress(readAllProgress(), incoming, knownLessons());
      saveAllProgress(merged);
      const extra = skipped
        ? ` ${plural(skipped, "lesson")} in the file no longer ${skipped === 1 ? "exists and was" : "exist and were"} skipped.`
        : "";
      if (added === 0) toast("Already up to date", { description: `Everything in this backup is already marked complete.${extra}` });
      else toast.success("Progress imported", { description: `${plural(added, "lesson")} marked complete.${extra}` });
    } catch (e) {
      toast.error("Couldn't import that file", {
        description: e instanceof BackupError ? e.message : "Something went wrong reading it.",
      });
    }
  };

  const btn =
    "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors";

  return (
    <span className={`inline-flex items-center gap-4 ${className}`}>
      <button type="button" onClick={exportProgress} className={btn}>
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Export progress
      </button>
      <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-label="Progress backup file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importProgress(file);
          e.target.value = "";
        }}
      />
    </span>
  );
}
