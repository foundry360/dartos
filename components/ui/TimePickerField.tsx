"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { FormField } from "@/components/ui/FormField";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";

const HOUR_12_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);
const PERIOD_OPTIONS = ["AM", "PM"] as const;

type DayPeriod = (typeof PERIOD_OPTIONS)[number];

interface TimeParts {
  hour: number;
  minute: number;
}

interface ClockParts {
  hour12: number;
  minute: number;
  period: DayPeriod;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function snapMinute(minute: number): number {
  return Math.min(55, Math.round(minute / 5) * 5);
}

function toClockParts(parts: TimeParts): ClockParts {
  const period: DayPeriod = parts.hour >= 12 ? "PM" : "AM";
  const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;

  return {
    hour12,
    minute: snapMinute(parts.minute),
    period,
  };
}

function to24Hour(hour12: number, period: DayPeriod): number {
  if (period === "AM") {
    return hour12 === 12 ? 0 : hour12;
  }

  return hour12 === 12 ? 12 : hour12 + 12;
}

function parseTimeValue(value: string): TimeParts | null {
  const match = value.trim().match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return { hour, minute };
}

function toTimeValue(parts: TimeParts): string {
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

function defaultParts(): TimeParts {
  const now = new Date();
  return {
    hour: now.getHours(),
    minute: snapMinute(now.getMinutes()),
  };
}

function formatDisplayValue(value: string): string | null {
  const parts = parseTimeValue(value);

  if (!parts) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(2000, 0, 1, parts.hour, parts.minute));
}

interface TimePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function scrollOptionIntoView(
  container: HTMLDivElement | null,
  optionValue: string | number,
) {
  if (!container) {
    return;
  }

  const option = container.querySelector<HTMLElement>(
    `[data-time-option="${optionValue}"]`,
  );

  option?.scrollIntoView({ block: "center", behavior: "instant" });
}

export function TimePickerField({
  label,
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
}: TimePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ClockParts>(() =>
    toClockParts(parseTimeValue(value) ?? defaultParts()),
  );
  const hourWheelRef = useRef<HTMLDivElement>(null);
  const minuteWheelRef = useRef<HTMLDivElement>(null);
  const periodWheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const next = toClockParts(parseTimeValue(value) ?? defaultParts());
    setDraft(next);

    const frame = window.requestAnimationFrame(() => {
      scrollOptionIntoView(hourWheelRef.current, next.hour12);
      scrollOptionIntoView(minuteWheelRef.current, next.minute);
      scrollOptionIntoView(periodWheelRef.current, next.period);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, value]);

  const displayValue = formatDisplayValue(value);

  const applyDraft = () => {
    onChange(
      toTimeValue({
        hour: to24Hour(draft.hour12, draft.period),
        minute: snapMinute(draft.minute),
      }),
    );
    setOpen(false);
  };

  return (
    <FormField label={label} className={className}>
      <button
        type="button"
        className={cn("form-field__picker", open && "form-field__picker--open")}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span
          className={cn(
            "form-field__picker-value",
            !displayValue && "form-field__picker-value--placeholder",
          )}
        >
          {displayValue ?? placeholder}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="form-field__picker-chevron"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>

      <BottomSheet
        open={open}
        title={label}
        onClose={() => setOpen(false)}
        className="datetime-picker-modal"
      >
        <div className="datetime-picker">
          <div className="time-picker-wheels" aria-label="Time">
            <div className="time-picker-wheels__highlight" aria-hidden />

            <div className="time-picker-wheel-column">
              <span className="datetime-picker__time-label">Hour</span>
              <div
                ref={hourWheelRef}
                className="time-picker-wheel"
                role="listbox"
                aria-label="Hour"
              >
                <div className="time-picker-wheel__spacer" aria-hidden />
                {HOUR_12_OPTIONS.map((hour) => {
                  const selected = draft.hour12 === hour;

                  return (
                    <button
                      key={hour}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-time-option={hour}
                      className={cn(
                        "time-picker-wheel__option",
                        selected && "time-picker-wheel__option--selected",
                      )}
                      onClick={() => {
                        setDraft((current) => ({ ...current, hour12: hour }));
                        scrollOptionIntoView(hourWheelRef.current, hour);
                      }}
                    >
                      {hour}
                    </button>
                  );
                })}
                <div className="time-picker-wheel__spacer" aria-hidden />
              </div>
            </div>

            <div className="time-picker-wheel-column">
              <span className="datetime-picker__time-label">Minute</span>
              <div
                ref={minuteWheelRef}
                className="time-picker-wheel"
                role="listbox"
                aria-label="Minute"
              >
                <div className="time-picker-wheel__spacer" aria-hidden />
                {MINUTE_OPTIONS.map((minute) => {
                  const selected = snapMinute(draft.minute) === minute;

                  return (
                    <button
                      key={minute}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-time-option={minute}
                      className={cn(
                        "time-picker-wheel__option",
                        selected && "time-picker-wheel__option--selected",
                      )}
                      onClick={() => {
                        setDraft((current) => ({ ...current, minute }));
                        scrollOptionIntoView(minuteWheelRef.current, minute);
                      }}
                    >
                      {pad2(minute)}
                    </button>
                  );
                })}
                <div className="time-picker-wheel__spacer" aria-hidden />
              </div>
            </div>

            <div className="time-picker-wheel-column">
              <span className="datetime-picker__time-label">AM/PM</span>
              <div
                ref={periodWheelRef}
                className="time-picker-wheel"
                role="listbox"
                aria-label="AM or PM"
              >
                <div className="time-picker-wheel__spacer" aria-hidden />
                {PERIOD_OPTIONS.map((period) => {
                  const selected = draft.period === period;

                  return (
                    <button
                      key={period}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-time-option={period}
                      className={cn(
                        "time-picker-wheel__option",
                        selected && "time-picker-wheel__option--selected",
                      )}
                      onClick={() => {
                        setDraft((current) => ({ ...current, period }));
                        scrollOptionIntoView(periodWheelRef.current, period);
                      }}
                    >
                      {period}
                    </button>
                  );
                })}
                <div className="time-picker-wheel__spacer" aria-hidden />
              </div>
            </div>
          </div>

          <div className="datetime-picker__actions">
            <TouchButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setOpen(false)}
            >
              Cancel
            </TouchButton>
            <TouchButton type="button" size="lg" onClick={applyDraft}>
              Apply
            </TouchButton>
          </div>
        </div>
      </BottomSheet>
    </FormField>
  );
}
