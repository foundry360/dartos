"use client";

import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayScreenHero } from "@/components/play/PlayScreenHero";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";

interface GameSetupPageProps {
  title: string;
  backHref?: string;
  splitLayout?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function GameSetupPage({
  title,
  backHref = APP_HOME_PATH,
  splitLayout = false,
  children,
  className,
}: GameSetupPageProps) {
  return (
    <MobileAppShell className="shell-page">
      <PlayScreenHero backHref={backHref} title={title} centered />
      <div
        className={cn(
          "shell-page__body game-setup-page",
          splitLayout && "game-setup-page--split",
          className,
        )}
      >
        {children}
      </div>
    </MobileAppShell>
  );
}
