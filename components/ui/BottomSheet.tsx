"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  className,
}: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const stackIndex = useMemo(() => {
    if (!open || typeof document === "undefined") {
      return 0;
    }

    return document.querySelectorAll(".app-modal-overlay").length;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      const overlays = document.querySelectorAll(".app-modal-overlay");
      const topOverlay = overlays[overlays.length - 1];

      // Only the topmost sheet should handle Escape when sheets are nested
      // (e.g. time picker inside create league).
      if (topOverlay && topOverlay !== overlayRef.current) {
        return;
      }

      event.stopPropagation();
      onClose();
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
    <div
      ref={overlayRef}
      className="app-modal-overlay"
      style={{ zIndex: 100 + stackIndex * 30 }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("app-modal", className)}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="app-modal__header">
          <h3 id={titleId} className="app-modal__title">
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
