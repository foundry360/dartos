import { cn } from "@/utils/cn";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  className?: string;
}

export function ToggleSwitch({ enabled, onChange, label, className }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors",
        enabled ? "bg-accent" : "bg-surface-hover",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-7 w-7 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
