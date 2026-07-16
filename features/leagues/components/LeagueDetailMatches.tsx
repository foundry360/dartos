"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LeagueMatchCard } from "@/features/leagues/components/LeagueMatchCard";
import { LeagueDetailSectionIcon } from "@/features/leagues/components/LeagueDetailSectionIcons";
import { useLeaguePlayers } from "@/features/leagues/hooks/useLeaguePlayers";
import { useLeagueSchedule } from "@/features/leagues/hooks/useLeagueSchedule";
import { useLeagueTeams } from "@/features/leagues/hooks/useLeagueTeams";
import type { LeagueDetailSectionId } from "@/features/leagues/lib/league-detail-sections";

interface LeagueDetailMatchesProps {
  leagueId: string;
  onSelectSection?: (section: LeagueDetailSectionId) => void;
}

export function LeagueDetailMatches({
  leagueId,
  onSelectSection,
}: LeagueDetailMatchesProps) {
  const router = useRouter();
  const {
    schedule,
    loading: scheduleLoading,
    error,
    saving,
    setMatchStatus,
  } = useLeagueSchedule(leagueId);
  const { players, loading: playersLoading } = useLeaguePlayers(leagueId);
  const { teams, loading: teamsLoading } = useLeagueTeams(leagueId);
  const [startingKey, setStartingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  const matches = schedule?.matches ?? [];
  const loading = scheduleLoading || playersLoading || teamsLoading;

  const openMatch = (matchKey: string) => {
    router.push(`/leagues/league/${leagueId}/match/${matchKey}`);
  };

  const startMatch = async (matchKey: string) => {
    if (saving || startingKey) {
      return;
    }

    setStartingKey(matchKey);

    try {
      await setMatchStatus({ matchKey, status: "in_progress" });
      openMatch(matchKey);
    } catch (caught) {
      console.error("Failed to start match", caught);
      setToast(
        caught instanceof Error ? caught.message : "Unable to start match.",
      );
      window.setTimeout(() => setToast(null), 2400);
    } finally {
      setStartingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="league-players-admin">
        <section className="league-detail-card">
          <div className="league-empty league-empty--players">
            <p className="league-empty__title">Loading matches…</p>
          </div>
        </section>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="league-players-admin">
        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h2 className="league-detail-card__title">Matches</h2>
          </div>
          <div className="league-empty league-empty--players">
            <div className="league-empty__icon" aria-hidden>
              <LeagueDetailSectionIcon section="matches" />
            </div>
            <p className="league-empty__title">No matches yet</p>
            <p className="league-empty__sub">
              Generate and publish a schedule to populate match cards here.
            </p>
            {onSelectSection ? (
              <button
                type="button"
                className="league-btn league-btn--primary"
                onClick={() => onSelectSection("schedule")}
              >
                Create Schedule
              </button>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="league-players-admin">
      <section className="league-detail-card">
        <div className="league-detail-card__header">
          <h2 className="league-detail-card__title">Matches</h2>
          <p className="league-match-list__count">
            {matches.length} match{matches.length === 1 ? "" : "es"}
          </p>
        </div>

        {error ? <p className="league-players__error">{error}</p> : null}

        <div className="league-match-list">
          {matches.map((match, index) => (
            <LeagueMatchCard
              key={match.key}
              matchNumber={index + 1}
              match={match}
              winnerSide={null}
              playersById={playersById}
              teamsById={teamsById}
              starting={startingKey === match.key}
              onStart={() => {
                void startMatch(match.key);
              }}
              onResume={() => openMatch(match.key)}
            />
          ))}
        </div>
      </section>

      {toast ? (
        <div className="league-players-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
