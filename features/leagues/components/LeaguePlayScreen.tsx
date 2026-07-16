"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { LeagueHeaderProfile } from "@/features/leagues/components/LeagueHeaderProfile";
import { MyLeagueCard } from "@/features/leagues/components/MyLeagueCard";
import { useMyRegisteredLeagues } from "@/features/leagues/hooks/useMyRegisteredLeagues";
import { getPlayerLeagueStatus } from "@/features/leagues/lib/league-formats";
import type { LeagueWithVenue } from "@/lib/supabase/queries/leagues";
import "@/features/leagues/league-play.css";

type LeaguePlayTab = "leagues" | "tournaments";

const LEAGUE_PLAY_TABS: Array<{ value: LeaguePlayTab; label: string }> = [
  { value: "leagues", label: "My Leagues" },
  { value: "tournaments", label: "My Tournaments" },
];

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="my-league-section__icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function UpcomingSectionIcon() {
  return (
    <SectionIcon>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M12 14v4" />
      <path d="M10 16h4" />
    </SectionIcon>
  );
}

function CompletedSectionIcon() {
  return (
    <SectionIcon>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </SectionIcon>
  );
}

function MyLeagueSection({
  title,
  icon,
  leagues,
  empty,
}: {
  title: string;
  icon: ReactNode;
  leagues: LeagueWithVenue[];
  empty: ReactNode;
}) {
  return (
    <section className="my-league-section">
      <h2 className="my-league-section__heading">
        {icon}
        <span>{title}</span>
      </h2>
      {leagues.length > 0 ? (
        <div className="my-league-list">
          {leagues.map((entry) => (
            <MyLeagueCard key={entry.league.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="my-league-section__empty">{empty}</div>
      )}
    </section>
  );
}

export function LeaguePlayScreen() {
  const [tab, setTab] = useState<LeaguePlayTab>("leagues");
  const { leagues, loading, error } = useMyRegisteredLeagues();

  const { upcoming, completed } = useMemo(() => {
    const nextUpcoming: LeagueWithVenue[] = [];
    const nextCompleted: LeagueWithVenue[] = [];

    for (const entry of leagues) {
      if (getPlayerLeagueStatus(entry.league) === "completed") {
        nextCompleted.push(entry);
      } else {
        nextUpcoming.push(entry);
      }
    }

    return { upcoming: nextUpcoming, completed: nextCompleted };
  }, [leagues]);

  return (
    <MobileAppShell
      className="shell-page league-play-page"
      headerContent={<LeagueHeaderProfile />}
    >
      <div className="league-play-screen">
        <SegmentedTabs
          ariaLabel="My leagues or my tournaments"
          options={LEAGUE_PLAY_TABS}
          value={tab}
          onChange={setTab}
          className="league-play-screen__tabs"
        />

        {tab === "leagues" ? (
          loading ? (
            <div className="league-play-screen__empty-state">
              <p className="league-play-screen__empty">Loading your leagues…</p>
            </div>
          ) : error ? (
            <div className="league-play-screen__empty-state">
              <p className="league-play-screen__empty" role="alert">
                {error}
              </p>
            </div>
          ) : (
            <div className="my-league-sections">
              <MyLeagueSection
                title="Upcoming Leagues"
                icon={<UpcomingSectionIcon />}
                leagues={upcoming}
                empty={
                  <>
                    <p className="my-league-section__empty-title">
                      Your league season starts here.
                    </p>
                    <p className="my-league-section__empty-copy">
                      Register for a league to access schedules, standings, match
                      history, and season performance, all from one place.
                    </p>
                  </>
                }
              />
              <MyLeagueSection
                title="Completed Leagues"
                icon={<CompletedSectionIcon />}
                leagues={completed}
                empty={
                  <p className="my-league-section__empty-copy">
                    There are no completed leagues.
                  </p>
                }
              />
            </div>
          )
        ) : (
          <div className="league-play-screen__empty-state">
            <h2 className="league-play-screen__heading">Your tournaments</h2>
            <p className="league-play-screen__empty">
              Upcoming and past tournaments will show up here.
            </p>
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}
