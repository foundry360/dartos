export function createMatchId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `match-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** League Pro uses `league:…` engine ids — not valid for player_active_matches.id (uuid). */
const CLOUD_ACTIVE_MATCH_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCloudPersistedActiveMatchId(
  matchId: string | null | undefined,
): boolean {
  return typeof matchId === "string" && CLOUD_ACTIVE_MATCH_ID_RE.test(matchId);
}

export function buildActiveMatchResumeHref(
  gameMode: "x01" | "cricket",
  matchId: string,
  gameType?: number | string,
): string {
  const base =
    gameMode === "cricket" ? "/cricket/play" : `/x01/${String(gameType ?? 501)}/play`;

  return `${base}?matchId=${encodeURIComponent(matchId)}`;
}
