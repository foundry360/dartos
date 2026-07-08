"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Z_INDEX } from "@/lib/constants";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";

interface MatchCompletePanelProps {
  open: boolean;
  winnerName: string;
  onHome: () => void;
  onRematch: () => void;
}

export function MatchCompletePanel({
  open,
  winnerName,
  onHome,
  onRematch,
}: MatchCompletePanelProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="confirm-dialog-root"
          style={{ zIndex: Z_INDEX.modal }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            aria-hidden
            className="confirm-dialog__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="match-complete-title"
            className="confirm-dialog__center confirm-dialog__center--leave-match"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <GlassPanel className="confirm-dialog confirm-dialog--leave-match match-complete-dialog">
              <h2 id="match-complete-title" className="confirm-dialog__title match-complete-dialog__title">
                {winnerName} wins
              </h2>
              <div className="confirm-dialog__actions confirm-dialog__actions--leave-match">
                <TouchButton variant="secondary" size="lg" fullWidth onClick={onHome}>
                  Back to Home
                </TouchButton>
                <TouchButton variant="primary" size="lg" fullWidth onClick={onRematch}>
                  Rematch
                </TouchButton>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
