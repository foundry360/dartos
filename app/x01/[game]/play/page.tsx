"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { ActionBar } from "@/components/layout/PageHeader";
import { ScoringLayout } from "@/components/layout/ScoringLayout";
import { BoardGameTitle } from "@/components/layout/BoardGameTitle";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { MatchAnalyticsButton } from "@/components/play/MatchAnalyticsButton";
import { Dartboard } from "@/components/dartboard/Dartboard";
import { X01PlaySidebar } from "@/features/x01/components/X01PlaySidebar";
import { X01PlayerStatsSlidePanel } from "@/features/x01/components/X01PlayerStatsSlidePanel";
import { computeX01MatchStatsFromGame } from "@/features/x01/lib/x01-stats";
import { formatX01MatchProgress } from "@/features/x01/lib/match-format";
import { isX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { getPlayerScorecardName } from "@/lib/player-display";
import { announceVisitTotalThenPlayerTurn, announceGameShotThenPlayerTurn, announceCheckoutCalloutAsync, prefetchMatchPlayerVoices, warmVoiceCache, primeGameShotClips, primeCheckoutClips } from "@/utils/speech";
import { primeFreeSpeech } from "@/utils/free-speech";
import { primeScoreClips } from "@/utils/score-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import type { DartHit } from "@/types/dart";
import { celebrateAfterDartThrow, playMatchWinCelebration } from "@/utils/match-celebration-sounds";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useResumeActiveMatchFromCloud } from "@/features/match-play/hooks/useResumeActiveMatchFromCloud";
import { isMatchCompletePreviewEnabled } from "@/lib/dev/match-complete-preview";
import { resolveGameShotOutcome } from "@/lib/game-shot-callouts";
import { resolveCheckoutCalloutForPlayer } from "@/lib/checkout-callouts";
import { useBotX01Turn } from "@/features/bot/hooks/useBotX01Turn";
import { isBotPlayer } from "@/features/bot/lib/build-bot-x01-setup";

export default function X01PlayPage() {
  return (
    <Suspense fallback={null}>
      <X01PlayPageContent />
    </Suspense>
  );
}

