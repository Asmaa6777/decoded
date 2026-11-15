import { useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "@/components/CourseCard";
import { CourseGlyph } from "@/components/brand/Glyphs";
import { courses, flattenLessons, getCourse, type Course } from "@/content/registry";
import { learningPaths, trackGroups } from "@/content/paths";

const accentText: Record<Course["accent"], string> = {
  neon: "text-neon",
  orange: "text-orange",
  sky: "text-sky",
  violet: "text-violet",
  mint: "text-mint",
};

/** Total reading time from lesson durations like "8 min", as "3h 27m" or "37 min". */
function readingTime(course: Course) {
  const minutes = flattenLessons(course).reduce((sum, l) => sum + (parseInt(l.duration, 10) || 0), 0);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} min`;
}

/** The home page's Tracks section: the beginner path, then every course with a subject filter. */
export function TrackPicker() {
  const [group, setGroup] = useState("all");
  const start = learningPaths.find((p) => p.slug === "start-here")!;
  const shown = group === "all" ? courses : courses.filter((c) => trackGroups.find((g) => g.slug === group)!.courses.includes(c.slug));
  const filters = [{ slug: "all", title: "All tracks", count: courses.length }].concat(
    trackGroups.map((g) => ({ slug: g.slug, title: g.title, count: g.courses.length })),
  );

  return (
    <>
      <div className="border border-border bg-card/60 p-5 md:p-8 mb-14">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 mb-6">
          <div>
            <div className="eyebrow text-neon mb-2">{start.title}?</div>
            <h3 className="font-display text-2xl md:text-[26px] font-bold leading-tight">Start with these four, in this order.</h3>
          </div>
          <p className="max-w-md font-body text-[15px] italic leading-relaxed text-muted-foreground">{start.description}</p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {start.courses.map((slug, i) => {
            const course = getCourse(slug)!;
            return (
              <li key={slug} className="flex">
                <Link
                  to={`/courses/${slug}`}
                  className="flex flex-1 items-center gap-3.5 border border-border bg-card p-4 transition-colors hover:border-foreground/40"
                >
                  <span className={`font-mono text-xs ${accentText[course.accent]}`}>{String(i + 1).padStart(2, "0")}</span>
                  <CourseGlyph slug={slug} className={`h-6 w-6 shrink-0 ${accentText[course.accent]}`} />
                  <span className="min-w-0">
                    <span className="block font-display font-bold leading-tight">{course.title}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      {flattenLessons(course).length} lessons · {readingTime(course)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="font-display text-sm font-bold uppercase tracking-[0.12em] mb-4">Or pick any track</div>
      <div role="group" aria-label="Filter tracks by subject" className="flex flex-wrap gap-2 pb-5 mb-8 border-b border-border">
        {filters.map((f) => {
          const on = group === f.slug;
          return (
            <button
              key={f.slug}
              type="button"
              aria-pressed={on}
              onClick={() => setGroup(f.slug)}
              className={`min-h-10 px-4 border font-mono text-xs tracking-wide transition-colors ${
                on ? "border-foreground bg-foreground text-background" : "border-border text-foreground/80 hover:border-foreground/40"
              }`}
            >
              {f.title}
              <span className="ml-1.5 opacity-60">{f.count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <CourseCard key={c.slug} slug={c.slug} />
        ))}
      </div>
    </>
  );
}
