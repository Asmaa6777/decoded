import type { LessonKind } from "@/content/registry";

/* Line icons from the Decoded brand sheet. All are 24×24, stroke-based and
   take currentColor, so callers colour them with a text-* class. */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  "aria-hidden": true as const,
  focusable: false as const,
};

const COURSE_GLYPHS: Record<string, (p: IconProps) => JSX.Element> = {
  // accepting state with an entry arrow
  "theory-of-computation": ({ className }) => (
    <svg {...base} className={className}>
      <circle cx="14" cy="12" r="7" />
      <circle cx="14" cy="12" r="4" />
      <path d="M1 12h5M4 9l3 3-3 3" />
    </svg>
  ),
  // shell prompt
  "computer-literacy": ({ className }) => (
    <svg {...base} className={className}>
      <path d="M4 7l5 5-5 5M12 17h8" />
    </svg>
  ),
  // sorted bars
  "algorithm-design-and-analysis": ({ className }) => (
    <svg {...base} strokeWidth={2.6} strokeLinecap="square" className={className}>
      <path d="M5 20v-6M12 20V9M19 20V4" />
    </svg>
  ),
  // balanced tree: a root and two children
  "advanced-algorithms": ({ className }) => (
    <svg {...base} className={className}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" fill="currentColor" />
      <path d="M10.6 7.1L7.2 15.8M13.4 7.1l3.4 8.7" />
    </svg>
  ),
  // chip
  "operating-systems": ({ className }) => (
    <svg {...base} className={className}>
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </svg>
  ),
  // three connected nodes
  "distributed-systems": ({ className }) => (
    <svg {...base} className={className}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="19" cy="18" r="2.5" />
      <path d="M11 7.3L6.3 15.8M13 7.3l4.7 8.5M7.5 18h9" />
    </svg>
  ),
  // target
  "the-exam-mind": ({ className }) => (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
};

/** The course's glyph, or a plain square for a course without one yet. */
export function CourseGlyph({ slug, className = "h-6 w-6" }: { slug: string; className?: string }) {
  const Glyph = COURSE_GLYPHS[slug];
  if (Glyph) return <Glyph className={className} />;
  return (
    <svg {...base} className={className}>
      <rect x="5" y="5" width="14" height="14" rx="1" />
    </svg>
  );
}

const KIND_LABEL: Record<LessonKind, string> = { theory: "Theory", practical: "Practical", quiz: "Quiz" };

/** Book for theory, code brackets for practical, check box for quiz. */
export function LessonKindIcon({ kind, className = "h-4 w-4" }: { kind: LessonKind; className?: string }) {
  const label = KIND_LABEL[kind];
  return (
    <svg {...base} aria-hidden={undefined} role="img" aria-label={label} className={className}>
      <title>{label}</title>
      {kind === "theory" && <path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" />}
      {kind === "practical" && <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />}
      {kind === "quiz" && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M8 12l3 3 5-6" />
        </>
      )}
    </svg>
  );
}
