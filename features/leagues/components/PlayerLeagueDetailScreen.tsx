"use client";

import Link from "next/link";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { LEAGUE_PLAY_PATH } from "@/lib/auth/routes";
import "@/features/leagues/league-play.css";

export function PlayerLeagueDetailScreen() {
  return (
    <MobileAppShell
      className="shell-page league-play-page"
    >
      <div className="league-play-screen player-league-detail">
        <nav className="player-league-detail__breadcrumb" aria-label="Breadcrumb">
          <Link href={LEAGUE_PLAY_PATH} className="player-league-detail__crumb">
            My Leagues
          </Link>
          <span className="player-league-detail__crumb-sep">/</span>
          <span className="player-league-detail__crumb-current">League</span>
        </nav>

        <header className="player-league-detail__header">
          <h1 className="player-league-detail__title">League</h1>
          <p className="player-league-detail__subtitle">
            Standings, stats, and results are coming soon.
          </p>
        </header>

        <div
          className="player-league-detail__sections"
          role="tablist"
          aria-label="League sections"
        >
          <button
            type="button"
            className="player-league-detail__tab is-active"
            role="tab"
            aria-selected
          >
            Standings
          </button>
          <button
            type="button"
            className="player-league-detail__tab"
            role="tab"
            aria-selected={false}
          >
            Stats
          </button>
          <button
            type="button"
            className="player-league-detail__tab"
            role="tab"
            aria-selected={false}
          >
            Results
          </button>
        </div>

        <section className="player-league-detail__placeholder">
          <p className="league-play-screen__empty">
            This league page is a placeholder. Standings, stats, and results will
            appear here.
          </p>
        </section>
      </div>
    </MobileAppShell>
  );
}
