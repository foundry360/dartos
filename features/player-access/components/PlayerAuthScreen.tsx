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
import { buildPlayerVerifyEmailPath } from "@/features/player-access/lib/player-verify-email-path";
import {
  signInWithEmail,
  signUpWithEmail,
} from "@/features/auth/lib/auth-actions";
import { DEACTIVATED_ACCOUNT_MESSAGE } from "@/lib/account/deactivated-account-message";
import { formatAuthError } from "@/features/auth/lib/auth-errors";
import { getPlayerPostAuthPath } from "@/lib/auth/account-kind";
import { setPendingVerifyEmail } from "@/lib/auth/pending-verify-email";
import { resetPlayerUpgradeModalForLogin } from "@/features/player-access/lib/player-upgrade-modal-storage";
import {
  LOGIN_PATH,
  PLAYER_HOME_PATH,
} from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/client";

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

function PlayerAuthScreenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const nextParam = searchParams.get("next");
  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(searchParams));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldsReady, setFieldsReady] = useState(false);
  const [error, setError] = useState<string | null>(
    () => authErrorMessage(searchParams.get("error")),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFieldsReady(true);
  }, []);

  const isSignUp = mode === "sign-up";

  const finishAuth = async () => {
    resetPlayerUpgradeModalForLogin();
    const path = getPlayerPostAuthPath(nextParam);
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
        const destination = getPlayerPostAuthPath(nextParam);
        const { session } = await signUpWithEmail({
          email: email.trim(),
          password,
          displayName,
          nextPath: destination,
          accountKind: "player",
        });

        if (session) {
          await finishAuth();
          return;
        }

        setPendingVerifyEmail(email.trim());
        router.push(buildPlayerVerifyEmailPath(searchParams));
        router.refresh();
        return;
      }

      await signInWithEmail({
        email: email.trim(),
        password,
      });

      await finishAuth();
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
        {isSignUp ? <>Join your league.</> : <>Step to&nbsp;the&nbsp;oche.</>}
      </h1>

      {!configured ? (
        <div className="auth-screen__card">
          <p className="auth-screen__notice">
            Supabase is not configured. Add your project URL and anon key to{" "}
            <code>.env.local</code> to enable league player accounts.
          </p>
        </div>
      ) : (
        <div className="auth-screen__card">
          <form className="auth-screen__form" onSubmit={handleSubmit}>
            {isSignUp ? (
              <div className="auth-screen__field">
                <label className="auth-screen__label" htmlFor="player-auth-display-name">
                  Display name
                </label>
                <div className="auth-screen__field-shell">
                  <UserFieldIcon className="auth-screen__field-icon" />
                  {fieldsReady ? (
                    <input
                      id="player-auth-display-name"
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
              <label className="auth-screen__label" htmlFor="player-auth-email">
                Email
              </label>
              <div className="auth-screen__field-shell">
                <EmailFieldIcon className="auth-screen__field-icon" />
                {fieldsReady ? (
                  <input
                    id="player-auth-email"
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
              <label className="auth-screen__label" htmlFor="player-auth-password">
                Password
              </label>
              <div className="auth-screen__field-shell">
                <LockFieldIcon className="auth-screen__field-icon" />
                {fieldsReady ? (
                  <input
                    id="player-auth-password"
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
                  {showPassword ? <EyeOffFieldIcon /> : <EyeFieldIcon />}
                </button>
              </div>
            </div>

            {error ? <p className="auth-screen__error">{error}</p> : null}
            {message ? <p className="auth-screen__message">{message}</p> : null}

            <button type="submit" className="auth-screen__cta" disabled={submitting}>
              {submitting
                ? "Please wait..."
                : isSignUp
                  ? "Create free account"
                  : "Sign in"}
            </button>
          </form>
        </div>
      )}

      {configured ? (
        <>
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
          <p className="auth-screen__footer">
            Full Vector account?{" "}
            <Link href={LOGIN_PATH} className="auth-screen__footer-link">
              Sign in here
            </Link>
          </p>
        </>
      ) : (
        <p className="auth-screen__footer">
          <Link href={PLAYER_HOME_PATH} className="auth-screen__footer-link">
            Back
          </Link>
        </p>
      )}
    </AuthShell>
  );
}

export function PlayerAuthScreen() {
  return (
    <Suspense fallback={<div className="auth-screen" />}>
      <PlayerAuthScreenForm />
    </Suspense>
  );
}
