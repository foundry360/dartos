"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { useCheckout121Store } from "@/features/classic-games/store/checkout-121-store";
import { useBobs27Store } from "@/features/classic-games/store/bobs-27-store";
import { useHalveItStore } from "@/features/classic-games/store/halve-it-store";
import { useShanghaiStore } from "@/features/classic-games/store/shanghai-store";
import { useKillerStore } from "@/features/classic-games/store/killer-store";
import { useBaseballStore } from "@/features/classic-games/store/baseball-store";
import { useGolfStore } from "@/features/classic-games/store/golf-store";
import { useTicTacToeStore } from "@/features/classic-games/store/tic-tac-toe-store";
import { abandonActiveMatchCloud } from "@/features/match-play/lib/abandon-active-match-cloud";
import { flushActiveMatchCloudSync } from "@/features/match-play/lib/flush-active-match-cloud-sync";
import { cancelVoiceAnnouncements } from "@/utils/voice-playback";
import { markMatchGameOnAnnounced } from "@/hooks/useMatchGameOnAnnouncement";
import { useX01Store } from "@/features/x01/store/x01-store";
import { APP_HOME_PATH } from "@/lib/auth/routes";

interface UseEndMatchExitOptions {
  gameMode: "x01" | "cricket" | "checkout-121" | "halve-it" | "bobs-27" | "shanghai" | "killer" | "baseball" | "golf" | "tic-tac-toe";
  onReset: () => void;
  exitHref?: string;
  /** Runs before navigating away on Save (keep game in memory). */
  onSaveLeave?: () => void;
  copy?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    secondaryLabel?: string;
  };
}

export function useEndMatchExit({
  gameMode,
  onReset,
  exitHref = APP_HOME_PATH,
  onSaveLeave,
  copy,
}: UseEndMatchExitOptions) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const matchExitInProgressRef = useRef(false);

  const getMatchId = useCallback(() => {
    if (gameMode === "cricket") {
      return useCricketStore.getState().game?.matchId;
    }

    if (gameMode === "checkout-121") {
      return useCheckout121Store.getState().game?.matchId;
    }

    if (gameMode === "halve-it") {
      return useHalveItStore.getState().game?.matchId;
    }

    if (gameMode === "bobs-27") {
      return useBobs27Store.getState().game?.matchId;
    }

    if (gameMode === "shanghai") {
      return useShanghaiStore.getState().game?.matchId;
    }

    if (gameMode === "killer") {
      return useKillerStore.getState().game?.matchId;
    }

    if (gameMode === "baseball") {
      return useBaseballStore.getState().game?.matchId;
    }

    if (gameMode === "golf") {
      return useGolfStore.getState().game?.matchId;
    }

    if (gameMode === "tic-tac-toe") {
      return useTicTacToeStore.getState().game?.matchId;
    }

    return useX01Store.getState().game?.matchId;
  }, [gameMode]);

  const requestExit = useCallback(() => {
    // Back / leave taps also unlock iOS audio — cancel outstanding callouts so a
    // queued "you're up" from a bot handoff does not play over the leave dialog.
    cancelVoiceAnnouncements();
    setOpen(true);
  }, []);
  const cancelExit = useCallback(() => setOpen(false), []);

  const confirmLeave = useCallback(() => {
    setOpen(false);
    matchExitInProgressRef.current = true;
    const matchId = getMatchId();
    if (matchId) {
      markMatchGameOnAnnounced(matchId);
    }
    cancelVoiceAnnouncements();
    onSaveLeave?.();
    void flushActiveMatchCloudSync(user?.id);
    router.push(exitHref);
  }, [exitHref, getMatchId, onSaveLeave, router, user?.id]);

  const confirmAbandon = useCallback(() => {
    setOpen(false);
    const matchId = getMatchId();
    matchExitInProgressRef.current = true;
    if (matchId) {
      markMatchGameOnAnnounced(matchId);
    }
    cancelVoiceAnnouncements();
    router.replace(exitHref);
    onReset();
    void abandonActiveMatchCloud(user?.id, matchId);
  }, [exitHref, getMatchId, onReset, router, user?.id]);

  const endMatchConfirmDialog = (
    <ConfirmDialog
      open={open}
      layout="leave-match"
      eyebrow={copy?.eyebrow ?? "Leave match"}
      title={copy?.title ?? "Leave match?"}
      description={
        copy?.description ?? "You can resume this match from the home screen."
      }
      confirmLabel={copy?.confirmLabel ?? "Save Match"}
      cancelLabel={copy?.cancelLabel ?? "Keep playing"}
      secondaryLabel={copy?.secondaryLabel ?? "End match"}
      confirmVariant="primary"
      secondaryVariant="danger"
      onConfirm={confirmLeave}
      onCancel={cancelExit}
      onSecondary={confirmAbandon}
    />
  );

  return { requestExit, endMatchConfirmDialog, matchExitInProgressRef };
}
