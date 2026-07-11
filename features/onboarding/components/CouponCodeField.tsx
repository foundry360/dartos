"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/utils/cn";
import type { AppliedSubscriptionCoupon } from "@/features/onboarding/lib/subscription-coupons";

interface CouponCodeFieldProps {
  disabled?: boolean;
  appliedCoupon: AppliedSubscriptionCoupon | null;
  onApply: (code: string) => string | null;
  onRemove: () => void;
}

export function CouponCodeField({
  disabled = false,
  appliedCoupon,
  onApply,
  onRemove,
}: CouponCodeFieldProps) {
  const fieldId = useId();
  const [enabled, setEnabled] = useState(() => Boolean(appliedCoupon));
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appliedCoupon) {
      return;
    }

    setEnabled(true);
    setCouponInput(appliedCoupon.code);
  }, [appliedCoupon]);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    setError(null);

    if (!checked) {
      setCouponInput("");
      if (appliedCoupon) {
        onRemove();
      }
    }
  };

  const handleApply = () => {
    const validationError = onApply(couponInput);
    setError(validationError);
  };

  return (
    <div className="onboarding-coupon">
      <div className="onboarding-payment-summary__row onboarding-coupon__toggle-row">
        <label className="onboarding-coupon__header" htmlFor={fieldId}>
          <span className="onboarding-payment-summary__key">Coupon code</span>
          <input
            id={fieldId}
            type="checkbox"
            className="onboarding-coupon__checkbox"
            checked={enabled}
            disabled={disabled}
            onChange={(event) => handleToggle(event.target.checked)}
          />
        </label>
      </div>

      {enabled ? (
        <div className="onboarding-coupon__panel">
          {appliedCoupon ? (
            <div className="onboarding-coupon__applied">
              <div>
                <p className="onboarding-coupon__code">{appliedCoupon.code}</p>
                <p className="onboarding-coupon__description">{appliedCoupon.description}</p>
              </div>
              <button
                type="button"
                className="auth-screen__text-link"
                disabled={disabled}
                onClick={() => {
                  setCouponInput("");
                  setError(null);
                  setEnabled(false);
                  onRemove();
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <div className="onboarding-coupon__row">
                <div className={cn("auth-screen__field-shell", "onboarding-coupon__input-shell")}>
                  <input
                    className="auth-screen__input auth-screen__input--flush"
                    type="text"
                    value={couponInput}
                    placeholder="Enter code"
                    autoComplete="off"
                    disabled={disabled}
                    onChange={(event) => {
                      setCouponInput(event.target.value.toUpperCase());
                      setError(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleApply();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="onboarding-coupon__apply"
                  disabled={disabled || !couponInput.trim()}
                  onClick={handleApply}
                >
                  Apply
                </button>
              </div>
              {error ? <p className="onboarding-coupon__error">{error}</p> : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
