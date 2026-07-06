"use client";

import { SettingsGroup } from "@/components/ui/SettingsGroup";

interface PracticeOptionRowProps {
  label: string;
  onPress: () => void;
}

export function PracticeOptionRow({ label, onPress }: PracticeOptionRowProps) {
  return (
    <div className="practice-target-row-card">
      <button type="button" className="practice-target-row settings-row settings-row--interactive" onClick={onPress}>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="settings-row__chevron practice-target-row__chevron"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="settings-row__label">{label}</span>
      </button>
    </div>
  );
}

interface PracticeSetupSectionProps {
  title: string;
  children: React.ReactNode;
}

export function PracticeSetupSection({ title, children }: PracticeSetupSectionProps) {
  return (
    <SettingsGroup title={title} className="settings-group--detached-targets">
      <div className="practice-target-list" role="list" aria-label={title}>
        {children}
      </div>
    </SettingsGroup>
  );
}
