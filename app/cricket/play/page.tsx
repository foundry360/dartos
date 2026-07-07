"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { CricketMatchAnalyticsButton } from "@/features/cricket/components/CricketMatchAnalyticsButton";
import { CricketPlaySidebar } from "@/features/cricket/components/CricketPlaySidebar";
import { CricketPlayerStatsSlidePanel } from "@/features/cricket/components/CricketPlayerStatsSlidePanel";
import { computeCricketMatchStatsFromGame } from "@/features/cricket/lib/cricket-stats";
import { finishCricketTurn } from "@/features/cricket/lib/cricket-engine";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { formatCricketMatchProgress } from "@/features/cricket/lib/match-format";
import { formatCricketVariantLabel } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";
import { announcePlayerTurn, prefetchPlayerTurnVoices, warmVoiceCache } from "@/utils/speech";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import {
  formatCricketMatchResultLines,
  formatCricketWinnerLabel,
} from "@/features/cricket/lib/team-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import type { DartHit } from "@/types/dart";
import {
  celebrateAfterDartThrow,
  celebrateAfterFinishTurn,
} from "@/utils/match-celebration-sounds";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { useResumeActiveMatchFromCloud } from "@/features/match-play/hooks/useResumeActiveMatchFromCloud";

export default function CricketPlayPage() {
  const router = useRouter();
  const game = useCricketStore((state) => state.game);
  const throwDart = useCricketStore((state) => state.throwDart);
  const finishTurn = useCricketStore((state) => state.finishTurn);
  const undo = useCricketStore((state) => state.undo);
  const reset = useCricketStore((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({ onReset: reset });
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const { ready: resumeReady } = useResumeActiveMatchFromCloud({ gameMode: "cricket" });

  useEffect(() => {
    if (!resumeReady || game) {
      return;
    }

    router.replace(APP_HOME_PATH);
  }, [game, resumeReady, router]);

  useMatchFullscreen(Boolean(game));

  useEffect(() => {
    if (!resumeReady || !game || !getMatchAudioPreferences().voice) {
      return;
    }

    warmVoiceCache();
    prefetchPlayerTurnVoices(game.players.map(getPlayerScorecardName));
  }, [game, resumeReady]);

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;

  const handleDartHit = (hit: DartHit) => {
    throwDart(hit);
    const updatedGame = useCricketStore.getState().game;
    celebrateAfterDartThrow(
      hit,
      updatedGame,
      (activeGame) => activeGame.visitDarts.reduce((total, dart) => total + dart.score, 0),
    );
  };

  const handleFinishTurn = () => {
    const activeGame = useCricketStore.getState().game;
    if (!activeGame || activeGame.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    const audio = getMatchAudioPreferences();
    const nextGame = finishCricketTurn(activeGame);

    if (audio.voice && nextGame.status === "playing") {
      const nextPlayer = nextGame.players[nextGame.currentPlayerIndex];
      if (nextPlayer) {
        announcePlayerTurn(getPlayerScorecardName(nextPlayer));
      }
    }

    finishTurn();
    celebrateAfterFinishTurn(useCricketStore.getState().game);
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: undo,
    onSwipeRight: () => {
      if (visitFull) {
        handleFinishTurn();
      }
    },
  });

  if (!resumeReady || !game) {
    return null;
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const matchStats = computeCricketMatchStatsFromGame(game);
  const canUndo = game.history.length > 0;

  const throwMiss = () => {
    if (visitFull) {
      return;
    }

    triggerHaptic("warning");
    playDartHitSound({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
    throwDart({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
  };

  const actionBarProps = {
    onMiss: throwMiss,
    missDisabled: visitFull,
    onUndo: undo,
    onPrimary: handleFinishTurn,
    primaryLabel: "Finish Turn" as const,
    undoDisabled: !canUndo,
    primaryDisabled: !visitFull,
  };

  if (game.status === "finished" && game.winnerId) {
    return (
      <MobileAppShell className="pb-safe-bottom">
        <div className="flex flex-1 flex-col justify-center px-4">
          <MatchCompletePanel
          winnerName={formatCricketWinnerLabel(game)}
          summary={
            <>
              {formatCricketMatchResultLines(game.players, game.teamsEnabled, game.teamNames).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </>
          }
          onHome={() => router.push(APP_HOME_PATH)}
        />
        </div>
      </MobileAppShell>
    );
  }

  return (
    <>
      {endMatchConfirmDialog}
      <ScoringLayout
        swipeHandlers={swipeHandlers}
        mainToolbar={
          <CricketMatchAnalyticsButton onClick={() => setStatsPanelOpen(true)} />
        }
        sidebar={
          <CricketPlaySidebar
            game={game}
            headerTitle={
              currentPlayer
                ? `${getPlayerScorecardName(currentPlayer)}'s Turn!`
                : "Turn!"
            }
            onBackClick={requestExit}
            actionBar={actionBarProps}
          />
        }
      boardHeader={
        <BoardGameTitle
          title={formatCricketVariantLabel(game.variant ?? "classic")}
          subtitle={formatCricketMatchProgress(game.players)}
        />
      }
      board={
        <Dartboard
            onHit={handleDartHit}
          recentHits={game.visitDarts}
          disabled={visitFull}
          showMissButton={false}
        />
      }
      />
      <CricketPlayerStatsSlidePanel
        open={statsPanelOpen}
        game={game}
        stats={matchStats}
        focusPlayerId={currentPlayer?.id ?? null}
        onClose={() => setStatsPanelOpen(false)}
      />
    </>
  );
}
