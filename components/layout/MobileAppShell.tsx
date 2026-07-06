"use client";

import { AppChrome } from "@/components/layout/AppChrome";
import { cn } from "@/utils/cn";

interface MobileAppShellProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  lockViewport?: boolean;
}

export function MobileAppShell({
  title = "DartScorer",
  children,
  className,
  lockViewport = false,
}: MobileAppShellProps) {
  return (
    <AppChrome
      title={title}
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
