"use client";

import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { HomeGameModeGrid } from "@/features/home/components/HomeGameModeGrid";
import { HomeIPhoneGreeting } from "@/features/home/components/HomeIPhoneGreeting";
import { HomeRecentMatches } from "@/features/home/components/HomeRecentMatches";
import { HomeResumeMatchCard } from "@/features/home/components/HomeResumeMatchCard";
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
            <HomeGameModeGrid />
            <HomeResumeMatchCard match={activeMatch} />
            <aside className="home-screen__aside home-screen__aside--iphone">
              <HomeRecentMatches />
            </aside>
          </div>
        ) : (
          <div className="home-screen__layout">
            <div className="home-screen__main">
              <HomeResumeMatchCard match={activeMatch} />
              <HomeGameModeGrid />
            </div>

            <aside className="home-screen__aside">
              <HomeRecentMatches />
            </aside>
          </div>
        )}
      </div>
    </MobileAppShell>
  );
}
