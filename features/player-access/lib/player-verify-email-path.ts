import { PLAYER_VERIFY_EMAIL_PATH } from "@/lib/auth/routes";

export function buildPlayerVerifyEmailPath(
  searchParams: URLSearchParams | Pick<URLSearchParams, "get">,
): string {
  const params = new URLSearchParams();
  const next = searchParams.get("next");

  if (next) {
    params.set("next", next);
  }

  const query = params.toString();
  return query ? `${PLAYER_VERIFY_EMAIL_PATH}?${query}` : PLAYER_VERIFY_EMAIL_PATH;
}
