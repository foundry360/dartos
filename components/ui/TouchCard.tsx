"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface TouchCardProps extends HTMLMotionProps<"div"> {
  href?: string;
  title: string;
  subtitle?: string;
  accent?: string;
  icon?: React.ReactNode;
}

export function TouchCard({
  href,
  title,
  subtitle,
  accent = "#3b82f6",
  icon,
  className,
  ...props
}: TouchCardProps) {
  const content = (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-surface-elevated/80 p-6",
        "min-h-[120px] backdrop-blur-xl transition-colors hover:border-border active:bg-surface-hover",
        "flex flex-col justify-between gap-4 shadow-card",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block touch-manipulation">
        {content}
      </Link>
    );
  }

  return content;
}
