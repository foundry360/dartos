import { cn } from "@/utils/cn";

export interface PillToggleOption<T extends string> {
  value: T;
  label: string;
}

interface PillToggleGroupProps<T extends string> {
  options: PillToggleOption<T>[];
  value: T | "";
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  layout?: "inline" | "grid";
  className?: string;
}

export function PillToggleGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  layout = "inline",
  className,
}: PillToggleGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "pill-toggle-group",
        size === "sm" && "pill-toggle-group--sm",
        layout === "grid" && "pill-toggle-group--grid",
        className,
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn("pill-toggle", selected && "pill-toggle--active")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
