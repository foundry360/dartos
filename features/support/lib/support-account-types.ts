export const SUPPORT_ACCOUNT_TYPES = [
  { id: "club", label: "Club" },
  { id: "elite", label: "Elite" },
  { id: "league_pro", label: "League Pro" },
  { id: "free", label: "Free / league player" },
  { id: "unsure", label: "Not sure" },
] as const;

export type SupportAccountTypeId = (typeof SUPPORT_ACCOUNT_TYPES)[number]["id"];

export function isSupportAccountTypeId(value: string): value is SupportAccountTypeId {
  return SUPPORT_ACCOUNT_TYPES.some((type) => type.id === value);
}

export function getSupportAccountTypeLabel(id: SupportAccountTypeId): string {
  return SUPPORT_ACCOUNT_TYPES.find((type) => type.id === id)?.label ?? id;
}

export function accountTypeFromPlan(plan: string | null | undefined): SupportAccountTypeId {
  if (plan === "club" || plan === "elite" || plan === "league_pro") {
    return plan;
  }
  return "free";
}
