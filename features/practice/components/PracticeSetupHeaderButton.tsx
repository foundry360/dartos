"use client";

import Link from "next/link";
import { BullseyeMenuIcon } from "@/components/ui/AppMenuIcons";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { cn } from "@/utils/cn";

interface PracticeSetupHeaderButtonProps {
  className?: string;
}

export function PracticeSetupHeaderButton({ className }: PracticeSetupHeaderButtonProps) {
  return (
    <Link
      href="/practice/setup"
      className={cn("practice-setup-header-button", className)}
      aria-label="Back to practice"
      style={{
        backgroundColor: APP_PRIMARY_COLOR,
        color: "#000000",
        borderRadius: "9999px",
        boxShadow: `0 0 20px color-mix(in srgb, ${APP_PRIMARY_COLOR} 28%, transparent)`,
      }}
    >
      <BullseyeMenuIcon className="h-6 w-6" />
    </Link>
  );
}
