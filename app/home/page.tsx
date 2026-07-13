"use client";

import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { HomeGameModeGrid } from "@/features/home/components/HomeGameModeGrid";
import { HomeHeaderProfile } from "@/features/home/components/HomeHeaderProfile";
import { HomeRecentMatches } from "@/features/home/components/HomeRecentMatches";
import { HomeResumeMatchCard } from "@/features/home/components/HomeResumeMatchCard";
import { useMostRecentActiveMatch } from "@/features/match-play/lib/use-active-match";
import "@/features/home/home-page.css";

export default function HomePage() {
  const activeMatch = useMostRecentActiveMatch();

  return (
    <MobileAppShell
      className="home-page shell-page"
      headerContent={<HomeHeaderProfile />}
    >
      <div className="home-screen">
        <div className="home-screen__layout">
          <div className="home-screen__main">
            <HomeResumeMatchCard match={activeMatch} />
            <HomeGameModeGrid />
          </div>

          <aside className="home-screen__aside">
            <HomeRecentMatches />
          </aside>
        </div>
      </div>
    </MobileAppShell>
  );
}
