"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MatchCompletePanel } from "@/components/play/MatchCompletePanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { GameSetupPage } from "@/components/layout/GameSetupPage";
import { useCommunityMatchSync } from "@/features/community/hooks/useCommunityMatchSync";
import { useCommunityRoom } from "@/features/community/hooks/useCommunityRoom";
import {
  buildCommunityMatchPlaySetup,
  communityEngineMatchId,
} from "@/features/community/lib/build-community-match-setup";
import {
  CommunityMatchIssueBanner,
  CommunityMatchPauseButton,
} from "@/features/community/components/CommunityMatchIssueControls";
import {
  mirrorCommunityCricketVoice,
  mirrorCommunityX01Voice,
} from "@/features/community/lib/mirror-community-match-voice";
import { communityFirstName } from "@/features/community/lib/community-name";
import {
  getCommunityFinishStatsKey,
  recordCommunityFinishedMatch,
} from "@/features/community/lib/record-community-match-stats";
import { getUserIdFromAccountProfileId } from "@/features/players/lib/account-player-profile";
import { discardPendingMatchStats } from "@/features/statistics/store/pending-match-stats-store";
import { CricketPlayerStatsSlidePanel } from "@/features/cricket/components/CricketPlayerStatsSlidePanel";
import {
  finishCricketTurn as previewFinishCricketTurn,
  getCricketVisitPointsScored,
} from "@/features/cricket/lib/cricket-engine";
import { computeCricketMatchStatsFromGame } from "@/features/cricket/lib/cricket-stats";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { ClubCricketScoringView } from "@/features/match-scoring/components/ClubCricketScoringView";
import { ClubX01ScoringView } from "@/features/match-scoring/components/ClubX01ScoringView";
import { X01PlayerStatsSlidePanel } from "@/features/x01/components/X01PlayerStatsSlidePanel";
import { computeX01MatchStatsFromGame } from "@/features/x01/lib/x01-stats";
import { getX01VisitEffectiveScore } from "@/features/statistics/lib/x01-visit-score";
import { useX01Store } from "@/features/x01/store/x01-store";
import { useEndMatchExit } from "@/hooks/useEndMatchExit";
import { useMatchFullscreen } from "@/hooks/useMatchFullscreen";
import { useMatchGameOnAnnouncement } from "@/hooks/useMatchGameOnAnnouncement";
import { useMatchVoiceReady } from "@/hooks/useMatchVoiceReady";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { resolveCheckoutCalloutForPlayer } from "@/lib/checkout-callouts";
import { getPlayerScorecardName } from "@/lib/player-display";
import { resolveGameShotOutcome } from "@/lib/game-shot-callouts";
import type { CricketGameState } from "@/types/cricket";
import type { DartHit } from "@/types/dart";
import type { X01GameState } from "@/types/x01";
import {
  announceCricketTargetClosed,
  primeCricketClosedClips,
} from "@/utils/cricket-closed-audio";
import {
  celebrateAfterDartThrow,
  celebrateAfterFinishTurn,
  playMatchWinCelebration,
} from "@/utils/match-celebration-sounds";
import { primeScoreClips } from "@/utils/score-audio";
import { getMatchAudioPreferences } from "@/utils/sound-settings";
import {
  announceCheckoutCalloutAsync,
  announceGameShotThenPlayerTurn,
  announceVisitEndAndHandOff,
  announceVisitTotalThenPlayerTurn,
  prefetchMatchPlayerVoices,
  primeCheckoutClips,
  primeGameShotClips,
  warmVoiceCache,
} from "@/utils/speech";
import { triggerHaptic } from "@/utils/haptics";
import { playDartHitSound } from "@/utils/sound-effects";
import { unlockVoicePlayback } from "@/utils/voice-playback";
import { cn } from "@/utils/cn";
import { isIPhoneDevice } from "@/utils/fullscreen";
import "@/features/community/community.css";

function getUpcomingX01PlayerName(game: X01GameState): string | null {
  if (game.players.length === 0) {
    return null;
  }
  const nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
  const nextPlayer = game.players[nextIndex];
  return nextPlayer ? getPlayerScorecardName(nextPlayer) : null;
}

