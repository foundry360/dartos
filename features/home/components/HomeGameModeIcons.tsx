import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface HomeGameModeIconProps {
  className?: string;
}

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function HomeGameModeIconShell({
  className,
  children,
}: HomeGameModeIconProps & { children: ReactNode }) {
  return (
    <svg {...iconProps} className={cn("home-game-mode-icon", className)}>
      {children}
    </svg>
  );
}

/** Cricket / Tactics — traced from the landscape home mockup (no outer ring). */
export function HomeCricketGameModeIcon({ className }: HomeGameModeIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/home-cricket-icon.png"
      alt=""
      className={cn("home-game-mode-icon home-game-mode-icon--cricket", className)}
      aria-hidden
    />
  );
}

/** X01 — score inside a thin circle. */
export function HomeX01GameModeIcon({
  className,
  label = "X01",
}: HomeGameModeIconProps & { label?: string }) {
  return (
    <HomeGameModeIconShell className={className}>
      <circle cx="12" cy="12" r="9.25" />
      <text
        x="12"
        y="12.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        stroke="none"
        fontSize={label.length > 3 ? "7.25" : "8"}
        fontWeight="700"
        fontFamily="var(--font-heading), ui-sans-serif, system-ui, sans-serif"
      >
        {label}
      </text>
    </HomeGameModeIconShell>
  );
}

/** Bot Play — Lucide bot icon. */
export function HomeBotPlayGameModeIcon({ className }: HomeGameModeIconProps) {
  return (
    <HomeGameModeIconShell className={className}>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </HomeGameModeIconShell>
  );
}

/** Community Play — globe / earth. */
export function HomeCommunityPlayGameModeIcon({ className }: HomeGameModeIconProps) {
  return (
    <HomeGameModeIconShell className={className}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 2.75v18.5" />
      <path d="M2.75 12h18.5" />
      <path d="M12 2.75c2.8 2.6 4.4 5.9 4.4 9.25S14.8 18.65 12 21.25" />
      <path d="M12 2.75C9.2 5.35 7.6 8.65 7.6 12s1.6 6.65 4.4 9.25" />
      <path d="M4.1 7.4c2.5 1 5.1 1.5 7.9 1.5s5.4-.5 7.9-1.5" />
      <path d="M4.1 16.6c2.5-1 5.1-1.5 7.9-1.5s5.4.5 7.9 1.5" />
    </HomeGameModeIconShell>
  );
}

/** @deprecated Prefer HomeCommunityPlayGameModeIcon */
export function HomeOnlineLearningGameModeIcon({ className }: HomeGameModeIconProps) {
  return <HomeCommunityPlayGameModeIcon className={className} />;
}

/** Classic Formats — minimal dartboard (outer ring + bull only). */
export function HomeClassicGamesGameModeIcon({ className }: HomeGameModeIconProps) {
  return (
    <HomeGameModeIconShell className={className}>
      <circle cx="12" cy="12" r="9.25" />
      <circle cx="12" cy="12" r="2.25" />
    </HomeGameModeIconShell>
  );
}

/** Practice — target with dart (transparent PNG asset). */
export function HomePracticeGameModeIcon({ className }: HomeGameModeIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/home-practice-icon.png"
      alt=""
      className={cn("home-game-mode-icon home-game-mode-icon--practice", className)}
      aria-hidden
    />
  );
}

export function HomeGameModeIcon({ modeId }: { modeId: string }) {
  switch (modeId) {
    case "cricket":
      return <HomeCricketGameModeIcon />;
    case "x01":
      return <HomeX01GameModeIcon />;
    case "bot-play":
      return <HomeBotPlayGameModeIcon />;
    case "community-play":
    case "online-learning":
      return <HomeCommunityPlayGameModeIcon />;
    case "classic-games":
      return <HomeClassicGamesGameModeIcon />;
    case "practice":
      return <HomePracticeGameModeIcon />;
    default:
      return <HomeCricketGameModeIcon />;
  }
}
