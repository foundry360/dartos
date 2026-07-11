import {
  AUTH_CALLBACK_PATH,
  getSafeNextPath,
} from "@/lib/auth/routes";
import { getPostAuthDestination } from "@/lib/auth/post-auth-path";
import { createClient } from "@/lib/supabase/client";
import { toAuthError } from "@/features/auth/lib/auth-errors";

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
  nextPath?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

function getEmailRedirectTo(nextPath?: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  const redirectUrl = new URL(AUTH_CALLBACK_PATH, window.location.origin);
  redirectUrl.searchParams.set("next", getSafeNextPath(nextPath));
  return redirectUrl.toString();
}

export async function signUpWithEmail({
  email,
  password,
  displayName,
  nextPath,
}: SignUpInput) {
  const supabase = createClient();
  const resolvedNextPath = nextPath ?? getPostAuthDestination(undefined);
  const normalizedEmail = email.trim();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        display_name: displayName.trim() || normalizedEmail,
      },
      emailRedirectTo: getEmailRedirectTo(resolvedNextPath),
    },
  });

  if (error) {
    throw toAuthError(error);
  }

  return data;
}

export async function verifySignupEmailOtp({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const supabase = createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: "signup",
  });

  if (error) {
    throw toAuthError(error);
  }

  return data;
}

export async function resendSignupEmailOtp({
  email,
  nextPath,
}: {
  email: string;
  nextPath?: string;
}) {
  const supabase = createClient();
  const resolvedNextPath = nextPath ?? getPostAuthDestination(undefined);

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: getEmailRedirectTo(resolvedNextPath),
    },
  });

  if (error) {
    throw toAuthError(error);
  }
}

export async function signInWithEmail({ email, password }: SignInInput) {
  const supabase = createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw toAuthError(error);
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
