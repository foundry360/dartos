import { formatAuthError } from "@/features/auth/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

const storageKey = (leagueId: string) => `dartos:league-detail-locked:${leagueId}`;

export function readLeagueDetailLocked(leagueId: string | undefined): boolean {
  if (!leagueId || typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(storageKey(leagueId)) === "1";
  } catch {
    return false;
  }
}

export function writeLeagueDetailLocked(
  leagueId: string | undefined,
  locked: boolean,
): void {
  if (!leagueId || typeof window === "undefined") {
    return;
  }

  try {
    if (locked) {
      window.sessionStorage.setItem(storageKey(leagueId), "1");
    } else {
      window.sessionStorage.removeItem(storageKey(leagueId));
    }
  } catch {
    // Ignore quota / private-mode failures; in-memory state still applies.
  }
}

/** Re-check the signed-in user's password without changing accounts. */
export async function verifyCurrentUserPassword(password: string): Promise<void> {
  const trimmed = password.trim();

  if (!trimmed) {
    throw new Error("Enter your password.");
  }

  const supabase = createClient();

  if (!supabase) {
    throw new Error("Sign in to unlock this league.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(formatAuthError(userError));
  }

  const email = user?.email?.trim();

  if (!email) {
    throw new Error(
      "Password unlock requires an email and password account. Sign in with email to use this lock.",
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: trimmed,
  });

  if (error) {
    throw new Error(formatAuthError(error));
  }
}
