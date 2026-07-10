"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { finishCricketTurn, getCricketVisitPointsScored } from "@/features/cricket/lib/cricket-engine";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { formatCricketMatchProgress } from "@/features/cricket/lib/match-format";
import { formatCricketVariantLabel } from "@/lib/constants";
import { getPlayerScorecardName } from "@/lib/player-display";
import { announceVisitTotalThenPlayerTurn, announceGameShotThenPlayerTurn, prefetchMatchPlayerVoices, warmVoiceCache, primeGameShotClips } from "@/utils/speech";
import { primeScoreClips } from "@/utils/score-audio";
import { announceCricketTargetClosed, primeCricketClosedClips } from "@/utils/cricket-closed-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import type { DartHit } from "@/types/dart";
import {
  celebrateAfterDartThrow,
  celebrateAfterFinishTurn,
} from "@/utils/match-celebration-sounds";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useMatchVoiceReady } from "@/hooks/useMatchVoiceReady";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useResumeActiveMatchFromCloud } from "@/features/match-play/hooks/useResumeActiveMatchFromCloud";
import { isMatchCompletePreviewEnabled } from "@/lib/dev/match-complete-preview";
import { resolveGameShotOutcome } from "@/lib/game-shot-callouts";
import { playMatchWinCelebration } from "@/utils/match-celebration-sounds";
import { unlockVoicePlayback } from "@/utils/voice-playback";
import { isBotPlayer } from "@/features/bot/lib/is-bot-player";
import { BOT_PLAY_HUB_PATH } from "@/features/bot/lib/bot-play-games";
import {
  useBotCricketTurn,
  type BotCricketVisitFinishedResult,
} from "@/features/bot/hooks/useBotCricketTurn";
import { prepareBotVisitScoreAudio } from "@/features/bot/lib/prepare-bot-visit-score-audio";
import { getX01DartboardHighlightFromHit } from "@/features/x01/lib/x01-dartboard-highlight";

export default function CricketPlayPage() {
  return (
    <Suspense fallback={null}>
      <CricketPlayPageContent />
    </Suspense>
  );
}

function CricketPlayPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previewComplete = isMatchCompletePreviewEnabled(searchParams.get("previewComplete"));
  const game = useCricketStore((state) => state.game);
  const throwDart = useCricketStore((state) => state.throwDart);
  const finishTurn = useCricketStore((state) => state.finishTurn);
  const undo = useCricketStore((state) => state.undo);
  const rematch = useCricketStore((state) => state.rematch);
  const reset = useCricketStore((state) => state.reset);
  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({
    gameMode: "cricket",
    onReset: reset,
    exitHref: game?.isBotMatch ? BOT_PLAY_HUB_PATH : APP_HOME_PATH,
  });
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const [botHighlightHit, setBotHighlightHit] = useState<DartHit | null>(null);
  const [botHighlightPulseKey, setBotHighlightPulseKey] = useState(0);

  const handleBotDartHighlight = useCallback((hit: DartHit | null, pulseKey?: number) => {
    setBotHighlightHit(hit);

    if (pulseKey != null) {
      setBotHighlightPulseKey(pulseKey);
    }
  }, []);

  const { ready: resumeReady } = useResumeActiveMatchFromCloud({ gameMode: "cricket" });

  useEffect(() => {
    if (!resumeReady || game) {
      return;
    }

    router.replace(APP_HOME_PATH);
  }, [game, resumeReady, router]);

  useMatchFullscreen(Boolean(game));

  const voiceReady = useMatchVoiceReady({ enabled: Boolean(game) });

  const { matchIntroReady } = useMatchGameOnAnnouncement({
    matchId: game?.matchId,
    startingPlayerName: (() => {
      const player = game?.players[game?.currentPlayerIndex ?? -1];
      return player ? getPlayerScorecardName(player) : null;
    })(),
    playerNames: game?.players.map(getPlayerScorecardName),
    resumeReady: resumeReady,
  });

  useEffect(() => {
    if (!resumeReady || !voiceReady || !game || !getMatchAudioPreferences().voice) {
      return;
    }

    warmVoiceCache();
    primeScoreClips();
    primeCricketClosedClips(game.variant ?? "classic");
    primeGameShotClips();
    prefetchMatchPlayerVoices(game.players.map(getPlayerScorecardName));
  }, [game, resumeReady, voiceReady, game?.variant]);

  const recordDartWithEffects = useCallback((hit: DartHit) => {
    const historyLengthBefore = useCricketStore.getState().game?.history.length ?? 0;

    throwDart(hit);
    const updatedGame = useCricketStore.getState().game;
    celebrateAfterDartThrow(
      hit,
      updatedGame,
      (activeGame) => activeGame.visitDarts.reduce((total, dart) => total + dart.score, 0),
    );

    if (updatedGame && getMatchAudioPreferences().voice) {
      if (updatedGame.history.length <= historyLengthBefore) {
        return;
      }

      const lastEntry = updatedGame.history.at(-1);
      if (lastEntry?.segmentClosed) {
        announceCricketTargetClosed(
          lastEntry.segmentClosed,
          updatedGame.variant ?? "classic",
        );
      }
    }
  }, [throwDart]);

  const handleBotVisitFinished = async (result: BotCricketVisitFinishedResult) => {
    if (!useCricketStore.getState().game) {
      return;
    }

    const audio = getMatchAudioPreferences();
    const gameShotOutcome = resolveGameShotOutcome(
      {
        legsPlayed: result.gameBeforeFinish.legsPlayed,
        status: result.gameBeforeFinish.status,
      },
      {
        legsPlayed: result.gameAtEnd.legsPlayed,
        status: result.gameAtEnd.status,
      },
    );

    celebrateAfterFinishTurn(result.gameAtEnd, {
      skipMatchWinCelebration: Boolean(audio.voice && gameShotOutcome === "match"),
    });

    if (!audio.voice) {
      return;
    }

    if (gameShotOutcome) {
      await unlockVoicePlayback();
      const nextPlayerState =
        result.gameAtEnd.status === "playing"
          ? result.gameAtEnd.players[result.gameAtEnd.currentPlayerIndex]
          : null;

      announceGameShotThenPlayerTurn(
        gameShotOutcome,
        nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
        gameShotOutcome === "match" ? playMatchWinCelebration : undefined,
      );
      return;
    }

    if (result.gameAtEnd.status !== "playing") {
      return;
    }

    const nextPlayerName = getPlayerScorecardName(
      result.gameAtEnd.players[result.gameAtEnd.currentPlayerIndex]!,
    );

    await prepareBotVisitScoreAudio(result.visitTotal, false);
    announceVisitTotalThenPlayerTurn(result.visitTotal, false, nextPlayerName);
  };

  const { isBotPlaying } = useBotCricketTurn({
    game,
    throwDart: recordDartWithEffects,
    finishTurn,
    getGame: () => useCricketStore.getState().game,
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

  const handleDartHit = (hit: DartHit) => {
    unlockVoicePlayback();
    recordDartWithEffects(hit);
  };

  const handleFinishTurn = () => {
    unlockVoicePlayback();
    const activeGame = useCricketStore.getState().game;
    if (!activeGame || activeGame.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    const audio = getMatchAudioPreferences();
    const nextGame = finishCricketTurn(activeGame);
    const visitTotal = getCricketVisitPointsScored(activeGame);
    const gameShotOutcome = resolveGameShotOutcome(activeGame, nextGame);

    finishTurn();
    celebrateAfterFinishTurn(useCricketStore.getState().game, {
      skipMatchWinCelebration: Boolean(audio.voice && gameShotOutcome === "match"),
    });

    if (audio.voice) {
      if (gameShotOutcome) {
        const nextPlayerState =
          nextGame.status === "playing"
            ? nextGame.players[nextGame.currentPlayerIndex]
            : null;

        announceGameShotThenPlayerTurn(
          gameShotOutcome,
          nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
          gameShotOutcome === "match" ? playMatchWinCelebration : undefined,
        );
        return;
      }

      const nextPlayerState =
        nextGame.status === "playing"
          ? nextGame.players[nextGame.currentPlayerIndex]
          : null;

      announceVisitTotalThenPlayerTurn(
        visitTotal,
        false,
        nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
      );
    }
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
  const matchStats = computeCricketMatchStatsFromGame(game);
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
    router.push(game?.isBotMatch ? BOT_PLAY_HUB_PATH : APP_HOME_PATH);
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
        mainToolbar={
          <CricketMatchAnalyticsButton onClick={() => setStatsPanelOpen(true)} />
        }
        actions={
          <ActionBar
            {...actionBarProps}
            className="scoring-layout__actions--portrait py-0 pb-0"
          />
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
          disabled={visitFull || isBotTurn}
          showMissButton={false}
          practiceTarget={dartboardHighlight.practiceTarget ?? null}
          practiceTargetHeavyPulse
          practiceTargetPulseKey={botHighlightPulseKey}
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
      <MatchCompletePanel
        open={showMatchComplete}
        winnerName={winnerName}
        onHome={handleMatchCompleteHome}
        onRematch={handleMatchCompleteRematch}
      />
    </>
  );
}
