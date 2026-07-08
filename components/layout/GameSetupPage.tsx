"use client";

import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { cn } from "@/utils/cn";

interface GameSetupPageProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function GameSetupPage({
  title,
  subtitle,
  children,
  className,
}: GameSetupPageProps) {
  return (
    <MobileAppShell title={title} className="shell-page setup-page">
      <div className={cn("setup-page__body", className)}>
        {subtitle ? <p className="setup-page__subtitle">{subtitle}</p> : null}
        {children}
      </div>
    </MobileAppShell>
  );
}
