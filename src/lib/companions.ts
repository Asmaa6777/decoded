/* Companions: two people studying one course together, paired only through
   an invite link one of them sent. Each sees the other's progress in that
   course and nothing else. The list is loaded once per page load for
   signed-in readers and shared by every component that shows it. */

import { useEffect, useSyncExternalStore } from "react";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { API_URL } from "@/lib/progressSync";

export type Companion = {
  course: string;
  handle: string;
  avatarUrl: string | null;
  completed: number;
  latest: { lesson: string; at: number } | null;
};
export type Invite = { inviter: { handle: string; avatarUrl: string | null }; course: string; expiresAt: number };
export type InviteError = "needs_profile" | "not_registered" | "too_many" | "signed_out" | "unavailable";
export type AcceptError = "needs_profile" | "own_invite" | "not_found" | "signed_out" | "unavailable";

// main.tsx turns this on, so tests and previews never call the API.
let enabled = false;
let companions: Companion[] = [];
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function enableCompanions() {
  enabled = true;
}

/** Test hook: start from nothing, optionally with the API switched on. */
export function resetCompanionsForTests(on = false) {
  enabled = on;
  companions = [];
  loading = null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function set(next: Companion[]) {
  companions = next;
  listeners.forEach((listener) => listener());
}

async function errorOf<E extends string>(response: Response, fallback: E): Promise<E> {
  try {
    return ((await response.json()) as { error?: E }).error ?? fallback;
  } catch {
    return fallback;
  }
}

function load(): Promise<void> {
  loading ??= fetch(`${API_URL}/companions`, { credentials: "include" })
    .then(async (response) => {
      if (response.ok) set(((await response.json()) as { companions: Companion[] }).companions);
    })
    .catch(() => {});
  return loading;
}

/** Your companions, in one course or all of them. Empty while signed out or loading. */
export function useCompanions(course?: string): Companion[] {
  const status = useAccountStatus();
  useEffect(() => {
    if (enabled && status === "signed-in") void load();
  }, [status]);
  const all = useSyncExternalStore(subscribe, () => companions);
  if (status !== "signed-in") return [];
  return course ? all.filter((c) => c.course === course) : all;
}

export async function createInvite(course: string): Promise<{ token: string; expiresAt: number } | { error: InviteError }> {
  try {
    const response = await fetch(`${API_URL}/companions/invites`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course }),
    });
    if (!response.ok) return { error: await errorOf<InviteError>(response, "unavailable") };
    return (await response.json()) as { token: string; expiresAt: number };
  } catch {
    return { error: "unavailable" };
  }
}

/** The invite behind a link, null if it was used or has expired, or undefined if the API couldn't say. */
export async function fetchInvite(token: string): Promise<Invite | null | undefined> {
  try {
    const response = await fetch(`${API_URL}/companions/invites/${encodeURIComponent(token)}`);
    if (response.status === 404) return null;
    return response.ok ? ((await response.json()) as Invite) : undefined;
  } catch {
    return undefined;
  }
}

export async function acceptInvite(token: string): Promise<{ course: string; companion: string } | { error: AcceptError }> {
  try {
    const response = await fetch(`${API_URL}/companions/invites/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) return { error: await errorOf<AcceptError>(response, "unavailable") };
    loading = null; // the new companion should show up
    void load();
    return (await response.json()) as { course: string; companion: string };
  } catch {
    return { error: "unavailable" };
  }
}

export async function removeCompanion(course: string, handle: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/companions/remove`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, handle }),
    });
    if (response.ok) set(companions.filter((c) => !(c.course === course && c.handle === handle)));
    return response.ok;
  } catch {
    return false;
  }
}

/** "today", "yesterday", "3 days ago", or a date for anything older than a week. */
export function sinceLabel(at: number, now = Date.now()): string {
  const days = Math.floor((new Date(now).setHours(0, 0, 0, 0) - new Date(at).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
