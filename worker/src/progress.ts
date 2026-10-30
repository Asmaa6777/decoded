import { currentUserId } from "./auth";
import type { Env } from "./index";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 100;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_LESSONS_PER_USER = 5000;
const MAX_ENROLLMENTS_PER_USER = 200;

type LessonRef = [course: string, lesson: string];
type ProgressMap = Record<string, string[]>;

function isLessonRef(value: unknown): value is LessonRef {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((slug) => typeof slug === "string" && slug.length <= MAX_SLUG_LENGTH && SLUG.test(slug))
  );
}

function parseChanges(text: string): { add: LessonRef[]; remove: LessonRef[] } | null {
  let body: { add?: unknown; remove?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  const { add = [], remove = [] } = body ?? {};
  if (!Array.isArray(add) || !Array.isArray(remove)) return null;
  if (add.length + remove.length > MAX_LESSONS_PER_USER) return null;
  if (!add.every(isLessonRef) || !remove.every(isLessonRef)) return null;
  return { add, remove };
}

async function readProgress(env: Env, userId: string): Promise<ProgressMap> {
  const { results } = await env.DB.prepare("SELECT course, lesson FROM progress WHERE user_id = ?")
    .bind(userId)
    .all<{ course: string; lesson: string }>();
  const progress: ProgressMap = {};
  for (const { course, lesson } of results) (progress[course] ??= []).push(lesson);
  return progress;
}

/** course slug -> when the user registered for it */
async function readEnrollments(env: Env, userId: string): Promise<Record<string, number>> {
  const { results } = await env.DB.prepare("SELECT course, enrolled_at FROM enrollments WHERE user_id = ?")
    .bind(userId)
    .all<{ course: string; enrolled_at: number }>();
  return Object.fromEntries(results.map((row) => [row.course, row.enrolled_at]));
}

export async function getProgress(request: Request, env: Env): Promise<Response> {
  const userId = await currentUserId(request, env);
  if (!userId) return Response.json({ signedIn: false });
  const profile = await env.DB.prepare("SELECT display_name AS name, avatar_url AS avatarUrl FROM users WHERE id = ?")
    .bind(userId)
    .first<{ name: string | null; avatarUrl: string | null }>();
  return Response.json({
    signedIn: true,
    user: profile,
    progress: await readProgress(env, userId),
    enrollments: await readEnrollments(env, userId),
  });
}

/** Applies a batch of changes and returns the user's progress after them. */
export async function changeProgress(request: Request, env: Env): Promise<Response> {
  const userId = await currentUserId(request, env);
  if (!userId) return Response.json({ error: "signed_out" }, { status: 401 });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  const changes = parseChanges(text);
  if (!changes) return Response.json({ error: "invalid" }, { status: 400 });

  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM progress WHERE user_id = ?").bind(userId).first<number>("n");
  if ((count ?? 0) + changes.add.length > MAX_LESSONS_PER_USER) {
    return Response.json({ error: "too_many" }, { status: 413 });
  }

  await env.DB.batch([
    env.DB.prepare(
      `DELETE FROM progress WHERE user_id = ? AND (course, lesson) IN
         (SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]') FROM json_each(?))`,
    ).bind(userId, JSON.stringify(changes.remove)),
    env.DB.prepare(
      `INSERT OR IGNORE INTO progress (user_id, course, lesson, completed_at)
         SELECT ?, json_extract(value, '$[0]'), json_extract(value, '$[1]'), ? FROM json_each(?)`,
    ).bind(userId, Date.now(), JSON.stringify(changes.add)),
  ]);

  return Response.json({ progress: await readProgress(env, userId) });
}

function parseCourse(text: string): string | null {
  if (text.length > 1024) return null;
  try {
    const { course } = JSON.parse(text);
    return typeof course === "string" && course.length <= MAX_SLUG_LENGTH && SLUG.test(course) ? course : null;
  } catch {
    return null;
  }
}

/** Registers the user for a course; registering twice keeps the first date. */
export async function enroll(request: Request, env: Env): Promise<Response> {
  const userId = await currentUserId(request, env);
  if (!userId) return Response.json({ error: "signed_out" }, { status: 401 });

  const course = parseCourse(await request.text());
  if (!course) return Response.json({ error: "invalid" }, { status: 400 });

  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM enrollments WHERE user_id = ?").bind(userId).first<number>("n");
  if ((count ?? 0) >= MAX_ENROLLMENTS_PER_USER) return Response.json({ error: "too_many" }, { status: 413 });

  await env.DB.prepare("INSERT OR IGNORE INTO enrollments (user_id, course, enrolled_at) VALUES (?, ?, ?)")
    .bind(userId, course, Date.now())
    .run();
  return Response.json({ enrollments: await readEnrollments(env, userId) });
}

/** Leaves a course, which also clears the progress in it. */
export async function unenroll(request: Request, env: Env): Promise<Response> {
  const userId = await currentUserId(request, env);
  if (!userId) return Response.json({ error: "signed_out" }, { status: 401 });

  const course = parseCourse(await request.text());
  if (!course) return Response.json({ error: "invalid" }, { status: 400 });

  await env.DB.batch([
    env.DB.prepare("DELETE FROM enrollments WHERE user_id = ? AND course = ?").bind(userId, course),
    env.DB.prepare("DELETE FROM progress WHERE user_id = ? AND course = ?").bind(userId, course),
  ]);
  return Response.json({ enrollments: await readEnrollments(env, userId) });
}
