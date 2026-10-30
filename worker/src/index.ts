export interface Env {
  DB: D1Database;
  SITE_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "GET" && pathname === "/health") {
      await env.DB.prepare("SELECT 1").first();
      return Response.json({ ok: true });
    }

    return Response.json({ error: "not_found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
