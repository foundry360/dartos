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

export function getHomeGreetingName(
  user: User | null,
  displayName?: string | null,
  nickname?: string | null,
) {
  if (nickname?.trim()) {
    return nickname.trim();
  }

  return getUserDisplayName(user, displayName);
}

export function buildHomeGreeting(
  user: User | null,
  displayName?: string | null,
  nickname?: string | null,
  date = new Date(),
) {
  return `${getTimeOfDayGreeting(date)}, ${getHomeGreetingName(user, displayName, nickname)}!`;
}
