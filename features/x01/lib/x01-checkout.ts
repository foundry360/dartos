import type { X01OutRule } from "@/types/x01";

export const X01_CHECKOUT_DISPLAY_MAX = 170;

export type CheckoutFinishRule = X01OutRule | "master_out";

interface CheckoutDart {
  score: number;
  label: string;
  canFinish: boolean;
}

function isRestrictedCheckoutOutRule(outRule: CheckoutFinishRule): boolean {
  return outRule === "double_out" || outRule === "master_out";
}

function buildCheckoutDarts(outRule: CheckoutFinishRule): CheckoutDart[] {
  const darts: CheckoutDart[] = [];

  for (let segment = 1; segment <= 20; segment += 1) {
    darts.push({
      score: segment,
      label: `S${segment}`,
      canFinish: outRule === "straight_out",
    });
    darts.push({
      score: segment * 2,
      label: `D${segment}`,
      canFinish: true,
    });
    darts.push({
      score: segment * 3,
      label: `T${segment}`,
      canFinish: false,
    });
  }

  darts.push({
    score: 25,
    label: "25",
    canFinish: outRule === "straight_out" || outRule === "master_out",
  });
  darts.push({
    score: 50,
    label: "50",
    canFinish: true,
  });

  return darts;
}

function canReachCheckout(
  remaining: number,
  outRule: CheckoutFinishRule,
  dartsAvailable: number,
  darts: CheckoutDart[],
): string[][] {
  if (remaining === 0) {
    return [[]];
  }

  if (
    dartsAvailable <= 0 ||
    remaining < 0 ||
    (isRestrictedCheckoutOutRule(outRule) && remaining === 1)
  ) {
    return [];
  }

  const paths: string[][] = [];

  for (const dart of darts) {
    const nextRemaining = remaining - dart.score;

    if (nextRemaining < 0) {
      continue;
    }

    if (nextRemaining === 0) {
      if (dart.canFinish) {
        paths.push([dart.label]);
      }
      continue;
    }

    if (isRestrictedCheckoutOutRule(outRule) && nextRemaining === 1) {
      continue;
    }

    const suffixes = canReachCheckout(
      nextRemaining,
      outRule,
      dartsAvailable - 1,
      darts,
    );

    for (const suffix of suffixes) {
      paths.push([dart.label, ...suffix]);
    }
  }

  return paths;
}

function preferCheckoutPath(a: string[], b: string[]): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }

  const aUsesBull = a.includes("50") ? 1 : 0;
  const bUsesBull = b.includes("50") ? 1 : 0;
  if (aUsesBull !== bUsesBull) {
    return aUsesBull - bUsesBull;
  }

  return a.join(" ").localeCompare(b.join(" "));
}

export function getCheckoutSuggestions(
  remaining: number,
  outRule: CheckoutFinishRule = "double_out",
  dartsAvailable = 3,
): string[][] {
  if (
    remaining <= 0 ||
    remaining > X01_CHECKOUT_DISPLAY_MAX ||
    dartsAvailable <= 0
  ) {
    return [];
  }

  const darts = buildCheckoutDarts(outRule);
  const paths = canReachCheckout(remaining, outRule, dartsAvailable, darts);

  if (paths.length === 0) {
    return [];
  }

  const shortestLength = Math.min(...paths.map((path) => path.length));
  const shortestPaths = paths.filter((path) => path.length === shortestLength);

  shortestPaths.sort(preferCheckoutPath);

  return shortestPaths.slice(0, 3);
}

export function formatCheckoutPath(path: string[]): string {
  return path.join(" · ");
}

export function hasCheckoutPath(
  remaining: number,
  outRule: CheckoutFinishRule = "double_out",
  dartsAvailable = 3,
): boolean {
  return getCheckoutSuggestions(remaining, outRule, dartsAvailable).length > 0;
}

export function getPreferredCheckoutPath(
  remaining: number,
  dartsAvailable: number,
  outRule: CheckoutFinishRule = "double_out",
): string[] | null {
  if (
    remaining <= 0 ||
    remaining > X01_CHECKOUT_DISPLAY_MAX ||
    dartsAvailable <= 0
  ) {
    return null;
  }

  const darts = buildCheckoutDarts(outRule);
  const paths = canReachCheckout(remaining, outRule, dartsAvailable, darts);

  if (paths.length === 0) {
    return null;
  }

  const exactLengthPaths = paths.filter((path) => path.length === dartsAvailable);

  if (exactLengthPaths.length === 0) {
    return null;
  }

  exactLengthPaths.sort(preferCheckoutPath);

  return exactLengthPaths[0] ?? null;
}

/** True when the score requires all three darts to finish (not reachable in one or two). */
export function isExactThreeDartCheckout(
  remaining: number,
  outRule: CheckoutFinishRule = "double_out",
): boolean {
  if (remaining <= 0 || remaining > X01_CHECKOUT_DISPLAY_MAX) {
    return false;
  }

  return hasCheckoutPath(remaining, outRule, 3) && !hasCheckoutPath(remaining, outRule, 2);
}
