import { VERIFY_EMAIL_PATH } from "@/lib/auth/routes";

export function buildVerifyEmailPath(
  searchParams: URLSearchParams | Pick<URLSearchParams, "get">,
): string {
  const params = new URLSearchParams();
  const plan = searchParams.get("plan");
  const next = searchParams.get("next");

  if (plan) {
    params.set("plan", plan);
  }

  if (next) {
    params.set("next", next);
  }

  const query = params.toString();
  return query ? `${VERIFY_EMAIL_PATH}?${query}` : VERIFY_EMAIL_PATH;
}
