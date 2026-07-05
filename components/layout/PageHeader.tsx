"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/ArrowLeftIcon";
import { cn } from "@/utils/cn";
import { TouchButton } from "@/components/ui/TouchButton";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backHref = "/", action }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 px-4 pb-4 pt-safe-top">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className={cn(
              "flex h-[52px] w-[52px] shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
            )}
            aria-label="Go back"
          >
            <ArrowLeftIcon />
          </Link>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
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
  return (
    <div
      className={cn(
        "grid gap-2 px-0 pb-safe-bottom pt-2",
        onMiss ? "grid-cols-3" : "grid-cols-2",
        className,
      )}
    >
      {onMiss ? (
        <TouchButton variant="secondary" size="md" onClick={onMiss} disabled={missDisabled}>
          Miss
        </TouchButton>
      ) : null}
      <TouchButton variant="secondary" size="md" onClick={onUndo} disabled={undoDisabled}>
        Undo
      </TouchButton>
      <TouchButton size="md" onClick={onPrimary} disabled={primaryDisabled}>
        {primaryLabel}
      </TouchButton>
    </div>
  );
}
