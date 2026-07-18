"use client";

import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppBrandLogo } from "@/components/layout/AppBrandLogo";
import { AppDrawer } from "@/components/layout/AppDrawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { MenuIcon } from "@/components/ui/MenuIcon";
import { HomeHeaderProfile } from "@/features/home/components/HomeHeaderProfile";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import {
  appMenuItems,
  shouldShowBottomNav,
  withLeagueNavItem,
  withLeagueProPlayerCardNavItem,
} from "@/lib/app-navigation";
import { useLeagueTrayNavItem } from "@/features/leagues/hooks/useLeagueTrayNavItem";
import { cn } from "@/utils/cn";
import "@/features/home/home-page.css";

interface AppChromeProps {
  title?: ReactNode;
  /** Extra trailing actions (shown before the persistent profile). Ignored on dartboard screens. */
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function AppChrome({
  title = <AppBrandLogo />,
  headerContent,
  children,
  className,
  style,
}: AppChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const drawerId = useId();
  const themePrimaryColor = useActiveBoardThemePrimaryColor();
  const showBottomNav = shouldShowBottomNav(className);
  const isScoringScreen = Boolean(className?.includes("scoring-layout-shell"));
  const showHeaderProfile = !isScoringScreen;
  const {
    item: leagueItem,
    listItem: leagueListItem,
    canManageLeagues,
  } = useLeagueTrayNavItem();
  const drawerItems = (() => {
    const withLeagues = withLeagueNavItem(appMenuItems, leagueItem, leagueListItem);
    return canManageLeagues
      ? withLeagueProPlayerCardNavItem(withLeagues)
      : withLeagues;
  })();
  const hasTrailing = showHeaderProfile || Boolean(headerContent);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Match any remainder under the tray on iPad — never on auth/public pages.
    if (!showBottomNav) {
      return;
    }
    document.body.classList.add("app-has-bottom-nav");
    return () => {
      document.body.classList.remove("app-has-bottom-nav");
    };
  }, [showBottomNav]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div
      className={cn(
        "mobile-app-root",
        showBottomNav && "mobile-app-root--with-bottom-nav",
      )}
    >
      <div
        className={cn(
          "mobile-app-shell",
          showBottomNav && "mobile-app-shell--with-bottom-nav",
          className,
        )}
        style={{ "--theme-primary-color": themePrimaryColor, ...style } as CSSProperties}
      >
        <header
          className={cn(
            "mobile-app-shell__header",
            hasTrailing ? "mobile-app-shell__header--custom" : undefined,
          )}
        >
          <button
            type="button"
            className="mobile-app-shell__menu-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>
          {hasTrailing ? (
            <>
              <h1 className="mobile-app-shell__title">{title}</h1>
              <div className="mobile-app-shell__header-trailing">
                {headerContent}
                {showHeaderProfile ? <HomeHeaderProfile /> : null}
              </div>
            </>
          ) : (
            <>
              <h1 className="mobile-app-shell__title">{title}</h1>
              <div aria-hidden className="mobile-app-shell__header-spacer" />
            </>
          )}
        </header>

        {children}

        <AppDrawer
          id={drawerId}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={drawerItems}
        />
      </div>

      {/* Outside overflow:hidden shell so the tray can flush to the iPad screen edge. */}
      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
