"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";

interface MatchCompletePanelProps {
  winnerName: string;
  summary?: React.ReactNode;
  onHome: () => void;
  className?: string;
}

export function MatchCompletePanel({
  winnerName,
  summary,
  onHome,
  className,
}: MatchCompletePanelProps) {
  return (
    <GlassPanel className={cn("play-screen-complete text-center", className)}>
      <p className="play-screen-complete__eyebrow">Match complete</p>
      <h2 className="play-screen-complete__winner">{winnerName} wins</h2>
      {summary ? <div className="play-screen-complete__summary">{summary}</div> : null}
      <TouchButton className="mt-6 w-full" size="md" onClick={onHome}>
        Back to Home
      </TouchButton>
    </GlassPanel>
  );
}
