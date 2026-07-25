"use client";

import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { HomeDesktopPromoRow } from "@/features/home/components/HomeDesktopPromoRow";
import { HomeGameModeGrid } from "@/features/home/components/HomeGameModeGrid";
import { HomeIPhoneBanner } from "@/features/home/components/HomeIPhoneBanner";
import { HomeIPhoneGreeting } from "@/features/home/components/HomeIPhoneGreeting";
import { HomeRecentMatches } from "@/features/home/components/HomeRecentMatches";
import { HomeResumeMatchCard } from "@/features/home/components/HomeResumeMatchCard";
import { HomeStatisticsCard } from "@/features/home/components/HomeStatisticsCard";
import { useMostRecentActiveMatch } from "@/features/match-play/lib/use-active-match";
import { cn } from "@/utils/cn";
import { isIPhoneDevice } from "@/utils/fullscreen";
import "@/features/home/home-page.css";

export default function HomePage() {
  const activeMatch = useMostRecentActiveMatch();
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    setIsIPhone(isIPhoneDevice());
  }, []);

  return (
    <MobileAppShell
      className={cn("home-page shell-page", isIPhone && "home-page--iphone")}
    >
      <div className="home-screen">
        {isIPhone ? (
          <div className="home-screen__layout home-screen__layout--iphone">
            <HomeIPhoneGreeting />
            <HomeIPhoneBanner />
            <HomeGameModeGrid />
            <HomeStatisticsCard />
            <aside className="home-screen__aside home-screen__aside--iphone">
              <HomeResumeMatchCard match={activeMatch} />
              <HomeRecentMatches />
            </aside>
          </div>
        ) : (
          <div className="home-screen__layout">
            <div className="home-screen__main">
              <HomeDesktopPromoRow />
              <HomeGameModeGrid />
            </div>

            <aside className="home-screen__aside">
              <HomeResumeMatchCard match={activeMatch} />
              <HomeRecentMatches />
            </aside>
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}
