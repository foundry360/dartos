"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { cn } from "@/utils/cn";

interface PlayScreenHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  onBackClick?: () => void;
  className?: string;
}

export function PlayScreenHeader({
  title,
  subtitle,
  backHref = APP_HOME_PATH,
  backLabel = "Go back",
  onBackClick,
  className,
}: PlayScreenHeaderProps) {
  return (
    <header
      className={cn(
        "play-screen-header grid grid-cols-[52px_1fr_52px] items-center gap-2 landscape:pt-0",
        className,
      )}
    >
      {onBackClick ? (
        <button
          type="button"
          onClick={onBackClick}
          className="play-screen-header__back flex h-[52px] w-[52px] shrink-0 items-center justify-center"
          aria-label={backLabel}
        >
          <ArrowLeftIcon />
        </button>
      ) : (
        <Link
          href={backHref}
          className="play-screen-header__back flex h-[52px] w-[52px] shrink-0 items-center justify-center"
          aria-label={backLabel}
        >
          <ArrowLeftIcon />
        </Link>
      )}

      <div className="min-w-0 text-center">
        <h1 className="play-screen-header__title truncate">{title}</h1>
        {subtitle ? (
          <p className="play-screen-header__subtitle truncate">{subtitle}</p>
        ) : null}
      </div>

      <div aria-hidden className="h-[52px] w-[52px]" />
    </header>
  );
}
