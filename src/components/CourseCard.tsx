import { Link } from "react-router-dom";
import { courses, flattenLessons } from "@/content/registry";
import { prerequisites } from "@/content/paths";
import { useProgress } from "@/hooks/useProgress";
import { useRegistration } from "@/hooks/useRegistration";
import { CourseGlyph } from "@/components/brand/Glyphs";
import { CourseMaturity } from "@/components/CourseMaturity";
import { useReveal } from "@/hooks/useReveal";
import { useEffect, useState, type CSSProperties } from "react";

const accentText: Record<string, string> = {
  neon: "text-neon",
  orange: "text-orange",
  sky: "text-sky",
  violet: "text-violet",
  mint: "text-mint",
};
const accentBg: Record<string, string> = {
  neon: "bg-neon",
  orange: "bg-orange",
  sky: "bg-sky",
  violet: "bg-violet",
  mint: "bg-mint",
};

export default function CourseCard({ slug }: { slug: string }) {
  const course = courses.find((c) => c.slug === slug)!;
  const { allProgress } = useProgress();
  const { registered } = useRegistration(course.slug);
  const total = flattenLessons(course).length;
  const done = (allProgress[course.slug] ?? []).filter((s) =>
    flattenLessons(course).some((l) => l.slug === s)
  ).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const disabled = course.status === "coming-soon";
  const required = prerequisites[course.slug]?.map((s) => courses.find((c) => c.slug === s)!.title);

  const { ref, shown } = useReveal<HTMLDivElement>();
  // Cards in the same row come in one after another, left to right.
  const [delay, setDelay] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const cols = getComputedStyle(parent).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
    setDelay((Array.prototype.indexOf.call(parent.children, el) % cols) * 90);
  }, [ref]);

  const Wrapper: React.ElementType = disabled ? "div" : Link;
  const wrapperProps = disabled ? {} : { to: `/courses/${course.slug}` };

  return (
    <Wrapper
      {...wrapperProps}
      ref={ref}
      data-shown={shown}
      style={{ "--d": `${delay}ms` } as CSSProperties}
      className={`reveal group relative block border border-border bg-card overflow-hidden transition-all
        ${disabled ? "opacity-60 cursor-not-allowed" : "hover:border-foreground/40 hover:-translate-y-0.5"}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${disabled ? "" : "group-hover:w-[6px]"} transition-[width] duration-200 ${accentBg[course.accent]}`} aria-hidden />

      <div className="p-6 md:p-7">
        <div className="flex items-center justify-between gap-3 mb-4">
          <CourseGlyph slug={course.slug} className={`h-7 w-7 ${accentText[course.accent]}`} />
          <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${accentText[course.accent]}`}>
            {course.status === "coming-soon" ? "Coming soon" : `${total} lesson${total !== 1 ? "s" : ""}`}
          </span>
        </div>

        <h3 className="font-display text-2xl md:text-[26px] font-bold leading-tight mb-2 group-hover:translate-x-0.5 transition-transform">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground italic leading-relaxed mb-5">
          {course.tagline}
        </p>

        {!disabled && <CourseMaturity rounds={course.rounds} className="mb-5" />}

        {required && (
          <p className="text-xs text-muted-foreground mb-5">
            <span className="font-mono uppercase tracking-widest text-[10px]">Helps to know first:</span>{" "}
            <span className="text-foreground/80">{required.join(", ")}</span>
          </p>
        )}

        {!disabled && total > 0 && !registered && (
          <div className={`font-mono text-[10px] tracking-widest uppercase ${accentText[course.accent]}`}>
            Register to track progress <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
          </div>
        )}

        {!disabled && total > 0 && registered && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              <span>Progress</span>
              <span>{done}/{total}</span>
            </div>
            <div className="h-[3px] w-full bg-secondary overflow-hidden">
              <div
                className={`h-full ${accentBg[course.accent]} transition-[width] duration-700 ease-out`}
                style={{ width: shown ? `${pct}%` : 0, transitionDelay: `${delay + 250}ms` }}
              />
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
