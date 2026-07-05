"use client";

import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayScreenHero } from "@/components/play/PlayScreenHero";
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
  backHref = "/",
  splitLayout = false,
  children,
  className,
}: GameSetupPageProps) {
  return (
    <MobileAppShell className="shell-page" hideHeader>
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
