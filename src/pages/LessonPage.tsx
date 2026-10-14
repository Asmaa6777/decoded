import { useEffect, useState, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteChrome";
import { getLesson, lessonNeighbors, lessonKind } from "@/content/registry";
import { useProgress } from "@/hooks/useProgress";
import { CodeBlock } from "@/components/mdx/MdxComponents";

const mdxComponents = { pre: CodeBlock };

const accentBg: Record<string, string> = {
  neon: "bg-neon", orange: "bg-orange", sky: "bg-sky", violet: "bg-violet", mint: "bg-mint",
};

export default function LessonPage() {
  const { courseSlug, lessonSlug } = useParams<{ courseSlug: string; lessonSlug: string }>();
  
  const data = useMemo(() => 
    courseSlug && lessonSlug ? getLesson(courseSlug, lessonSlug) : null,
    [courseSlug, lessonSlug]
  );

  const { isComplete, setComplete } = useProgress(courseSlug);
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    if (data) document.title = `${data.lesson.title} — ${data.course.title}`;
    window.scrollTo({ top: 0 });
  }, [data]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setScroll(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!data || !courseSlug || !lessonSlug) return <Navigate to="/404" replace />;
  const { course, module, lesson } = data;
  const Lesson = lesson.Component;
  const { prev, next } = lessonNeighbors(courseSlug, lessonSlug);
  const done = isComplete(lessonSlug);
  const kind = lessonKind(lesson);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent">
        <div
          className={`h-full ${accentBg[course.accent]} transition-[width] duration-150`}
          style={{ width: `${scroll}%` }}
        />
      </div>

      <SiteHeader />

      <main className="flex-1">
        <article className="container max-w-2xl py-10 md:py-16">
          {/* breadcrumbs */}
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-8 flex-wrap">
            <Link to="/courses" className="hover:text-foreground transition">Tracks</Link>
            <span>/</span>
            <Link to={`/courses/${course.slug}`} className="hover:text-foreground transition">
              {course.title}
            </Link>
            <span>/</span>
            <span>{module.title}</span>
          </div>

          <div className="flex items-center gap-3 mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span>{lesson.duration} read</span>
          </div>

          <MDXProvider components={mdxComponents}>
            <div className="prose-reading">
              <Lesson />
            </div>
          </MDXProvider>

          {/* Mark complete */}
          <div className="mt-12 pt-8 border-t border-border">
            {kind === "quiz" ? (
              done ? (
                <div className="inline-flex items-center gap-3 px-5 py-3 border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-widest">
                  <span className="inline-flex h-4 w-4 items-center justify-center border border-background bg-background text-foreground">✓</span>
                  Quiz passed — lesson complete
                </div>
              ) : (
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Pass the quiz above to mark this lesson complete.
                </p>
              )
            ) : (
              <button
                onClick={() => setComplete(lessonSlug, !done)}
                className={`group inline-flex items-center gap-3 px-5 py-3 border transition font-mono text-xs uppercase tracking-widest
                  ${done
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground"}`}
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center border ${
                    done ? "bg-background border-background text-foreground" : "border-foreground/40"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                {done ? "Lesson complete" : "Mark as complete"}
              </button>
            )}
          </div>

          {/* Prev / Next */}
          <nav className="mt-10 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                to={`/courses/${course.slug}/${prev.slug}`}
                className="group border border-border p-5 hover:border-foreground/40 transition"
              >
                <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
                  ← Previous
                </div>
                <div className="font-display font-semibold group-hover:-translate-x-0.5 transition-transform">
                  {prev.title}
                </div>
              </Link>
            ) : <span />}

            {next ? (
              <Link
                to={`/courses/${course.slug}/${next.slug}`}
                className="group border border-border p-5 hover:border-foreground/40 transition text-right"
              >
                <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
                  Next →
                </div>
                <div className="font-display font-semibold group-hover:translate-x-0.5 transition-transform">
                  {next.title}
                </div>
              </Link>
            ) : (
              <Link
                to={`/courses/${course.slug}`}
                className="group border border-border p-5 hover:border-foreground/40 transition text-right"
              >
                <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1.5">
                  Back to course
                </div>
                <div className="font-display font-semibold">{course.title}</div>
              </Link>
            )}
          </nav>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
