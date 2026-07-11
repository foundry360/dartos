type AuthErrorLike = {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
  __isAuthError?: boolean;
};

function isBlankAuthMessage(message: string | undefined) {
  const trimmed = message?.trim();
  return !trimmed || trimmed === "{}" || trimmed === "[object Object]";
}

export function formatAuthError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const authError = error as AuthErrorLike;

    if (!isBlankAuthMessage(authError.message)) {
      return authError.message!.trim();
    }

    if (authError.code === "user_already_exists") {
      return "That email is already registered. Sign in instead.";
    }

    if (authError.status === 500) {
      return "We couldn't send the verification email. Check Supabase email delivery (SMTP or built-in mail limits), then try again.";
    }

    if (authError.status === 422) {
      return "That email is already registered. Sign in instead, or use a different address.";
    }

    if (authError.status === 400) {
      return "Check your email and password and try again.";
    }

    if (authError.status === 429) {
      return "Too many attempts. Wait a minute and try again.";
    }
  }

  if (error instanceof Error && !isBlankAuthMessage(error.message)) {
    return error.message.trim();
  }

  return "Unable to complete authentication. Try again.";
}

export function toAuthError(error: unknown): Error {
  if (error instanceof Error && !isBlankAuthMessage(error.message)) {
    return error;
  }

  return new Error(formatAuthError(error));
}
