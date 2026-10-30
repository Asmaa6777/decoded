import { currentUserId, deleteAccount, finishGithub, signOut, startGithub } from "./auth";
import { changeProgress, getProgress } from "./progress";

export interface Env {
  DB: D1Database;
  SITE_ORIGIN: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  const key = `${request.method} ${pathname}`;

  // Cookies go with any request, so changes are only accepted from the site itself.
  if (request.method !== "GET" && request.headers.get("Origin") !== env.SITE_ORIGIN) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  switch (key) {
    case "GET /health":
      await env.DB.prepare("SELECT 1").first();
      return Response.json({ ok: true });
    case "GET /auth/github/start":
      return startGithub(request, env);
    case "GET /auth/github/callback":
      return finishGithub(request, env);
    case "GET /me":
      return Response.json({ signedIn: (await currentUserId(request, env)) !== null });
    case "POST /auth/sign-out":
      return signOut(request, env);
    case "POST /account/delete":
      return deleteAccount(request, env);
    case "GET /progress":
      return getProgress(request, env);
    case "POST /progress":
      return changeProgress(request, env);
    default:
      return Response.json({ error: "not_found" }, { status: 404 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const fromSite = request.headers.get("Origin") === env.SITE_ORIGIN;
    const corsHeaders: Record<string, string> = fromSite
      ? { "Access-Control-Allow-Origin": env.SITE_ORIGIN, "Access-Control-Allow-Credentials": "true" }
      : {};

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Methods": "GET, POST",
          "Access-Control-Allow-Headers": "Content-Type",
          Vary: "Origin",
        },
      });
    }

    const response = await route(request, env);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(corsHeaders)) headers.set(name, value);
    headers.set("Vary", "Origin");
    headers.set("Cache-Control", "no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<Env>;
