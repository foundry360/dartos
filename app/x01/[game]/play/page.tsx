"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { ClubX01ScoringView } from "@/features/match-scoring/components/ClubX01ScoringView";
import { X01PlayerStatsSlidePanel } from "@/features/x01/components/X01PlayerStatsSlidePanel";
import { computeX01MatchStatsFromGame } from "@/features/x01/lib/x01-stats";
import { isX01GameType } from "@/features/x01/lib/x01-engine";
import { useX01Store } from "@/features/x01/store/x01-store";
import { getPlayerScorecardName } from "@/lib/player-display";
import {
  announceVisitEndAndHandOff,
  announceGameShotThenPlayerTurn,
  announceCheckoutCalloutAsync,
  prefetchMatchPlayerVoices,
  warmVoiceCache,
  primeGameShotClips,
  primeCheckoutClips,
} from "@/utils/speech";
import {
  getPlayerTurnAnnouncementName,
  getPlayerTurnAnnouncementNames,
} from "@/utils/player-turn-audio";
import { primeScoreClips } from "@/utils/score-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import type { DartHit } from "@/types/dart";
import type { X01GameState } from "@/types/x01";
import { celebrateAfterDartThrow, playMatchWinCelebration } from "@/utils/match-celebration-sounds";
import { unlockVoicePlayback } from "@/utils/voice-playback";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useMatchVoiceReady } from "@/hooks/useMatchVoiceReady";
import { useConfirmFinishTurn } from "@/hooks/useConfirmFinishTurn";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useResumeActiveMatchFromCloud } from "@/features/match-play/hooks/useResumeActiveMatchFromCloud";
import { isMatchCompletePreviewEnabled } from "@/lib/dev/match-complete-preview";
import { resolveGameShotOutcome } from "@/lib/game-shot-callouts";
import { resolveCheckoutCalloutForPlayer } from "@/lib/checkout-callouts";
import { useBotX01Turn, type BotVisitFinishedResult } from "@/features/bot/hooks/useBotX01Turn";
import { prepareBotVisitScoreAudio } from "@/features/bot/lib/prepare-bot-visit-score-audio";
import { isBotPlayer } from "@/features/bot/lib/build-bot-x01-setup";
import { BOT_PLAY_HUB_PATH } from "@/features/bot/lib/bot-play-games";
import {
  getX01DartboardHighlightFromHit,
} from "@/features/x01/lib/x01-dartboard-highlight";

