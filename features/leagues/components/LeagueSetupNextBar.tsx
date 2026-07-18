"use client";

import { TouchButton } from "@/components/ui/TouchButton";

interface LeagueSetupNextBarProps {
  disabled?: boolean;
  onNext: () => void | Promise<void>;
}

/** Shared primary Next control for setup tabs (Rules → Players → Teams → Schedule). */
export function LeagueSetupNextBar({
  disabled = false,
  onNext,
}: LeagueSetupNextBarProps) {
  return (
    <div className="league-setup-next">
      <TouchButton
        type="button"
        variant="primary"
        onClick={() => void onNext()}
        disabled={disabled}
      >
        Next
      </TouchButton>
    </div>
  );
}
