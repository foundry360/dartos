"use client";

import type { ReactNode } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import { cn } from "@/utils/cn";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  eyebrow?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, only the confirm action is shown (backdrop/Escape still cancel). */
  hideCancel?: boolean;
  secondaryLabel?: string;
  confirmVariant?: "primary" | "danger";
  secondaryVariant?: "primary" | "danger" | "secondary";
  onConfirm: () => void;
  onCancel: () => void;
  onSecondary?: () => void;
  className?: string;
  layout?: "default" | "leave-match";
  size?: "default" | "wide";
  /** Body copy alignment. Titles use the shared app-modal header. */
  align?: "center" | "left";
  busy?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  eyebrow,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  hideCancel = false,
  secondaryLabel,
  confirmVariant = "primary",
  secondaryVariant = "danger",
  onConfirm,
  onCancel,
  onSecondary,
  className,
  layout = "default",
  size = "default",
  align = "left",
  busy = false,
}: ConfirmDialogProps) {
  const sheetClassName =
    layout === "leave-match" || size === "wide"
      ? "create-league-modal"
      : "create-venue-modal";

  return (
    <BottomSheet
      open={open}
      title={title}
      onClose={onCancel}
      className={cn(
        "confirm-dialog-modal",
        sheetClassName,
        layout === "leave-match" && "confirm-dialog-modal--leave-match",
        className,
      )}
    >
      <div
        className={cn(
          "confirm-dialog-modal__body",
          layout === "leave-match"
            ? "create-league-modal__body"
            : "create-venue-modal__body",
          align === "center" && "confirm-dialog-modal__body--center",
        )}
      >
        {eyebrow ? (
          <p className="confirm-dialog-modal__eyebrow">{eyebrow}</p>
        ) : null}
        <div
          id="confirm-dialog-description"
          className="confirm-dialog-modal__description"
        >
          {description}
        </div>
        <div
          className={cn(
            "confirm-dialog-modal__actions",
            hideCancel && "confirm-dialog-modal__actions--single",
            layout === "leave-match" &&
              "confirm-dialog-modal__actions--leave-match",
            Boolean(secondaryLabel && onSecondary) &&
              !hideCancel &&
              "confirm-dialog-modal__actions--triple",
          )}
        >
          {hideCancel ? null : (
            <TouchButton
              variant="secondary"
              size="lg"
              fullWidth
              disabled={busy}
              onClick={onCancel}
            >
              {cancelLabel}
            </TouchButton>
          )}
          <TouchButton
            variant={confirmVariant === "danger" ? "danger" : "primary"}
            size="lg"
            fullWidth
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </TouchButton>
          {secondaryLabel && onSecondary ? (
            <TouchButton
              variant={
                secondaryVariant === "danger"
                  ? "danger"
                  : secondaryVariant === "primary"
                    ? "primary"
                    : "secondary"
              }
              size="lg"
              fullWidth
              disabled={busy}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </TouchButton>
          ) : null}
        </div>
      </div>
    </BottomSheet>
  );
}
