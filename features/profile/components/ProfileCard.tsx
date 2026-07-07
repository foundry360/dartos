"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ProfileCardProps {
  children: ReactNode;
  className?: string;
}

export function ProfileCard({ children, className }: ProfileCardProps) {
  return <div className={cn("profile-card", className)}>{children}</div>;
}
