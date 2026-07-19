import type { PostgrestError } from "@supabase/supabase-js";

export function formatSupabaseError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const postgrestError = error as PostgrestError;
    return postgrestError.code
      ? `${postgrestError.code}: ${postgrestError.message}`
      : postgrestError.message;
  }

  return String(error);
}

/** True for browser/network TypeErrors like `Failed to fetch`. */
export function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    error.name === "TypeError" &&
    (message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("load failed") ||
      message.includes("network request failed"))
  );
}

export function isMissingRelationError(error: PostgrestError | null): boolean {
  if (!error) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  );
}
