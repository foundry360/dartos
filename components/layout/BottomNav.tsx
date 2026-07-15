"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppMenuItemIcon } from "@/components/ui/AppMenuIcons";
import { useLeagueTrayNavItem } from "@/features/leagues/hooks/useLeagueTrayNavItem";
import {
  bottomNavItems,
  isAppNavItemActive,
  withLeagueNavItem,
} from "@/lib/app-navigation";
import { cn } from "@/utils/cn";

export function BottomNav() {
  const pathname = usePathname();
  const { item: leagueItem } = useLeagueTrayNavItem();
  const items = withLeagueNavItem(bottomNavItems, leagueItem);

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => {
        const isActive = isAppNavItemActive(pathname, item.href);

        return (
          <Link
            key={`${item.icon}-${item.href}`}
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
  );
}
