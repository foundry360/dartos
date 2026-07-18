"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EmailFieldIcon,
  EyeFieldIcon,
  EyeOffFieldIcon,
  LockFieldIcon,
  UserFieldIcon,
} from "@/features/auth/components/AuthFieldIcons";
import { AuthBrandLogo } from "@/features/auth/components/AuthBrandLogo";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { getSignUpNextPath } from "@/features/onboarding/lib/onboarding-path";
import { buildVerifyEmailPath } from "@/features/auth/lib/verify-email-path";
import { resolvePostAuthDestination } from "@/lib/auth/post-auth-path";
import { APP_HOME_PATH } from "@/lib/auth/routes";
import { setPendingVerifyEmail } from "@/lib/auth/pending-verify-email";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  signInWithEmail,
  signUpWithEmail,
} from "@/features/auth/lib/auth-actions";
import { DEACTIVATED_ACCOUNT_MESSAGE } from "@/lib/account/deactivated-account-message";
import { formatAuthError } from "@/features/auth/lib/auth-errors";

type AuthMode = "sign-in" | "sign-up";

function authErrorMessage(errorCode: string | null) {
  if (errorCode === "auth_callback") {
    return "Unable to confirm that sign-in link. Request a new one or sign in with your password.";
  }

  if (errorCode === "account_deactivated") {
    return DEACTIVATED_ACCOUNT_MESSAGE;
  }

  return null;
}

function getInitialMode(searchParams: URLSearchParams): AuthMode {
  return searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";
}

function AuthScreenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const nextParam = searchParams.get("next");
  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(searchParams));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Defer real inputs until after mount so password managers (LastPass, etc.)
  // can't inject nodes into SSR HTML and break hydration.
  const [fieldsReady, setFieldsReady] = useState(false);

  useEffect(() => {
    setFieldsReady(true);
  }, []);
  const [error, setError] = useState<string | null>(
    () => authErrorMessage(searchParams.get("error")),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === "sign-up";

  const finishAuth = async (completedMode: AuthMode) => {
    if (completedMode === "sign-up") {
      router.push(getSignUpNextPath(searchParams));
      router.refresh();
      return;
    }

    const supabase = createClient();
    let path = APP_HOME_PATH;

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        path = await resolvePostAuthDestination(supabase, user.id, nextParam);
      }
    }

    router.push(path);
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { session } = await signUpWithEmail({
          email: email.trim(),
          password,
          displayName,
          nextPath: getSignUpNextPath(searchParams),
        });

        if (session) {
          await finishAuth("sign-up");
          return;
        }

        setPendingVerifyEmail(email.trim());
        router.push(buildVerifyEmailPath(searchParams));
        router.refresh();
        return;
      }

      await signInWithEmail({
        email: email.trim(),
        password,
      });

      await finishAuth("sign-in");
    } catch (caught) {
      setError(formatAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setShowPassword(false);
  };

  return (
    <AuthShell>
      <AuthBrandLogo />

        <h1 className="auth-screen__title auth-screen__title--solo">
          {isSignUp ? <>Create account.</> : <>Step to&nbsp;the&nbsp;oche.</>}
        </h1>

        {!configured ? (
          <div className="auth-screen__card">
            <p className="auth-screen__notice">
              Supabase is not configured. Add your project URL and anon key to{" "}
              <code>.env.local</code> to enable accounts.
            </p>
            <button
              type="button"
              className="auth-screen__alt-btn"
              onClick={() => router.push(APP_HOME_PATH)}
            >
              Continue without account
            </button>
          </div>
        ) : (
          <div className="auth-screen__card">
            <form className="auth-screen__form" onSubmit={handleSubmit}>
              {isSignUp ? (
                <div className="auth-screen__field">
                  <label className="auth-screen__label" htmlFor="auth-display-name">
                    Display name
                  </label>
                  <div className="auth-screen__field-shell">
                    <UserFieldIcon className="auth-screen__field-icon" />
                    {fieldsReady ? (
                      <input
                        id="auth-display-name"
                        className="auth-screen__input"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        autoComplete="name"
                        placeholder="Your name"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                      />
                    ) : (
                      <div className="auth-screen__input auth-screen__input--pending" aria-hidden />
                    )}
                  </div>
                </div>
              ) : null}

              <div className="auth-screen__field">
                <label className="auth-screen__label" htmlFor="auth-email">
                  Email
                </label>
                <div className="auth-screen__field-shell">
                  <EmailFieldIcon className="auth-screen__field-icon" />
                  {fieldsReady ? (
                    <input
                      id="auth-email"
                      className="auth-screen__input"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      required
                      placeholder="you@example.com"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      data-form-type="other"
                    />
                  ) : (
                    <div className="auth-screen__input auth-screen__input--pending" aria-hidden />
                  )}
                </div>
              </div>

              <div className="auth-screen__field">
                <label className="auth-screen__label" htmlFor="auth-password">
                  Password
                </label>
                <div className="auth-screen__field-shell">
                  <LockFieldIcon className="auth-screen__field-icon" />
                  {fieldsReady ? (
                    <input
                      id="auth-password"
                      className="auth-screen__input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      data-form-type="other"
                    />
                  ) : (
                    <div className="auth-screen__input auth-screen__input--pending" aria-hidden />
                  )}
                  <button
                    type="button"
                    className="auth-screen__toggle-pw"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    disabled={!fieldsReady}
                  >
                    {showPassword ? (
                      <EyeOffFieldIcon />
                    ) : (
                      <EyeFieldIcon />
                    )}
                  </button>
                </div>
              </div>

              {!isSignUp ? (
                <div className="auth-screen__row-between">
                  <button
                    type="button"
                    className="auth-screen__text-link"
                    onClick={() =>
                      setMessage("Password reset is not available yet. Contact support if you need help.")
                    }
                  >
                    Forgot password?
                  </button>
                </div>
              ) : null}

              {error ? <p className="auth-screen__error">{error}</p> : null}
              {message ? <p className="auth-screen__message">{message}</p> : null}

              <button type="submit" className="auth-screen__cta" disabled={submitting}>
                {submitting
                  ? "Please wait..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>
          </div>
        )}

        {configured ? (
          <p className="auth-screen__footer">
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              className="auth-screen__footer-link"
              onClick={() => switchMode(isSignUp ? "sign-in" : "sign-up")}
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        ) : (
          <p className="auth-screen__footer">
            <Link href={APP_HOME_PATH} className="auth-screen__footer-link">
              Open app without signing in
            </Link>
          </p>
        )}
    </AuthShell>
  );
}

export function AuthScreen() {
  return (
    <Suspense fallback={<div className="auth-screen" />}>
      <AuthScreenForm />
    </Suspense>
  );
}
