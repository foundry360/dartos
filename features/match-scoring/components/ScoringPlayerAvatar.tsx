"use client";

import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { CountryFlag } from "@/features/community/components/CountryFlag";
import { cn } from "@/utils/cn";

interface ScoringPlayerAvatarProps {
  name: string;
  color: string;
  avatarUrl?: string | null;
  countryCode?: string | null;
  size?: "sm" | "md";
  className?: string;
  wrapClassName?: string;
  /** Show flag on the avatar badge (default false — prefer next to name). */
  flagOnAvatar?: boolean;
}

/** Player avatar with optional country flag badge. */
export function ScoringPlayerAvatar({
  name,
  color,
  avatarUrl,
  countryCode,
  size = "md",
  className,
  wrapClassName,
  flagOnAvatar = false,
}: ScoringPlayerAvatarProps) {
  return (
    <span className={cn("league-scoring__player-avatar-wrap", wrapClassName)}>
      <PlayerAvatar
        name={name}
        color={color}
        avatarUrl={avatarUrl ?? undefined}
        size={size}
        className={className}
      />
      {flagOnAvatar ? (
        <CountryFlag
          countryCode={countryCode}
          className="league-scoring__player-flag"
          title="Country"
          size={18}
        />
      ) : null}
    </span>
  );
}

interface ScoringPlayerNameProps {
  name: string;
  countryCode?: string | null;
  className?: string;
}

/** Player name with optional country flag beside it. */
export function ScoringPlayerName({
  name,
  countryCode,
  className,
}: ScoringPlayerNameProps) {
  return (
    <span className={cn("league-scoring__player-name-row", className)}>
      <span className="league-scoring__player-name">{name}</span>
      <CountryFlag
        countryCode={countryCode}
        className="league-scoring__name-flag"
        title="Country"
        size={18}
      />
    </span>
  );
}
