"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { getSignUpNextPath } from "@/features/onboarding/lib/onboarding-path";
import {
  resendSignupEmailOtp,
  verifySignupEmailOtp,
} from "@/features/auth/lib/auth-actions";
import { formatAuthError } from "@/features/auth/lib/auth-errors";
import {
  EMAIL_OTP_LENGTH,
  isCompleteEmailOtp,
  normalizeEmailOtp,
} from "@/features/auth/lib/email-otp";
import { LOGIN_PATH } from "@/lib/auth/routes";
import {
  clearPendingVerifyEmail,
  getPendingVerifyEmail,
  setPendingVerifyEmail,
} from "@/lib/auth/pending-verify-email";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(email: string) {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return email;
  }

  if (local.length <= 2) {
    return `${local[0] ?? ""}••@${domain}`;
  }

  return `${local.slice(0, 2)}••••@${domain}`;
}

function otpErrorMessage(error: unknown) {
  return formatAuthError(error);
}

function EmailVerifyScreenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const configured = isSupabaseConfigured();
  const nextPath = getSignUpNextPath(searchParams);
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN_SECONDS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const pendingEmail = getPendingVerifyEmail();

    if (!pendingEmail) {
      router.replace(LOGIN_PATH);
      return;
    }

    setEmail(pendingEmail);
    setReady(true);
    inputRef.current?.focus();
  }, [router]);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const finishVerification = useCallback(() => {
    clearPendingVerifyEmail();
    router.push(nextPath);
    router.refresh();
  }, [nextPath, router]);

  const handleVerify = useCallback(
    async (token: string) => {
      if (!email || !isCompleteEmailOtp(token) || submitting) {
        return;
      }

      setSubmitting(true);
      setError(null);
      setMessage(null);

      try {
        const { session } = await verifySignupEmailOtp({
          email,
          token,
        });

        if (!session) {
          setError("Email confirmed, but no session was created. Sign in with your password.");
          return;
        }

        finishVerification();
      } catch (caught) {
        setError(otpErrorMessage(caught));
        setCode("");
        inputRef.current?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [email, finishVerification, submitting],
  );

  useEffect(() => {
    if (isCompleteEmailOtp(code)) {
      void handleVerify(code);
    }
  }, [code, handleVerify]);

  const handleResend = async () => {
    if (!email || resendSeconds > 0 || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await resendSignupEmailOtp({
        email,
        nextPath,
      });
      setPendingVerifyEmail(email);
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      setMessage("A new code was sent to your email.");
      setCode("");
      inputRef.current?.focus();
    } catch (caught) {
      setError(otpErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || !email) {
    return <div className="auth-screen" />;
  }

  return (
    <AuthShell>
      <div className="auth-screen__brand-row">
        <span className="auth-screen__bullseye" aria-hidden />
        <span className="auth-screen__wordmark">DartScorer</span>
      </div>

      <h1 className="auth-screen__title auth-screen__title--solo">Check your email.</h1>
      <p className="auth-screen__tagline">
        Enter the <strong>{EMAIL_OTP_LENGTH}-digit code</strong> we sent to{" "}
        <strong>{maskEmail(email)}</strong>.
      </p>

      {!configured ? (
        <div className="auth-screen__card">
          <p className="auth-screen__notice">
            Supabase is not configured. Add your project URL and anon key to{" "}
            <code>.env.local</code> to enable accounts.
          </p>
        </div>
      ) : (
        <div className="auth-screen__card">
          <form
            className="auth-screen__form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleVerify(code);
            }}
          >
            <div className="auth-screen__field">
              <label className="auth-screen__label" htmlFor={inputId}>
                Verification code
              </label>
              <div className="auth-screen__field-shell auth-screen__field-shell--otp">
                <input
                  ref={inputRef}
                  id={inputId}
                  className="auth-screen__input auth-screen__input--otp"
                  type="text"
                  value={code}
                    onChange={(event) => {
                      setCode(normalizeEmailOtp(event.target.value));
                    setError(null);
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  minLength={EMAIL_OTP_LENGTH}
                  maxLength={EMAIL_OTP_LENGTH}
                  pattern={`[0-9]{${EMAIL_OTP_LENGTH}}`}
                  placeholder={"0".repeat(EMAIL_OTP_LENGTH)}
                  disabled={submitting}
                  aria-invalid={Boolean(error)}
                />
              </div>
            </div>

            {error ? <p className="auth-screen__error">{error}</p> : null}
            {message ? <p className="auth-screen__message">{message}</p> : null}

            <div className="onboarding-payment-screen__actions">
              <button
                type="button"
                className="onboarding-payment-screen__back"
                disabled={submitting}
                onClick={() => {
                  clearPendingVerifyEmail();
                  const params = new URLSearchParams({ mode: "sign-up" });
                  const plan = searchParams.get("plan");
                  if (plan) {
                    params.set("plan", plan);
                  }
                  router.push(`${LOGIN_PATH}?${params.toString()}`);
                }}
              >
                Back
              </button>
              <button
                type="submit"
                className="auth-screen__cta onboarding-payment-screen__cta"
                disabled={submitting || !isCompleteEmailOtp(code)}
              >
                {submitting ? "Verifying..." : "Verify email"}
              </button>
            </div>
          </form>

          <p className="auth-screen__verify-resend">
            {resendSeconds > 0 ? (
              <>Resend code in {resendSeconds}s</>
            ) : (
              <button
                type="button"
                className="auth-screen__text-link"
                disabled={submitting}
                onClick={() => void handleResend()}
              >
                Resend code
              </button>
            )}
          </p>
        </div>
      )}

      <p className="auth-screen__footer">
        Wrong email?{" "}
        <Link
          href={LOGIN_PATH}
          className="auth-screen__footer-link"
          onClick={() => clearPendingVerifyEmail()}
        >
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export function EmailVerifyScreen() {
  return (
    <Suspense fallback={<div className="auth-screen" />}>
      <EmailVerifyScreenForm />
    </Suspense>
  );
}
