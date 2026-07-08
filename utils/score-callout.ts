export function buildVisitTotalCallout(total: number, busted = false): string {
  if (busted || total <= 0) {
    return "No score";
  }

  return String(total);
}
