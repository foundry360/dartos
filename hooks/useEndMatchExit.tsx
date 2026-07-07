"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { APP_HOME_PATH } from "@/lib/auth/routes";

interface UseEndMatchExitOptions {
  onReset: () => void;
  exitHref?: string;
}

export function useEndMatchExit({ onReset, exitHref = APP_HOME_PATH }: UseEndMatchExitOptions) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const requestExit = useCallback(() => setOpen(true), []);
  const cancelExit = useCallback(() => setOpen(false), []);

  const confirmLeave = useCallback(() => {
    setOpen(false);
    router.push(exitHref);
  }, [exitHref, router]);

  const confirmAbandon = useCallback(() => {
    onReset();
    setOpen(false);
    router.push(exitHref);
  }, [exitHref, onReset, router]);

  const endMatchConfirmDialog = (
    <ConfirmDialog
      open={open}
      eyebrow="Leave match"
      title="Leave match?"
      description="You can resume this match from the home screen. End match only if you want to discard progress."
      confirmLabel="Leave"
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
