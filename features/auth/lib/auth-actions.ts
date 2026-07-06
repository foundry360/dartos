import {
  APP_HOME_PATH,
  AUTH_CALLBACK_PATH,
  getSafeNextPath,
} from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";

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
  nextPath = APP_HOME_PATH,
}: SignUpInput) {
  const supabase = createClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName.trim() || email,
      },
      emailRedirectTo: getEmailRedirectTo(nextPath),
    },
  });

  if (error) {
    throw error;
  }

  return data;
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
    throw error;
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
