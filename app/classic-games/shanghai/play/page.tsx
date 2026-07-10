"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { ShanghaiPlaySidebar } from "@/features/classic-games/components/ShanghaiPlaySidebar";
import {
  formatShanghaiProgress,
  getShanghaiDartboardHighlight,
} from "@/features/classic-games/lib/shanghai-engine";
import { useShanghaiStore } from "@/features/classic-games/store/shanghai-store";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { BOT_PLAY_HUB_PATH } from "@/features/bot/lib/bot-play-games";
import {
  useBotShanghaiTurn,
  type BotShanghaiVisitFinishedResult,
} from "@/features/bot/hooks/useBotShanghaiTurn";
import { getX01DartboardHighlightFromHit } from "@/features/x01/lib/x01-dartboard-highlight";
import { getPlayerScorecardName } from "@/lib/player-display";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import type { DartHit } from "@/types/dart";
import { celebrateAfterDartThrow } from "@/utils/match-celebration-sounds";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import {
  announceShanghaiAfterTurn,
  announceShanghaiRound,
  primeShanghaiClips,
} from "@/utils/shanghai-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { prefetchMatchPlayerVoices, warmVoiceCache } from "@/utils/speech";

export default function ShanghaiPlayPage() {
  const router = useRouter();
  const game = useShanghaiStore((state) => state.game);
  const throwDart = useShanghaiStore((state) => state.throwDart);
  const finishTurn = useShanghaiStore((state) => state.finishTurn);
  const undo = useShanghaiStore((state) => state.undo);
  const rematch = useShanghaiStore((state) => state.rematch);
  const reset = useShanghaiStore((state) => state.reset);
  const [botHighlightHit, setBotHighlightHit] = useState<DartHit | null>(null);
  const [botHighlightPulseKey, setBotHighlightPulseKey] = useState(0);
  const { requestExit, endMatchConfirmDialog, matchExitInProgressRef } = useEndMatchExit({
    gameMode: "shanghai",
    onReset: reset,
    exitHref: game?.isBotMatch ? BOT_PLAY_HUB_PATH : APP_HOME_PATH,
  });

  const handleBotDartHighlight = useCallback((hit: DartHit | null, pulseKey?: number) => {
    setBotHighlightHit(hit);

    if (pulseKey != null) {
      setBotHighlightPulseKey(pulseKey);
    }
  }, []);

  useEffect(() => {
    if (!game && !matchExitInProgressRef.current) {
      router.replace("/classic-games/shanghai/setup");
    }
  }, [game, matchExitInProgressRef, router]);

  useEffect(() => {
    if (!game?.matchId) {
      return;
    }

    primeShanghaiClips();

    if (game.isBotMatch && getMatchAudioPreferences().voice) {
      warmVoiceCache();
      prefetchMatchPlayerVoices(game.players.map(getPlayerScorecardName));
    }
  }, [game?.isBotMatch, game?.matchId, game?.players]);

  useMatchFullscreen(Boolean(game));

  const { matchIntroReady } = useMatchGameOnAnnouncement({
    matchId: game?.matchId,
    startingPlayerName: (() => {
      const player = game?.players[game?.currentPlayerIndex ?? -1];
      return player ? getPlayerScorecardName(player) : null;
    })(),
    playerNames: game?.players.map(getPlayerScorecardName),
    onAfterAnnounce: () => {
      const activeGame = useShanghaiStore.getState().game;
      if (!activeGame || !getMatchAudioPreferences().voice) {
        return;
      }

      announceShanghaiRound(activeGame);
    },
  });

  const handleBotVisitFinished = (result: BotShanghaiVisitFinishedResult) => {
    if (!useShanghaiStore.getState().game || !getMatchAudioPreferences().voice) {
      return;
    }

    announceShanghaiAfterTurn(
      result.gameBeforeFinish,
      result.gameAtEnd,
      result.completedPlayerIndex,
    );
  };

  const { isBotPlaying } = useBotShanghaiTurn({
    game,
    throwDart,
    finishTurn,
    getGame: () => useShanghaiStore.getState().game,
    onBotVisitFinished: handleBotVisitFinished,
    onBotDartHighlight: handleBotDartHighlight,
    enabled: matchIntroReady,
  });

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;
  const currentPlayer = game?.players[game.currentPlayerIndex ?? -1];
  const isBotTurn = isBotPlayer(currentPlayer) || isBotPlaying;

  const handleFinishTurn = useCallback(() => {
    const activeGame = useShanghaiStore.getState().game;
    if (!activeGame || activeGame.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    const activePlayer = activeGame.players[activeGame.currentPlayerIndex];
    if (isBotPlayer(activePlayer) || isBotPlaying) {
      return;
    }

    const before = activeGame;
    const completedPlayerIndex = before.currentPlayerIndex;
    finishTurn();

    const after = useShanghaiStore.getState().game;
    if (!after || !getMatchAudioPreferences().voice) {
      return;
    }

    announceShanghaiAfterTurn(before, after, completedPlayerIndex);
  }, [finishTurn, isBotPlaying]);

  const dartboardHighlight = useMemo((): {
    practiceTarget?: import("@/features/practice/lib/practice-target-segments").PracticeTargetHighlight | null;
    practiceHighlightSegment?: number | "bull" | null;
    practiceHighlightBulls?: boolean;
  } => {
    if (game && !visitFull && isBotPlaying && botHighlightHit) {
      return getX01DartboardHighlightFromHit(botHighlightHit);
    }

    return game ? getShanghaiDartboardHighlight(game) : {};
  }, [botHighlightHit, game, isBotPlaying, visitFull]);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: undo,
    onSwipeRight: () => {
      if (visitFull && !isBotTurn) {
        handleFinishTurn();
      }
    },
  });

  if (!game) {
    return null;
  }

  const canUndo = game.history.length > 0;
  const showMatchComplete = game.status === "finished" && game.winnerId != null;
  const winnerPlayer = game.players.find((player) => player.id === game.winnerId);
  const winnerName = winnerPlayer ? getPlayerScorecardName(winnerPlayer) : "Player";

  const handleDartHit = (hit: DartHit) => {
    throwDart(hit);
    const updatedGame = useShanghaiStore.getState().game;
    celebrateAfterDartThrow(
      hit,
      updatedGame,
      (activeGame) => activeGame.visitDarts.reduce((total, dart) => total + dart.score, 0),
    );
  };

  const throwMiss = () => {
    if (visitFull || game.visitDarts.length === 0 || isBotTurn) {
      return;
    }

    triggerHaptic("warning");
    playDartHitSound({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
    throwDart({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
  };

  const actionBarProps = {
    onMiss: throwMiss,
    missDisabled: visitFull || game.visitDarts.length === 0 || isBotTurn,
    onUndo: undo,
    onPrimary: handleFinishTurn,
    primaryLabel: "Finish Turn" as const,
    undoDisabled: !canUndo || isBotTurn,
    primaryDisabled: !visitFull || isBotTurn,
  };

  const handleMatchCompleteHome = () => {
    matchExitInProgressRef.current = true;
    reset();
    router.push(game.isBotMatch ? BOT_PLAY_HUB_PATH : APP_HOME_PATH);
  };

  const handleMatchCompleteRematch = () => {
    rematch();
  };

  return (
    <>
      {endMatchConfirmDialog}
      <ScoringLayout
        swipeHandlers={swipeHandlers}
        actions={
          <ActionBar
            {...actionBarProps}
            className="scoring-layout__actions--portrait py-0 pb-0"
          />
        }
        sidebar={
          <ShanghaiPlaySidebar
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
            title="Shanghai"
            subtitle={formatShanghaiProgress(game)}
          />
        }
        board={
          <Dartboard
            onHit={handleDartHit}
            recentHits={game.visitDarts}
            disabled={visitFull || game.status === "finished" || isBotTurn}
            showMissButton={false}
            practiceTarget={dartboardHighlight.practiceTarget ?? null}
            practiceHighlightSegment={
              dartboardHighlight.practiceTarget
                ? null
                : (dartboardHighlight.practiceHighlightSegment ?? null)
            }
            practiceHighlightBulls={dartboardHighlight.practiceHighlightBulls ?? false}
            practiceTargetPulseKey={botHighlightPulseKey}
            practiceTargetHeavyPulse
          />
        }
        showFullscreenButton
      />
      <MatchCompletePanel
        open={showMatchComplete}
        winnerName={winnerName}
        onHome={handleMatchCompleteHome}
        onRematch={handleMatchCompleteRematch}
      />
    </>
  );
}
