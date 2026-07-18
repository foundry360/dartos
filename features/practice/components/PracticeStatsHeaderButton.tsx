"use client";

import Link from "next/link";
import { StatisticsMenuIcon } from "@/components/ui/AppMenuIcons";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import { cn } from "@/utils/cn";

interface PracticeStatsHeaderButtonProps {
  className?: string;
}

export function PracticeStatsHeaderButton({ className }: PracticeStatsHeaderButtonProps) {
  return (
    <Link
      href="/practice/stats"
      className={cn("practice-stats-header-button", className)}
      aria-label="Practice stats"
      style={{
        backgroundColor: APP_PRIMARY_COLOR,
        color: "#d4d4d8",
        borderRadius: "9999px",
        boxShadow: `0 0 20px color-mix(in srgb, ${APP_PRIMARY_COLOR} 28%, transparent)`,
      }}
    >
      <StatisticsMenuIcon className="h-6 w-6" />
    </Link>
  );
}
