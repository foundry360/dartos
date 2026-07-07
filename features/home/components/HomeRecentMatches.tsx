"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { HomeRecentMatchDartboard } from "@/features/home/components/HomeRecentMatchDartboard";
import { formatRelativeTime } from "@/features/home/lib/format-relative-time";
import { getHomeRecentMatchesPreview } from "@/features/home/lib/home-recent-matches-sample";
import { useSavedPlayerProfiles } from "@/features/players/hooks/useSavedPlayerProfiles";
import type { MatchHistoryEntry } from "@/features/match-play/store/match-history-store";
import { useMatchHistoryStore } from "@/features/match-play/store/match-history-store";
import { cn } from "@/utils/cn";

function getPlayerNickname(profile: { nickname?: string | null; name: string }) {
  return profile.nickname?.trim() || profile.name;
}

function formatResult(match: MatchHistoryEntry) {
  const verb = match.userWon ? "WON" : "LOST";
  return `${verb} ${match.userLegs}–${match.opponentLegs}`;
}

interface HomeRecentMatchRowProps {
  match: MatchHistoryEntry;
  userNickname: string;
  opponentNickname: string;
}

function HomeRecentMatchRow({ match, userNickname, opponentNickname }: HomeRecentMatchRowProps) {
  const isWin = match.userWon;

  return (
    <div className="home-recent-match">
      <HomeRecentMatchDartboard />

      <div className="home-recent-match__copy">
        <p className="home-recent-match__title">
          {userNickname} <span className="home-recent-match__versus">vs</span> {opponentNickname}
        </p>
        <p className="home-recent-match__meta">
          <span>{match.matchType}</span>
          <span aria-hidden>•</span>
          <span>{formatRelativeTime(match.playedAt)}</span>
        </p>
      </div>

      <span
        className={cn(
          "home-recent-match__result",
          isWin ? "home-recent-match__result--win" : "home-recent-match__result--loss",
        )}
      >
        {formatResult(match)}
      </span>
    </div>
  );
}

export function HomeRecentMatches() {
  const { user, loading: authLoading } = useAuth();
  const matches = useMatchHistoryStore((state) => state.matches);
  const hydrated = useMatchHistoryStore((state) => state.hydrated);
  const {
    accountProfile,
    cloudProfiles,
    loading: profilesLoading,
    isCloudConfigured,
  } = useSavedPlayerProfiles();

  const userNickname = accountProfile ? getPlayerNickname(accountProfile) : "You";

  const recentMatches = useMemo(() => {
    const resolved = matches.slice(0, 5).map((match) => {
      const opponent = cloudProfiles.find((profile) => profile.id === match.opponentId);

      return {
        match,
        opponentNickname: opponent ? getPlayerNickname(opponent) : "Saved player",
      };
    });

    return getHomeRecentMatchesPreview(resolved);
  }, [cloudProfiles, matches]);

  const usingSampleData =
    process.env.NODE_ENV === "development" && matches.length === 0 && recentMatches.length > 0;
  const loading = authLoading || profilesLoading || !hydrated;
  const showMatches = usingSampleData || (Boolean(user) && isCloudConfigured && recentMatches.length > 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="home-section home-section--aside"
    >
      <div className="home-recent-matches">
        <div className="home-recent-matches__header">
          <h2 className="home-section__title">Recent Matches</h2>
          {recentMatches.length > 0 && !usingSampleData ? (
            <Link href="/match-play" className="home-section__link">
              View all
            </Link>
          ) : null}
        </div>

        {loading ? (
          <p className="home-recent-matches__empty">Loading matches…</p>
        ) : !showMatches && !user ? (
          <p className="home-recent-matches__empty">Sign in to track match history.</p>
        ) : !showMatches && !isCloudConfigured ? (
          <p className="home-recent-matches__empty">
            Configure Supabase to sync match history across devices.
          </p>
        ) : !showMatches ? (
          <p className="home-recent-matches__empty">
            No matches yet. Start your first match to begin tracking your stats.
          </p>
        ) : (
          <div className="home-recent-matches__list">
            {recentMatches.map(({ match, opponentNickname }) => (
              <HomeRecentMatchRow
                key={match.id}
                match={match}
                userNickname={userNickname}
                opponentNickname={opponentNickname}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
