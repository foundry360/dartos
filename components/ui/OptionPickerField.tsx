"use client";

import { useState } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { FormField } from "@/components/ui/FormField";
import { cn } from "@/utils/cn";

export interface OptionPickerItem<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface OptionPickerFieldProps<T extends string> {
  label: string;
  value: T | "";
  options: OptionPickerItem<T>[];
  onChange: (value: T | "") => void;
  placeholder?: string;
  hint?: string;
  allowClear?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  emptyLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function OptionPickerField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  hint,
  allowClear = true,
  clearLabel = "None",
  disabled = false,
  className,
  emptyLabel,
  actionLabel,
  onAction,
}: OptionPickerFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const selectValue = (nextValue: T | "") => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <FormField label={label} hint={hint} className={className}>
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
        menuAriaLabel={label}
        trigger={
          <button
            type="button"
            className={cn("form-field__picker", open && "form-field__picker--open")}
            disabled={disabled}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <span
              className={cn(
                "form-field__picker-value",
                !selected && "form-field__picker-value--placeholder",
              )}
            >
              {selected?.label ?? placeholder}
            </span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="form-field__picker-chevron"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        }
      >
        {allowClear ? (
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className={cn("dropdown__option", !value && "dropdown__option--selected")}
            onClick={() => selectValue("")}
          >
            <span className="dropdown__option-label">{clearLabel}</span>
            {!value ? <span className="dropdown__check" aria-hidden>✓</span> : null}
          </button>
        ) : null}

        {options.length === 0 && emptyLabel ? (
          <div className="dropdown__empty">{emptyLabel}</div>
        ) : null}

        {options.map((option) => {
          const selectedOption = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selectedOption}
              className={cn("dropdown__option", selectedOption && "dropdown__option--selected")}
              onClick={() => selectValue(option.value)}
            >
              <span className="dropdown__option-text">
                <span className="dropdown__option-label">{option.label}</span>
                {option.description ? (
                  <span className="dropdown__option-description">{option.description}</span>
                ) : null}
              </span>
              {selectedOption ? <span className="dropdown__check" aria-hidden>✓</span> : null}
            </button>
          );
        })}

        {actionLabel && onAction ? (
          <button
            type="button"
            className="dropdown__option dropdown__option--action"
            onClick={() => {
              setOpen(false);
              onAction();
            }}
          >
            <span className="dropdown__option-label">{actionLabel}</span>
          </button>
        ) : null}
      </Dropdown>
    </FormField>
  );
}
