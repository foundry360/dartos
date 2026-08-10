export const LOGIN_PATH = "/login";
export const VERIFY_EMAIL_PATH = "/login/verify";
/** Free league-player track (separate from paid Vector login). */
export const PLAYER_PATH_PREFIX = "/player";
export const PLAYER_HOME_PATH = "/player";
export const PLAYER_MY_LEAGUES_PATH = "/player/my-leagues";
export const PLAYER_LOGIN_PATH = "/player/login";
export const PLAYER_VERIFY_EMAIL_PATH = "/player/login/verify";
export const PLAYER_DISCOVER_PATH = "/player/discover";
export const PLAYER_JOIN_CODE_PATH = "/player/join/code";
export const PLAYER_ACCOUNT_PATH = "/player/account";
export const PLAYER_MESSAGES_PATH = "/player/messages";

export function playerLeaguePath(leagueId: string): string {
  return `${PLAYER_PATH_PREFIX}/leagues/${encodeURIComponent(leagueId)}`;
}

export function playerInvitePath(token: string): string {
  return `${PLAYER_PATH_PREFIX}/join/invite/${encodeURIComponent(token)}`;
}

export const SUBSCRIBE_PATH = "/subscribe";
export const SUBSCRIBE_CONFIRM_PATH = "/subscribe/confirm";
export const SUBSCRIBE_PAYMENT_PATH = "/subscribe/payment";
export const SUBSCRIBE_SUCCESS_PATH = "/subscribe/success";
export const APP_HOME_PATH = "/home";
/** Club/Elite full-page notifications (iPhone; desktop keeps the slide panel). */
export const APP_NOTIFICATIONS_PATH = "/home/notifications";
/** Social online rooms (create / join lobby). */
export const COMMUNITY_PLAY_PATH = "/community";
/** Friend requests and friends list. */
export const FRIENDS_PATH = "/friends";
export const LEAGUE_PLAY_PATH = "/league-play";
/** Paid Club/Elite discover & register (member app shell — not /player). */
export const LEAGUE_DISCOVER_PATH = "/league-play/discover";
export const LEAGUE_MANAGEMENT_PATH = "/leagues";
/** League Pro tray — leagues-only list (not the management dashboard). */
export const LEAGUE_LIST_PATH = "/leagues/leagues";
/** League Pro — searchable league player cards (replaces tray Profile). */
export const LEAGUE_PLAYER_CARD_PATH = "/league-players";

export function leaguePlayerCardPath(playerId: string): string {
  return `${LEAGUE_PLAYER_CARD_PATH}/${encodeURIComponent(playerId)}`;
}
export const AUTH_CALLBACK_PATH = "/auth/callback";

export const PUBLIC_PATHS = new Set([
  LOGIN_PATH,
  VERIFY_EMAIL_PATH,
  PLAYER_LOGIN_PATH,
  PLAYER_VERIFY_EMAIL_PATH,
  "/privacy",
  "/terms",
  AUTH_CALLBACK_PATH,
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
  "/favicon.ico",
]);

export function isPublicPath(pathname: string): boolean {
  if (
    process.env.NODE_ENV !== "production" &&
    (pathname === "/subscribe/preview" ||
      pathname.startsWith("/subscribe/preview/") ||
      pathname === "/dev/device" ||
      pathname.startsWith("/dev/device/"))
  ) {
    return true;
  }

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

  const withoutHash = next.split("#", 1)[0] ?? next;
  const questionIndex = withoutHash.indexOf("?");
  const pathname =
    questionIndex === -1 ? withoutHash : withoutHash.slice(0, questionIndex);
  const search = questionIndex === -1 ? "" : withoutHash.slice(questionIndex + 1);

  if (
    pathname === "/" ||
    pathname === LOGIN_PATH ||
    pathname === VERIFY_EMAIL_PATH ||
    pathname === PLAYER_LOGIN_PATH ||
    pathname === PLAYER_VERIFY_EMAIL_PATH ||
    pathname === AUTH_CALLBACK_PATH ||
    pathname.startsWith(`${AUTH_CALLBACK_PATH}/`) ||
    isPublicPath(pathname)
  ) {
    return fallback;
  }

  return search ? `${pathname}?${search}` : pathname;
}
