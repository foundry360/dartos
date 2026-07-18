"use client";

import type { ReactNode } from "react";
import { AppBrandLogo } from "@/components/layout/AppBrandLogo";
import { AppChrome } from "@/components/layout/AppChrome";
import { cn } from "@/utils/cn";

interface MobileAppShellProps {
  title?: ReactNode;
  /** When set, replaces the hamburger with a back control to this href. */
  backHref?: string;
  /** Optional label shown beside the back arrow (not the centered title). */
  backLabel?: string;
  backAriaLabel?: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  lockViewport?: boolean;
}

export function MobileAppShell({
  title = <AppBrandLogo />,
  backHref,
  backLabel,
  backAriaLabel,
  headerContent,
  children,
  className,
  lockViewport = false,
}: MobileAppShellProps) {
  return (
    <AppChrome
      title={title}
      backHref={backHref}
      backLabel={backLabel}
      backAriaLabel={backAriaLabel}
      headerContent={headerContent}
      className={cn(lockViewport && "mobile-app-shell--locked", className)}
    >
      <main
        className={cn(
          "mobile-app-shell__main",
          lockViewport && "mobile-app-shell__main--locked",
        )}
      >
        {children}
      </main>
    </AppChrome>
  );
}
