"use client";

import type { CSSProperties } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface SlidePanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Defaults to right — use left for Match Desk and similar. */
  side?: "left" | "right";
}

export function SlidePanel({
  open,
  title,
  onClose,
  children,
  className,
  style,
  side = "right",
}: SlidePanelProps) {
  const fromLeft = side === "left";

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
  }, [onClose, open]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close panel"
            className="slide-panel__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="slide-panel-title"
            className={cn(
              "slide-panel",
              fromLeft && "slide-panel--left",
              className,
            )}
            style={style}
            initial={{ x: fromLeft ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: fromLeft ? "-100%" : "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <header className="slide-panel__header">
              <h3 id="slide-panel-title" className="slide-panel__title">
                {title}
              </h3>
              <button
                type="button"
                className="slide-panel__close"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <div className="slide-panel__body">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
