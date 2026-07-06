import { cn } from "@/utils/cn";

interface TargetIconProps {
  className?: string;
}

export function TargetIcon({ className }: TargetIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface AvatarPlaceholderProps {
  className?: string;
  iconClassName?: string;
}

export function AvatarPlaceholder({ className, iconClassName }: AvatarPlaceholderProps) {
  return (
    <span className={cn("avatar-placeholder", className)}>
      <TargetIcon className={cn("avatar-placeholder__icon", iconClassName)} />
    </span>
  );
}
