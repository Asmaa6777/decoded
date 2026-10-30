import { currentUserId } from "./auth";
import type { Env } from "./index";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 100;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_LESSONS_PER_USER = 5000;

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

export async function getProgress(request: Request, env: Env): Promise<Response> {
  const userId = await currentUserId(request, env);
  if (!userId) return Response.json({ signedIn: false });
  return Response.json({ signedIn: true, progress: await readProgress(env, userId) });
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
