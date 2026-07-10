"use client";

import { motion, useAnimation, type PanInfo } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/utils/cn";

const DELETE_ACTION_WIDTH_PX = 88;

interface SwipeToDeleteRowProps {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function SwipeToDeleteRow({
  children,
  onDelete,
  deleteLabel = "Delete",
  isOpen,
  onOpenChange,
  className,
}: SwipeToDeleteRowProps) {
  const controls = useAnimation();
  const closedOffset = 0;
  const openOffset = -DELETE_ACTION_WIDTH_PX;

  useEffect(() => {
    void controls.start({
      x: isOpen ? openOffset : closedOffset,
      transition: { type: "spring", stiffness: 520, damping: 38 },
    });
  }, [closedOffset, controls, isOpen, openOffset]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const revealThreshold = DELETE_ACTION_WIDTH_PX / 2;
    const shouldReveal =
      info.offset.x <= -revealThreshold ||
      (info.offset.x < 0 && info.velocity.x <= -450);
    const shouldHide =
      info.offset.x >= -revealThreshold / 2 ||
      info.velocity.x >= 450;

    if (shouldReveal && !shouldHide) {
      triggerHaptic("light");
      onOpenChange(true);
      return;
    }

    onOpenChange(false);
  };

  const handleDelete = () => {
    triggerHaptic("medium");
    onDelete();
    onOpenChange(false);
  };

  return (
    <div className={cn("swipe-delete-row", className)}>
      <motion.div
        className="swipe-delete-row__track"
        drag="x"
        dragConstraints={{ left: openOffset, right: closedOffset }}
        dragElastic={{ left: 0.08, right: 0.18 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ x: closedOffset }}
      >
        <div className="swipe-delete-row__content">{children}</div>

        <button
          type="button"
          className="swipe-delete-row__action"
          onClick={handleDelete}
          aria-label={deleteLabel}
        >
          {deleteLabel}
        </button>
      </motion.div>
    </div>
  );
}
