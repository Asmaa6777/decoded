import { useCourseStats } from "@/lib/learnerStats";

/* Each piece renders nothing until there are at least 10 people to count. */

/** "48 people taking it · 9 finished", for the course page header. */
export function CourseLearners({ course, className = "" }: { course: string; className?: string }) {
  const stats = useCourseStats(course);
  if (!stats?.registered) return null;
  return (
    <p className={`font-mono text-[11px] tracking-widest uppercase text-muted-foreground ${className}`}>
      {stats.registered} people taking it
      {stats.finished ? ` · ${stats.finished} finished` : ""}
    </p>
  );
}

/** "31 finished this week", beside a lesson's reading time. */
export function LessonLearners({ course, lesson }: { course: string; lesson: string }) {
  const count = useCourseStats(course)?.completedThisWeek[lesson];
  if (!count) return null;
  return (
    <>
      <span aria-hidden>·</span>
      <span>{count} finished this week</span>
    </>
  );
}

/** "Readers average 72% on this quiz.", under a finished quiz. */
export function QuizAverage({ course, lesson }: { course: string; lesson: string }) {
  const average = useCourseStats(course)?.quizAverages[lesson];
  if (average === undefined) return null;
  return <p className="mt-3 font-mono text-xs text-muted-foreground">Readers average {average}% on this quiz.</p>;
}
