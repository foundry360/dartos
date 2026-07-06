"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { TOUCH_MIN_SIZE_PX } from "@/lib/constants";
import { getContrastTextColor } from "@/utils/color-contrast";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "lg" | "xl";

export interface TouchButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Overrides the default app accent for primary buttons. */
  accentColor?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground shadow-glow hover:bg-accent/90 active:scale-[0.98]",
  secondary:
    "bg-surface-elevated text-foreground border border-border hover:bg-surface-hover active:scale-[0.98]",
  ghost: "bg-transparent text-foreground hover:bg-surface-hover active:scale-[0.98]",
  danger:
    "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "min-h-[52px] px-5 text-base rounded-2xl",
  lg: "min-h-[56px] px-6 text-lg rounded-2xl",
  xl: "min-h-[64px] px-8 text-xl rounded-3xl",
};

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "lg",
      fullWidth = false,
      accentColor,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isThemedPrimary = variant === "primary" && Boolean(accentColor);
    const themedTextColor = accentColor ? getContrastTextColor(accentColor) : undefined;

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
          isThemedPrimary
            ? "hover:opacity-90 active:scale-[0.98]"
            : variantStyles[variant],
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isThemedPrimary
            ? "focus-visible:ring-[color:var(--touch-button-accent)]"
            : "focus-visible:ring-accent",
          "disabled:pointer-events-none disabled:opacity-40",
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        style={{
          minWidth: TOUCH_MIN_SIZE_PX,
          ...(isThemedPrimary
            ? {
                backgroundColor: accentColor,
                color: themedTextColor,
                boxShadow: `0 0 30px color-mix(in srgb, ${accentColor} 28%, transparent)`,
                ["--touch-button-accent" as string]: accentColor,
              }
            : undefined),
          ...style,
        }}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

TouchButton.displayName = "TouchButton";
