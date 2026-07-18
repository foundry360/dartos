import type { ComponentType } from "react";
import { cn } from "@/utils/cn";
import type { SettingsSectionId } from "@/features/settings/lib/settings-sections";

interface IconProps {
  className?: string;
}

function AppearanceSectionIcon({ className }: IconProps) {
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
      <path d="M12 3c-4.5 0-8 3.5-8 8s3.5 8 8 8 8-3.5 8-8-3.5-8-8-8Z" />
      <path d="M12 3v16" />
      <path d="M3 11h18" />
    </svg>
  );
}

function PreferencesSectionIcon({ className }: IconProps) {
  return <AppearanceSectionIcon className={className} />;
}

function GameplaySectionIcon({ className }: IconProps) {
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
      <path d="M6 11h4v4H6z" />
      <path d="M14 9h4v6h-4z" />
      <path d="M6 15v3a2 2 0 0 0 2 2h1" />
      <path d="M18 9V6a2 2 0 0 0-2-2h-1" />
      <path d="M10 7V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function PlayersSectionIcon({ className }: IconProps) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BillingSectionIcon({ className }: IconProps) {
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
      <path d="M19 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
      <path d="M16 11h.01" />
      <path d="M2 10h20" />
    </svg>
  );
}

function InstallSectionIcon({ className }: IconProps) {
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
      <path d="M12 3v12" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

function AccountSectionIcon({ className }: IconProps) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

const SECTION_ICONS = {
  preferences: PreferencesSectionIcon,
  gameplay: GameplaySectionIcon,
  players: PlayersSectionIcon,
  billing: BillingSectionIcon,
  install: InstallSectionIcon,
  account: AccountSectionIcon,
} as const satisfies Record<SettingsSectionId, ComponentType<IconProps>>;

export function SettingsSectionIcon({
  section,
  className,
}: {
  section: SettingsSectionId;
  className?: string;
}) {
  const Icon = SECTION_ICONS[section];
  return <Icon className={className} />;
}
