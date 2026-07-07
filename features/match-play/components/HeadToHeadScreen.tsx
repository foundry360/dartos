"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PillToggleGroup } from "@/components/ui/PillToggleGroup";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import { ActiveMatchRow } from "@/features/match-play/components/ActiveMatchRow";
import {
  filterMatchesByPeriod,
  formatMatchPlayedDate,
} from "@/features/match-play/lib/match-history-period";
import { resolveMatchOpponentNickname } from "@/features/match-play/lib/match-history-opponent";
import { formatMatchLegs } from "@/features/match-play/lib/format-match-type-with-legs";
import { useActiveMatch } from "@/features/match-play/lib/use-active-match";
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
}) {
  return (
    <GlassPanel className="match-history-row">
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

export function HeadToHeadScreen() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<StatsPeriod>("lifetime");
  const activeMatch = useActiveMatch();
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
      const opponentNickname = resolveMatchOpponentNickname(match, cloudProfiles, getPlayerNickname);

      return {
        match,
        opponentName: opponent?.name ?? opponentNickname,
        opponentNickname,
        opponentColor: opponent?.color ?? null,
        opponentAvatarUrl: opponent?.avatarUrl,
      };
    });
  }, [cloudProfiles, matches, period]);

  const activeOpponent = useMemo(() => {
    if (!activeMatch?.opponentProfileId) {
      return null;
    }

    return cloudProfiles.find((profile) => profile.id === activeMatch.opponentProfileId) ?? null;
  }, [activeMatch, cloudProfiles]);

  const loading = authLoading || profilesLoading || !hydrated;

  return (
    <MobileAppShell
      title="Matches"
      className="match-play-page shell-page"
      headerContent={
        <PillToggleGroup
          options={STATS_PERIOD_OPTIONS}
          value={period}
          onChange={setPeriod}
          ariaLabel="Match records time period"
          size="sm"
          className="match-play-page__period-toggle"
        />
      }
    >
      <section className="match-play-page__content">
        {isCloudConfigured && user && !loading ? (
          <div className="match-play-page__active-section">
            <h2 className="app-heading match-play-page__section-title">Active Matches</h2>
            {activeMatch ? (
              <div className="match-history-list">
                <ActiveMatchRow
                  match={activeMatch}
                  userNickname={userNickname}
                  userName={userName}
                  userColor={userColor}
                  userAvatarUrl={userAvatarUrl}
                  opponentNickname={
                    activeOpponent ? getPlayerNickname(activeOpponent) : activeMatch.opponentName
                  }
                  opponentDisplayName={activeOpponent?.name ?? activeMatch.opponentName}
                  opponentColor={activeOpponent?.color ?? activeMatch.opponentColor ?? null}
                  opponentAvatarUrl={activeOpponent?.avatarUrl ?? activeMatch.opponentAvatarUrl}
                />
              </div>
            ) : (
              <GlassPanel className="stats-panel match-play-page__empty-matches">
                <p className="stats-panel__subtitle match-play-page__empty-matches-text">
                  No active matches
                </p>
              </GlassPanel>
            )}
          </div>
        ) : null}

        {!isCloudConfigured ? (
          <GlassPanel className="stats-panel">
            <p className="stats-panel__subtitle">Connect Supabase to track completed match records.</p>
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
          <div className="match-play-page__history-section">
            <h2 className="app-heading match-play-page__section-title">Completed Matches</h2>
            {visibleMatches.length > 0 ? (
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
              </div>
            ) : (
              <GlassPanel className="stats-panel match-play-page__empty-matches">
                <p className="stats-panel__subtitle match-play-page__empty-matches-text">
                  No completed matches
                </p>
              </GlassPanel>
            )}
          </div>
        ) : null}
      </section>
    </MobileAppShell>
  );
}