export function CommunityMatchScreen() {
  const router = useRouter();
  const {
    user,
    room,
    members,
    profilesByUserId,
    loading,
    busy,
    error,
    leaveRoom,
  } = useCommunityRoom();

  const x01Game = useX01Store((state) => state.game);
  const startX01 = useX01Store((state) => state.startGame);
  const restoreX01 = useX01Store((state) => state.restoreGame);
  const throwX01Dart = useX01Store((state) => state.throwDart);
  const nextX01Player = useX01Store((state) => state.nextPlayer);
  const undoX01 = useX01Store((state) => state.undo);
  const rematchX01 = useX01Store((state) => state.rematch);
  const resetX01 = useX01Store((state) => state.reset);

  const cricketGame = useCricketStore((state) => state.game);
  const startCricket = useCricketStore((state) => state.startGame);
  const restoreCricket = useCricketStore((state) => state.restoreGame);
  const throwCricketDart = useCricketStore((state) => state.throwDart);
  const finishCricketTurn = useCricketStore((state) => state.finishTurn);
  const undoCricket = useCricketStore((state) => state.undo);
  const rematchCricket = useCricketStore((state) => state.rematch);
  const resetCricket = useCricketStore((state) => state.reset);

  const isHosting = Boolean(user && room && room.hostId === user.id);
  const gameMode: "x01" | "cricket" =
    room?.gameType === "cricket" ? "cricket" : "x01";

  const [isIPhone, setIsIPhone] = useState(false);
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const startedMatchIdRef = useRef<string | null>(null);
  const endingAbandonedMatchRef = useRef(false);
  /** Dedupe stats/history commit for a finished community match (per client). */
  const recordedCommunityStatsKeyRef = useRef<string | null>(null);
  /** Skip voice on first sync apply (hydrate/seed); mirror later remote diffs. */
  const skipRemoteVoiceOnceRef = useRef(true);

  useEffect(() => {
    setIsIPhone(isIPhoneDevice());
  }, []);

  useEffect(() => {
    skipRemoteVoiceOnceRef.current = true;
  }, [room?.id]);

  const seatedCount = members.filter((member) => member.seat != null).length;
  const hasGuestSeat = members.some((member) => member.seat === 1);
  // Require a hydrated roster (members.length > 0) so a fresh mount with
  // members=[] doesn't look like the opponent left and bounce to the grid.
  const opponentLeft = Boolean(
    !loading &&
      room &&
      room.status === "playing" &&
      members.length > 0 &&
      !hasGuestSeat,
  );

  useEffect(() => {
    if (loading || !user) {
      return;
    }
    if (!room || room.status === "ended") {
      useX01Store.getState().reset();
      useCricketStore.getState().reset();
      startedMatchIdRef.current = null;
      router.replace("/community");
      return;
    }
    if (room.status === "lobby") {
      router.replace(seatedCount >= 2 ? "/community/waiting" : "/community");
      return;
    }
    if (opponentLeft && !endingAbandonedMatchRef.current) {
      endingAbandonedMatchRef.current = true;
      discardPendingMatchStats();
      useX01Store.getState().reset();
      useCricketStore.getState().reset();
      startedMatchIdRef.current = null;
      // End the orphaned playing room so the feed doesn't bounce us back to /match.
      void leaveRoom().finally(() => {
        endingAbandonedMatchRef.current = false;
        router.replace("/community");
      });
    }
  }, [leaveRoom, loading, opponentLeft, room, router, seatedCount, user]);

  const playable = useMemo(() => {
    if (!room || room.status !== "playing" || loading || seatedCount < 2) {
      return null;
    }
    return buildCommunityMatchPlaySetup({
      room,
      members,
      profilesByUserId,
    });
  }, [loading, members, profilesByUserId, room, seatedCount]);

  // Host mints the local engine game once; guest waits for synced snapshot.
  useEffect(() => {
    if (!room || room.status !== "playing" || !playable || "error" in playable) {
      if (playable && "error" in playable && !opponentLeft) {
        setSetupError(playable.error);
      }
      return;
    }

    setSetupError(null);
    if (!isHosting) {
      return;
    }

    const matchId = communityEngineMatchId(room.id);
    if (startedMatchIdRef.current === matchId) {
      return;
    }

    if (playable.kind === "x01") {
      const existing = useX01Store.getState().game;
      if (
        existing?.matchId === matchId &&
        (existing.status === "playing" || existing.status === "finished")
      ) {
        startedMatchIdRef.current = matchId;
        return;
      }
      startX01(playable.setup);
      startedMatchIdRef.current = matchId;
      return;
    }

    const existing = useCricketStore.getState().game;
    if (
      existing?.matchId === matchId &&
      (existing.status === "playing" || existing.status === "finished")
    ) {
      startedMatchIdRef.current = matchId;
      return;
    }
    startCricket(playable.setup);
    startedMatchIdRef.current = matchId;
  }, [isHosting, opponentLeft, playable, room, startCricket, startX01]);

  const activeGame = gameMode === "cricket" ? cricketGame : x01Game;
  const resetStore = gameMode === "cricket" ? resetCricket : resetX01;

  const getLocalState = useCallback(() => {
    const game = gameMode === "cricket"
      ? useCricketStore.getState().game
      : useX01Store.getState().game;
    return game ? (game as unknown as Record<string, unknown>) : null;
  }, [gameMode]);

  const restoreRemoteState = useCallback(
    (state: Record<string, unknown>) => {
      const skipVoice = skipRemoteVoiceOnceRef.current;
      if (skipVoice) {
        skipRemoteVoiceOnceRef.current = false;
      }

      if (gameMode === "cricket") {
        const prev = useCricketStore.getState().game;
        const next = state as unknown as CricketGameState;
        restoreCricket(next);
        startedMatchIdRef.current =
          typeof state.matchId === "string"
            ? state.matchId
            : room
              ? communityEngineMatchId(room.id)
              : null;
        if (!skipVoice && prev) {
          mirrorCommunityCricketVoice(prev, next);
        }
        return;
      }

      const prev = useX01Store.getState().game;
      const next = state as unknown as X01GameState;
      restoreX01(next);
      startedMatchIdRef.current =
        typeof state.matchId === "string"
          ? state.matchId
          : room
            ? communityEngineMatchId(room.id)
            : null;
      if (!skipVoice && prev) {
        mirrorCommunityX01Voice(prev, next);
      }
    },
    [gameMode, restoreCricket, restoreX01, room],
  );

  const playerUserIds = useMemo(() => {
    const hostId =
      members.find((member) => member.seat === 0)?.userId ?? room?.hostId ?? null;
    const guestId =
      members.find((member) => member.seat === 1)?.userId ?? null;
    return [hostId, guestId].filter((id): id is string => Boolean(id));
  }, [members, room?.hostId]);

  /** Live profiles → flags (`profileId` is `account-{userId}`). */
  const resolveCountryCode = useCallback(
    (
      player: { profileId?: string; countryCode?: string | null },
      seatIndex: number,
    ) => {
      if (player.countryCode) {
        return player.countryCode;
      }
      const profileUserId = getUserIdFromAccountProfileId(player.profileId);
      if (profileUserId) {
        return profilesByUserId[profileUserId]?.countryCode ?? null;
      }
      const seatUserId = playerUserIds[seatIndex];
      return seatUserId
        ? (profilesByUserId[seatUserId]?.countryCode ?? null)
        : null;
    },
    [playerUserIds, profilesByUserId],
  );

  const x01GameWithFlags = useMemo(() => {
    if (!x01Game) {
      return null;
    }
    return {
      ...x01Game,
      players: x01Game.players.map((player, index) => ({
        ...player,
        countryCode: resolveCountryCode(player, index),
      })),
    };
  }, [resolveCountryCode, x01Game]);

  const cricketGameWithFlags = useMemo(() => {
    if (!cricketGame) {
      return null;
    }
    return {
      ...cricketGame,
      players: cricketGame.players.map((player, index) => ({
        ...player,
        countryCode: resolveCountryCode(player, index),
      })),
    };
  }, [cricketGame, resolveCountryCode]);

  const {
    syncReady,
    syncError,
    isMyTurn,
    issueActive,
    issueRaisedBy,
    raiseIssue,
    clearIssue,
    publishLocalState,
  } = useCommunityMatchSync({
    roomId: room?.status === "playing" ? room.id : null,
    userId: user?.id ?? null,
    gameMode,
    enabled: Boolean(
      room?.status === "playing" &&
        seatedCount >= 2 &&
        !opponentLeft &&
        playerUserIds.length >= 2 &&
        (isHosting ? Boolean(activeGame) : true),
    ),
    isHost: isHosting,
    playerUserIds,
    getLocalState,
    restoreRemoteState,
  });

  const endCommunityMatch = useCallback(async () => {
    if (user?.id && activeGame?.status === "finished") {
      const key = getCommunityFinishStatsKey(activeGame);
      if (key && recordedCommunityStatsKeyRef.current !== key) {
        const recordedKey = recordCommunityFinishedMatch({
          game: activeGame,
          viewerUserId: user.id,
        });
        if (recordedKey) {
          recordedCommunityStatsKeyRef.current = recordedKey;
        }
      }
    }
    discardPendingMatchStats();
    resetStore();
    startedMatchIdRef.current = null;
    await leaveRoom();
    router.replace("/community");
  }, [activeGame, leaveRoom, resetStore, router, user?.id]);

  const leaveAndClear = useCallback(() => {
    discardPendingMatchStats();
    resetStore();
    startedMatchIdRef.current = null;
    void leaveRoom();
  }, [leaveRoom, resetStore]);

  // Commit career stats + match history on both clients when the engine finishes.
  useEffect(() => {
    if (!user?.id || !activeGame) {
      return;
    }

    const key = getCommunityFinishStatsKey(activeGame);
    if (!key || recordedCommunityStatsKeyRef.current === key) {
      return;
    }

    const recordedKey = recordCommunityFinishedMatch({
      game: activeGame,
      viewerUserId: user.id,
    });

    if (recordedKey) {
      recordedCommunityStatsKeyRef.current = recordedKey;
    }
  }, [activeGame, user?.id]);

  // Rematch (local or synced) clears the finish dedupe key for the next result.
  useEffect(() => {
    if (activeGame?.status === "playing") {
      recordedCommunityStatsKeyRef.current = null;
    }
  }, [activeGame?.status]);

  const { requestExit, endMatchConfirmDialog } = useEndMatchExit({
    gameMode: gameMode === "cricket" ? "cricket" : "x01",
    onReset: leaveAndClear,
    exitHref: "/community",
    onSaveLeave: leaveAndClear,
    copy: {
      title: "Leave match?",
      description: "This closes the Community Play room for both players.",
      confirmLabel: "Leave",
      cancelLabel: "Keep playing",
      secondaryLabel: "End match",
    },
  });

  useMatchFullscreen(Boolean(activeGame && room?.status === "playing"));

  const matchVoiceEnabled = Boolean(activeGame && syncReady);
  const voiceReady = useMatchVoiceReady({ enabled: matchVoiceEnabled });

  useMatchGameOnAnnouncement({
    matchId: activeGame?.matchId,
    startingPlayerName: (() => {
      const player = activeGame?.players[activeGame.currentPlayerIndex ?? -1];
      return player ? getPlayerScorecardName(player) : null;
    })(),
    playerNames: activeGame?.players.map(getPlayerScorecardName),
    resumeReady: syncReady,
    matchStatus: activeGame?.status,
  });

  useEffect(() => {
    if (
      !syncReady ||
      !voiceReady ||
      !activeGame ||
      !getMatchAudioPreferences().voice
    ) {
      return;
    }

    warmVoiceCache();
    primeScoreClips();
    primeGameShotClips();
    if (gameMode === "x01") {
      primeCheckoutClips();
    } else if (cricketGame) {
      primeCricketClosedClips(cricketGame.variant ?? "classic");
    }
    prefetchMatchPlayerVoices(activeGame.players.map(getPlayerScorecardName));
  }, [activeGame, cricketGame, gameMode, syncReady, voiceReady]);

  const x01VisitFull = Boolean(
    x01Game && x01Game.visitDarts.length >= DARTS_PER_VISIT,
  );
  const cricketVisitFull = Boolean(
    cricketGame && cricketGame.visitDarts.length >= DARTS_PER_VISIT,
  );

  const issueAlertedRef = useRef(false);
  /** While paused, board stays locked until someone undoes, then thrower can re-enter. */
  const [issueScoringUnlocked, setIssueScoringUnlocked] = useState(false);
  const issueHistoryLenRef = useRef(0);
  useEffect(() => {
    if (!issueActive) {
      issueAlertedRef.current = false;
      setIssueScoringUnlocked(false);
      issueHistoryLenRef.current = activeGame?.history.length ?? 0;
      return;
    }
    if (!issueAlertedRef.current) {
      issueAlertedRef.current = true;
      setIssueScoringUnlocked(false);
      issueHistoryLenRef.current = activeGame?.history.length ?? 0;
      triggerHaptic("warning");
      return;
    }
    // Remote or local undo shrinks history — unlock board for the current thrower.
    const historyLen = activeGame?.history.length ?? 0;
    if (historyLen < issueHistoryLenRef.current) {
      setIssueScoringUnlocked(true);
    }
    issueHistoryLenRef.current = historyLen;
  }, [activeGame?.history.length, issueActive]);

  const issueRaiserName = useMemo(() => {
    if (!issueRaisedBy) {
      return null;
    }
    const profile = profilesByUserId[issueRaisedBy];
    if (profile) {
      return communityFirstName(profile.displayName);
    }
    return "Opponent";
  }, [issueRaisedBy, profilesByUserId]);

  const finishX01TurnWithVoice = useCallback(
    (options?: { allowPartialVisit?: boolean }) => {
      if (issueActive) {
        return false;
      }
      const active = useX01Store.getState().game;
      if (!active || active.visitDarts.length === 0) {
        return false;
      }
      if (
        !options?.allowPartialVisit &&
        active.visitDarts.length < DARTS_PER_VISIT
      ) {
        return false;
      }

      unlockVoicePlayback();
      const audio = getMatchAudioPreferences();
      const visitTotal = getX01VisitEffectiveScore(
        active,
        active.visitDarts.length,
      );
      const busted = active.history
        .slice(-active.visitDarts.length)
        .some((entry) => entry.bust);
      const nextPlayerName = getUpcomingX01PlayerName(active);

      const advanceAndPublish = () => {
        nextX01Player();
        void publishLocalState();
      };

      if (audio.voice) {
        void announceVisitEndAndHandOff({
          visitTotal,
          busted,
          nextPlayerName,
          onAfterVisitTotal: advanceAndPublish,
          getCheckoutCallout: () => {
            const updated = useX01Store.getState().game;
            if (!updated || updated.status !== "playing") {
              return null;
            }
            return resolveCheckoutCalloutForPlayer(
              updated,
              updated.currentPlayerIndex,
              DARTS_PER_VISIT,
            );
          },
        });
      } else {
        advanceAndPublish();
      }

      return true;
    },
    [issueActive, nextX01Player, publishLocalState],
  );

  const handleX01DartHit = useCallback(
    (hit: DartHit) => {
      if (!isMyTurn || (issueActive && !issueScoringUnlocked)) {
        return;
      }

      unlockVoicePlayback();
      const before = useX01Store.getState().game;
      const audio = getMatchAudioPreferences();
      throwX01Dart(hit);
      const after = useX01Store.getState().game;
      const gameShot =
        before && after ? resolveGameShotOutcome(before, after) : null;

      celebrateAfterDartThrow(
        hit,
        after,
        (state) => getX01VisitEffectiveScore(state, state.visitDarts.length),
        {
          skipMatchWinCelebration: Boolean(
            audio.voice && gameShot === "match",
          ),
        },
      );

      if (gameShot && audio.voice && after) {
        const nextPlayerState =
          after.status === "playing"
            ? after.players[after.currentPlayerIndex]
            : null;
        const checkoutCallout =
          after.status === "playing"
            ? resolveCheckoutCalloutForPlayer(
                after,
                after.currentPlayerIndex,
                DARTS_PER_VISIT,
              )
            : null;

        announceGameShotThenPlayerTurn(
          gameShot,
          nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
          gameShot === "match" ? playMatchWinCelebration : undefined,
          checkoutCallout,
        );
        void publishLocalState();
        return;
      }

      if (gameShot === "match" && !audio.voice) {
        playMatchWinCelebration();
      }

      const lastEntry = after?.history.at(-1);
      if (lastEntry?.bust && after?.status === "playing") {
        triggerHaptic("warning");
        if (issueActive) {
          void publishLocalState();
          return;
        }
        finishX01TurnWithVoice({ allowPartialVisit: true });
        return;
      }

      if (audio.voice && after?.status === "playing") {
        const dartsAvailable = DARTS_PER_VISIT - after.visitDarts.length;
        const checkoutCallout = resolveCheckoutCalloutForPlayer(
          after,
          after.currentPlayerIndex,
          dartsAvailable,
        );
        if (checkoutCallout) {
          announceCheckoutCalloutAsync(checkoutCallout);
        }
      }

      void publishLocalState();
    },
    [
      finishX01TurnWithVoice,
      isMyTurn,
      issueActive,
      issueScoringUnlocked,
      publishLocalState,
      throwX01Dart,
    ],
  );

  const handleCricketDartHit = useCallback(
    (hit: DartHit) => {
      if (!isMyTurn || (issueActive && !issueScoringUnlocked)) {
        return;
      }

      unlockVoicePlayback();
      const before = useCricketStore.getState().game;
      if (!before) {
        return;
      }

      const historyLengthBefore = before.history.length;
      const audio = getMatchAudioPreferences();
      throwCricketDart(hit);
      const after = useCricketStore.getState().game;
      const gameShot =
        after != null ? resolveGameShotOutcome(before, after) : null;

      celebrateAfterDartThrow(
        hit,
        after,
        (game) => game.visitDarts.reduce((total, dart) => total + dart.score, 0),
        {
          skipMatchWinCelebration: Boolean(
            audio.voice && gameShot === "match",
          ),
        },
      );

      if (after && audio.voice) {
        if (gameShot) {
          const nextPlayerState =
            after.status === "playing"
              ? after.players[after.currentPlayerIndex]
              : null;
          announceGameShotThenPlayerTurn(
            gameShot,
            nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
            gameShot === "match" ? playMatchWinCelebration : undefined,
          );
          void publishLocalState();
          return;
        }

        if (after.history.length > historyLengthBefore) {
          const lastEntry = after.history.at(-1);
          if (lastEntry?.segmentClosed) {
            announceCricketTargetClosed(
              lastEntry.segmentClosed,
              after.variant ?? "classic",
            );
          }
        }
      } else if (gameShot === "match") {
        playMatchWinCelebration();
      }

      void publishLocalState();
    },
    [
      isMyTurn,
      issueActive,
      issueScoringUnlocked,
      publishLocalState,
      throwCricketDart,
    ],
  );

  const handleX01Confirm = useCallback(() => {
    if (!isMyTurn || issueActive) {
      return;
    }
    finishX01TurnWithVoice();
  }, [finishX01TurnWithVoice, isMyTurn, issueActive]);

  const handleCricketConfirm = useCallback(() => {
    if (!isMyTurn || issueActive) {
      return;
    }

    unlockVoicePlayback();
    const active = useCricketStore.getState().game;
    if (!active || active.visitDarts.length < DARTS_PER_VISIT) {
      return;
    }

    const audio = getMatchAudioPreferences();
    const nextGame = previewFinishCricketTurn(active);
    const visitTotal = getCricketVisitPointsScored(active);
    const gameShot = resolveGameShotOutcome(active, nextGame);

    finishCricketTurn();
    celebrateAfterFinishTurn(useCricketStore.getState().game, {
      skipMatchWinCelebration: Boolean(audio.voice && gameShot === "match"),
    });

    if (audio.voice) {
      if (gameShot) {
        const nextPlayerState =
          nextGame.status === "playing"
            ? nextGame.players[nextGame.currentPlayerIndex]
            : null;
        announceGameShotThenPlayerTurn(
          gameShot,
          nextPlayerState ? getPlayerScorecardName(nextPlayerState) : null,
          gameShot === "match" ? playMatchWinCelebration : undefined,
        );
      } else {
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
    }

    void publishLocalState();
  }, [finishCricketTurn, isMyTurn, issueActive, publishLocalState]);

  const canUndoWhilePaused = isMyTurn || issueActive;

  const handleX01Undo = useCallback(() => {
    if (!canUndoWhilePaused) {
      return;
    }
    if (issueActive) {
      setIssueScoringUnlocked(true);
    }
    undoX01();
    void publishLocalState();
  }, [canUndoWhilePaused, issueActive, publishLocalState, undoX01]);

  const handleCricketUndo = useCallback(() => {
    if (!canUndoWhilePaused) {
      return;
    }
    if (issueActive) {
      setIssueScoringUnlocked(true);
    }
    undoCricket();
    void publishLocalState();
  }, [canUndoWhilePaused, issueActive, publishLocalState, undoCricket]);

  const handleX01Miss = useCallback(() => {
    if (!isMyTurn || issueActive || x01VisitFull) {
      return;
    }
    triggerHaptic("warning");
    playDartHitSound({
      segment: "miss",
      multiplier: "miss",
      score: 0,
      label: "Miss",
    });
    handleX01DartHit({
      segment: "miss",
      multiplier: "miss",
      score: 0,
      label: "Miss",
    });
  }, [handleX01DartHit, isMyTurn, issueActive, x01VisitFull]);

  const handleCricketMiss = useCallback(() => {
    if (!isMyTurn || issueActive || cricketVisitFull) {
      return;
    }
    triggerHaptic("warning");
    playDartHitSound({
      segment: "miss",
      multiplier: "miss",
      score: 0,
      label: "Miss",
    });
    handleCricketDartHit({
      segment: "miss",
      multiplier: "miss",
      score: 0,
      label: "Miss",
    });
  }, [cricketVisitFull, handleCricketDartHit, isMyTurn, issueActive]);

  const handleHostRematch = useCallback(() => {
    if (!isHosting || activeGame?.status !== "finished") {
      return;
    }
    recordedCommunityStatsKeyRef.current = null;
    discardPendingMatchStats();
    if (gameMode === "cricket") {
      rematchCricket();
    } else {
      rematchX01();
    }
    void clearIssue();
    void publishLocalState();
  }, [
    activeGame?.status,
    clearIssue,
    gameMode,
    isHosting,
    publishLocalState,
    rematchCricket,
    rematchX01,
  ]);

  const x01SwipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (canUndoWhilePaused) {
        handleX01Undo();
      }
    },
    onSwipeRight: () => {
      if (isMyTurn && !issueActive && x01VisitFull) {
        handleX01Confirm();
      }
    },
  });

  const cricketSwipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (canUndoWhilePaused) {
        handleCricketUndo();
      }
    },
    onSwipeRight: () => {
      if (isMyTurn && !issueActive && cricketVisitFull) {
        handleCricketConfirm();
      }
    },
  });

  const turnLocked = !syncReady || !isMyTurn;
  const pauseLocksBoard = issueActive && !issueScoringUnlocked;
  const boardLocked = turnLocked || pauseLocksBoard;
  const confirmLocked = turnLocked || issueActive;
  const missLocked = turnLocked || issueActive;
  const undoLocked = !syncReady || !canUndoWhilePaused;

  const handleRaiseIssue = useCallback(() => {
    triggerHaptic("warning");
    void raiseIssue();
  }, [raiseIssue]);

  const handleResumeIssue = useCallback(() => {
    void clearIssue();
  }, [clearIssue]);

  const matchPauseHeaderAction =
    activeGame?.status === "playing" ? (
      <CommunityMatchPauseButton
        issueActive={issueActive}
        busy={busy}
        onRaise={handleRaiseIssue}
        onResume={handleResumeIssue}
      />
    ) : null;

  const matchIssueBanner =
    activeGame?.status === "playing" ? (
      <CommunityMatchIssueBanner
        issueActive={issueActive}
        raiserName={issueRaiserName}
      />
    ) : null;

  if (!user) {
    return (
      <GameSetupPage title="Community">
        <div className={cn("community-room", isIPhone && "community-room--iphone")}>
          <p className="community-room__copy">Sign in to enter this match.</p>
          <Link href={LOGIN_PATH} className="community-room__sign-in-link">
            <TouchButton type="button" fullWidth size="lg">
              Sign in
            </TouchButton>
          </Link>
        </div>
      </GameSetupPage>
    );
  }

  if (loading || !room || room.status !== "playing") {
    return (
      <GameSetupPage title="Community">
        <p className="community-room__status">Loading match…</p>
      </GameSetupPage>
    );
  }

  if (setupError || (playable && "error" in playable)) {
    return (
      <GameSetupPage title="Community" className={cn(isIPhone && "community-page--iphone")}>
        <div className={cn("community-room", isIPhone && "community-room--iphone")}>
          <p className="community-room__error">
            {setupError ?? (playable && "error" in playable ? playable.error : null)}
          </p>
          {error ? <p className="community-room__error">{error}</p> : null}
          <TouchButton
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            disabled={busy}
            onClick={() => {
              void endCommunityMatch();
            }}
          >
            Back to Community
          </TouchButton>
        </div>
      </GameSetupPage>
    );
  }

  if (!activeGame || !syncReady) {
    return (
      <GameSetupPage title="Community">
        <p className="community-room__status">
          {isHosting ? "Syncing match…" : "Waiting for match sync…"}
        </p>
        {syncError ? <p className="community-room__error">{syncError}</p> : null}
      </GameSetupPage>
    );
  }

  const showMatchComplete =
    activeGame.status === "finished" && activeGame.winnerId != null;
  const winnerPlayer = activeGame.players.find(
    (player) => player.id === activeGame.winnerId,
  );
  const winnerName = winnerPlayer ? getPlayerScorecardName(winnerPlayer) : "Player";

  if (gameMode === "cricket" && cricketGame && cricketGameWithFlags) {
    const matchStats = computeCricketMatchStatsFromGame(cricketGameWithFlags);
    const currentPlayer =
      cricketGameWithFlags.players[cricketGameWithFlags.currentPlayerIndex];
    const canUndo = cricketGameWithFlags.history.length > 0;

    return (
      <>
        {endMatchConfirmDialog}
        <ClubCricketScoringView
          game={cricketGameWithFlags}
          onDartHit={handleCricketDartHit}
          onMiss={handleCricketMiss}
          onUndo={handleCricketUndo}
          onConfirmTurn={handleCricketConfirm}
          onLeave={requestExit}
          onOpenStats={() => setStatsPanelOpen(true)}
          matchKindLabel="Community Match"
          headerActions={matchPauseHeaderAction}
          boardDisabled={boardLocked || cricketVisitFull}
          missDisabled={missLocked || cricketVisitFull}
          undoDisabled={undoLocked || !canUndo}
          confirmDisabled={confirmLocked || !cricketVisitFull}
          swipeHandlers={cricketSwipeHandlers}
          overlay={
            <>
              {matchIssueBanner}
              <CricketPlayerStatsSlidePanel
                open={statsPanelOpen}
                game={cricketGameWithFlags}
                stats={matchStats}
                focusPlayerId={currentPlayer?.id ?? null}
                onClose={() => setStatsPanelOpen(false)}
              />
              <MatchCompletePanel
                open={showMatchComplete}
                winnerName={winnerName}
                matchId={cricketGameWithFlags.matchId}
                onHome={() => {
                  void endCommunityMatch();
                }}
                onRematch={isHosting ? handleHostRematch : () => undefined}
              />
            </>
          }
        />
      </>
    );
  }

  if (!x01Game) {
    return (
      <GameSetupPage title="Community">
        <p className="community-room__status">Starting scoring…</p>
      </GameSetupPage>
    );
  }

  const displayX01Game = x01GameWithFlags ?? x01Game;
  const matchStats = computeX01MatchStatsFromGame(displayX01Game);
  const currentPlayer = displayX01Game.players[displayX01Game.currentPlayerIndex];
  const canUndo = displayX01Game.history.length > 0;

  return (
    <>
      {endMatchConfirmDialog}
      <ClubX01ScoringView
        game={displayX01Game}
        onDartHit={handleX01DartHit}
        onMiss={handleX01Miss}
        onUndo={handleX01Undo}
        onConfirmTurn={handleX01Confirm}
        onLeave={requestExit}
        onOpenStats={() => setStatsPanelOpen(true)}
        matchKindLabel="Community Match"
        headerActions={matchPauseHeaderAction}
        boardDisabled={boardLocked || x01VisitFull}
        missDisabled={missLocked || x01VisitFull}
        undoDisabled={undoLocked || !canUndo}
        confirmDisabled={confirmLocked || !x01VisitFull}
        swipeHandlers={x01SwipeHandlers}
        overlay={
          <>
            {matchIssueBanner}
            <X01PlayerStatsSlidePanel
              open={statsPanelOpen}
              game={displayX01Game}
              stats={matchStats}
              focusPlayerId={currentPlayer?.id ?? null}
              onClose={() => setStatsPanelOpen(false)}
            />
            <MatchCompletePanel
              open={showMatchComplete}
              winnerName={winnerName}
              matchId={displayX01Game.matchId}
              onHome={() => {
                void endCommunityMatch();
              }}
              onRematch={isHosting ? handleHostRematch : () => undefined}
            />
          </>
        }
      />
    </>
  );
}
