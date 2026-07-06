"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { cn } from "@/utils/cn";
import { TouchButton } from "@/components/ui/TouchButton";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backHref = APP_HOME_PATH, action }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 px-4 pb-4 pt-safe-top">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className="page-header__back flex h-[52px] w-[52px] shrink-0 items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeftIcon />
          </Link>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-3xl">{title}</h1>
          {subtitle ? (
            <p className="app-subheading mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </header>
  );
}

interface ActionBarProps {
  onMiss?: () => void;
  missDisabled?: boolean;
  onUndo?: () => void;
  onPrimary?: () => void;
  primaryLabel?: string;
  undoDisabled?: boolean;
  primaryDisabled?: boolean;
  className?: string;
}

export function ActionBar({
  onMiss,
  missDisabled,
  onUndo,
  onPrimary,
  primaryLabel = "Next",
  undoDisabled,
  primaryDisabled,
  className,
}: ActionBarProps) {
  const primaryThemeColor = useActiveBoardThemePrimaryColor();

  return (
    <div
      className={cn(
        "grid gap-2 px-0 pb-safe-bottom pt-1",
        onMiss ? "grid-cols-3" : "grid-cols-2",
        className,
      )}
    >
      {onMiss ? (
        <TouchButton
          variant="secondary"
          size="lg"
          className="min-h-[52px] whitespace-nowrap text-base"
          onClick={onMiss}
          disabled={missDisabled}
        >
          Miss
        </TouchButton>
      ) : null}
      <TouchButton
        variant="secondary"
        size="lg"
        className="min-h-[52px] whitespace-nowrap text-base"
        onClick={onUndo}
        disabled={undoDisabled}
      >
        Undo
      </TouchButton>
      <TouchButton
        size="lg"
        className="min-h-[52px] whitespace-nowrap text-base"
        accentColor={primaryThemeColor}
        onClick={onPrimary}
        disabled={primaryDisabled}
      >
        {primaryLabel}
      </TouchButton>
    </div>
  );
}
