import { cn } from "@/utils/cn";

interface StepperControlProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

export function StepperControl({ value, min, max, onChange, className }: StepperControlProps) {
  return (
    <div className={cn("stepper-control", className)}>
      <button
        type="button"
        className="stepper-control__button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="stepper-control__value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="stepper-control__button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
