export const SUPPORT_CATEGORIES = [
  {
    id: "account",
    label: "Accounts and subscriptions",
    description: "Billing, plans, trials, and membership changes",
  },
  {
    id: "login",
    label: "Login issues",
    description: "Sign-in, verification codes, and account access",
  },
  {
    id: "technical",
    label: "Report a technical issue",
    description: "Bugs, crashes, and unexpected app behavior",
  },
  {
    id: "feature",
    label: "Suggest a new feature",
    description: "Ideas and enhancements for VectorOS",
  },
] as const;

export type SupportCategoryId = (typeof SUPPORT_CATEGORIES)[number]["id"];

export function isSupportCategoryId(value: string): value is SupportCategoryId {
  return SUPPORT_CATEGORIES.some((category) => category.id === value);
}

export function getSupportCategoryLabel(id: SupportCategoryId): string {
  return SUPPORT_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

export function getSupportCategory(id: SupportCategoryId) {
  return SUPPORT_CATEGORIES.find((category) => category.id === id) ?? null;
}
