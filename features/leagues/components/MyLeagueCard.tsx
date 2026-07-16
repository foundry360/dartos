"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatLeagueDate,
  formatLeagueFormatDetailLabel,
  formatLeagueGameFormatLabel,
  formatLeagueTime,
  formatLeagueWeekday,
  formatPlayerLeagueStatusLabel,
  getPlayerLeagueStatus,
} from "@/features/leagues/lib/league-formats";
import type { LeagueWithVenue } from "@/lib/supabase/queries/leagues";
import { cn } from "@/utils/cn";

function MetaIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="my-league-card__icon"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function VenueIcon() {
  return (
    <MetaIcon>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </MetaIcon>
  );
}

function StartDateIcon() {
  return (
    <MetaIcon>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
    </MetaIcon>
  );
}

function EndDateIcon() {
  return (
    <MetaIcon>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </MetaIcon>
  );
}

function GameFormatIcon() {
  return (
    <MetaIcon>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </MetaIcon>
  );
}

function DayIcon() {
  return (
    <MetaIcon>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M12 14v4" />
      <path d="M10 16h4" />
    </MetaIcon>
  );
}

function TimeIcon() {
  return (
    <MetaIcon>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </MetaIcon>
  );
}

function LeagueFormatIcon() {
  return (
    <MetaIcon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </MetaIcon>
  );
}

function ViewLeagueArrowIcon() {
  return (
    <svg
      className="my-league-card__btn-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

interface MyLeagueCardProps {
  entry: LeagueWithVenue;
}

export function MyLeagueCard({ entry }: MyLeagueCardProps) {
  const { league, organization } = entry;
  const status = getPlayerLeagueStatus(league);
  const href = `/league-play/${league.id}`;

  const rows: Array<{ label: string; value: string; icon: ReactNode }> = [
    {
      label: "Venue",
      value: organization.name,
      icon: <VenueIcon />,
    },
    {
      label: "Start Date",
      value: formatLeagueDate(league.starts_at) ?? "TBD",
      icon: <StartDateIcon />,
    },
    {
      label: "End Date",
      value: formatLeagueDate(league.ends_at) ?? "TBD",
      icon: <EndDateIcon />,
    },
    {
      label: "Game Format",
      value: formatLeagueGameFormatLabel(league.game_format) ?? "TBD",
      icon: <GameFormatIcon />,
    },
    {
      label: "Day",
      value: formatLeagueWeekday(league.starts_at) ?? "TBD",
      icon: <DayIcon />,
    },
    {
      label: "Time",
      value: formatLeagueTime(league.starts_at) ?? "TBD",
      icon: <TimeIcon />,
    },
    {
      label: "League Format",
      value: formatLeagueFormatDetailLabel(league.format) ?? "TBD",
      icon: <LeagueFormatIcon />,
    },
  ];

  return (
    <article className="my-league-card">
      <div className="my-league-card__header">
        <h2 className="my-league-card__title">{league.name}</h2>
        <span
          className={cn(
            "my-league-card__status",
            `my-league-card__status--${status}`,
          )}
        >
          {formatPlayerLeagueStatusLabel(status)}
        </span>
      </div>

      <dl className="my-league-card__meta">
        {rows.map((row) => (
          <div key={row.label} className="my-league-card__row">
            <dt>
              <span className="sr-only">{row.label}</span>
              {row.icon}
            </dt>
            <dd title={row.label}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <Link href={href} className="my-league-card__cta">
        View League
        <ViewLeagueArrowIcon />
      </Link>
    </article>
  );
}
