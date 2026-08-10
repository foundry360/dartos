"use client";

import Link from "next/link";
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppBrandLogo } from "@/components/layout/AppBrandLogo";
import { AppDrawer } from "@/components/layout/AppDrawer";
import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { MenuIcon } from "@/components/ui/MenuIcon";
import { HomeHeaderProfile } from "@/features/home/components/HomeHeaderProfile";
import { PlayerUpgradeModal } from "@/features/player-access/components/PlayerUpgradeModal";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import {
  appMenuItems,
  leagueProDrawerNavItems,
  shouldShowBottomNav,
  withLeagueNavItem,
} from "@/lib/app-navigation";
import { useLeagueTrayNavItem } from "@/features/leagues/hooks/useLeagueTrayNavItem";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { cn } from "@/utils/cn";
import { isPhoneLayoutDevice } from "@/utils/fullscreen";
import "@/features/home/home-page.css";

interface AppChromeProps {
  title?: ReactNode;
  /** When set, replaces the hamburger with a back control to this href. */
  backHref?: string;
  /** Optional label shown beside the back arrow (not the centered title). */
  backLabel?: string;
  backAriaLabel?: string;
  /** Extra trailing actions (shown before the persistent profile). Ignored on dartboard screens. */
  headerContent?: React.ReactNode;
  /**
   * Persistent greeting / avatar / notifications cluster.
   * Defaults to on except scoring screens.
   */
  showHeaderProfile?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function AppChrome({
  title = <AppBrandLogo />,
  backHref,
  backLabel,
  backAriaLabel = "Go back",
  headerContent,
  showHeaderProfile: showHeaderProfileProp,
  children,
  className,
  style,
}: AppChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isIPhone, setIsIPhone] = useState(false);
  const pathname = usePathname();
  const drawerId = useId();
  const boardThemePrimaryColor = useActiveBoardThemePrimaryColor();
  const showBottomNav = shouldShowBottomNav(className);
  const isScoringScreen = Boolean(className?.includes("scoring-layout-shell"));
  // Scoring chrome always uses brand primary — never board-theme / Classic kelly green.
  const themePrimaryColor = isScoringScreen
    ? APP_PRIMARY_COLOR
    : boardThemePrimaryColor;
  const showHeaderProfile =
    showHeaderProfileProp ?? !isScoringScreen;

  useEffect(() => {
    setIsIPhone(isPhoneLayoutDevice());
  }, []);
  const {
    item: leagueItem,
    listItem: leagueListItem,
    canManageLeagues,
  } = useLeagueTrayNavItem();
  // League Pro drawer matches the tray, plus Community + Support (drawer-only).
  const drawerItems =
    canManageLeagues && leagueListItem
      ? leagueProDrawerNavItems(leagueItem, leagueListItem)
      : withLeagueNavItem(appMenuItems, leagueItem);
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
        isIPhone && "mobile-app-root--iphone",
      )}
    >
      <div
        className={cn(
          "mobile-app-shell",
          showBottomNav && "mobile-app-shell--with-bottom-nav",
          className,
        )}
        style={
          {
            "--theme-primary-color": themePrimaryColor,
            ...style,
            // Scoring UI greens always win over board-theme / caller overrides.
            ...(isScoringScreen
              ? {
                  "--theme-primary-color": APP_PRIMARY_COLOR,
                  "--theme-mark-color": APP_PRIMARY_COLOR,
                  "--accent": APP_PRIMARY_COLOR,
                  "--ls-accent": APP_PRIMARY_COLOR,
                  "--ls-lime": APP_PRIMARY_COLOR,
                  "--ls-lime-bright": APP_PRIMARY_COLOR,
                }
              : null),
          } as CSSProperties
        }
      >
        <header
          className={cn(
            "mobile-app-shell__header",
            hasTrailing ? "mobile-app-shell__header--custom" : undefined,
            backHref && backLabel ? "mobile-app-shell__header--back-label" : undefined,
          )}
        >
          {backHref ? (
            <Link
              href={backHref}
              className={cn(
                "mobile-app-shell__back",
                backLabel
                  ? "mobile-app-shell__back--with-label"
                  : "mobile-app-shell__menu-button",
              )}
              aria-label={backAriaLabel}
            >
              <span className="mobile-app-shell__back-icon" aria-hidden>
                <ArrowLeftIcon className="h-5 w-5" />
              </span>
              {backLabel ? (
                <span className="mobile-app-shell__back-label">{backLabel}</span>
              ) : null}
            </Link>
          ) : (
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
          )}
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

        {backHref ? null : (
          <AppDrawer
            id={drawerId}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            items={drawerItems}
          />
        )}
      </div>

      {/* Outside overflow:hidden shell so the tray can flush to the iPad screen edge. */}
      {showBottomNav ? <BottomNav /> : null}

      {/* Club/Elite trial conversion prompt — same pattern as free league upgrade modal. */}
      <PlayerUpgradeModal variant="trial" />
    </div>
  );
}
