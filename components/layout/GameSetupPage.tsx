"use client";

import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";

interface GameSetupPageProps {
  title: string;
  backHref?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function GameSetupPage({
  title,
  backHref: _backHref = APP_HOME_PATH,
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
