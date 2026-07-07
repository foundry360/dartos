"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { flushActiveMatchCloudSync } from "@/features/match-play/lib/flush-active-match-cloud-sync";
import { APP_HOME_PATH } from "@/lib/auth/routes";

interface UseEndMatchExitOptions {
  onReset: () => void;
  exitHref?: string;
}

export function useEndMatchExit({ onReset, exitHref = APP_HOME_PATH }: UseEndMatchExitOptions) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const requestExit = useCallback(() => setOpen(true), []);
  const cancelExit = useCallback(() => setOpen(false), []);

  const confirmLeave = useCallback(() => {
    setOpen(false);
    void flushActiveMatchCloudSync(user?.id);
    router.push(exitHref);
  }, [exitHref, router, user?.id]);

  const confirmAbandon = useCallback(() => {
    onReset();
    setOpen(false);
    void flushActiveMatchCloudSync(user?.id);
    router.push(exitHref);
  }, [exitHref, onReset, router, user?.id]);

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
