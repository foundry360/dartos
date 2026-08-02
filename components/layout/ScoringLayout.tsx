"use client";

import type { CSSProperties, HTMLAttributes } from "react";
import { AppChrome } from "@/components/layout/AppChrome";
import { FullscreenButton } from "@/components/ui/FullscreenButton";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { cn } from "@/utils/cn";

interface ScoringLayoutProps {
  sidebar: React.ReactNode;
  board: React.ReactNode;
  actions?: React.ReactNode;
  boardHeader?: React.ReactNode;
  mainHeader?: React.ReactNode;
  mainToolbar?: React.ReactNode;
  showFullscreenButton?: boolean;
  className?: string;
  swipeHandlers?: HTMLAttributes<HTMLDivElement>;
}

/**
 * Board-first layout for scoring screens.
 * Portrait: compact sidebar on top, dartboard fills remaining height.
 * Landscape: sidebar left, dartboard dominates the right side.
 */
export function ScoringLayout({
  sidebar,
  board,
  actions,
  boardHeader,
  mainHeader,
  mainToolbar,
  showFullscreenButton = false,
  className,
  swipeHandlers,
}: ScoringLayoutProps) {
  return (
    <AppChrome
      className="scoring-layout-shell"
      style={
        {
          "--theme-primary-color": APP_PRIMARY_COLOR,
          "--theme-mark-color": APP_PRIMARY_COLOR,
          "--accent": APP_PRIMARY_COLOR,
          "--ls-accent": APP_PRIMARY_COLOR,
          "--ls-lime": APP_PRIMARY_COLOR,
          "--ls-lime-bright": APP_PRIMARY_COLOR,
        } as CSSProperties
      }
    >
      <div
        className={cn("scoring-layout mx-auto w-full max-w-none", className)}
        {...swipeHandlers}
      >
        <div className="scoring-layout__sidebar">
          <div className="scoring-layout__sidebar-inner">{sidebar}</div>
        </div>

        <div className="scoring-layout__main">
          {mainToolbar || showFullscreenButton ? (
            <div className="scoring-layout__toolbar">
              {mainToolbar}
              {showFullscreenButton ? <FullscreenButton /> : null}
            </div>
          ) : null}
          {mainHeader ? (
            <div className="scoring-layout__main-header">{mainHeader}</div>
          ) : null}
          <div className="scoring-layout__board">
            {boardHeader ? (
              <div className="scoring-layout__board-title">{boardHeader}</div>
            ) : null}
            <div className="scoring-layout__board-canvas">{board}</div>
          </div>
          {actions ? <div className="scoring-layout__actions">{actions}</div> : null}
        </div>
      </div>
    </AppChrome>
  );
}
