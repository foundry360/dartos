"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { FormField } from "@/components/ui/FormField";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseDateValue(value: string): DateParts | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return { year, month, day };
}

function toDateValue(parts: DateParts): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function partsToDate(parts: DateParts): Date {
  return new Date(parts.year, parts.month - 1, parts.day);
}

function dateToParts(date: Date): DateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatDisplayValue(value: string): string | null {
  const parts = parseDateValue(value);

  if (!parts) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(partsToDate(parts));
}

function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(startOfMonth(year, month));
}

function defaultParts(minValue?: string): DateParts {
  const minParts = minValue ? parseDateValue(minValue) : null;
  return minParts ?? dateToParts(new Date());
}

function clampToMin(parts: DateParts, minValue?: string): DateParts {
  if (!minValue) {
    return parts;
  }

  const minParts = parseDateValue(minValue);

  if (!minParts) {
    return parts;
  }

  if (partsToDate(parts).getTime() < partsToDate(minParts).getTime()) {
    return minParts;
  }

  return parts;
}

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  min,
  placeholder = "Select date",
  disabled = false,
  className,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateParts>(() =>
    clampToMin(parseDateValue(value) ?? defaultParts(min), min),
  );
  const [viewYear, setViewYear] = useState(draft.year);
  const [viewMonth, setViewMonth] = useState(draft.month);

  useEffect(() => {
    if (!open) {
      return;
    }

    const next = clampToMin(parseDateValue(value) ?? defaultParts(min), min);
    setDraft(next);
    setViewYear(next.year);
    setViewMonth(next.month);
  }, [open, value, min]);

  const displayValue = formatDisplayValue(value);

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(viewYear, viewMonth).getDay();
    const totalDays = daysInMonth(viewYear, viewMonth);
    const cells: Array<number | null> = [];

    for (let index = 0; index < firstDay; index += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(day);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [viewMonth, viewYear]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  };

  const isDayDisabled = (day: number) => {
    if (!min) {
      return false;
    }

    const minParts = parseDateValue(min);

    if (!minParts) {
      return false;
    }

    const candidate = new Date(viewYear, viewMonth - 1, day);
    return candidate.getTime() < partsToDate(minParts).getTime();
  };

  const selectDay = (day: number) => {
    if (isDayDisabled(day)) {
      return;
    }

    setDraft(
      clampToMin(
        {
          year: viewYear,
          month: viewMonth,
          day,
        },
        min,
      ),
    );
  };

  const applyDraft = () => {
    onChange(toDateValue(clampToMin(draft, min)));
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
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      <BottomSheet
        open={open}
        title={label}
        onClose={() => setOpen(false)}
        className="datetime-picker-modal"
      >
        <div className="datetime-picker">
          <div className="datetime-picker__month-nav">
            <button
              type="button"
              className="datetime-picker__nav-button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              ‹
            </button>
            <p className="datetime-picker__month-label">
              {formatMonthLabel(viewYear, viewMonth)}
            </p>
            <button
              type="button"
              className="datetime-picker__nav-button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="datetime-picker__weekdays" aria-hidden>
            {WEEKDAY_LABELS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="datetime-picker__grid" role="grid" aria-label="Calendar">
            {calendarDays.map((day, index) => {
              if (day == null) {
                return <span key={`empty-${index}`} className="datetime-picker__day-cell" />;
              }

              const selected =
                draft.year === viewYear &&
                draft.month === viewMonth &&
                draft.day === day;
              const dayDisabled = isDayDisabled(day);

              return (
                <button
                  key={`${viewYear}-${viewMonth}-${day}`}
                  type="button"
                  className={cn(
                    "datetime-picker__day",
                    selected && "datetime-picker__day--selected",
                    dayDisabled && "datetime-picker__day--disabled",
                  )}
                  disabled={dayDisabled}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
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
