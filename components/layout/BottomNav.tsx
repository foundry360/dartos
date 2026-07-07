"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppMenuItemIcon } from "@/components/ui/AppMenuIcons";
import { bottomNavItems, isAppNavItemActive } from "@/lib/app-navigation";
import { cn } from "@/utils/cn";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="z-30 flex shrink-0 border-t border-border bg-black pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      {bottomNavItems.map((item) => {
        const isActive = isAppNavItemActive(pathname, item.href);

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
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                isActive &&
                  "bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_28%,transparent),color-mix(in_srgb,var(--primary)_12%,transparent))]",
              )}
            >
              <AppMenuItemIcon name={item.icon} className="h-7 w-7 shrink-0" />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
