"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayScreenHero } from "@/components/play/PlayScreenHero";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import {
  filterMatchesByPeriod,
  formatMatchPlayedDate,
} from "@/features/match-play/lib/match-history-period";
import { formatMatchLegs } from "@/features/match-play/lib/format-match-type-with-legs";
import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import { useMatchHistoryStore } from "@/features/match-play/store/match-history-store";
import {
  STATS_PERIOD_OPTIONS,
  type StatsPeriod,
} from "@/features/statistics/lib/stats-period";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";

function getPlayerNickname(profile: { nickname?: string | null; name: string }) {
  return profile.nickname?.trim() || profile.name;
}

function MatchHistoryRow({
  match,
  userNickname,
  userName,
  userColor,
  userAvatarUrl,
  opponentNickname,
  opponentName,
  opponentColor,
  opponentAvatarUrl,
  sample = false,
}: {
  match: MatchHistoryEntry;
  userNickname: string;
  userName: string;
  userColor: string;
  userAvatarUrl?: string | null;
  opponentNickname: string;
  opponentName: string;
  opponentColor: string | null;
  opponentAvatarUrl?: string | null;
  sample?: boolean;
}) {
  return (
    <GlassPanel className={cn("match-history-row", sample && "match-history-row--sample")}>
      <div className="match-history-row__player match-history-row__player--user">
        <PlayerAvatar
          name={userName}
          color={userColor}
          avatarUrl={userAvatarUrl}
        />
        <span className="match-history-row__name">{userNickname}</span>
      </div>

      <div className="match-history-row__meta">
        <span className="match-history-row__date">{formatMatchPlayedDate(match.playedAt)}</span>
        <span
          className={cn(
            "match-history-row__result",
            match.userWon ? "match-history-row__result--win" : "match-history-row__result--loss",
          )}
        >
          {match.userWon ? "W" : "L"}
        </span>
        <span className="match-history-row__type">
          {match.matchType}
          <span className="match-history-row__legs"> {formatMatchLegs(match)}</span>
        </span>
      </div>

      <div className="match-history-row__player match-history-row__player--opponent">
        <span className="match-history-row__name">{opponentNickname}</span>
        <PlayerAvatar
          name={opponentName}
          color={opponentColor ?? APP_PRIMARY_COLOR}
          avatarUrl={opponentAvatarUrl}
        />
      </div>
    </GlassPanel>
  );
}

const SAMPLE_MATCH: MatchHistoryEntry = {
  id: "sample-match-row",
  opponentId: "sample-opponent",
  userWon: true,
  matchType: "501",
  userLegs: 3,
  opponentLegs: 1,
  playedAt: new Date().toISOString(),
};

export function HeadToHeadScreen() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<StatsPeriod>("lifetime");
  const matches = useMatchHistoryStore((state) => state.matches);
  const hydrated = useMatchHistoryStore((state) => state.hydrated);
  const {
    accountProfile,
    cloudProfiles,
    loading: profilesLoading,
    isCloudConfigured,
  } = useSavedPlayerProfiles();

  const userNickname = accountProfile
    ? getPlayerNickname(accountProfile)
    : "You";
  const userName = accountProfile?.name ?? "You";
  const userColor = accountProfile?.color ?? APP_PRIMARY_COLOR;
  const userAvatarUrl = accountProfile?.avatarUrl;

  const visibleMatches = useMemo(() => {
    return filterMatchesByPeriod(matches, period).map((match) => {
      const opponent = cloudProfiles.find((profile) => profile.id === match.opponentId);

      return {
        match,
        opponentName: opponent?.name ?? "Saved player",
        opponentNickname: opponent ? getPlayerNickname(opponent) : "Saved player",
        opponentColor: opponent?.color ?? null,
        opponentAvatarUrl: opponent?.avatarUrl,
      };
    });
  }, [cloudProfiles, matches, period]);

  const loading = authLoading || profilesLoading || !hydrated;
  const sampleOpponent = cloudProfiles[0];
  const showSampleRow = visibleMatches.length === 0;

  return (
    <MobileAppShell title="Matches" className="match-play-page shell-page">
      <PlayScreenHero
        eyebrow="Matches"
        title="Match Performance"
        titleActions={
          <PillToggleGroup
            options={STATS_PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            ariaLabel="Match records time period"
            size="sm"
            className="match-play-page__period-toggle"
          />
        }
      />

      <section className="match-play-page__content">
        {!isCloudConfigured ? (
          <GlassPanel className="stats-panel">
            <p className="stats-panel__subtitle">Connect Supabase to track match records.</p>
          </GlassPanel>
        ) : null}

        {isCloudConfigured && !authLoading && !user ? (
          <GlassPanel className="stats-panel">
            <p className="stats-panel__subtitle">
              Sign in to view your match record against saved players.
            </p>
            <Link href={LOGIN_PATH} className="match-play-page__sign-in-link">
              Sign in
            </Link>
          </GlassPanel>
        ) : null}

        {isCloudConfigured && user && loading ? (
          <GlassPanel className="stats-panel">
            <p className="stats-panel__subtitle">Loading match records…</p>
          </GlassPanel>
        ) : null}

        {isCloudConfigured && user && !loading ? (
          <div className="match-history-list">
            {visibleMatches.map((entry) => (
              <MatchHistoryRow
                key={entry.match.id}
                match={entry.match}
                userNickname={userNickname}
                userName={userName}
                userColor={userColor}
                userAvatarUrl={userAvatarUrl}
                opponentNickname={entry.opponentNickname}
                opponentName={entry.opponentName}
                opponentColor={entry.opponentColor}
                opponentAvatarUrl={entry.opponentAvatarUrl}
              />
            ))}

            {showSampleRow ? (
              <>
                <MatchHistoryRow
                  sample
                  match={SAMPLE_MATCH}
                  userNickname={userNickname}
                  userName={userName}
                  userColor={userColor}
                  userAvatarUrl={userAvatarUrl}
                  opponentNickname={
                    sampleOpponent ? getPlayerNickname(sampleOpponent) : "Ace"
                  }
                  opponentName={sampleOpponent?.name ?? "Alex"}
                  opponentColor={sampleOpponent?.color ?? "#3b82f6"}
                  opponentAvatarUrl={sampleOpponent?.avatarUrl}
                />
                <p className="match-history-list__sample-note">
                  {matches.length > 0
                    ? "No matches in this period. Sample row shown for layout preview."
                    : cloudProfiles.length === 0
                      ? "Sample row for layout preview. Create saved players and play a match to start tracking results."
                      : "Sample row for layout preview. Play a match as your account profile against a saved player to record results."}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </MobileAppShell>
  );
}
