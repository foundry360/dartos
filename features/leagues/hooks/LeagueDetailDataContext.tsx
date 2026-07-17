"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";

type LeaguePlayersApi = ReturnType<typeof useLeaguePlayers>;
type LeagueTeamsApi = ReturnType<typeof useLeagueTeams>;
type LeagueScheduleApi = ReturnType<typeof useLeagueSchedule>;

export interface LeagueDetailDataValue {
  leagueId: string | undefined;
  players: LeaguePlayersApi;
  teams: LeagueTeamsApi;
  schedule: LeagueScheduleApi;
}

const LeagueDetailDataContext = createContext<LeagueDetailDataValue | null>(
  null,
);

export function LeagueDetailDataProvider({
  leagueId,
  children,
}: {
  leagueId: string | undefined;
  children: ReactNode;
}) {
  const players = useLeaguePlayers(leagueId);
  const teams = useLeagueTeams(leagueId);
  const schedule = useLeagueSchedule(leagueId);

  const value = useMemo(
    () => ({
      leagueId,
      players,
      teams,
      schedule,
    }),
    [leagueId, players, teams, schedule],
  );

  return (
    <LeagueDetailDataContext.Provider value={value}>
      {children}
    </LeagueDetailDataContext.Provider>
  );
}

export function useLeagueDetailData(): LeagueDetailDataValue {
  const value = useContext(LeagueDetailDataContext);

  if (!value) {
    throw new Error(
      "useLeagueDetailData must be used within LeagueDetailDataProvider.",
    );
  }

  return value;
}
