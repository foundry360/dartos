"use client";

import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { HomeGameModeGrid } from "@/features/home/components/HomeGameModeGrid";
import { HomeHeaderProfile } from "@/features/home/components/HomeHeaderProfile";
import { HomeRecentMatches } from "@/features/home/components/HomeRecentMatches";
import { HomeResumeMatchCard } from "@/features/home/components/HomeResumeMatchCard";
import { useActiveMatch } from "@/features/home/lib/use-active-match";
import "@/features/home/home-page.css";

export default function HomePage() {
  const activeMatch = useActiveMatch();

  return (
    <MobileAppShell
      className="home-page shell-page"
      title="DartScorer"
      headerContent={<HomeHeaderProfile />}
    >
      <div className="home-screen">
        <div className="home-screen__layout">
          <div className="home-screen__main">
            {activeMatch ? <HomeResumeMatchCard match={activeMatch} /> : null}
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
