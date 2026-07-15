"use client";

import { useState } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import "@/features/leagues/league-play.css";

type LeaguePlayTab = "leagues" | "tournaments";

const LEAGUE_PLAY_TABS: Array<{ value: LeaguePlayTab; label: string }> = [
  { value: "leagues", label: "Leagues" },
  { value: "tournaments", label: "Tournaments" },
];

export function LeaguePlayScreen() {
  const [tab, setTab] = useState<LeaguePlayTab>("leagues");

  return (
    <MobileAppShell className="shell-page league-play-page" title="Leagues & Tournaments">
      <div className="league-play-screen">
        <SegmentedTabs
          ariaLabel="Leagues or tournaments"
          options={LEAGUE_PLAY_TABS}
          value={tab}
          onChange={setTab}
          className="league-play-screen__tabs"
        />

        <div className="league-play-screen__empty-state">
          {tab === "leagues" ? (
            <>
              <h2 className="league-play-screen__heading">Your league season starts here.</h2>
              <p className="league-play-screen__empty">
                Register for a league to access schedules, standings, match history, and season
                performance, all from one place.
              </p>
            </>
          ) : (
            <>
              <h2 className="league-play-screen__heading">Your tournaments</h2>
              <p className="league-play-screen__empty">
                Upcoming and past tournaments will show up here.
              </p>
            </>
          )}
        </div>
      </div>
    </MobileAppShell>
  );
}
