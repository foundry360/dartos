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
  label,
}: HomeGameModeIconProps & { label: string }) {
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

/** Classic Formats — dartboard with segment lines. */
export function HomeClassicGamesGameModeIcon({ className }: HomeGameModeIconProps) {
  return (
    <HomeGameModeIconShell className={className}>
      <circle cx="12" cy="12" r="9.25" />
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="2.75" x2="12" y2="21.25" />
      <line x1="2.75" y1="12" x2="21.25" y2="12" />
      <line x1="5.1" y1="5.1" x2="18.9" y2="18.9" />
      <line x1="18.9" y1="5.1" x2="5.1" y2="18.9" />
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
    case "301":
      return <HomeX01GameModeIcon label="301" />;
    case "501":
      return <HomeX01GameModeIcon label="501" />;
    case "701":
      return <HomeX01GameModeIcon label="701" />;
    case "classic-games":
      return <HomeClassicGamesGameModeIcon />;
    case "practice":
      return <HomePracticeGameModeIcon />;
    default:
      return <HomeCricketGameModeIcon />;
  }
}
