"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_HOME_PATH, getSafeNextPath } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  signInWithEmail,
  signUpWithEmail,
} from "@/features/auth/lib/auth-actions";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";

type AuthMode = "sign-in" | "sign-up";

const inputClassName =
  "min-h-[52px] w-full rounded-2xl border border-border bg-surface px-4 text-lg font-semibold outline-none ring-accent focus:ring-2";

function authErrorMessage(errorCode: string | null) {
  if (errorCode === "auth_callback") {
    return "Unable to confirm that sign-in link. Request a new one or sign in with your password.";
  }

  return null;
}

function AuthScreenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(
    () => authErrorMessage(searchParams.get("error")),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const finishAuth = () => {
    router.push(nextPath);
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (mode === "sign-up") {
        const { session } = await signUpWithEmail({
          email: email.trim(),
          password,
          displayName,
          nextPath,
        });

        if (session) {
          finishAuth();
          return;
        }

        setMessage("Account created. Check your email to confirm, then sign in.");
        setMode("sign-in");
        return;
      }

      await signInWithEmail({
        email: email.trim(),
        password,
      });

      finishAuth();
    } catch (caught) {
      const authError =
        caught instanceof Error ? caught.message : "Unable to authenticate. Try again.";
      setError(authError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-screen__layout">
        <section className="auth-screen__form-panel">
          <div className="auth-screen__content">
            <header className="auth-screen__header">
              <p className="auth-screen__eyebrow">DartScorer</p>
              <h1 className="auth-screen__title">
                {mode === "sign-in" ? "Sign in" : "Create account"}
              </h1>
            </header>

            {!configured ? (
              <GlassPanel className="auth-screen__panel">
                <p className="text-sm text-muted-foreground">
                  Supabase is not configured. Add your project URL and anon key to{" "}
                  <code className="text-foreground">.env.local</code> to enable accounts.
                </p>
                <TouchButton
                  className="mt-4"
                  fullWidth
                  variant="secondary"
                  onClick={() => router.push(APP_HOME_PATH)}
                >
                  Continue without account
                </TouchButton>
              </GlassPanel>
            ) : (
              <GlassPanel className="auth-screen__panel">
                <form className="auth-screen__form" onSubmit={handleSubmit}>
                  {mode === "sign-up" ? (
                    <label className="auth-screen__field">
                      <span className="auth-screen__label">Display name</span>
                      <input
                        className={inputClassName}
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        autoComplete="name"
                        placeholder="Your name"
                      />
                    </label>
                  ) : null}

                  <label className="auth-screen__field">
                    <span className="auth-screen__label">Email</span>
                    <input
                      className={inputClassName}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      required
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="auth-screen__field">
                    <span className="auth-screen__label">Password</span>
                    <input
                      className={inputClassName}
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                    />
                  </label>

                  {error ? <p className="auth-screen__error">{error}</p> : null}
                  {message ? <p className="auth-screen__message">{message}</p> : null}

                  <TouchButton
                    type="submit"
                    fullWidth
                    size="xl"
                    disabled={submitting}
                    className="mt-2"
                  >
                    {submitting
                      ? "Please wait..."
                      : mode === "sign-in"
                        ? "Sign in"
                        : "Create account"}
                  </TouchButton>
                </form>
              </GlassPanel>
            )}

            {configured ? (
              <p className="auth-screen__footer">
                {mode === "sign-in" ? "Need an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="auth-screen__link"
                  onClick={() => {
                    setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                    setError(null);
                    setMessage(null);
                  }}
                >
                  {mode === "sign-in" ? "Create one" : "Sign in"}
                </button>
              </p>
            ) : (
              <p className="auth-screen__footer">
                <Link href={APP_HOME_PATH} className="auth-screen__link">
                  Open app without signing in
                </Link>
              </p>
            )}
          </div>
        </section>

        <aside className="auth-screen__media-panel" aria-label="Promotional image">
          <div className="auth-screen__media-placeholder">
            <p className="auth-screen__media-eyebrow">DartScorer</p>
            <p className="auth-screen__media-title">Image coming soon</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function AuthScreen() {
  return (
    <Suspense fallback={<div className="auth-screen" />}>
      <AuthScreenForm />
    </Suspense>
  );
}
