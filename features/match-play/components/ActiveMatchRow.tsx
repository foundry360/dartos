"use client";

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ActiveMatchSummary } from "@/features/match-play/lib/use-active-match";
import { APP_PRIMARY_COLOR } from "@/lib/theme";

interface ActiveMatchRowProps {
  match: ActiveMatchSummary;
  userNickname: string;
  userName: string;
  userColor: string;
  userAvatarUrl?: string | null;
  opponentNickname: string;
  opponentDisplayName: string;
  opponentColor: string | null;
  opponentAvatarUrl?: string | null;
  /** iPhone Matches: cap displayed nicknames at 8 characters. */
  truncateNames?: boolean;
  opaque?: boolean;
}

function truncateMatchPlayerName(name: string, enabled: boolean, maxLength = 8) {
  const trimmed = name.trim();
  if (!enabled || trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}

export function ActiveMatchRow({
  match,
  userNickname,
  userName,
  userColor,
  userAvatarUrl,
  opponentNickname,
  opponentDisplayName,
  opponentColor,
  opponentAvatarUrl,
  truncateNames = false,
  opaque = false,
}: ActiveMatchRowProps) {
  const userDisplayName = truncateMatchPlayerName(userNickname, truncateNames);
  const opponentLabel = truncateMatchPlayerName(opponentNickname, truncateNames);

  return (
    <GlassPanel opaque={opaque} className="match-history-row match-history-row--active">
      <div className="match-history-row__player match-history-row__player--user">
        <PlayerAvatar name={userName} color={userColor} avatarUrl={userAvatarUrl} />
        <span className="match-history-row__name" title={userNickname}>
          {userDisplayName}
        </span>
      </div>

      <div className="match-history-row__meta">
        <span className="match-history-row__type">
          {match.matchType}
          <span className="match-history-row__legs"> • {match.progress}</span>
        </span>
        <Link href={match.href} className="match-history-row__continue">
          Continue Match
        </Link>
      </div>

      <div className="match-history-row__player match-history-row__player--opponent">
        <span className="match-history-row__name" title={opponentNickname}>
          {opponentLabel}
        </span>
        <PlayerAvatar
          name={opponentDisplayName}
          color={opponentColor ?? APP_PRIMARY_COLOR}
          avatarUrl={opponentAvatarUrl}
        />
      </div>
    </GlassPanel>
  );
}
