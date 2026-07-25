"use client";

import { useState } from "react";
import { HelpMenuIcon } from "@/components/ui/AppMenuIcons";
import { HowToPlaySheet } from "@/features/help/components/HowToPlaySheet";
import type { HowToPlayId } from "@/features/help/lib/how-to-play";
import { cn } from "@/utils/cn";

interface HowToPlayTitleButtonProps {
  gameId: HowToPlayId;
  className?: string;
}

export function HowToPlayTitleButton({
  gameId,
  className,
}: HowToPlayTitleButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn("how-to-play-title-button", className)}
        aria-label="How to play"
        onClick={() => setOpen(true)}
      >
        <HelpMenuIcon className="h-4 w-4" />
      </button>
      <HowToPlaySheet
        gameId={gameId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
