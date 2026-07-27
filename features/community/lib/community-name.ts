/** Community Play shows first token of display name only. */
export function communityFirstName(
  displayName: string | null | undefined,
  fallback = "Player",
): string {
  const trimmed = displayName?.trim();
  if (!trimmed) {
    return fallback;
  }

  const first = trimmed.split(/\s+/)[0];
  return first || fallback;
}

export function communityDisplayInitials(displayName: string | null | undefined): string {
  const parts = (displayName?.trim() || "P").split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "P";
  const second = parts[1];
  if (!second) {
    return first.slice(0, 2).toUpperCase();
  }
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}
