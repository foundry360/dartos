export function createMatchId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `match-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
