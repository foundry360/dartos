import type { HTMLAttributes } from "react";
import { FullscreenButton } from "@/components/ui/FullscreenButton";
import { cn } from "@/utils/cn";

interface ScoringLayoutProps {
  sidebar: React.ReactNode;
  board: React.ReactNode;
  actions: React.ReactNode;
  mainHeader?: React.ReactNode;
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
  mainHeader,
  showFullscreenButton = true,
  className,
  swipeHandlers,
}: ScoringLayoutProps) {
  return (
    <div
      className={cn("scoring-layout mx-auto min-h-dvh w-full max-w-none", className)}
      {...swipeHandlers}
    >
      <div className="scoring-layout__sidebar">
        <div className="scoring-layout__sidebar-inner">{sidebar}</div>
      </div>

      <div className="scoring-layout__main">
        {showFullscreenButton ? (
          <div className="scoring-layout__fullscreen">
            <FullscreenButton />
          </div>
        ) : null}
        {mainHeader ? (
          <div className="scoring-layout__main-header">{mainHeader}</div>
        ) : null}
        <div className="scoring-layout__board">{board}</div>
        <div className="scoring-layout__actions">{actions}</div>
      </div>
    </div>
  );
}
