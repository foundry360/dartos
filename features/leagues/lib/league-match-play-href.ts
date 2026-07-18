import { isTeamStyleLeagueFormat } from "@/features/leagues/lib/league-game-rules";

/**
 * Resolve where League match play should navigate after starting the engine.
 * X01 Singles and team-style leagues use the League Pro scoring screen;
 * other formats keep Club play.
 */
export function leagueMatchPlayHref(input: {
  leagueId: string;
  matchKey: string;
  setupKind: "x01" | "cricket";
  leagueFormat: string | null | undefined;
  fallbackPlayHref: string;
}): string {
  const format = (input.leagueFormat ?? "").toLowerCase();
  const useLeagueProScoring =
    input.setupKind === "x01" &&
    (format === "singles" || isTeamStyleLeagueFormat(format));

  if (useLeagueProScoring) {
    return `/leagues/league/${input.leagueId}/match/${encodeURIComponent(input.matchKey)}/score`;
  }

  return input.fallbackPlayHref;
}
