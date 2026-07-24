"use client";

import Image from "next/image";
import Link from "next/link";
import { Barlow_Condensed, IBM_Plex_Mono, Inter } from "next/font/google";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { buildSubscribePath } from "@/features/onboarding/lib/onboarding-path";
import {
  getSubscriptionPlan,
  type SubscriptionPlanId,
} from "@/features/onboarding/lib/subscription-plans";
import {
  dismissPlayerUpgradeModal,
  resetPlayerUpgradeModalForLogin,
  wasPlayerUpgradeModalDismissed,
} from "@/features/player-access/lib/player-upgrade-modal-storage";
import { cn } from "@/utils/cn";
import "@/features/player-access/player-upgrade-modal.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-player-upgrade-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-player-upgrade-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-player-upgrade-mono",
});

type UpgradePlanId = Extract<SubscriptionPlanId, "club" | "elite">;

/** Feature bullets for free → paid upgrade, aligned with Club / Elite access. */
const UPGRADE_PLAN_FEATURES: Record<UpgradePlanId, string[]> = {
  club: [
    "Live match scoring",
    "Practice modes",
    "Player profiles and performance tracking",
    "Cloud sync across devices",
  ],
  elite: [
    "Everything in Club",
    "Online league play",
    "Advanced statistics",
    "Priority voice and features",
  ],
};

const CheckMark = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden>
    <path
      d="M2 6l3 3 5-6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function TierBoardVisual() {
  return (
    <div className="player-upgrade-modal__board-wrap">
      <svg viewBox="0 0 400 400" width="100%" height="100%" aria-hidden>
        <defs>
          <radialGradient id="playerEliteGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#B8E05A" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#6F9E24" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id="playerClubFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6F9E24" stopOpacity="0" />
            <stop offset="100%" stopColor="#6F9E24" stopOpacity="0.28" />
          </radialGradient>
          <filter id="playerSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="200"
          cy="200"
          r="185"
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1.5"
          strokeDasharray="2 5"
        />
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="14"
        />
        <circle
          cx="200"
          cy="200"
          r="118"
          fill="url(#playerClubFill)"
          stroke="#8BC53F"
          strokeWidth="1.5"
          strokeOpacity="0.85"
        />
        <circle
          cx="200"
          cy="200"
          r="66"
          fill="url(#playerEliteGlow)"
          opacity="0.9"
          filter="url(#playerSoftGlow)"
        >
          <animate
            attributeName="opacity"
            values="0.75;1;0.75"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="200" cy="200" r="66" fill="none" stroke="#B8E05A" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="14" fill="#6F9E24" stroke="#B8E05A" strokeWidth="1.5" />

        <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
          <line x1="200" y1="15" x2="200" y2="385" />
          <line x1="15" y1="200" x2="385" y2="200" />
          <line x1="65" y1="65" x2="335" y2="335" />
          <line x1="65" y1="335" x2="335" y2="65" />
        </g>

        <g>
          <polygon points="0,-6 12,0 0,6 3,0" fill="#B8E05A">
            <animateMotion
              dur="4.5s"
              repeatCount="indefinite"
              path="M -180 -8 L -60 -3 L -8 0"
              rotate="auto"
            />
          </polygon>
        </g>
      </svg>

      <span className="player-upgrade-modal__tier-caption player-upgrade-modal__tier-caption--free">
        Free
      </span>
      <span className="player-upgrade-modal__tier-caption player-upgrade-modal__tier-caption--club">
        Club
      </span>
      <span className="player-upgrade-modal__tier-caption player-upgrade-modal__tier-caption--elite">
        Elite
      </span>
    </div>
  );
}

export function PlayerUpgradeModal() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [planId, setPlanId] = useState<UpgradePlanId>("club");
  const plan = getSubscriptionPlan(planId);
  const features = UPGRADE_PLAN_FEATURES[planId];

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback(() => {
    dismissPlayerUpgradeModal();
    setOpen(false);
  }, []);

  useEffect(() => {
    let shouldShow = false;

    // Email-link / auth callback can ask to show again after a fresh login.
    const params = new URLSearchParams(window.location.search);
    if (params.get("show_upgrade") === "1") {
      resetPlayerUpgradeModalForLogin();
      params.delete("show_upgrade");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", next);
      shouldShow = true;
    } else if (!wasPlayerUpgradeModalDismissed()) {
      // Shown after each login until dismissed for that signed-in visit.
      shouldShow = true;
    }

    if (!shouldShow) {
      return;
    }

    // Let the landing page paint first, then fade the modal in.
    const timer = window.setTimeout(() => {
      setOpen(true);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dismiss, open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "player-upgrade-modal-overlay",
        barlow.variable,
        inter.variable,
        plexMono.variable,
      )}
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="player-upgrade-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="player-upgrade-modal__close"
          onClick={dismiss}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="player-upgrade-modal__visual">
          <TierBoardVisual />
          <p className="player-upgrade-modal__visual-footer">
            Every dart moves you <strong>closer to center</strong>
          </p>
        </div>

        <div className="player-upgrade-modal__content">
          <div className="player-upgrade-modal__brand">
            <Image
              src="/vectoros-logo.png"
              alt="VectorOS"
              width={1024}
              height={113}
              className="player-upgrade-modal__logo"
              priority
            />
          </div>
          <h2 id={titleId} className="player-upgrade-modal__headline">
            Unlock the Full Vector Experience
          </h2>
          <p className="player-upgrade-modal__subhead">
            Your free league membership includes standings and statistics. Upgrade to Club or
            Elite to unlock live scoring, practice modes, performance tracking, and the complete
            Vector experience.
          </p>

          <div className="player-upgrade-modal__toggle" role="tablist" aria-label="Choose a plan">
            {(["club", "elite"] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={planId === id}
                className={cn(
                  "player-upgrade-modal__toggle-btn",
                  planId === id && "is-active",
                  planId === id && `is-${id}`,
                )}
                onClick={() => setPlanId(id)}
              >
                {id === "club" ? "Club" : "Elite"}
              </button>
            ))}
          </div>

          <div className={cn("player-upgrade-modal__plan", `is-${planId}`)}>
            <div className="player-upgrade-modal__price-row">
              <span className="player-upgrade-modal__price">{plan.priceLabel}</span>
              <span className="player-upgrade-modal__price-unit">/ mo</span>
            </div>

            <ul className="player-upgrade-modal__features">
              {features.map((feature, index) => (
                <li
                  key={feature}
                  className={cn(planId === "elite" && index > 0 && "is-starred")}
                >
                  <span className="player-upgrade-modal__mark">
                    <CheckMark />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="player-upgrade-modal__fine">{plan.billingMeta} · cancel anytime</p>

          <div className="player-upgrade-modal__cta-row">
            <Link
              href={buildSubscribePath(planId)}
              className={cn(
                "player-upgrade-modal__upgrade",
                planId === "club" ? "is-club" : "is-elite",
              )}
              onClick={dismiss}
            >
              Upgrade to {plan.name}
            </Link>
            <button
              type="button"
              className="player-upgrade-modal__not-now"
              onClick={dismiss}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
