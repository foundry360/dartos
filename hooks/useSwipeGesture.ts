"use client";

import { useCallback, useRef } from "react";
import { triggerHaptic } from "@/utils/haptics";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
}

interface UseSwipeGestureOptions extends SwipeHandlers {
  threshold?: number;
  longPressMs?: number;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  threshold = 80,
  longPressMs = 500,
}: UseSwipeGestureOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      startX.current = touch.clientX;
      startY.current = touch.clientY;
      longPressTriggered.current = false;

      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          longPressTriggered.current = true;
          triggerHaptic("medium");
          onLongPress();
        }, longPressMs);
      }
    },
    [longPressMs, onLongPress],
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      clearLongPress();

      if (longPressTriggered.current) {
        return;
      }

      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }

      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;

      if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY)) {
        return;
      }

      if (deltaX < 0) {
        triggerHaptic("light");
        onSwipeLeft?.();
        return;
      }

      triggerHaptic("light");
      onSwipeRight?.();
    },
    [clearLongPress, onSwipeLeft, onSwipeRight, threshold],
  );

  const onTouchMove = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
  };
}
