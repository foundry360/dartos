"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { abandonActiveMatchCloud } from "@/features/match-play/lib/abandon-active-match-cloud";
import { flushActiveMatchCloudSync } from "@/features/match-play/lib/flush-active-match-cloud-sync";
import { useX01Store } from "@/features/x01/store/x01-store";
import { APP_HOME_PATH } from "@/lib/auth/routes";

interface UseEndMatchExitOptions {
  gameMode: "x01" | "cricket";
  onReset: () => void;
  exitHref?: string;
}

export function useEndMatchExit({
  gameMode,
  onReset,
  exitHref = APP_HOME_PATH,
}: UseEndMatchExitOptions) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const getMatchId = useCallback(() => {
    const game =
      gameMode === "cricket" ? useCricketStore.getState().game : useX01Store.getState().game;

    return game?.matchId;
  }, [gameMode]);

  const requestExit = useCallback(() => setOpen(true), []);
  const cancelExit = useCallback(() => setOpen(false), []);

  const confirmLeave = useCallback(() => {
    setOpen(false);
    void flushActiveMatchCloudSync(user?.id);
    router.push(exitHref);
  }, [exitHref, router, user?.id]);

  const confirmAbandon = useCallback(() => {
    setOpen(false);
    void abandonActiveMatchCloud(user?.id, getMatchId());
    router.replace(exitHref);
    onReset();
  }, [exitHref, getMatchId, onReset, router, user?.id]);

  const endMatchConfirmDialog = (
    <ConfirmDialog
      open={open}
      layout="leave-match"
      eyebrow="Leave match"
      title="Leave match?"
      description="You can resume this match from the home screen."
      confirmLabel="Save Match"
      cancelLabel="Keep playing"
      secondaryLabel="End match"
      confirmVariant="primary"
      secondaryVariant="danger"
      onConfirm={confirmLeave}
      onCancel={cancelExit}
      onSecondary={confirmAbandon}
    />
  );

  return { requestExit, endMatchConfirmDialog };
}
