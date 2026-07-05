"use client";

import { useEffect, useState } from "react";
import { ExitFullscreenIcon, FullscreenIcon } from "@/components/ui/FullscreenIcon";
import { cn } from "@/utils/cn";
import { exitAppFullscreen, isEffectivelyFullscreen, requestAppFullscreen, shouldUseFullscreenAPI } from "@/utils/fullscreen";

interface FullscreenButtonProps {
  className?: string;
}

function readFullscreenState(): boolean {
  return isEffectivelyFullscreen();
}

export function FullscreenButton({ className }: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(readFullscreenState);

  useEffect(() => {
    if (!shouldUseFullscreenAPI()) {
      return;
    }

    const sync = () => setIsFullscreen(readFullscreenState());

    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);

    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  if (!shouldUseFullscreenAPI()) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (isFullscreen) {
          void exitAppFullscreen();
          return;
        }

        void requestAppFullscreen();
      }}
      className={cn(
        "flex h-[52px] w-[52px] shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
    </button>
  );
}
