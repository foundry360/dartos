"use client";

import { useEffect, useState } from "react";
import { ExitFullscreenIcon, FullscreenIcon } from "@/components/ui/FullscreenIcon";
import { cn } from "@/utils/cn";
import {
  exitAppFullscreen,
  getFullscreenElement,
  isStandaloneDisplay,
  listenForFullscreenChanges,
  markFullscreenPreference,
  requestAppFullscreen,
  shouldUseFullscreenAPI,
} from "@/utils/fullscreen";

interface FullscreenButtonProps {
  className?: string;
}

function readFullscreenState(): boolean {
  return Boolean(getFullscreenElement()) || isStandaloneDisplay();
}

export function FullscreenButton({ className }: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(readFullscreenState);

  useEffect(() => {
    const sync = () => setIsFullscreen(readFullscreenState());
    sync();
    return listenForFullscreenChanges(sync);
  }, []);

  if (!shouldUseFullscreenAPI()) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (isFullscreen) {
          void exitAppFullscreen(true).then(() => setIsFullscreen(readFullscreenState()));
          return;
        }

        markFullscreenPreference();
        void requestAppFullscreen().then((entered) => {
          setIsFullscreen(readFullscreenState());
          if (!entered) {
            setIsFullscreen(readFullscreenState());
          }
        });
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
