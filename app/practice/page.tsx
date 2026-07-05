"use client";

import { useState } from "react";
import { type DartHit } from "@/types/dart";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { PlayScreenHeader } from "@/components/play/PlayScreenHeader";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";

export default function PracticePage() {
  const [visitDarts, setVisitDarts] = useState<DartHit[]>([]);
  const [history, setHistory] = useState<DartHit[]>([]);

  const throwDart = (hit: DartHit) => {
    if (visitDarts.length >= 3) {
      return;
    }

    setVisitDarts((current) => [...current, hit]);
    setHistory((current) => [...current, hit]);
  };

  const undo = () => {
    setVisitDarts((current) => {
      if (current.length === 0) {
        return current;
      }

      setHistory((all) => all.slice(0, -1));
      return current.slice(0, -1);
    });
  };

  const resetVisit = () => setVisitDarts([]);

  const visitTotal = visitDarts.reduce((sum, dart) => sum + dart.score, 0);

  return (
    <ScoringLayout
      sidebar={
        <>
          <PlayScreenHeader title="Practice Mode" subtitle="Free scoring board" />
          <GlassPanel className="scorecard-panel text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Visit total
            </p>
            <p className="mt-2 text-5xl font-black tabular-nums">{visitTotal}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {visitDarts.map((dart, index) => (
                <span
                  key={`${dart.label}-${index}`}
                  className="rounded-2xl bg-surface px-4 py-2 text-lg font-bold"
                >
                  {dart.label}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Session darts: {history.length}
            </p>
          </GlassPanel>
        </>
      }
      boardHeader={<BoardGameTitle title="Practice" />}
      board={
        <Dartboard
          onHit={throwDart}
          recentHits={visitDarts}
          disabled={visitDarts.length >= 3}
        />
      }
      actions={
        <div className="grid grid-cols-2 gap-2 px-0 pb-safe-bottom pt-2">
          <TouchButton variant="secondary" onClick={undo} disabled={visitDarts.length === 0}>
            Undo
          </TouchButton>
          <TouchButton onClick={resetVisit} disabled={visitDarts.length === 0}>
            New Visit
          </TouchButton>
        </div>
      }
    />
  );
}
