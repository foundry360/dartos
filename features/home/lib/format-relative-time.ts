export function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (diffMs < dayMs) {
    return "Today";
  }

  if (diffMs < dayMs * 2) {
    return "Yesterday";
  }

  if (diffMs < dayMs * 7) {
    return `${Math.floor(diffMs / dayMs)} days ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}
