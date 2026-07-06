import { cn } from "@/utils/cn";

interface ValueSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  hint?: string;
  className?: string;
}

export function ValueSlider({
  label,
  value,
  min,
  max,
  onChange,
  hint,
  className,
}: ValueSliderProps) {
  return (
    <div className={cn("value-slider", className)}>
      <div className="value-slider__header">
        <span className="value-slider__label">{label}</span>
        <span className="value-slider__value">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="value-slider__input"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      />
      <div className="value-slider__ticks">
        <span>{min}</span>
        {hint ? <span className="value-slider__hint">{hint}</span> : <span aria-hidden />}
        <span>{max}</span>
      </div>
    </div>
  );
}
