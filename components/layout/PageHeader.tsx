"use client";

import Link from "next/link";
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
              "mt-1 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl",
              "border border-border bg-surface-elevated text-muted-foreground transition-colors hover:text-foreground",
            )}
            aria-label="Go back"
          >
            ←
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
  onUndo?: () => void;
  onPrimary?: () => void;
  primaryLabel?: string;
  undoDisabled?: boolean;
  primaryDisabled?: boolean;
}

export function ActionBar({
  onUndo,
  onPrimary,
  primaryLabel = "Next",
  undoDisabled,
  primaryDisabled,
}: ActionBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-safe-bottom pt-2">
      <TouchButton variant="secondary" onClick={onUndo} disabled={undoDisabled}>
        Undo
      </TouchButton>
      <TouchButton onClick={onPrimary} disabled={primaryDisabled}>
        {primaryLabel}
      </TouchButton>
    </div>
  );
}
