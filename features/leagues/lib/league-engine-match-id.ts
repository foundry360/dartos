/** Stable engine match id so league Resume Scoring can find the in-progress game. */
export function leagueEngineMatchId(leagueId: string, matchKey: string): string {
  return `league:${leagueId}:${matchKey}`;
}
