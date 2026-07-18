"use client";

import { useState } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/utils/cn";

export interface LeagueNightSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface LeagueNightSelectProps {
  value: string;
  options: LeagueNightSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  clearLabel?: string;
  allowClear?: boolean;
  disabled?: boolean;
  required?: boolean;
  ariaLabel: string;
  className?: string;
  menuClassName?: string;
}

export function LeagueNightSelect({
  value,
  options,
  onChange,
  placeholder = "-",
  clearLabel = "-",
  allowClear = true,
  disabled = false,
  required = false,
  ariaLabel,
  className,
  menuClassName,
}: LeagueNightSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const selectValue = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      menuAriaLabel={ariaLabel}
      className={cn("league-night-select", className)}
      menuClassName={cn("league-night-select__menu", menuClassName)}
      trigger={
        <button
          type="button"
          className={cn(
            "form-field__picker",
            "league-night-select__trigger",
            open && "form-field__picker--open",
            required && "league-night-select__trigger--required",
          )}
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-invalid={required || undefined}
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

      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={option.disabled}
            className={cn(
              "dropdown__option",
              isSelected && "dropdown__option--selected",
              option.disabled && "dropdown__option--disabled",
            )}
            onClick={() => {
              if (option.disabled) {
                return;
              }
              selectValue(option.value);
            }}
          >
            <span className="dropdown__option-label">{option.label}</span>
            {isSelected ? (
              <span className="dropdown__check" aria-hidden>
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </Dropdown>
  );
}
