import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface ScoringLayoutProps {
  sidebar: React.ReactNode;
  board: React.ReactNode;
  actions: React.ReactNode;
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
  className,
  swipeHandlers,
}: ScoringLayoutProps) {
  return (
    <div
      className={cn("scoring-layout mx-auto min-h-dvh w-full max-w-none", className)}
      {...swipeHandlers}
    >
      <div className="scoring-layout__sidebar">{sidebar}</div>

      <div className="scoring-layout__main">
        <div className="scoring-layout__board">{board}</div>
        <div className="scoring-layout__actions">{actions}</div>
      </div>
    </div>
  );
}
