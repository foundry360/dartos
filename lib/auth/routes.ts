export const LOGIN_PATH = "/";
export const APP_HOME_PATH = "/home";
export const AUTH_CALLBACK_PATH = "/auth/callback";

export const PUBLIC_PATHS = new Set([
  LOGIN_PATH,
  "/login",
  AUTH_CALLBACK_PATH,
  "/manifest.webmanifest",
  "/icon",
  "/favicon.ico",
]);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api/")) {
    return true;
  }

  // Static / generated assets should never require auth or become `next` targets.
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

/** Prevent open redirects; only allow in-app relative paths. */
export function getSafeNextPath(
  next: string | null | undefined,
  fallback: string = APP_HOME_PATH,
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }

  const pathname = next.split(/[?#]/, 1)[0] ?? next;

  if (
    pathname === LOGIN_PATH ||
    pathname === "/login" ||
    pathname === AUTH_CALLBACK_PATH ||
    pathname.startsWith(`${AUTH_CALLBACK_PATH}/`) ||
    isPublicPath(pathname)
  ) {
    return fallback;
  }

  return pathname;
}
