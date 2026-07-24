"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppBrandLogo } from "@/components/layout/AppBrandLogo";
import { AppMenuItemIcon } from "@/components/ui/AppMenuIcons";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { MenuIcon } from "@/components/ui/MenuIcon";
import {
  NotificationsBellButton,
  NotificationsPanel,
} from "@/features/notifications/components/NotificationsPanel";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { getUserDisplayName } from "@/features/players/lib/account-player-profile";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { PlayerAppDrawer } from "@/features/player-access/components/PlayerAppDrawer";
import { PlayerUpgradeModal } from "@/features/player-access/components/PlayerUpgradeModal";
import {
  PLAYER_ACCOUNT_PATH,
  PLAYER_DISCOVER_PATH,
  PLAYER_HOME_PATH,
  PLAYER_MESSAGES_PATH,
  PLAYER_MY_LEAGUES_PATH,
  PLAYER_PATH_PREFIX,
} from "@/lib/auth/routes";
import { isInstalledPwa, isIPhoneDevice } from "@/utils/fullscreen";
import { cn } from "@/utils/cn";
import "@/features/home/home-page.css";
import "@/features/player-access/player-access.css";

const PLAYER_NAV = [
  { label: "Leagues", href: PLAYER_HOME_PATH, icon: "leagues" as const },
  { label: "Discover", href: PLAYER_DISCOVER_PATH, icon: "search" as const },
  { label: "Account", href: PLAYER_ACCOUNT_PATH, icon: "profile" as const },
];

function isNavActive(pathname: string, href: string) {
  if (href === PLAYER_HOME_PATH) {
    return (
      pathname === PLAYER_HOME_PATH ||
      pathname === PLAYER_MY_LEAGUES_PATH ||
      pathname.startsWith(`${PLAYER_PATH_PREFIX}/leagues`)
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

interface PlayerAppShellProps {
  /** Screen heading shown below the logo header. */
  heading?: ReactNode;
  backHref?: string;
  children: ReactNode;
  className?: string;
}

export function PlayerAppShell({
  heading,
  backHref,
  children,
  className,
}: PlayerAppShellProps) {
  const pathname = usePathname();
  const drawerId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [iphoneMessagesScreen, setIphoneMessagesScreen] = useState(false);
  const [installedPwa, setInstalledPwa] = useState(false);
  const { user } = useAuth();
  const displayName = useProfileStore((state) => state.displayName);
  const resolvedName = getUserDisplayName(user, displayName);
  const themePrimaryColor = useActiveBoardThemePrimaryColor();

  useEffect(() => {
    setIphoneMessagesScreen(isIPhoneDevice());
    setInstalledPwa(isInstalledPwa());
  }, []);

  useEffect(() => {
    document.body.classList.add("app-has-bottom-nav");
    return () => {
      document.body.classList.remove("app-has-bottom-nav");
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
        "mobile-app-root mobile-app-root--with-bottom-nav player-access-root",
        installedPwa && "player-access-root--standalone",
      )}
    >
      <div
        className={cn(
          "mobile-app-shell mobile-app-shell--with-bottom-nav player-access-shell",
          className,
        )}
        style={{ "--theme-primary-color": themePrimaryColor } as CSSProperties}
      >
        <header className="mobile-app-shell__header">
          {backHref ? (
            <Link
              href={backHref}
              className="mobile-app-shell__back mobile-app-shell__menu-button"
              aria-label="Go back"
            >
              <span className="mobile-app-shell__back-icon" aria-hidden>
                <ArrowLeftIcon className="h-5 w-5" />
              </span>
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
          <div className="mobile-app-shell__title" aria-label="VectorOS">
            <AppBrandLogo />
          </div>
          <div className="player-header-avatar">
            <ProfileAvatar
              user={user}
              displayName={resolvedName}
              className="player-header-avatar__image"
              interactive
            />
          </div>
        </header>

        {iphoneMessagesScreen ? null : <NotificationsPanel />}

        <main className="mobile-app-shell__main">
          {heading ? <h1 className="player-screen-heading">{heading}</h1> : null}
          {children}
        </main>

        {backHref ? null : (
          <PlayerAppDrawer
            id={drawerId}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      <nav className="bottom-nav" aria-label="Player navigation">
        {PLAYER_NAV.map((item) => {
          const isActive = isNavActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "player-bottom-nav__item flex min-w-0 flex-1 items-center justify-center px-1 no-underline transition-colors",
                isActive
                  ? "text-[var(--primary)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  isActive &&
                    "bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_28%,transparent),color-mix(in_srgb,var(--primary)_12%,transparent))]",
                )}
              >
                <AppMenuItemIcon name={item.icon} className="h-7 w-7 shrink-0" />
              </span>
            </Link>
          );
        })}

        <div className="player-bottom-nav__item flex min-w-0 flex-1 items-center justify-center px-1">
          <NotificationsBellButton
            className={cn(
              "player-tray-notifications",
              pathname === PLAYER_MESSAGES_PATH && "text-[var(--primary)]",
            )}
            iconClassName="player-tray-notifications__icon"
            badgeClassName="player-tray-notifications__badge"
            href={iphoneMessagesScreen ? PLAYER_MESSAGES_PATH : undefined}
          />
        </div>
      </nav>

      <PlayerUpgradeModal />
    </div>
  );
}
