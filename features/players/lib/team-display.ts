import type { MatchTeamNames } from "@/types/player-setup";

export const DEFAULT_TEAM_NAMES: MatchTeamNames = ["Team 1", "Team 2"];

export function normalizeTeamNames(value: unknown): MatchTeamNames {
  if (!Array.isArray(value) || value.length < 2) {
    return [...DEFAULT_TEAM_NAMES];
  }

  return [
    typeof value[0] === "string" && value[0].trim() ? value[0].trim() : DEFAULT_TEAM_NAMES[0],
    typeof value[1] === "string" && value[1].trim() ? value[1].trim() : DEFAULT_TEAM_NAMES[1],
  ];
}

export function getTeamName(teamNames: MatchTeamNames | undefined, teamId: number): string {
  const names = teamNames ?? DEFAULT_TEAM_NAMES;
  return names[teamId] ?? `Team ${teamId + 1}`;
}

export function orderSetupSlotsForTeams<T extends { teamId: number }>(slots: T[]): T[] {
  const team0 = slots.filter((slot) => slot.teamId === 0);
  const team1 = slots.filter((slot) => slot.teamId === 1);
  const ordered: T[] = [];
  const pairCount = Math.max(team0.length, team1.length);

  for (let index = 0; index < pairCount; index += 1) {
    if (team0[index]) {
      ordered.push(team0[index]!);
    }

    if (team1[index]) {
      ordered.push(team1[index]!);
    }
  }

  return ordered;
}
