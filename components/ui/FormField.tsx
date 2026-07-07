"use client";

import { cn } from "@/utils/cn";

interface FormFieldProps {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn("form-field", className)}>
      <span className="form-field__label">{label}</span>
      {children}
      {hint ? <span className="form-field__hint">{hint}</span> : null}
    </div>
  );
}

interface FormTextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  hint?: string;
  className?: string;
}

export function FormTextField({
  label,
  hint,
  className,
  id,
  ...inputProps
}: FormTextFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className={cn("form-field", className)} htmlFor={inputId}>
      <span className="form-field__label">{label}</span>
      <input id={inputId} className="form-field__input" {...inputProps} />
      {hint ? <span className="form-field__hint">{hint}</span> : null}
    </label>
  );
}
