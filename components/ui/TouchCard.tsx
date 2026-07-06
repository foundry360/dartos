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
  size?: "md" | "lg";
}

const sizeStyles = {
  md: {
    card: "min-h-[120px] gap-4 p-6 rounded-3xl",
    title: "text-2xl",
    icon: "h-12 w-12 rounded-2xl text-xl",
  },
  lg: {
    card: "min-h-[168px] gap-5 p-8 rounded-[1.75rem]",
    title: "text-3xl",
    icon: "h-16 w-16 rounded-2xl text-2xl",
  },
} as const;

export function TouchCard({
  href,
  title,
  subtitle,
  accent: _accent,
  icon,
  size = "md",
  className,
  ...props
}: TouchCardProps) {
  const styles = sizeStyles[size];

  const content = (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden border border-border/60 bg-surface-elevated/80",
        "backdrop-blur-xl transition-colors hover:border-border active:bg-surface-hover",
        "flex flex-col justify-between shadow-card",
        styles.card,
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn("text-accent", styles.title)}>{title}</h2>
          {subtitle ? (
            <p className="touch-card__subtitle" style={{ fontSize: "16px" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center border border-border/70 bg-surface font-bold text-foreground",
              styles.icon,
            )}
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
