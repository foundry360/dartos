import type { ComponentType } from "react";
import { cn } from "@/utils/cn";
import type { ProfileAchievementIcon, ProfileActivityIcon } from "@/types/profile";

interface IconProps {
  className?: string;
}

function TargetIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrophyIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M5 5H3v1a3 3 0 0 0 3 3" />
      <path d="M19 5h2v1a3 3 0 0 1-3 3" />
    </svg>
  );
}

function FlameIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    >
      <path d="M12 3c2 3 4 4.5 4 7.5a4 4 0 1 1-8 0C8 7.5 10 6 12 3Z" />
      <path d="M12 14.5c1.5 1 2.5 2.2 2.5 3.8a2.5 2.5 0 1 1-5 0c0-1.6 1-2.8 2.5-3.8Z" />
    </svg>
  );
}

function CricketIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
      <path d="M8 7v10" />
      <path d="M16 7v10" />
      <path d="M12 7v10" />
    </svg>
  );
}

function BullIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LossIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 8 8 8" />
      <path d="m16 8-8 8" />
    </svg>
  );
}

export function ProfileOneEightyIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("profile-icon-glyph", className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.25" />
      <text
        x="12"
        y="12.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        stroke="none"
        fontSize="6.25"
        fontWeight="700"
        fontFamily="var(--font-heading), ui-sans-serif, system-ui, sans-serif"
      >
        180
      </text>
    </svg>
  );
}

const ACHIEVEMENT_ICONS = {
  trophy: TrophyIcon,
  target: TargetIcon,
  flame: FlameIcon,
  cricket: CricketIcon,
  bull: BullIcon,
} as const satisfies Record<ProfileAchievementIcon, ComponentType<IconProps>>;

const ACTIVITY_ICONS = {
  target: TargetIcon,
  loss: LossIcon,
  trophy: TrophyIcon,
  flame: FlameIcon,
} as const satisfies Record<ProfileActivityIcon, ComponentType<IconProps>>;

export function ProfileAchievementIconGlyph({
  icon,
  className,
}: {
  icon: ProfileAchievementIcon;
  className?: string;
}) {
  const Icon = ACHIEVEMENT_ICONS[icon];
  return <Icon className={cn("profile-icon-glyph", className)} />;
}

export function ProfileActivityIconGlyph({
  icon,
  className,
}: {
  icon: ProfileActivityIcon;
  className?: string;
}) {
  const Icon = ACTIVITY_ICONS[icon];
  return <Icon className={cn("profile-icon-glyph", className)} />;
}
