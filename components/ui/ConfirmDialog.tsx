"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Z_INDEX } from "@/lib/constants";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  eyebrow?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryLabel?: string;
  confirmVariant?: "primary" | "danger";
  secondaryVariant?: "primary" | "danger" | "secondary";
  onConfirm: () => void;
  onCancel: () => void;
  onSecondary?: () => void;
  className?: string;
  layout?: "default" | "leave-match";
}

export function ConfirmDialog({
  open,
  title,
  description,
  eyebrow,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  secondaryLabel,
  confirmVariant = "primary",
  secondaryVariant = "danger",
  onConfirm,
  onCancel,
  onSecondary,
  className,
  layout = "default",
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

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
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="confirm-dialog__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            className={cn(
              "confirm-dialog__center",
              layout === "leave-match" && "confirm-dialog__center--leave-match",
            )}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <GlassPanel className={cn("confirm-dialog", layout === "leave-match" && "confirm-dialog--leave-match", className)}>
              {eyebrow ? <p className="confirm-dialog__eyebrow">{eyebrow}</p> : null}
              <h2 id="confirm-dialog-title" className="confirm-dialog__title">
                {title}
              </h2>
              <p id="confirm-dialog-description" className="confirm-dialog__description">
                {description}
              </p>
              <div
                className={cn(
                  "confirm-dialog__actions",
                  layout === "leave-match" && "confirm-dialog__actions--leave-match",
                )}
              >
                <TouchButton variant="secondary" size="lg" fullWidth onClick={onCancel}>
                  {cancelLabel}
                </TouchButton>
                <TouchButton
                  variant={confirmVariant === "danger" ? "danger" : "primary"}
                  size="lg"
                  fullWidth
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </TouchButton>
                {secondaryLabel && onSecondary ? (
                  <TouchButton
                    variant="ghost"
                    size="lg"
                    fullWidth
                    className="confirm-dialog__end-match"
                    onClick={onSecondary}
                  >
                    {secondaryLabel}
                  </TouchButton>
                ) : null}
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
