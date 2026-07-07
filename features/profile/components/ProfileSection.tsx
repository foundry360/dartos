"use client";

import type { ReactNode } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/utils/cn";

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ProfileSection({ title, children, className }: ProfileSectionProps) {
  return (
    <GlassPanel className={cn("profile-section", className)}>
      <h3 className="profile-section__title">{title}</h3>
      {children}
    </GlassPanel>
  );
}

interface ProfileStatRowProps {
  label: string;
  value: string;
}

export function ProfileStatRow({ label, value }: ProfileStatRowProps) {
  return (
    <div className="profile-stat-row">
      <span className="profile-stat-row__label">{label}</span>
      <span className="profile-stat-row__value">{value}</span>
    </div>
  );
}

interface ProfileMetaRowProps {
  label: string;
  value: string | null;
}

export function ProfileMetaRow({ label, value }: ProfileMetaRowProps) {
  if (!value) {
    return null;
  }

  return (
    <div className="profile-meta-row">
      <span className="profile-meta-row__label">{label}</span>
      <span className="profile-meta-row__value">{value}</span>
    </div>
  );
}
