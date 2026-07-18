import { cn } from "@/utils/cn";

interface MatchDeskIconProps {
  className?: string;
}

/** Left control panel — opens Match Desk from live scoring. */
export function MatchDeskIcon({ className }: MatchDeskIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M14 8h4" />
      <path d="M14 12h4" />
      <path d="M14 16h4" />
    </svg>
  );
}
