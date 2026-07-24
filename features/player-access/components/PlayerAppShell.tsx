"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { AppBrandLogo } from "@/components/layout/AppBrandLogo";
import { AppMenuItemIcon } from "@/components/ui/AppMenuIcons";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { PlayerUpgradeModal } from "@/features/player-access/components/PlayerUpgradeModal";
import {
  PLAYER_ACCOUNT_PATH,
  PLAYER_DISCOVER_PATH,
  PLAYER_HOME_PATH,
} from "@/lib/auth/routes";
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
      pathname.startsWith(`${PLAYER_HOME_PATH}/leagues`)
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

interface PlayerAppShellProps {
  title?: ReactNode;
  backHref?: string;
  children: ReactNode;
  className?: string;
}

export function PlayerAppShell({
  title = <AppBrandLogo />,
  backHref,
  children,
  className,
}: PlayerAppShellProps) {
  const pathname = usePathname();
  const themePrimaryColor = useActiveBoardThemePrimaryColor();

  useEffect(() => {
    document.body.classList.add("app-has-bottom-nav");
    return () => {
      document.body.classList.remove("app-has-bottom-nav");
    };
  }, []);

  return (
    <div className="mobile-app-root mobile-app-root--with-bottom-nav player-access-root">
      <div
        className={cn(
          "mobile-app-shell mobile-app-shell--with-bottom-nav player-access-shell",
          className,
        )}
        style={{ "--theme-primary-color": themePrimaryColor } as CSSProperties}
      >
        <header className="mobile-app-shell__header">
          {backHref ? (
            <Link href={backHref} className="mobile-app-shell__back mobile-app-shell__menu-button" aria-label="Go back">
              ←
            </Link>
          ) : (
            <div className="mobile-app-shell__header-spacer" aria-hidden />
          )}
          <h1 className="mobile-app-shell__title">{title}</h1>
          <div className="mobile-app-shell__header-spacer" aria-hidden />
        </header>

        <main className="mobile-app-shell__main">{children}</main>
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
                "flex min-w-0 flex-1 items-center justify-center px-1 py-3.5 no-underline transition-colors",
                isActive
                  ? "text-[var(--primary)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                  isActive &&
                    "bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_28%,transparent),color-mix(in_srgb,var(--primary)_12%,transparent))]",
                )}
              >
                <AppMenuItemIcon name={item.icon} className="h-8 w-8 shrink-0" />
              </span>
            </Link>
          );
        })}
      </nav>

      <PlayerUpgradeModal />
    </div>
  );
}
