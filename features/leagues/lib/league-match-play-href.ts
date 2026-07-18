/**
 * Resolve where League match play should navigate after starting the engine.
 * X01 Singles uses the League Pro scoring screen; other formats keep Club play.
 */
export function leagueMatchPlayHref(input: {
  leagueId: string;
  matchKey: string;
  setupKind: "x01" | "cricket";
  leagueFormat: string | null | undefined;
  fallbackPlayHref: string;
}): string {
  const useLeagueSinglesScoring =
    input.setupKind === "x01" &&
    (input.leagueFormat ?? "").toLowerCase() === "singles";

  if (useLeagueSinglesScoring) {
    return `/leagues/league/${input.leagueId}/match/${encodeURIComponent(input.matchKey)}/score`;
  }

  return input.fallbackPlayHref;
}
