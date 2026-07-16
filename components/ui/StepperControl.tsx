import { cn } from "@/utils/cn";

interface StepperControlProps {
  value: number | null;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  emptyLabel?: string;
}

export function StepperControl({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
  emptyLabel = "—",
}: StepperControlProps) {
  const amount = Math.max(1, step);

  return (
    <div className={cn("stepper-control", className)}>
      <button
        type="button"
        className="stepper-control__button"
        onClick={() =>
          onChange(
            value == null ? min : Math.max(min, value - amount),
          )
        }
        disabled={value != null && value <= min}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="stepper-control__value" aria-live="polite">
        {value == null ? emptyLabel : value}
      </span>
      <button
        type="button"
        className="stepper-control__button"
        onClick={() =>
          onChange(
            value == null ? min : Math.min(max, value + amount),
          )
        }
        disabled={value != null && value >= max}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
