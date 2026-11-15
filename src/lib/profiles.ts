/* Public profiles: a handle someone chose, shown only when they turn it on.
   The Worker owns the rules; HANDLE here only gives instant feedback while
   typing and must match worker/src/profiles.ts. */

import { API_URL } from "@/lib/progressSync";

export const HANDLE = /^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$/;

export type OwnProfile = { handle: string; public: boolean; hidden: boolean };
export type PublicProfile = {
  handle: string;
  avatarUrl: string | null;
  since: number;
  /** courses they take, with how many lessons they've completed in each */
  courses: { course: string; completed: number }[];
};
export type ProfileSummary = { handle: string; avatarUrl: string | null };
export type ReportReason = "offensive" | "impersonation" | "personal-info" | "other";

export type SaveError = "invalid" | "not_allowed" | "taken" | "signed_out" | "unavailable";

const SAVE_ERRORS: Record<number, SaveError> = { 400: "invalid", 401: "signed_out", 409: "taken", 422: "not_allowed" };

/** What's wrong with a handle as typed, before asking the Worker. */
export function handleHint(handle: string): string | null {
  if (handle.length < 3) return "At least 3 characters.";
  if (handle.length > 20) return "At most 20 characters.";
  if (/[^a-z0-9_]/.test(handle)) return "Only lowercase letters, digits and _.";
  if (!HANDLE.test(handle)) return "Start and end with a letter or digit.";
  return null;
}

/** Your profile, null if you never made one, or undefined if the API couldn't say. */
export async function fetchOwnProfile(): Promise<OwnProfile | null | undefined> {
  try {
    const response = await fetch(`${API_URL}/profile`, { credentials: "include" });
    if (!response.ok) return undefined;
    return ((await response.json()) as { profile: OwnProfile | null }).profile;
  } catch {
    return undefined;
  }
}

export async function saveOwnProfile(handle: string, isPublic: boolean): Promise<{ profile: OwnProfile } | { error: SaveError }> {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, public: isPublic }),
    });
    if (!response.ok) return { error: SAVE_ERRORS[response.status] ?? "unavailable" };
    return (await response.json()) as { profile: OwnProfile };
  } catch {
    return { error: "unavailable" };
  }
}

/** A public profile, null when there's none by that handle, or undefined if the API couldn't say. */
export async function fetchPublicProfile(handle: string): Promise<PublicProfile | null | undefined> {
  try {
    const response = await fetch(`${API_URL}/profiles/${encodeURIComponent(handle)}`);
    if (response.status === 404) return null;
    return response.ok ? ((await response.json()) as PublicProfile) : undefined;
  } catch {
    return undefined;
  }
}

export async function searchProfiles(query: string): Promise<ProfileSummary[]> {
  try {
    const response = await fetch(`${API_URL}/profiles?q=${encodeURIComponent(query)}`);
    return response.ok ? ((await response.json()) as { results: ProfileSummary[] }).results : [];
  } catch {
    return [];
  }
}

export async function reportProfile(handle: string, reason: ReportReason): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/profiles/${encodeURIComponent(handle)}/report`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
