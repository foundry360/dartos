"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, title, onClose, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="app-modal-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        className={cn("app-modal", className)}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="app-modal__header">
          <h3 id="app-modal-title" className="app-modal__title">
            {title}
          </h3>
          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="app-modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
