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

  const confirmExit = useCallback(() => {
    onReset();
    setOpen(false);
    router.push(exitHref);
  }, [exitHref, onReset, router]);

  const endMatchConfirmDialog = (
    <ConfirmDialog
      open={open}
      eyebrow="Leave match"
      title="End match?"
      description="Your progress will be lost. Are you sure you want to leave this match?"
      confirmLabel="End match"
      cancelLabel="Keep playing"
      confirmVariant="primary"
      onConfirm={confirmExit}
      onCancel={cancelExit}
    />
  );

  return { requestExit, endMatchConfirmDialog };
}
