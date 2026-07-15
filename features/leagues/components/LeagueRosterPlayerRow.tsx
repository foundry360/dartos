"use client";

import type { SampleLeagueRosterPlayer } from "@/features/leagues/lib/sample-league-dashboard";
import { cn } from "@/utils/cn";

export function isVectorRosterAccount(
  status: SampleLeagueRosterPlayer["status"],
): boolean {
  return status === "connected";
}

interface LeagueRosterPlayerRowProps {
  player: SampleLeagueRosterPlayer;
}

export function LeagueRosterPlayerRow({ player }: LeagueRosterPlayerRowProps) {
  const isVector = isVectorRosterAccount(player.status);

  return (
    <li className="league-roster__row">
      <span
        className={cn(
          "league-roster__avatar",
          isVector
            ? "league-roster__avatar--primary"
            : "league-roster__avatar--muted",
        )}
      >
        {player.initials}
      </span>
      <div className="league-roster__copy">
        <p className="league-roster__name">{player.name}</p>
        <p className="league-roster__sub">
          {player.team}
          <span className="league-roster__sep" aria-hidden>
            ·
          </span>
          {isVector ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/icon-192.png"
              alt="Vector account"
              title="Vector account"
              className="league-roster__vector-mark"
            />
          ) : (
            <span className="league-roster__account">Guest</span>
          )}
        </p>
      </div>
    </li>
  );
}
