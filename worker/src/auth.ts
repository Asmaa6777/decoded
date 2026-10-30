import type { Env } from "./index";

const SESSION_COOKIE = "__Host-decoded_session";
const OAUTH_COOKIE = "__Host-decoded_oauth";
const SESSION_DAYS = 90;
const OAUTH_MINUTES = 10;

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}

async function hashToken(token: string): Promise<string> {
  return [...(await sha256(token))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readCookie(request: Request, name: string): string | undefined {
  for (const part of (request.headers.get("Cookie") ?? "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

function setCookie(name: string, value: string, maxAgeSeconds: number): string {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

/** Only a path on the site itself, so sign-in can't redirect people elsewhere. */
export function safeReturnPath(value: string | null): string {
  if (!value || !/^\/(?![/\\])[^\\\s]*$/.test(value)) return "/";
  return value;
}

function redirect(location: string, cookies: string[]): Response {
  const headers = new Headers({ Location: location });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function callbackUrl(request: Request): string {
  return `${new URL(request.url).origin}/auth/github/callback`;
}

export async function startGithub(request: Request, env: Env): Promise<Response> {
  const state = randomToken();
  const verifier = randomToken();
  const returnPath = safeReturnPath(new URL(request.url).searchParams.get("return"));

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", callbackUrl(request));
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", base64url(await sha256(verifier)));
  authorize.searchParams.set("code_challenge_method", "S256");

  const cookie = [state, verifier, encodeURIComponent(returnPath)].join(".");
  return redirect(authorize.toString(), [setCookie(OAUTH_COOKIE, cookie, OAUTH_MINUTES * 60)]);
}

type GithubUser = { id: string; login: string | null; avatarUrl: string | null };

async function fetchGithubUser(request: Request, env: Env, code: string, verifier: string): Promise<GithubUser | null> {
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl(request),
      code_verifier: verifier,
    }),
  });
  if (!tokenResponse.ok) return null;
  const { access_token: accessToken } = await tokenResponse.json<{ access_token?: string }>();
  if (!accessToken) return null;

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "decoded-api",
    },
  });
  if (!userResponse.ok) return null;
  const { id, login, avatar_url: avatarUrl } = await userResponse.json<{ id?: number; login?: string; avatar_url?: string }>();
  if (typeof id !== "number") return null;
  return {
    id: String(id),
    login: typeof login === "string" && /^[a-zA-Z0-9-]{1,39}$/.test(login) ? login : null,
    // The site puts this in an <img>, so only GitHub's own avatar host is accepted.
    avatarUrl: typeof avatarUrl === "string" && avatarUrl.startsWith("https://avatars.githubusercontent.com/") ? avatarUrl : null,
  };
}

async function findUserId(env: Env, provider: string, providerUserId: string): Promise<string | null> {
  return env.DB.prepare("SELECT user_id FROM identities WHERE provider = ? AND provider_user_id = ?")
    .bind(provider, providerUserId)
    .first<string>("user_id");
}

async function findOrCreateUser(env: Env, provider: string, providerUserId: string): Promise<string> {
  const existing = await findUserId(env, provider, providerUserId);
  if (existing) return existing;

  const userId = crypto.randomUUID();
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO users (id, created_at) VALUES (?, ?)").bind(userId, Date.now()),
      env.DB.prepare("INSERT INTO identities (provider, provider_user_id, user_id) VALUES (?, ?, ?)").bind(
        provider,
        providerUserId,
        userId,
      ),
    ]);
    return userId;
  } catch (error) {
    // Two first sign-ins at once: the other one won, so use its account.
    const winner = await findUserId(env, provider, providerUserId);
    if (winner) return winner;
    throw error;
  }
}

export async function finishGithub(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const clearOauth = setCookie(OAUTH_COOKIE, "", 0);
  const failed = redirect(`${env.SITE_ORIGIN}/?signin=failed`, [clearOauth]);

  // encodeURIComponent leaves dots alone, so the path may hold more of them.
  const [state, verifier, ...returnParts] = (readCookie(request, OAUTH_COOKIE) ?? "").split(".");
  const code = url.searchParams.get("code");
  if (!state || !verifier || !code || url.searchParams.get("state") !== state) return failed;

  const github = await fetchGithubUser(request, env, code, verifier);
  if (!github) return failed;

  const userId = await findOrCreateUser(env, "github", github.id);
  const token = randomToken();
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now),
    env.DB.prepare("UPDATE users SET display_name = ?, avatar_url = ? WHERE id = ?").bind(github.login, github.avatarUrl, userId),
    env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(
      await hashToken(token),
      userId,
      now + SESSION_DAYS * 24 * 60 * 60 * 1000,
    ),
  ]);

  return redirect(`${env.SITE_ORIGIN}${safeReturnPath(decodeURIComponent(returnParts.join(".")))}`, [
    clearOauth,
    setCookie(SESSION_COOKIE, token, SESSION_DAYS * 24 * 60 * 60),
  ]);
}

/** The signed-in user's ID, always taken from the session and never from the request. */
export async function currentUserId(request: Request, env: Env): Promise<string | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return env.DB.prepare("SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(await hashToken(token), Date.now())
    .first<string>("user_id");
}

export async function signOut(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await hashToken(token)).run();
  }
  return new Response(null, { status: 204, headers: { "Set-Cookie": setCookie(SESSION_COOKIE, "", 0) } });
}

/** Removes the account; its identities, sessions and progress go with it by cascade. */
export async function deleteAccount(request: Request, env: Env): Promise<Response> {
  const userId = await currentUserId(request, env);
  if (!userId) return Response.json({ error: "signed_out" }, { status: 401 });
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
  return new Response(null, { status: 204, headers: { "Set-Cookie": setCookie(SESSION_COOKIE, "", 0) } });
}