function getUpcomingPlayerNames(game: X01GameState): string[] | null {
  if (game.players.length === 0) {
    return null;
  }

  const nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
  const nextPlayer = game.players[nextIndex];

  return nextPlayer ? getPlayerTurnAnnouncementNames(nextPlayer) : null;
}

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
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({
    gameMode: "x01",
    onReset: reset,
    exitHref: game?.isBotMatch ? BOT_PLAY_HUB_PATH : APP_HOME_PATH,
  });
  const { maybeAutoFinishVisit } = useConfirmFinishTurn();
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const [botHighlightHit, setBotHighlightHit] = useState<DartHit | null>(null);
  const [botAimPulseKey, setBotAimPulseKey] = useState(0);

  const handleBotDartHighlight = useCallback((hit: DartHit | null, pulseKey?: number) => {
    setBotHighlightHit(hit);

    if (pulseKey != null) {
      setBotAimPulseKey(pulseKey);
    }
  }, []);
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

  const voiceReady = useMatchVoiceReady({ enabled: Boolean(game) });

  useMatchGameOnAnnouncement({
    matchId: game?.matchId,
    startingPlayerName: (() => {
      const player = game?.players[game?.currentPlayerIndex ?? -1];
      return player ? getPlayerTurnAnnouncementName(player) : null;
    })(),
    playerNames: game?.players.map(getPlayerTurnAnnouncementName),
    resumeReady: resumeReady,
    matchStatus: game?.status,
  });

  useEffect(() => {
    if (!resumeReady || !voiceReady || !game || !getMatchAudioPreferences().voice) {
      return;
    }

    warmVoiceCache();
    primeScoreClips();
    primeGameShotClips();
    primeCheckoutClips();
    prefetchMatchPlayerVoices(
      game.players.flatMap((player) => getPlayerTurnAnnouncementNames(player)),
    );
  }, [game, resumeReady, voiceReady]);

  const handleBotVisitFinished = async (result: BotVisitFinishedResult) => {
    if (!useX01Store.getState().game) {
      return;
    }

    const audio = getMatchAudioPreferences();
    const gameAfter = result.gameAtEnd;

    if (!audio.voice) {
      if (result.advanceTurn) {
        nextPlayer();
      }
      return;
    }

    const gameShotOutcome = resolveGameShotOutcome(
      {
        legsPlayed: result.gameBeforeFinalDart.legsPlayed,
        status: result.gameBeforeFinalDart.status,
      },
      {
        legsPlayed: gameAfter.legsPlayed,
        status: gameAfter.status,
      },
    );

    if (gameShotOutcome) {
      await unlockVoicePlayback();
      const nextPlayerState =
        gameAfter.status === "playing" ? gameAfter.players[gameAfter.currentPlayerIndex] : null;
      const checkoutCallout =
        gameAfter.status === "playing"
          ? resolveCheckoutCalloutForPlayer(
              gameAfter,
              gameAfter.currentPlayerIndex,
              DARTS_PER_VISIT,
            )
          : null;

      announceGameShotThenPlayerTurn(
        gameShotOutcome,
        nextPlayerState ? getPlayerTurnAnnouncementNames(nextPlayerState) : null,
        gameShotOutcome === "match" ? playMatchWinCelebration : undefined,
        checkoutCallout,
      );
      return;
    }

    if (gameAfter.status !== "playing") {
      return;
    }

    const nextPlayerName = result.advanceTurn
      ? getUpcomingPlayerNames(result.gameAtEnd)
      : getPlayerTurnAnnouncementNames(gameAfter.players[gameAfter.currentPlayerIndex]!);

    // Already warmed in the bot runner — don't block the turn callout on a refetch.
    void prepareBotVisitScoreAudio(result.visitTotal, result.busted);

    // Advance before voice so a stalled clip/queue cannot freeze the match.
    if (result.advanceTurn) {
      nextPlayer();
    }

    void announceVisitEndAndHandOff({
      visitTotal: result.visitTotal,
      busted: result.busted,
      nextPlayerName,
      getCheckoutCallout: () => {
        const updatedGame = useX01Store.getState().game;

        if (!updatedGame || updatedGame.status !== "playing") {
          return null;
        }

        return resolveCheckoutCalloutForPlayer(
          updatedGame,
          updatedGame.currentPlayerIndex,
          DARTS_PER_VISIT,
        );
      },
    });
  };

  const { isBotPlaying } = useBotX01Turn({
    game,
    throwDart,
    nextPlayer,
    getGame: () => useX01Store.getState().game,
    onBotVisitFinished: handleBotVisitFinished,
    onBotDartHighlight: handleBotDartHighlight,
    enabled: resumeReady,
  });

  const visitFull = (game?.visitDarts.length ?? 0) >= DARTS_PER_VISIT;

  const dartboardHighlight = useMemo(() => {
    if (!game || visitFull || !isBotPlaying || !botHighlightHit) {
      return {};
    }

    return getX01DartboardHighlightFromHit(botHighlightHit);
  }, [botHighlightHit, game, isBotPlaying, visitFull]);

  const finishCurrentTurn = (options?: { allowPartialVisit?: boolean }) => {
    const activeGame = useX01Store.getState().game;
    if (!activeGame || activeGame.visitDarts.length === 0) {
      return false;
    }

    if (!options?.allowPartialVisit && activeGame.visitDarts.length < DARTS_PER_VISIT) {
      return false;
    }

    unlockVoicePlayback();

    const audio = getMatchAudioPreferences();
    const visitTotal = getX01VisitEffectiveScore(activeGame, activeGame.visitDarts.length);
    const busted = activeGame.history
      .slice(-activeGame.visitDarts.length)
      .some((entry) => entry.bust);
    const nextPlayerName = getUpcomingPlayerNames(activeGame);

    // Advance immediately — never gate turn handoff on voice playback.
    // A hung clip used to leave Confirm Turn enabled with no effect.
    nextPlayer();

    if (audio.voice) {
      void announceVisitEndAndHandOff({
        visitTotal,
        busted,
        nextPlayerName,
        getCheckoutCallout: () => {
          const updatedGame = useX01Store.getState().game;

          if (!updatedGame || updatedGame.status !== "playing") {
            return null;
          }

          return resolveCheckoutCalloutForPlayer(
            updatedGame,
            updatedGame.currentPlayerIndex,
            DARTS_PER_VISIT,
          );
        },
      });
    }

    return true;
  };

  const handleDartHit = (hit: DartHit) => {
    unlockVoicePlayback();
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
        nextPlayerState ? getPlayerTurnAnnouncementNames(nextPlayerState) : null,
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

    if (
      maybeAutoFinishVisit({
        visitDartCount: updatedGame?.visitDarts.length ?? 0,
        status: updatedGame?.status,
        finish: () => finishCurrentTurn(),
      })
    ) {
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
    if (visitFull || isBotTurn) {
      return;
    }

    triggerHaptic("warning");
    playDartHitSound({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
    throwDart({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" });
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
    router.push(game?.isBotMatch ? BOT_PLAY_HUB_PATH : APP_HOME_PATH);
  };

  const handleMatchCompleteRematch = () => {
    clearPreviewComplete();
    rematch();
  };

  return (
    <>
      {endMatchConfirmDialog}
      <ClubX01ScoringView
        game={game}
        onDartHit={handleDartHit}
        onMiss={throwMiss}
        onUndo={undo}
        onConfirmTurn={handleFinishTurn}
        onLeave={requestExit}
        onOpenStats={() => setStatsPanelOpen(true)}
        boardDisabled={visitFull || isBotTurn}
        missDisabled={visitFull || isBotTurn}
        undoDisabled={!canUndo || isBotTurn}
        confirmDisabled={!visitFull || isBotTurn}
        practiceTarget={dartboardHighlight.practiceTarget ?? null}
        practiceTargetPulseKey={botAimPulseKey}
        swipeHandlers={swipeHandlers}
        overlay={
          <>
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
              matchId={game.matchId}
              onHome={handleMatchCompleteHome}
              onRematch={handleMatchCompleteRematch}
            />
          </>
        }
      />
    </>
  );
}
