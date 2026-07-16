"use client";

import { useMemo, useState } from "react";
import {
  ScheduleSidePickerSheet,
  type ScheduleSidePickerOption,
} from "@/features/leagues/components/ScheduleSidePickerSheet";
import { ScheduleMatchupRow } from "@/features/leagues/components/ScheduleMatchupRow";
import {
  leaguePlayerDisplayName,
  type LeaguePlayer,
} from "@/features/leagues/lib/league-players";
import type {
  DraftLeagueMatch,
  LeagueScheduleWeek,
  ScheduleParticipant,
} from "@/features/leagues/lib/league-schedule";
import type { LeagueTeam } from "@/features/leagues/lib/league-teams";
import { APP_PRIMARY_COLOR } from "@/lib/theme";

interface ReplaceTarget {
  matchKey: string;
  side: "home" | "away";
}

interface ScheduleMatchListProps {
  weeks: LeagueScheduleWeek[];
  playersById: Map<string, LeaguePlayer>;
  teamsById: Map<string, LeagueTeam>;
  participants: ScheduleParticipant[];
  canReplaceSides?: boolean;
  onReplaceParticipant?: (input: {
    matchKey: string;
    side: "home" | "away";
    participant: ScheduleParticipant;
  }) => void | Promise<void>;
}

export function ScheduleMatchList({
  weeks,
  playersById,
  teamsById,
  participants,
  canReplaceSides = false,
  onReplaceParticipant,
}: ScheduleMatchListProps) {
  const [target, setTarget] = useState<ReplaceTarget | null>(null);

  const flatMatches = useMemo(
    () => weeks.flatMap((week) => week.matches),
    [weeks],
  );

  const activeMatch = target
    ? flatMatches.find((match) => match.key === target.matchKey) ?? null
    : null;

  const pickerOptions = useMemo((): ScheduleSidePickerOption[] => {
    if (!activeMatch || !target) {
      return [];
    }

    const sideKind =
      target.side === "home" ? activeMatch.homeKind : activeMatch.awayKind;
    const otherId =
      target.side === "home" ? activeMatch.awayId : activeMatch.homeId;

    return participants
      .filter(
        (participant) =>
          participant.kind === sideKind && participant.id !== otherId,
      )
      .map((participant) => {
        if (participant.kind === "player") {
          const player = playersById.get(participant.id);

          return {
            participant,
            name: player
              ? leaguePlayerDisplayName(player)
              : participant.label,
            color: player?.color || APP_PRIMARY_COLOR,
            avatarUrl: player?.avatarUrl ?? null,
          };
        }

        const team = teamsById.get(participant.id);

        return {
          participant,
          name: team?.name ?? participant.label,
          color: team?.color || APP_PRIMARY_COLOR,
          avatarUrl: null,
        };
      });
  }, [activeMatch, participants, playersById, target, teamsById]);

  const selectedId =
    activeMatch && target
      ? target.side === "home"
        ? activeMatch.homeId
        : activeMatch.awayId
      : null;

  const applyReplacement = async (participant: ScheduleParticipant) => {
    if (!target || !onReplaceParticipant) {
      return;
    }

    await onReplaceParticipant({
      matchKey: target.matchKey,
      side: target.side,
      participant,
    });
    setTarget(null);
  };

  return (
    <>
      <div className="schedule-match-days">
        {weeks.map((week) => (
          <section
            key={`${week.weekNumber}-${week.dateLabel}`}
            className="schedule-match-day"
            aria-label={`Week ${week.weekNumber}, ${week.dateLabel}`}
          >
            <ul className="schedule-match-list">
              {week.matches.map((match) => (
                <ScheduleMatchupRow
                  key={match.key}
                  match={match}
                  dateLabel={week.dateLabel}
                  timeLabel={week.timeLabel}
                  playersById={playersById}
                  teamsById={teamsById}
                  canReplaceSides={canReplaceSides && Boolean(onReplaceParticipant)}
                  onReplaceSide={(side) =>
                    setTarget({ matchKey: match.key, side })
                  }
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <ScheduleSidePickerSheet
        open={Boolean(target)}
        title={
          target?.side === "away" ? "Change away side" : "Change home side"
        }
        options={pickerOptions}
        selectedId={selectedId}
        onClose={() => setTarget(null)}
        onSelect={(participant) => {
          void applyReplacement(participant);
        }}
      />
    </>
  );
}

export function replaceMatchParticipant(
  match: DraftLeagueMatch,
  side: "home" | "away",
  participant: ScheduleParticipant,
): DraftLeagueMatch {
  if (side === "home") {
    return {
      ...match,
      homeId: participant.id,
      homeLabel: participant.label,
      homeKind: participant.kind,
    };
  }

  return {
    ...match,
    awayId: participant.id,
    awayLabel: participant.label,
    awayKind: participant.kind,
  };
}
