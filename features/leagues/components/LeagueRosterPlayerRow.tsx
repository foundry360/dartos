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
        <p className="league-roster__name-row">
          <span className="league-roster__name">{player.name}</span>
          {isVector ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/icon-192.png"
              alt=""
              title="Vector account"
              className="league-roster__vector-mark"
            />
          ) : null}
          <span className="league-roster__sep" aria-hidden>
            ·
          </span>
          <span className="league-roster__team">{player.team}</span>
        </p>
      </div>
    </li>
  );
}
