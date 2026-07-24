import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  LOGIN_PATH,
  PLAYER_HOME_PATH,
  PLAYER_LOGIN_PATH,
  PLAYER_PATH_PREFIX,
  PLAYER_VERIFY_EMAIL_PATH,
  SUBSCRIBE_PATH,
  isPublicPath,
} from "@/lib/auth/routes";

export {
  PLAYER_HOME_PATH,
  PLAYER_LOGIN_PATH,
  PLAYER_PATH_PREFIX,
  PLAYER_VERIFY_EMAIL_PATH,
};

export type AccountKind = "player" | "member";

export function isAccountKind(value: string | null | undefined): value is AccountKind {
  return value === "player" || value === "member";
}

export function isPlayerAccountKind(kind: string | null | undefined): boolean {
  return kind === "player";
}

export async function fetchAccountKind(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AccountKind> {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_kind")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.account_kind) {
    return "member";
  }

  return isAccountKind(data.account_kind) ? data.account_kind : "member";
}

export function isPlayerAuthPath(pathname: string): boolean {
  return (
    pathname === PLAYER_LOGIN_PATH ||
    pathname === PLAYER_VERIFY_EMAIL_PATH ||
    pathname.startsWith(`${PLAYER_LOGIN_PATH}/`)
  );
}

export function isPlayerAppPath(pathname: string): boolean {
  return (
    pathname === PLAYER_PATH_PREFIX ||
    pathname.startsWith(`${PLAYER_PATH_PREFIX}/`)
  );
}

/** Paths a free player account may visit. */
export function isPlayerAllowedPath(pathname: string): boolean {
  if (isPublicPath(pathname) || isPlayerAuthPath(pathname) || isPlayerAppPath(pathname)) {
    return true;
  }

  // Upgrade CTA may enter the subscribe funnel.
  if (pathname === SUBSCRIBE_PATH || pathname.startsWith(`${SUBSCRIBE_PATH}/`)) {
    return true;
  }

  return false;
}

export function resolveUnauthenticatedLoginPath(pathname: string): string {
  if (isPlayerAppPath(pathname) || isPlayerAuthPath(pathname)) {
    return PLAYER_LOGIN_PATH;
  }

  return LOGIN_PATH;
}

export function getPlayerPostAuthPath(
  next: string | null | undefined,
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return PLAYER_HOME_PATH;
  }

  const withoutHash = next.split("#", 1)[0] ?? next;
  const pathname = withoutHash.split("?", 1)[0] ?? withoutHash;

  if (isPlayerAppPath(pathname) && !isPlayerAuthPath(pathname)) {
    return withoutHash;
  }

  return PLAYER_HOME_PATH;
}

export async function promoteAccountKindToMember(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  await supabase
    .from("profiles")
    .update({ account_kind: "member" })
    .eq("id", userId)
    .eq("account_kind", "player");
}
