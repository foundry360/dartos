"use client";

import { cn } from "@/utils/cn";

interface SettingsRowProps {
  label: string;
  children?: React.ReactNode;
  value?: string;
  hint?: string;
  chevron?: boolean;
  onPress?: () => void;
  className?: string;
}

export function SettingsRow({
  label,
  children,
  value,
  hint,
  chevron = false,
  onPress,
  className,
}: SettingsRowProps) {
  const interactive = Boolean(onPress);
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onPress}
      className={cn(
        "settings-row",
        interactive && "settings-row--interactive",
        className,
      )}
    >
      <div className="settings-row__main">
        <span className="settings-row__label">{label}</span>
        {hint ? <span className="settings-row__hint">{hint}</span> : null}
      </div>
      <div className="settings-row__trailing">
        {children}
        {value ? <span className="settings-row__value">{value}</span> : null}
        {chevron ? (
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="settings-row__chevron"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
              clipRule="evenodd"
            />
          </svg>
        ) : null}
      </div>
    </Tag>
  );
}
