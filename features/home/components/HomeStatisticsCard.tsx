"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

type HomeStat = {
  id: string;
  label: string;
  value: string;
  icon: ReactNode;
};

function StatIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="home-stats-card__icon-svg"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const HOME_STATS: HomeStat[] = [
  {
    id: "matches",
    label: "Matches Played",
    value: "84",
    icon: (
      <StatIcon>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
      </StatIcon>
    ),
  },
  {
    id: "wins",
    label: "Wins",
    value: "46",
    icon: (
      <StatIcon>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M17 4h2a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4" />
        <path d="M7 4H5a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4" />
      </StatIcon>
    ),
  },
  {
    id: "win-rate",
    label: "Win Rate",
    value: "55%",
    icon: (
      <StatIcon>
        <path d="M3 17 9 11l4 4 7-8" />
        <path d="M14 7h6v6" />
      </StatIcon>
    ),
  },
  {
    id: "current-streak",
    label: "Current Streak",
    value: "3 Wins",
    icon: (
      <StatIcon>
        <path d="M12 3c2 3 2 5 1 7 2 0 4 1 5 3-1 4-4 7-6 8-2-1-5-4-6-8 1-2 3-3 5-3-1-2-1-4 1-7Z" />
      </StatIcon>
    ),
  },
  {
    id: "best-game",
    label: "Best Game",
    value: "501",
    icon: (
      <StatIcon>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </StatIcon>
    ),
  },
  {
    id: "bullseyes",
    label: "Bullseyes",
    value: "128",
    icon: (
      <StatIcon>
        <path d="m12 3 1.8 5.5H19l-4.4 3.2 1.7 5.3L12 14.8 7.7 17l1.7-5.3L5 8.5h5.2L12 3Z" />
      </StatIcon>
    ),
  },
  {
    id: "highest-score",
    label: "Highest Score",
    value: "180",
    icon: (
      <StatIcon>
        <path d="M4 14h4l2-9 3 14 2-7h5" />
      </StatIcon>
    ),
  },
  {
    id: "practice-streak",
    label: "Practice Streak",
    value: "5 Days",
    icon: (
      <StatIcon>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
      </StatIcon>
    ),
  },
];

interface HomeStatisticsCardProps {
  className?: string;
}

export function HomeStatisticsCard({ className }: HomeStatisticsCardProps) {
  return (
    <section className={cn("home-stats-section", className)} aria-labelledby="home-stats-title">
      <div className="home-section__header home-stats-section__header">
        <h2 id="home-stats-title" className="home-section__title">
          Statistics
        </h2>
        <Link href="/statistics" className="home-section__link">
          View all
        </Link>
      </div>

      <ul className="home-stats-card__grid">
        {HOME_STATS.map((stat) => (
          <li key={stat.id} className="home-stats-card">
            <span className="home-stats-card__icon" aria-hidden>
              {stat.icon}
            </span>
            <div className="home-stats-card__copy">
              <span className="home-stats-card__value">{stat.value}</span>
              <span className="home-stats-card__label">{stat.label}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
