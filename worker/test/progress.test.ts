import { applyD1Migrations, env as testEnv } from "cloudflare:test";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../src/index";

const env = testEnv as unknown as Env & { TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1] };
const API = "https://decoded-api.stack42.tech";
const SITE = "https://decoded.stack42.tech";

function call(path: string, init: RequestInit = {}): Promise<Response> {
  return worker.fetch(new Request(`${API}${path}`, { redirect: "manual", ...init }), env);
}

function cookieValue(response: Response, name: string): string {
  const cookie = response.headers.getSetCookie().find((c) => c.startsWith(`${name}=`));
  return cookie!.slice(name.length + 1).split(";")[0];
}

async function signIn(githubId: number): Promise<string> {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) =>
    String(input).endsWith("/access_token") ? Response.json({ access_token: "t" }) : Response.json({ id: githubId }),
  );
  const start = await call("/auth/github/start");
  const state = new URL(start.headers.get("Location")!).searchParams.get("state")!;
  const oauth = cookieValue(start, "__Host-decoded_oauth");
  const done = await call(`/auth/github/callback?code=c&state=${state}`, {
    headers: { Cookie: `__Host-decoded_oauth=${oauth}` },
  });
  return cookieValue(done, "__Host-decoded_session");
}

function post(session: string | null, body: unknown, origin = SITE): Promise<Response> {
  return call("/progress", {
    method: "POST",
    headers: { Origin: origin, ...(session ? { Cookie: `__Host-decoded_session=${session}` } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function read(session: string) {
  const response = await call("/progress", { headers: { Cookie: `__Host-decoded_session=${session}` } });
  return response.json<{ signedIn: boolean; progress: Record<string, string[]> }>();
}

beforeAll(() => applyD1Migrations(env.DB, env.TEST_MIGRATIONS));

beforeEach(async () => {
  await env.DB.batch([env.DB.prepare("DELETE FROM sessions"), env.DB.prepare("DELETE FROM users")]);
});

afterEach(() => vi.unstubAllGlobals());

describe("progress", () => {
  it("reports signed-out visitors without an error", async () => {
    const response = await call("/progress");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedIn: false });
  });

  it("refuses changes from signed-out visitors", async () => {
    expect((await post(null, { add: [["toc", "intro"]] })).status).toBe(401);
  });

  it("saves additions and removals and returns the result", async () => {
    const session = await signIn(1);
    await post(session, { add: [["toc", "intro"], ["toc", "dfa"], ["os", "threads"]] });
    const response = await post(session, { remove: [["toc", "dfa"]], add: [["os", "paging"]] });
    const { progress } = await response.json<{ progress: Record<string, string[]> }>();
    expect(progress.toc).toEqual(["intro"]);
    expect(progress.os.sort()).toEqual(["paging", "threads"]);
    expect((await read(session)).progress).toEqual(progress);
  });

  it("treats a repeated addition as a no-op", async () => {
    const session = await signIn(1);
    await post(session, { add: [["toc", "intro"]] });
    expect((await post(session, { add: [["toc", "intro"]] })).status).toBe(200);
    expect((await read(session)).progress).toEqual({ toc: ["intro"] });
  });

  it("keeps each user's progress out of reach of everyone else", async () => {
    const alice = await signIn(1);
    const bob = await signIn(2);
    await post(alice, { add: [["toc", "intro"]] });

    expect((await read(bob)).progress).toEqual({});

    await post(bob, { remove: [["toc", "intro"]], user_id: "anyone", userId: "anyone" });
    expect((await read(alice)).progress).toEqual({ toc: ["intro"] });
  });

  it("ignores any user ID sent by the client", async () => {
    const alice = await signIn(1);
    const bob = await signIn(2);
    const aliceId = await env.DB.prepare("SELECT user_id FROM sessions LIMIT 1").first<string>("user_id");
    await post(bob, { add: [["toc", "bobs-lesson"]], user_id: aliceId });
    expect((await read(alice)).progress).toEqual({});
    expect((await read(bob)).progress).toEqual({ toc: ["bobs-lesson"] });
  });

  it("refuses changes from other origins", async () => {
    const session = await signIn(1);
    expect((await post(session, { add: [["toc", "intro"]] }, "https://evil.example")).status).toBe(403);
    expect((await read(session)).progress).toEqual({});
  });

  it.each([
    ["not JSON", "{"],
    ["a non-list", { add: "toc" }],
    ["a malformed pair", { add: [["toc"]] }],
    ["a non-slug", { add: [["toc", "<script>"]] }],
    ["SQL in a slug", { add: [["toc", "x'; DROP TABLE users;--"]] }],
    ["an overlong slug", { add: [["toc", "a".repeat(101)]] }],
  ])("rejects %s", async (_name, body) => {
    const session = await signIn(1);
    expect((await post(session, body)).status).toBe(400);
    expect((await read(session)).progress).toEqual({});
  });

  it("rejects an oversized body", async () => {
    const session = await signIn(1);
    expect((await post(session, "x".repeat(256 * 1024 + 1))).status).toBe(413);
  });

  it("caps how many lessons one user can store", async () => {
    const session = await signIn(1);
    const lessons = Array.from({ length: 5000 }, (_, i) => ["toc", `l${i}`]);
    expect((await post(session, { add: lessons })).status).toBe(200);
    expect((await post(session, { add: [["toc", "one-more"]] })).status).toBe(413);
  });
});
