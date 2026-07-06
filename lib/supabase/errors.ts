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
