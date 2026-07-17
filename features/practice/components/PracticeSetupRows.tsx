"use client";

import { ArrowRightIcon } from "@/components/ui/ArrowRightIcon";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface PracticeOptionRowProps {
  label: string;
  onPress: () => void;
}

export function PracticeOptionRow({ label, onPress }: PracticeOptionRowProps) {
  return (
    <div className="practice-target-row-card">
      <button type="button" className="practice-target-row settings-row settings-row--interactive" onClick={onPress}>
        <span className="settings-row__label">{label}</span>
        <span className="practice-target-row__arrow" aria-hidden>
          <ArrowRightIcon />
        </span>
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
    <section className="practice-setup-section" aria-label={title}>
      <GlassPanel className="practice-setup-section__panel">
        <h2 className="practice-setup-section__title">{title}</h2>
        <div className="practice-target-list" role="list" aria-label={title}>
          {children}
        </div>
      </GlassPanel>
    </section>
  );
}