function X01PlayPageContent() {
  const params = useParams<{ game: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previewComplete = isMatchCompletePreviewEnabled(searchParams.get("previewComplete"));
  const gameParam = params.game;
  const game = useX01Store((state) => state.game);
  const throwDart = useX01Store((state) => state.throwDart);
  const nextPlayer = useX01Store((state) => state.nextPlayer);
  const undo = useX01Store((state) => state.undo);
  const rematch = useX01Store((state) => state.rematch);
  const reset = useX01Store((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({ gameMode: "x01", onReset: reset });
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const { ready: resumeReady } = useResumeActiveMatchFromCloud({
    gameMode: "x01",
    x01GameType: isX01GameType(gameParam) ? gameParam : undefined,
  });

  useEffect(() => {
    if (!resumeReady || game) {
      return;
    }

    router.replace(APP_HOME_PATH);
  }, [game, resumeReady, router]);

  useMatchFullscreen(Boolean(game));

  useMatchGameOnAnnouncement({
    matchId: game?.matchId,
    startingPlayerName: (() => {
      const player = game?.players[game?.currentPlayerIndex ?? -1];
      return player ? getPlayerScorecardName(player) : null;
    })(),
    playerNames: game?.players.map(getPlayerScorecardName),
    resumeReady,
  });

  useEffect(() => {
    if (!resumeReady || !game || !getMatchAudioPreferences().voice) {
      return;
    }

    warmVoiceCache();
    primeScoreClips();
    primeGameShotClips();
    primeCheckoutClips();
    primeFreeSpeech();
    prefetchMatchPlayerVoices(game.players.map(getPlayerScorecardName));
  }, [game, resumeReady]);

  const requestBotVisitRef = useRef<() => void>(() => {});

  const handleBotVisitFinished = ({ visitTotal, busted }: { visitTotal: number; busted: boolean }) => {
    const audio = getMatchAudioPreferences();
    if (!audio.voice) {
      return;
    }

    const updatedGame = useX01Store.getState().game;

    if (!updatedGame || updatedGame.status !== "playing") {
      return;
    }

    const nextPlayerState = updatedGame.players[updatedGame.currentPlayerIndex];
    const checkoutCallout = resolveCheckoutCalloutForPlayer(
      updatedGame,
      updatedGame.currentPlayerIndex,
      DARTS_PER_VISIT,
    );

    announceVisitTotalThenPlayerTurn(
      visitTotal,
      busted,
      nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
      checkoutCallout,
    );
  };

  const { isBotPlaying, requestBotVisit } = useBotX01Turn({
    game,
    throwDart,
    nextPlayer,
    getGame: () => useX01Store.getState().game,
    onBotVisitFinished: handleBotVisitFinished,
    enabled: resumeReady,
  });

  requestBotVisitRef.current = requestBotVisit;

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;

  const finishCurrentTurn = (options?: { allowPartialVisit?: boolean }) => {
    const activeGame = useX01Store.getState().game;
    if (!activeGame || activeGame.visitDarts.length === 0) {
      return false;
    }

    if (!options?.allowPartialVisit && activeGame.visitDarts.length < DARTS_PER_VISIT) {
      return false;
    }

    const audio = getMatchAudioPreferences();
    const visitTotal = getX01VisitEffectiveScore(activeGame, activeGame.visitDarts.length);
    const busted = activeGame.history
      .slice(-activeGame.visitDarts.length)
      .some((entry) => entry.bust);

    nextPlayer();

    if (audio.voice) {
      const updatedGame = useX01Store.getState().game;
      const nextPlayerState =
        updatedGame?.status === "playing"
          ? updatedGame.players[updatedGame.currentPlayerIndex]
          : null;
      const checkoutCallout =
        updatedGame?.status === "playing"
          ? resolveCheckoutCalloutForPlayer(
              updatedGame,
              updatedGame.currentPlayerIndex,
              DARTS_PER_VISIT,
            )
          : null;

      announceVisitTotalThenPlayerTurn(
        visitTotal,
        busted,
        nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
        checkoutCallout,
      );
    }

    const botTurnGame = useX01Store.getState().game;
    const botNextPlayer = botTurnGame?.players[botTurnGame.currentPlayerIndex ?? -1];

    if (botTurnGame && isBotPlayer(botNextPlayer)) {
      requestBotVisitRef.current();
    }

    return true;
  };

  const handleDartHit = (hit: DartHit) => {
    const activeGame = useX01Store.getState().game;
    const audio = getMatchAudioPreferences();

    throwDart(hit);
    const updatedGame = useX01Store.getState().game;
    const gameShotOutcome =
      activeGame && updatedGame ? resolveGameShotOutcome(activeGame, updatedGame) : null;

    celebrateAfterDartThrow(
      hit,
      updatedGame,
      (activeGameState) => getX01VisitEffectiveScore(activeGameState, activeGameState.visitDarts.length),
      { skipMatchWinCelebration: Boolean(audio.voice && gameShotOutcome === "match") },
    );

    if (gameShotOutcome && audio.voice && updatedGame) {
      const nextPlayerState =
        updatedGame.status === "playing"
          ? updatedGame.players[updatedGame.currentPlayerIndex]
          : null;
      const checkoutCallout =
        updatedGame.status === "playing"
          ? resolveCheckoutCalloutForPlayer(
              updatedGame,
              updatedGame.currentPlayerIndex,
              DARTS_PER_VISIT,
            )
          : null;

      announceGameShotThenPlayerTurn(
        gameShotOutcome,
        nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
        gameShotOutcome === "match" ? playMatchWinCelebration : undefined,
        checkoutCallout,
      );
      return;
    }

    const lastEntry = updatedGame?.history.at(-1);
    if (lastEntry?.bust && updatedGame?.status === "playing") {
      triggerHaptic("warning");
      finishCurrentTurn({ allowPartialVisit: true });
      return;
    }

    if (audio.voice && updatedGame?.status === "playing") {
      const dartsAvailable = DARTS_PER_VISIT - updatedGame.visitDarts.length;
      const checkoutCallout = resolveCheckoutCalloutForPlayer(
        updatedGame,
        updatedGame.currentPlayerIndex,
        dartsAvailable,
      );

      if (checkoutCallout) {
        announceCheckoutCalloutAsync(checkoutCallout);
      }
    }
  };

  const handleFinishTurn = () => {
    finishCurrentTurn();
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
  const isBotTurn = isBotPlayer(currentPlayer) || isBotPlaying;
  const matchStats = computeX01MatchStatsFromGame(game);
  const canUndo = game.history.length > 0;

  const throwMiss = () => {
    if (visitFull || game.visitDarts.length === 0) {
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

  const showMatchComplete =
    (game.status === "finished" && game.winnerId != null) || previewComplete;
  const winnerPlayer = previewComplete
    ? game.players[0]
    : game.players.find((player) => player.id === game.winnerId);
  const winnerName = winnerPlayer ? getPlayerScorecardName(winnerPlayer) : "Player";

  const clearPreviewComplete = () => {
    if (!previewComplete) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("previewComplete");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const handleMatchCompleteHome = () => {
    reset();
    router.push(APP_HOME_PATH);
  };

  const handleMatchCompleteRematch = () => {
    clearPreviewComplete();
    rematch();
  };

  return (
    <>
      {endMatchConfirmDialog}
      <ScoringLayout
        swipeHandlers={swipeHandlers}
        mainToolbar={<MatchAnalyticsButton onClick={() => setStatsPanelOpen(true)} />}
        sidebar={
          <X01PlaySidebar
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
            title={String(game.gameType)}
            subtitle={formatX01MatchProgress(game.players)}
          />
        }
        board={
          <Dartboard
            onHit={handleDartHit}
            recentHits={game.visitDarts}
            disabled={visitFull || isBotTurn}
            showMissButton={false}
          />
        }
      />
      <X01PlayerStatsSlidePanel
        open={statsPanelOpen}
        game={game}
        stats={matchStats}
        focusPlayerId={currentPlayer?.id ?? null}
        onClose={() => setStatsPanelOpen(false)}
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
