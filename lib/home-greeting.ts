"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getUserDisplayName } from "@/features/players/lib/account-player-profile";

export function getTimeOfDayGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

function looksLikeEmail(value: string) {
  return value.includes("@");
}

/** Prefer a real first name; never greet with a full email address. */
function firstNameFromLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed || looksLikeEmail(trimmed)) {
    return null;
  }

  return trimmed.split(/\s+/)[0] || null;
}

function firstNameFromEmail(email: string | null | undefined) {
  const local = email?.split("@")[0]?.trim();
  if (!local) {
    return null;
  }

  const token = local.split(/[._-]/)[0] || local;
  if (!token) {
    return null;
  }

  return token.charAt(0).toUpperCase() + token.slice(1);
}

export function getHomeGreetingName(
  user: User | null,
  displayName?: string | null,
  nickname?: string | null,
) {
  const fromNickname = firstNameFromLabel(nickname ?? "");
  if (fromNickname) {
    return fromNickname;
  }

  const fromDisplayName = firstNameFromLabel(displayName ?? "");
  if (fromDisplayName) {
    return fromDisplayName;
  }

  const metaName =
    typeof user?.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null;
  const fromMeta = firstNameFromLabel(metaName ?? "");
  if (fromMeta) {
    return fromMeta;
  }

  const fromEmail = firstNameFromEmail(user?.email);
  if (fromEmail) {
    return fromEmail;
  }

  // Guest / unknown — keep previous Guest fallback via getUserDisplayName.
  const fullName = getUserDisplayName(user, displayName);
  if (!looksLikeEmail(fullName)) {
    return fullName.split(/\s+/)[0] || fullName;
  }

  return "Player";
}

export function buildHomeGreeting(
  user: User | null,
  displayName?: string | null,
  nickname?: string | null,
  date = new Date(),
) {
  return `${getTimeOfDayGreeting(date)}, ${getHomeGreetingName(user, displayName, nickname)}!`;
}

/**
 * Hydration-safe greeting. SSR + first client paint use a stable "Hello"
 * prefix; time-of-day is applied after mount so server/client clocks can't diverge.
 */
export function useHomeGreeting(
  user: User | null,
  displayName?: string | null,
  nickname?: string | null,
) {
  const name = getHomeGreetingName(user, displayName, nickname);
  const [timeGreeting, setTimeGreeting] = useState<string | null>(null);

  useEffect(() => {
    setTimeGreeting(getTimeOfDayGreeting());
  }, []);

  return `${timeGreeting ?? "Hello"}, ${name}!`;
}
