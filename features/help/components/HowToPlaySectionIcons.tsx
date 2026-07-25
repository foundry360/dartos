import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface IconProps {
  className?: string;
}

function SectionIconShell({
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("how-to-play-modal__section-icon-svg", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Target / bull — Objective */
export function HowToPlayObjectiveIcon({ className }: IconProps) {
  return (
    <SectionIconShell className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </SectionIconShell>
  );
}

/** List / play — How to Play */
export function HowToPlayRulesIcon({ className }: IconProps) {
  return (
    <SectionIconShell className={className}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </SectionIconShell>
  );
}

/** Trophy — Winning */
export function HowToPlayWinningIcon({ className }: IconProps) {
  return (
    <SectionIconShell className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </SectionIconShell>
  );
}

/** Lightbulb — Strategy Tips */
export function HowToPlayTipsIcon({ className }: IconProps) {
  return (
    <SectionIconShell className={className}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </SectionIconShell>
  );
}
