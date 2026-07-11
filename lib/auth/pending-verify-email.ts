const PENDING_VERIFY_EMAIL_KEY = "dartos-pending-verify-email";

export function setPendingVerifyEmail(email: string) {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.setItem(PENDING_VERIFY_EMAIL_KEY, email.trim().toLowerCase());
}

export function getPendingVerifyEmail(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  return sessionStorage.getItem(PENDING_VERIFY_EMAIL_KEY);
}

export function clearPendingVerifyEmail() {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.removeItem(PENDING_VERIFY_EMAIL_KEY);
}
