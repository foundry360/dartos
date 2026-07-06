"use client";

import { cn } from "@/utils/cn";

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  variant?: "control" | "heading";
  className?: string;
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  variant = "control",
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "segmented-tabs",
        variant === "heading" && "segmented-tabs--heading",
        className,
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn("segmented-tabs__tab", selected && "segmented-tabs__tab--active")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
