import { cn } from "@/utils/cn";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  onBeforeChange?: (enabled: boolean) => void;
  label?: string;
  className?: string;
}

export function ToggleSwitch({
  enabled,
  onChange,
  onBeforeChange,
  label,
  className,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => {
        const next = !enabled;
        onBeforeChange?.(next);
        onChange(next);
      }}
      className={cn(
        "relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors duration-200",
        enabled ? "bg-accent" : "bg-surface-hover",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-0.5 size-7 rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out"
        style={{ left: enabled ? "1.375rem" : "0.125rem" }}
      />
    </button>
  );
}
